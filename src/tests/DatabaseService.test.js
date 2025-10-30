import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService } from '../services/DatabaseService.js';
import { RegistroDiario } from '../models/RegistroDiario.js';
import { Conductor } from '../models/Conductor.js';

describe('DatabaseService', () => {
  let dbService;

  beforeEach(async () => {
    // Create a new instance for each test
    dbService = new DatabaseService();
    await dbService.initDatabase();
  });

  afterEach(async () => {
    // Clean up database after each test
    if (dbService.db) {
      await dbService.db.registros.clear();
      await dbService.db.conductor.clear();
      await dbService.db.configuracion.clear();
    }
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const result = await dbService.initDatabase();
      expect(result).toBe(true);
    });

    it('should create default configuration on first init', async () => {
      const config = await dbService.getConfiguracion();
      expect(config).toBeDefined();
      expect(config.tema).toBe('dark');
      expect(config.idioma).toBe('es');
    });
  });

  describe('Registro CRUD Operations', () => {
    it('should save a new registro diario', async () => {
      const registroData = {
        fecha: new Date('2023-12-01'),
        kmRecorridos: 150,
        numeroCarreras: 12,
        uber: { app: 80, propinas: 10 },
        freeNow: { app: 60, tarjeta: 40, efectivo: 20, propinas: 5 },
        taxiConvencional: { tarjeta: 30, efectivo: 15 },
        gastos: { combustible: 25 }
      };

      const savedRegistro = await dbService.saveRegistroDiario(registroData);
      
      expect(savedRegistro).toBeDefined();
      expect(savedRegistro.id).toBeDefined();
      expect(savedRegistro.kmRecorridos).toBe(150);
      expect(savedRegistro.numeroCarreras).toBe(12);
    });

    it('should retrieve all registros', async () => {
      // Save test data
      await dbService.saveRegistroDiario({
        fecha: new Date('2023-12-01'),
        kmRecorridos: 100,
        numeroCarreras: 8
      });
      
      await dbService.saveRegistroDiario({
        fecha: new Date('2023-12-02'),
        kmRecorridos: 120,
        numeroCarreras: 10
      });

      const registros = await dbService.getAllRegistros();
      expect(registros).toHaveLength(2);
      expect(registros[0].fecha).toBeInstanceOf(Date);
    });

    it('should retrieve registros by date range', async () => {
      const date1 = new Date('2023-12-01');
      const date2 = new Date('2023-12-15');
      const date3 = new Date('2023-12-30');

      await dbService.saveRegistroDiario({ fecha: date1, kmRecorridos: 100 });
      await dbService.saveRegistroDiario({ fecha: date2, kmRecorridos: 120 });
      await dbService.saveRegistroDiario({ fecha: date3, kmRecorridos: 80 });

      const registros = await dbService.getRegistrosByDateRange(
        new Date('2023-12-01'),
        new Date('2023-12-20')
      );

      expect(registros).toHaveLength(2);
    });

    it('should update an existing registro', async () => {
      const savedRegistro = await dbService.saveRegistroDiario({
        fecha: new Date('2023-12-01'),
        kmRecorridos: 100
      });

      const updatedRegistro = await dbService.updateRegistro(savedRegistro.id, {
        kmRecorridos: 150,
        numeroCarreras: 12
      });

      expect(updatedRegistro.kmRecorridos).toBe(150);
      expect(updatedRegistro.numeroCarreras).toBe(12);
    });

    it('should delete a registro', async () => {
      const savedRegistro = await dbService.saveRegistroDiario({
        fecha: new Date('2023-12-01'),
        kmRecorridos: 100
      });

      await dbService.deleteRegistro(savedRegistro.id);
      
      const registros = await dbService.getAllRegistros();
      expect(registros).toHaveLength(0);
    });
  });

  describe('Conductor Operations', () => {
    it('should save conductor data', async () => {
      const conductorData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        configuracion: {
          diaLibreSemanal: 'domingo',
          vacaciones: {
            inicio: new Date('2023-12-20'),
            fin: new Date('2023-12-30')
          }
        }
      };

      const savedConductor = await dbService.saveConductor(conductorData);
      
      expect(savedConductor).toBeDefined();
      expect(savedConductor.nombre).toBe('Juan');
      expect(savedConductor.apellido).toBe('Pérez');
    });

    it('should update existing conductor', async () => {
      // Save initial conductor
      await dbService.saveConductor({
        nombre: 'Juan',
        apellido: 'Pérez'
      });

      // Update conductor
      const updatedConductor = await dbService.saveConductor({
        nombre: 'Juan Carlos',
        apellido: 'Pérez García'
      });

      expect(updatedConductor.nombre).toBe('Juan Carlos');
      expect(updatedConductor.apellido).toBe('Pérez García');
    });

    it('should retrieve conductor data', async () => {
      await dbService.saveConductor({
        nombre: 'María',
        apellido: 'González'
      });

      const conductor = await dbService.getConductor();
      expect(conductor).toBeDefined();
      expect(conductor.nombre).toBe('María');
    });
  });

  describe('Configuration Operations', () => {
    it('should retrieve configuration', async () => {
      const config = await dbService.getConfiguracion();
      expect(config).toBeDefined();
      expect(config.tema).toBe('dark');
    });

    it('should update configuration', async () => {
      const updatedConfig = await dbService.updateConfiguracion({
        tema: 'light',
        idioma: 'en',
        moneda: 'USD'
      });

      expect(updatedConfig.tema).toBe('light');
      expect(updatedConfig.idioma).toBe('en');
      expect(updatedConfig.moneda).toBe('USD');
    });
  });

  describe('Export/Import Operations', () => {
    it('should export data successfully', async () => {
      // Add test data
      await dbService.saveRegistroDiario({
        fecha: new Date('2023-12-01'),
        kmRecorridos: 100
      });
      
      await dbService.saveConductor({
        nombre: 'Test',
        apellido: 'User'
      });

      const exportData = await dbService.exportData();
      
      expect(exportData).toBeDefined();
      expect(exportData.version).toBe('1.0.0');
      expect(exportData.data.registros).toHaveLength(1);
      expect(exportData.data.conductor).toBeDefined();
    });

    it('should import data successfully', async () => {
      const importData = {
        version: '1.0.0',
        data: {
          registros: [{
            fecha: new Date('2023-12-01'),
            kmRecorridos: 100,
            numeroCarreras: 8
          }],
          conductor: {
            nombre: 'Imported',
            apellido: 'User'
          },
          configuracion: {
            tema: 'light',
            idioma: 'en'
          }
        }
      };

      const result = await dbService.importData(importData);
      expect(result).toBe(true);

      const registros = await dbService.getAllRegistros();
      const conductor = await dbService.getConductor();
      
      expect(registros).toHaveLength(1);
      expect(conductor.nombre).toBe('Imported');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid import data', async () => {
      const invalidData = { invalid: 'data' };
      
      await expect(dbService.importData(invalidData)).rejects.toThrow('Invalid import data format');
    });

    it('should handle database errors gracefully', async () => {
      // Close database to simulate error
      await dbService.db.close();
      
      await expect(dbService.saveRegistroDiario({})).rejects.toThrow();
    });
  });
});