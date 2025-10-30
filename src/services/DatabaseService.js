import Dexie from 'dexie';

export class DatabaseService {
  constructor() {
    this.db = new Dexie('ConductorTrackerDB');
    this.setupSchema();
    this.errorHandler = null; // Will be set by main app
    this.performanceService = null; // Will be set by main app
    this.queryCache = new Map();
    this.cacheExpiry = new Map();
    this.defaultCacheTTL = 2 * 60 * 1000; // 2 minutes
  }

  setErrorHandler(errorHandler) {
    this.errorHandler = errorHandler;
  }

  setPerformanceService(performanceService) {
    this.performanceService = performanceService;
  }

  setupSchema() {
    // Version 1: Original schema
    this.db.version(1).stores({
      registros: '++id, fecha, kmRecorridos, numeroCarreras, uber, freeNow, taxiConvencional, gastos, gananciaBruta, gananciaNeta, createdAt, updatedAt',
      conductor: '++id, nombre, apellido, configuracion, createdAt, updatedAt',
      configuracion: '++id, tema, idioma, moneda, formatoFecha, backupAutomatico, updatedAt'
    });

    // Version 2: Add historial_cambios table and edit tracking fields
    this.db.version(2).stores({
      registros: '++id, fecha, kmRecorridos, numeroCarreras, uber, freeNow, taxiConvencional, gastos, gananciaBruta, gananciaNeta, createdAt, updatedAt, editCount, lastEditedAt, isModified',
      historial_cambios: '++id, registroId, timestamp, changedFields, previousValues, newValues',
      conductor: '++id, nombre, apellido, configuracion, createdAt, updatedAt',
      configuracion: '++id, tema, idioma, moneda, formatoFecha, backupAutomatico, updatedAt'
    }).upgrade(tx => {
      // Migrate existing registros to add new fields
      return tx.table('registros').toCollection().modify(registro => {
        registro.editCount = 0;
        registro.lastEditedAt = null;
        registro.isModified = false;
      });
    });
  }

  async initDatabase() {
    try {
      await this.db.open();
      console.log('Database initialized successfully');
      
      // Initialize default configuration if not exists
      const configCount = await this.db.configuracion.count();
      if (configCount === 0) {
        await this.createDefaultConfig();
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      if (this.errorHandler) {
        this.errorHandler.handleDatabaseError(error, 'inicialización de base de datos');
      }
      throw error;
    }
  }

  async createDefaultConfig() {
    const defaultConfig = {
      tema: 'dark',
      idioma: 'es',
      moneda: 'EUR',
      formatoFecha: 'dd/mm/yyyy',
      backupAutomatico: false,
      updatedAt: new Date()
    };
    
    return await this.db.configuracion.add(defaultConfig);
  }

  // Registro methods
  async saveRegistroDiario(registro) {
    try {
      const now = new Date();
      const registroData = {
        ...registro,
        createdAt: now,
        updatedAt: now
      };
      
      const operation = () => this.db.registros.add(registroData);
      
      const id = this.performanceService 
        ? await this.performanceService.optimizedDBOperation(operation, 'saveRegistroDiario')
        : await operation();

      // Clear relevant caches after saving
      if (this.performanceService) {
        this.performanceService.clearCache('all-registros');
        // Clear date range caches that might include this date
        const fecha = registro.fecha;
        this.clearDateRangeCaches(fecha);
      }

      return { id, ...registroData };
    } catch (error) {
      console.error('Error saving registro:', error);
      if (this.errorHandler) {
        this.errorHandler.handleDatabaseError(error, 'guardado de registro');
      }
      throw error;
    }
  }

  // Helper method to clear date range caches
  clearDateRangeCaches(fecha) {
    if (!this.performanceService) return;
    
    // Clear caches that might contain this date
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Clear monthly cache
    const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];
    this.performanceService.clearCache(`registros-${monthStart}-${monthEnd}`);
    
    // Clear weekly caches (approximate)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    this.performanceService.clearCache(`registros-${weekStart.toISOString().split('T')[0]}-${weekEnd.toISOString().split('T')[0]}`);
  }

