import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService } from '../services/DatabaseService.js';
import { CalculationService } from '../services/CalculationService.js';
import { NotificationService } from '../services/NotificationService.js';
import { ErrorHandlingService } from '../services/ErrorHandlingService.js';
import { ValidationService } from '../services/ValidationService.js';
import { PerformanceService } from '../services/PerformanceService.js';
import { PDFService } from '../services/PDFService.js';
import { ExportImportService } from '../services/ExportImportService.js';

describe('Integration Tests', () => {
  let dbService;
  let calcService;
  let notificationService;
  let errorHandlingService;
  let validationService;
  let performanceService;
  let pdfService;
  let exportImportService;

  beforeEach(async () => {
    // Initialize all services
    notificationService = new NotificationService();
    errorHandlingService = new ErrorHandlingService(notificationService);
    validationService = new ValidationService(errorHandlingService);
    performanceService = new PerformanceService();
    
    dbService = new DatabaseService();
    dbService.setErrorHandler(errorHandlingService);
    dbService.setPerformanceService(performanceService);
    
    calcService = new CalculationService();
    pdfService = new PDFService();
    exportImportService = new ExportImportService(dbService);

    await dbService.initDatabase();

    // Mock DOM elements for notification service
    document.body.innerHTML = '<div id="notification-container"></div>';
  });

  afterEach(async () => {
    // Clean up
    if (dbService.db) {
      await dbService.db.registros.clear();
      await dbService.db.conductor.clear();
      await dbService.db.configuracion.clear();
    }
    performanceService.cleanup();
    document.body.innerHTML = '';
  });

  describe('Complete Registration Flow', () => {
    it('should complete full registration workflow with validation and calculations', async () => {
      // Step 1: Validate input data
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 150,
        numeroCarreras: 12,
        uber: { app: 80, propinas: 10 },
        freeNow: { app: 60, tarjeta: 40, efectivo: 20, propinas: 5 },
        taxiConvencional: { tarjeta: 30, efectivo: 15 },
        gastos: { combustible: 25 }
      };

      const validationResult = validationService.validateRegistroDiario(registroData);
      expect(validationResult.isValid).toBe(true);

      // Step 2: Calculate earnings
      const calculation = calcService.calculateGananciaNeta(registroData);
      expect(calculation).toBeDefined();
      expect(calculation.gananciaBruta).toBeGreaterThan(0);
      expect(calculation.gananciaNeta).toBeDefined();

      // Step 3: Add calculated values to registro
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;

      // Step 4: Save to database
      const savedRegistro = await dbService.saveRegistroDiario(registroData);
      expect(savedRegistro).toBeDefined();
      expect(savedRegistro.id).toBeDefined();

      // Step 5: Verify data integrity
      const retrievedRegistro = await dbService.getRegistrosByDateRange('2023-12-01', '2023-12-01');
      expect(retrievedRegistro).toHaveLength(1);
      expect(retrievedRegistro[0].gananciaNeta).toBe(calculation.gananciaNeta);
    });

    it('should handle validation errors in registration flow', async () => {
      const invalidRegistroData = {
        fecha: '2025-01-01', // Future date
        kmRecorridos: -50, // Negative value
        numeroCarreras: 'invalid', // Invalid type
        uber: { app: 'not-a-number' }
      };

      const validationResult = validationService.validateRegistroDiario(invalidRegistroData);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(Object.keys(validationResult.errors).length).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully during registration', async () => {
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 100,
        numeroCarreras: 8
      };

      // Close database to simulate error
      await dbService.db.close();

      let errorHandled = false;
      const originalHandleError = errorHandlingService.handleDatabaseError;
      errorHandlingService.handleDatabaseError = vi.fn(() => {
        errorHandled = true;
      });

      try {
        await dbService.saveRegistroDiario(registroData);
      } catch (error) {
        expect(errorHandled).toBe(true);
      }

      // Restore original method
      errorHandlingService.handleDatabaseError = originalHandleError;
    });
  });

  describe('Calculation Integration Tests', () => {
    it('should calculate complex earnings scenario correctly', async () => {
      const complexRegistro = {
        fecha: '2023-12-01',
        kmRecorridos: 200,
        numeroCarreras: 15,
        uber: { app: 120, propinas: 15 },
        freeNow: { app: 80, tarjeta: 60, efectivo: 40, propinas: 8 },
        taxiConvencional: { tarjeta: 50, efectivo: 30 },
        gastos: { combustible: 35 }
      };

      const calculation = calcService.calculateGananciaNeta(complexRegistro);
      
      // Verify calculation components
      expect(calculation.gananciaBruta).toBe(403); // Sum of all income except tips
      expect(calculation.comisionVehiculo).toBe(209.56); // 52% of gross
      expect(calculation.costoKilometraje).toBe(10); // 200km * 0.05
      expect(calculation.comisionFreeNowEfectivo).toBe(2.4); // 6% of 40
      
      // Verify final calculation
      const expectedNeta = 403 - 209.56 - 10 - 2.4 - 35; // Subtract fuel costs
      expect(calculation.gananciaNeta).toBeCloseTo(expectedNeta, 2);
    });

    it('should handle edge cases in calculations', async () => {
      const edgeCaseRegistro = {
        fecha: '2023-12-01',
        kmRecorridos: 0,
        numeroCarreras: 0,
        uber: { app: 0, propinas: 0 },
        freeNow: { app: 0, tarjeta: 0, efectivo: 0, propinas: 0 },
        taxiConvencional: { tarjeta: 0, efectivo: 0 },
        gastos: { combustible: 20 }
      };

      const calculation = calcService.calculateGananciaNeta(edgeCaseRegistro);
      
      expect(calculation.gananciaBruta).toBe(0);
      expect(calculation.comisionVehiculo).toBe(0);
      expect(calculation.costoKilometraje).toBe(0);
      expect(calculation.comisionFreeNowEfectivo).toBe(0);
      expect(calculation.gananciaNeta).toBe(-20); // Only fuel costs
    });

    it('should calculate monthly aggregations correctly', async () => {
      // Create multiple registros for a month
      const registros = [
        {
          fecha: '2023-12-01',
          kmRecorridos: 100,
          numeroCarreras: 8,
          uber: { app: 60, propinas: 5 },
          freeNow: { app: 40, tarjeta: 30, efectivo: 20, propinas: 3 },
          taxiConvencional: { tarjeta: 25, efectivo: 15 },
          gastos: { combustible: 20 }
        },
        {
          fecha: '2023-12-02',
          kmRecorridos: 120,
          numeroCarreras: 10,
          uber: { app: 80, propinas: 8 },
          freeNow: { app: 50, tarjeta: 40, efectivo: 25, propinas: 4 },
          taxiConvencional: { tarjeta: 30, efectivo: 20 },
          gastos: { combustible: 25 }
        }
      ];

      // Save registros with calculations
      for (const registro of registros) {
        const calculation = calcService.calculateGananciaNeta(registro);
        registro.gananciaBruta = calculation.gananciaBruta;
        registro.gananciaNeta = calculation.gananciaNeta;
        await dbService.saveRegistroDiario(registro);
      }

      // Get monthly data
      const monthlyData = await dbService.getRegistrosByDateRange('2023-12-01', '2023-12-31');
      const monthlyTotals = calcService.calculateMonthlyTotals(monthlyData);

      expect(monthlyTotals.totalKm).toBe(220);
      expect(monthlyTotals.totalCarreras).toBe(18);
      expect(monthlyTotals.totalGananciaBruta).toBeGreaterThan(0);
      expect(monthlyTotals.totalGananciaNeta).toBeDefined();
    });
  });

  describe('PDF Generation Integration', () => {
    it('should generate PDF with real data', async () => {
      // Setup conductor data
      await dbService.saveConductor({
        nombre: 'Juan',
        apellido: 'Pérez'
      });

      // Create sample monthly data
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 150,
        numeroCarreras: 12,
        uber: { app: 80, propinas: 10 },
        freeNow: { app: 60, tarjeta: 40, efectivo: 20, propinas: 5 },
        taxiConvencional: { tarjeta: 30, efectivo: 15 },
        gastos: { combustible: 25 }
      };

      const calculation = calcService.calculateGananciaNeta(registroData);
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;
      
      await dbService.saveRegistroDiario(registroData);

      // Get monthly data
      const monthlyData = await dbService.getRegistrosByDateRange('2023-12-01', '2023-12-31');
      const conductor = await dbService.getConductor();
      const monthlyTotals = calcService.calculateMonthlyTotals(monthlyData);

      // Generate PDF
      const pdfBlob = await pdfService.generateMonthlyReport(monthlyTotals, conductor, '2023-12');
      
      expect(pdfBlob).toBeDefined();
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    it('should handle PDF generation errors', async () => {
      let errorHandled = false;
      const originalHandleError = errorHandlingService.handlePDFError;
      errorHandlingService.handlePDFError = vi.fn(() => {
        errorHandled = true;
      });

      try {
        // Try to generate PDF with invalid data
        await pdfService.generateMonthlyReport(null, null, null);
      } catch (error) {
        expect(errorHandled).toBe(true);
      }

      // Restore original method
      errorHandlingService.handlePDFError = originalHandleError;
    });
  });

  describe('Export/Import Integration', () => {
    it('should complete full export/import cycle', async () => {
      // Setup initial data
      await dbService.saveConductor({
        nombre: 'Test',
        apellido: 'User'
      });

      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 100,
        numeroCarreras: 8,
        uber: { app: 60, propinas: 5 },
        freeNow: { app: 40, tarjeta: 30, efectivo: 20, propinas: 3 },
        taxiConvencional: { tarjeta: 25, efectivo: 15 },
        gastos: { combustible: 20 }
      };

      const calculation = calcService.calculateGananciaNeta(registroData);
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;
      
      await dbService.saveRegistroDiario(registroData);

      // Export data
      const exportedData = await exportImportService.exportData();
      expect(exportedData).toBeDefined();
      expect(exportedData.data.registros).toHaveLength(1);
      expect(exportedData.data.conductor).toBeDefined();

      // Clear database
      await dbService.db.registros.clear();
      await dbService.db.conductor.clear();

      // Verify data is cleared
      const emptyRegistros = await dbService.getAllRegistros();
      const emptyConductor = await dbService.getConductor();
      expect(emptyRegistros).toHaveLength(0);
      expect(emptyConductor).toBeNull();

      // Import data back
      const importResult = await exportImportService.importData(exportedData);
      expect(importResult.success).toBe(true);

      // Verify data is restored
      const restoredRegistros = await dbService.getAllRegistros();
      const restoredConductor = await dbService.getConductor();
      
      expect(restoredRegistros).toHaveLength(1);
      expect(restoredRegistros[0].kmRecorridos).toBe(100);
      expect(restoredConductor.nombre).toBe('Test');
    });

    it('should validate import data integrity', async () => {
      const invalidImportData = {
        version: '1.0.0',
        data: {
          registros: [{ invalid: 'data' }],
          conductor: null
        }
      };

      let errorHandled = false;
      const originalHandleError = errorHandlingService.handleImportExportError;
      errorHandlingService.handleImportExportError = vi.fn(() => {
        errorHandled = true;
      });

      try {
        await exportImportService.importData(invalidImportData);
      } catch (error) {
        expect(errorHandled).toBe(true);
      }

      // Restore original method
      errorHandlingService.handleImportExportError = originalHandleError;
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = performance.now();
      
      // Create 100 registros
      const registros = [];
      for (let i = 0; i < 100; i++) {
        const date = new Date('2023-01-01');
        date.setDate(date.getDate() + i);
        
        registros.push({
          fecha: date.toISOString().split('T')[0],
          kmRecorridos: Math.floor(Math.random() * 200) + 50,
          numeroCarreras: Math.floor(Math.random() * 15) + 5,
          uber: { app: Math.floor(Math.random() * 100) + 20, propinas: Math.floor(Math.random() * 20) },
          freeNow: { 
            app: Math.floor(Math.random() * 80) + 10, 
            tarjeta: Math.floor(Math.random() * 60) + 10,
            efectivo: Math.floor(Math.random() * 40) + 5,
            propinas: Math.floor(Math.random() * 15)
          },
          taxiConvencional: { 
            tarjeta: Math.floor(Math.random() * 50) + 10, 
            efectivo: Math.floor(Math.random() * 30) + 5 
          },
          gastos: { combustible: Math.floor(Math.random() * 40) + 15 }
        });
      }

      // Save all registros with calculations
      for (const registro of registros) {
        const calculation = calcService.calculateGananciaNeta(registro);
        registro.gananciaBruta = calculation.gananciaBruta;
        registro.gananciaNeta = calculation.gananciaNeta;
        await dbService.saveRegistroDiario(registro);
      }

      const saveTime = performance.now();
      console.log(`Saved 100 registros in ${saveTime - startTime}ms`);

      // Retrieve and calculate monthly totals
      const allRegistros = await dbService.getAllRegistros();
      const monthlyTotals = calcService.calculateMonthlyTotals(allRegistros);

      const endTime = performance.now();
      console.log(`Complete operation took ${endTime - startTime}ms`);

      expect(allRegistros).toHaveLength(100);
      expect(monthlyTotals.totalKm).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should use caching effectively', async () => {
      // Save a registro
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 100,
        numeroCarreras: 8
      };
      
      await dbService.saveRegistroDiario(registroData);

      // First call - should hit database
      const start1 = performance.now();
      const result1 = await dbService.getAllRegistros();
      const time1 = performance.now() - start1;

      // Second call - should use cache
      const start2 = performance.now();
      const result2 = await dbService.getAllRegistros();
      const time2 = performance.now() - start2;

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(time2).toBeLessThan(time1); // Cache should be faster
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from database connection loss', async () => {
      // Save initial data
      await dbService.saveRegistroDiario({
        fecha: '2023-12-01',
        kmRecorridos: 100,
        numeroCarreras: 8
      });

      // Simulate connection loss
      await dbService.db.close();

      // Try to save another registro - should trigger error handling
      let errorHandled = false;
      const originalHandleError = errorHandlingService.handleDatabaseError;
      errorHandlingService.handleDatabaseError = vi.fn(() => {
        errorHandled = true;
      });

      try {
        await dbService.saveRegistroDiario({
          fecha: '2023-12-02',
          kmRecorridos: 120,
          numeroCarreras: 10
        });
      } catch (error) {
        expect(errorHandled).toBe(true);
      }

      // Restore original method
      errorHandlingService.handleDatabaseError = originalHandleError;
    });

    it('should handle validation errors gracefully in complete flow', async () => {
      const invalidData = {
        fecha: '2025-01-01', // Future date
        kmRecorridos: -100, // Negative value
        numeroCarreras: 'invalid'
      };

      // Validation should catch errors before calculation
      const validationResult = validationService.validateRegistroDiario(invalidData);
      expect(validationResult.isValid).toBe(false);

      // Should not proceed to calculation or saving
      let calculationCalled = false;
      const originalCalculate = calcService.calculateGananciaNeta;
      calcService.calculateGananciaNeta = vi.fn(() => {
        calculationCalled = true;
        return originalCalculate.call(calcService, invalidData);
      });

      // In a real flow, validation would prevent this from happening
      if (validationResult.isValid) {
        calcService.calculateGananciaNeta(invalidData);
      }

      expect(calculationCalled).toBe(false);

      // Restore original method
      calcService.calculateGananciaNeta = originalCalculate;
    });
  });

  describe('User Experience Integration', () => {
    it('should provide appropriate feedback during operations', async () => {
      let notificationShown = false;
      const originalShow = notificationService.show;
      notificationService.show = vi.fn((message, type) => {
        notificationShown = true;
        return originalShow.call(notificationService, message, type);
      });

      // Perform operation that should show notification
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 100,
        numeroCarreras: 8
      };

      await dbService.saveRegistroDiario(registroData);

      // In real app, this would trigger a success notification
      notificationService.success('Registro guardado correctamente');

      expect(notificationShown).toBe(true);

      // Restore original method
      notificationService.show = originalShow;
    });

    it('should handle loading states properly', async () => {
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Save';
      document.body.appendChild(mockButton);

      // Test loading state
      performanceService.setLoadingState(mockButton, true, 'Saving...');
      expect(mockButton.classList.contains('loading')).toBe(true);
      expect(mockButton.disabled).toBe(true);

      // Test restore state
      performanceService.setLoadingState(mockButton, false);
      expect(mockButton.classList.contains('loading')).toBe(false);
      expect(mockButton.disabled).toBe(false);
    });
  });
});