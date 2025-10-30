export class ExportImportService {
  constructor(dbService) {
    this.dbService = dbService;
    this.version = '1.0.0';
  }

  /**
   * Export all data to JSON format with metadata
   */
  async exportData() {
    try {
      const registros = await this.dbService.getAllRegistros();
      const conductor = await this.dbService.getConductor();
      const configuracion = await this.dbService.getConfiguracion();
      
      const exportData = {
        version: this.version,
        exportDate: new Date().toISOString(),
        appName: 'Conductor Tracker',
        metadata: {
          totalRegistros: registros.length,
          dateRange: this.getDateRange(registros),
          conductorName: conductor ? `${conductor.nombre} ${conductor.apellido}` : 'Sin configurar'
        },
        data: {
          registros: registros.map(this.sanitizeRegistro),
          conductor: conductor ? this.sanitizeConductor(conductor) : null,
          configuracion: configuracion ? this.sanitizeConfiguracion(configuracion) : null
        }
      };
      
      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Error al exportar los datos: ' + error.message);
    }
  }

  /**
   * Generate and download JSON file
   */
  async downloadExport() {
    try {
      const exportData = await this.exportData();
      const filename = this.generateFilename(exportData.metadata.conductorName);
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        filename,
        recordCount: exportData.metadata.totalRegistros
      };
    } catch (error) {
      console.error('Error downloading export:', error);
      throw new Error('Error al descargar el archivo: ' + error.message);
    }
  }

  /**
   * Validate imported data structure
   */
  validateImportData(importData) {
    const errors = [];
    
    // Check basic structure
    if (!importData || typeof importData !== 'object') {
      errors.push('El archivo no contiene datos válidos');
      return { isValid: false, errors };
    }
    
    if (!importData.version) {
      errors.push('Falta información de versión');
    }
    
    if (!importData.data) {
      errors.push('Falta la sección de datos');
      return { isValid: false, errors };
    }
    
    const { data } = importData;
    
    // Validate registros
    if (data.registros && Array.isArray(data.registros)) {
      data.registros.forEach((registro, index) => {
        const registroErrors = this.validateRegistro(registro, index);
        errors.push(...registroErrors);
      });
    }
    
    // Validate conductor
    if (data.conductor) {
      const conductorErrors = this.validateConductor(data.conductor);
      errors.push(...conductorErrors);
    }
    
    // Validate configuracion
    if (data.configuracion) {
      const configErrors = this.validateConfiguracion(data.configuracion);
      errors.push(...configErrors);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.generateWarnings(importData)
    };
  }

  /**
   * Import data from validated JSON
   */
  async importData(importData, options = { overwrite: false }) {
    try {
      const validation = this.validateImportData(importData);
      
      if (!validation.isValid) {
        throw new Error('Datos inválidos: ' + validation.errors.join(', '));
      }
      
      const { data } = importData;
      
      if (options.overwrite) {
        // Clear existing data
        await this.clearAllData();
      }
      
      let importResults = {
        registros: 0,
        conductor: false,
        configuracion: false
      };
      
      // Import registros
      if (data.registros && data.registros.length > 0) {
        for (const registro of data.registros) {
          await this.dbService.saveRegistroDiario(registro);
          importResults.registros++;
        }
      }
      
      // Import conductor
      if (data.conductor) {
        await this.dbService.saveConductor(data.conductor);
        importResults.conductor = true;
      }
      
      // Import configuracion
      if (data.configuracion) {
        await this.dbService.updateConfiguracion(data.configuracion);
        importResults.configuracion = true;
      }
      
      return {
        success: true,
        results: importResults,
        warnings: validation.warnings
      };
      
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Error al importar los datos: ' + error.message);
    }
  }

  /**
   * Get preview of import data
   */
  getImportPreview(importData) {
    try {
      const validation = this.validateImportData(importData);
      
      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors
        };
      }
      
      const { data, metadata } = importData;
      
      const preview = {
        isValid: true,
        metadata: {
          version: importData.version,
          exportDate: importData.exportDate,
          appName: importData.appName || 'Desconocido',
          ...metadata
        },
        summary: {
          registros: data.registros ? data.registros.length : 0,
          conductor: data.conductor ? `${data.conductor.nombre} ${data.conductor.apellido}` : 'No incluido',
          configuracion: data.configuracion ? 'Incluida' : 'No incluida',
          dateRange: data.registros ? this.getDateRange(data.registros) : 'Sin registros'
        },
        warnings: validation.warnings
      };
      
      return preview;
    } catch (error) {
      return {
        isValid: false,
        errors: ['Error al procesar el archivo: ' + error.message]
      };
    }
  }

  // Helper methods
  sanitizeRegistro(registro) {
    return {
      fecha: registro.fecha,
      kmRecorridos: registro.kmRecorridos,
      numeroCarreras: registro.numeroCarreras,
      uber: registro.uber,
      freeNow: registro.freeNow,
      taxiConvencional: registro.taxiConvencional,
      gastos: registro.gastos,
      gananciaBruta: registro.gananciaBruta,
      gananciaNeta: registro.gananciaNeta,
      createdAt: registro.createdAt,
      updatedAt: registro.updatedAt
    };
  }

  sanitizeConductor(conductor) {
    return {
      nombre: conductor.nombre,
      apellido: conductor.apellido,
      configuracion: conductor.configuracion,
      createdAt: conductor.createdAt,
      updatedAt: conductor.updatedAt
    };
  }

  sanitizeConfiguracion(configuracion) {
    return {
      tema: configuracion.tema,
      idioma: configuracion.idioma,
      moneda: configuracion.moneda,
      formatoFecha: configuracion.formatoFecha,
      backupAutomatico: configuracion.backupAutomatico,
      updatedAt: configuracion.updatedAt
    };
  }

  validateRegistro(registro, index) {
    const errors = [];
    const prefix = `Registro ${index + 1}:`;
    
    if (!registro.fecha) {
      errors.push(`${prefix} Falta la fecha`);
    }
    
    if (typeof registro.kmRecorridos !== 'number' || registro.kmRecorridos < 0) {
      errors.push(`${prefix} Kilómetros inválidos`);
    }
    
    if (typeof registro.numeroCarreras !== 'number' || registro.numeroCarreras < 0) {
      errors.push(`${prefix} Número de carreras inválido`);
    }
    
    return errors;
  }

  validateConductor(conductor) {
    const errors = [];
    
    if (!conductor.nombre || typeof conductor.nombre !== 'string') {
      errors.push('Conductor: Nombre inválido');
    }
    
    if (!conductor.apellido || typeof conductor.apellido !== 'string') {
      errors.push('Conductor: Apellido inválido');
    }
    
    return errors;
  }

  validateConfiguracion(configuracion) {
    const errors = [];
    
    // Basic validation - configuracion is optional
    if (configuracion.tema && !['light', 'dark'].includes(configuracion.tema)) {
      errors.push('Configuración: Tema inválido');
    }
    
    return errors;
  }

  generateWarnings(importData) {
    const warnings = [];
    
    // Check version compatibility
    if (importData.version !== this.version) {
      warnings.push(`Versión diferente: archivo v${importData.version}, app v${this.version}`);
    }
    
    // Check export date
    if (importData.exportDate) {
      const exportDate = new Date(importData.exportDate);
      const daysDiff = Math.floor((new Date() - exportDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 30) {
        warnings.push(`Los datos fueron exportados hace ${daysDiff} días`);
      }
    }
    
    return warnings;
  }

  getDateRange(registros) {
    if (!registros || registros.length === 0) {
      return 'Sin registros';
    }
    
    const dates = registros.map(r => new Date(r.fecha)).sort((a, b) => a - b);
    const firstDate = dates[0].toLocaleDateString('es-ES');
    const lastDate = dates[dates.length - 1].toLocaleDateString('es-ES');
    
    return firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
  }

  generateFilename(conductorName) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const safeName = conductorName.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `ConductorTracker_${safeName}_${dateStr}_${timeStr}.json`;
  }

  async clearAllData() {
    await this.dbService.db.registros.clear();
    await this.dbService.db.conductor.clear();
    await this.dbService.db.configuracion.clear();
  }
}