  async getRegistrosByDateRange(startDate, endDate) {
    const cacheKey = `registros-${startDate}-${endDate}`;
    
    try {
      // Check cache first
      if (this.performanceService) {
        const cached = this.performanceService.getCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Perform optimized database operation
      const operation = () => this.db.registros
        .where('fecha')
        .between(startDate, endDate, true, true)
        .toArray();
      
      const result = this.performanceService 
        ? await this.performanceService.optimizedDBOperation(operation, 'getRegistrosByDateRange')
        : await operation();

      // Cache result with shorter TTL for date ranges
      if (this.performanceService) {
        this.performanceService.setCache(cacheKey, result, 60 * 1000); // 1 minute
      }

      return result;
    } catch (error) {
      console.error('Error getting registros by date range:', error);
      if (this.errorHandler) {
        this.errorHandler.handleDatabaseError(error, 'consulta de registros por fecha');
      }
      throw error;
    }
  }

  async getAllRegistros() {
    const cacheKey = 'all-registros';
    
    try {
      // Check cache first
      if (this.performanceService) {
        const cached = this.performanceService.getCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Perform optimized database operation
      const operation = () => this.db.registros.orderBy('fecha').reverse().toArray();
      
      const result = this.performanceService 
        ? await this.performanceService.optimizedDBOperation(operation, 'getAllRegistros')
        : await operation();

      // Cache result
      if (this.performanceService) {
        this.performanceService.setCache(cacheKey, result, this.defaultCacheTTL);
      }

      return result;
    } catch (error) {
      console.error('Error getting all registros:', error);
      if (this.errorHandler) {
        this.errorHandler.handleDatabaseError(error, 'consulta de todos los registros');
      }
      throw error;
    }
  }

  async getRegistroById(id) {
    try {
      const registro = await this.db.registros.get(id);
      if (!registro) {
        throw new Error(`Registro with id ${id} not found`);
      }
      return registro;
    } catch (error) {
      console.error('Error getting registro by id:', error);
      if (this.errorHandler) {
        this.errorHandler.handleDatabaseError(error, 'consulta de registro por ID');
      }
      throw error;
    }
  }

  async updateRegistro(id, data) {
    try {
      const now = new Date();
      
      // Get current registro to update edit tracking
      const currentRegistro = await this.db.registros.get(id);
      if (!currentRegistro) {
        throw new Error(`Registro with id ${id} not found`);
      }
      
      const updateData = {
        ...data,
        updatedAt: now,
        editCount: (currentRegistro.editCount || 0) + 1,
        lastEditedAt: now,
        isModified: true
      };
      
      await this.db.registros.update(id, updateData);
      
      // Clear relevant caches after updating
      if (this.performanceService) {
        this.performanceService.clearCache('all-registros');
        this.clearDateRangeCaches(data.fecha || currentRegistro.fecha);
      }
      
      return await this.db.registros.get(id);
    } catch (error) {
      console.error('Error updating registro:', error);
      if (this.errorHandler) {
        this.errorHandler.handleDatabaseError(error, 'actualización de registro');
      }
      throw error;
    }
  }

  async deleteRegistro(id) {
    try {
      return await this.db.registros.delete(id);
    } catch (error) {
      console.error('Error deleting registro:', error);
      throw error;
    }
  }

  // Conductor methods
  async saveConductor(conductorData) {
    try {
      const existing = await this.db.conductor.toArray();
      const now = new Date();
      
      if (existing.length > 0) {
        // Update existing conductor
        const id = existing[0].id;
        await this.db.conductor.update(id, {
          ...conductorData,
          updatedAt: now
        });
        return await this.db.conductor.get(id);
      } else {
        // Create new conductor
        const data = {
          ...conductorData,
          createdAt: now,
          updatedAt: now
        };
        const id = await this.db.conductor.add(data);
        return { id, ...data };
      }
    } catch (error) {
      console.error('Error saving conductor:', error);
      throw error;
    }
  }

  async getConductor() {
    try {
      const conductores = await this.db.conductor.toArray();
      return conductores.length > 0 ? conductores[0] : null;
    } catch (error) {
      console.error('Error getting conductor:', error);
      throw error;
    }
  }

  // Configuration methods
  async getConfiguracion() {
    try {
      const configs = await this.db.configuracion.toArray();
      return configs.length > 0 ? configs[0] : null;
    } catch (error) {
      console.error('Error getting configuracion:', error);
      throw error;
    }
  }

  async updateConfiguracion(configData) {
    try {
      const existing = await this.db.configuracion.toArray();
      const now = new Date();
      
      if (existing.length > 0) {
        const id = existing[0].id;
        await this.db.configuracion.update(id, {
          ...configData,
          updatedAt: now
        });
        return await this.db.configuracion.get(id);
      } else {
        const data = {
          ...configData,
          updatedAt: now
        };
        const id = await this.db.configuracion.add(data);
        return { id, ...data };
      }
    } catch (error) {
      console.error('Error updating configuracion:', error);
      throw error;
    }
  }

  // Export/Import methods
  async exportData() {
    try {
      const registros = await this.getAllRegistros();
      const conductor = await this.getConductor();
      const configuracion = await this.getConfiguracion();
      
      // Export historial_cambios if table exists (version 2+)
      let historialCambios = [];
      try {
        historialCambios = await this.db.historial_cambios.toArray();
      } catch (error) {
        // Table might not exist in older versions
        console.log('historial_cambios table not found, skipping...');
      }
      
      return {
        version: '2.0.0',
        schemaVersion: 2,
        exportDate: new Date().toISOString(),
        data: {
          registros,
          conductor,
          configuracion,
          historialCambios
        }
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(importData) {
    try {
      if (!importData.data) {
        throw new Error('Invalid import data format');
      }
      
      const { registros, conductor, configuracion, historialCambios } = importData.data;
      
      // Clear existing data
      await this.db.registros.clear();
      await this.db.conductor.clear();
      await this.db.configuracion.clear();
      
      // Clear historial_cambios if table exists
      try {
        await this.db.historial_cambios.clear();
      } catch (error) {
        console.log('historial_cambios table not found during import, skipping...');
      }
      
      // Import new data
      if (registros && registros.length > 0) {
        // Ensure all registros have edit tracking fields
        const registrosWithDefaults = registros.map(r => ({
          ...r,
          editCount: r.editCount || 0,
          lastEditedAt: r.lastEditedAt || null,
          isModified: r.isModified || false
        }));
        await this.db.registros.bulkAdd(registrosWithDefaults);
      }
      
      if (conductor) {
        await this.db.conductor.add(conductor);
      }
      
      if (configuracion) {
        await this.db.configuracion.add(configuracion);
      }
      
      // Import historial_cambios if available
      if (historialCambios && historialCambios.length > 0) {
        try {
          await this.db.historial_cambios.bulkAdd(historialCambios);
        } catch (error) {
          console.warn('Could not import historial_cambios:', error);
        }
      }
      
      // Clear all caches after import
      if (this.performanceService) {
        this.performanceService.clearCache('all-registros');
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}