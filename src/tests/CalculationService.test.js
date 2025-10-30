import { describe, it, expect, beforeEach } from 'vitest';
import { CalculationService } from '../services/CalculationService.js';

describe('CalculationService', () => {
  let calculationService;

  beforeEach(() => {
    calculationService = new CalculationService();
  });

  describe('Constants', () => {
    it('should have correct commission rates', () => {
      expect(calculationService.COMISION_VEHICULO).toBe(0.52);
      expect(calculationService.COSTO_KILOMETRAJE).toBe(0.05);
      expect(calculationService.COMISION_FREENOW_EFECTIVO).toBe(0.06);
    });
  });

  describe('Individual calculation methods', () => {
    describe('applyComisionVehiculo', () => {
      it('should calculate 52% commission correctly', () => {
        expect(calculationService.applyComisionVehiculo(100)).toBe(52);
        expect(calculationService.applyComisionVehiculo(200)).toBe(104);
        expect(calculationService.applyComisionVehiculo(0)).toBe(0);
      });

      it('should handle decimal values', () => {
        expect(calculationService.applyComisionVehiculo(150.50)).toBe(78.26);
      });
    });

    describe('applyCostoKilometraje', () => {
      it('should calculate 0.05€ per km correctly', () => {
        expect(calculationService.applyCostoKilometraje(100)).toBe(5);
        expect(calculationService.applyCostoKilometraje(200)).toBe(10);
        expect(calculationService.applyCostoKilometraje(0)).toBe(0);
      });

      it('should handle decimal kilometers', () => {
        expect(calculationService.applyCostoKilometraje(150.5)).toBe(7.53);
      });
    });

    describe('applyComisionFreeNowEfectivo', () => {
      it('should calculate 6% commission correctly', () => {
        expect(calculationService.applyComisionFreeNowEfectivo(100)).toBe(6);
        expect(calculationService.applyComisionFreeNowEfectivo(50)).toBe(3);
        expect(calculationService.applyComisionFreeNowEfectivo(0)).toBe(0);
      });

      it('should handle decimal values', () => {
        expect(calculationService.applyComisionFreeNowEfectivo(83.33)).toBe(5);
      });
    });
  });

  describe('calculateGananciaNeta', () => {
    it('should calculate net earnings correctly with all platforms', () => {
      const registro = {
        kmRecorridos: 100,
        uber: { app: 50, propinas: 10 },
        freeNow: { app: 40, tarjeta: 30, efectivo: 20, propinas: 5 },
        taxiConvencional: { tarjeta: 25, efectivo: 15 },
        gastos: { combustible: 30 }
      };

      const result = calculationService.calculateGananciaNeta(registro);

      // Ganancia bruta: 50 + 40 + 30 + 20 + 25 + 15 = 180€
      expect(result.gananciaBruta).toBe(180);
      
      // Comisión vehículo: 180 * 0.52 = 93.6€
      expect(result.comisionVehiculo).toBe(93.6);
      
      // Costo kilometraje: 100 * 0.05 = 5€
      expect(result.costoKilometraje).toBe(5);
      
      // Comisión FreeNow efectivo: 20 * 0.06 = 1.2€
      expect(result.comisionFreeNowEfectivo).toBe(1.2);
      
      // Gastos combustible: 30€
      expect(result.gastosCombustible).toBe(30);
      
      // Ganancia neta: (180 - 93.6 - 5 - 1.2) + 30 = 110.2€
      expect(result.gananciaNeta).toBe(110.2);
    });

    it('should handle empty or missing data', () => {
      const registro = {};
      const result = calculationService.calculateGananciaNeta(registro);

      expect(result.gananciaBruta).toBe(0);
      expect(result.comisionVehiculo).toBe(0);
      expect(result.costoKilometraje).toBe(0);
      expect(result.comisionFreeNowEfectivo).toBe(0);
      expect(result.gastosCombustible).toBe(0);
      expect(result.gananciaNeta).toBe(0);
    });

    it('should handle partial data correctly', () => {
      const registro = {
        kmRecorridos: 50,
        uber: { app: 100 },
        gastos: { combustible: 20 }
      };

      const result = calculationService.calculateGananciaNeta(registro);

      expect(result.gananciaBruta).toBe(100);
      expect(result.comisionVehiculo).toBe(52); // 100 * 0.52
      expect(result.costoKilometraje).toBe(2.5); // 50 * 0.05
      expect(result.comisionFreeNowEfectivo).toBe(0);
      expect(result.gastosCombustible).toBe(20);
      expect(result.gananciaNeta).toBe(65.5); // (100 - 52 - 2.5 - 0) + 20
    });

    it('should include detailed breakdown', () => {
      const registro = {
        kmRecorridos: 80,
        uber: { app: 60 },
        freeNow: { efectivo: 40 }
      };

      const result = calculationService.calculateGananciaNeta(registro);

      expect(result.detalles).toEqual({
        uberApp: 60,
        freeNowApp: 0,
        freeNowTarjeta: 0,
        freeNowEfectivo: 40,
        taxiTarjeta: 0,
        taxiEfectivo: 0,
        kmRecorridos: 80
      });
    });
  });

  describe('Monthly and Weekly Totals', () => {
    const sampleRegistros = [
      {
        kmRecorridos: 100,
        numeroCarreras: 15,
        uber: { app: 80 },
        freeNow: { app: 60, efectivo: 20 },
        gastos: { combustible: 25 }
      },
      {
        kmRecorridos: 120,
        numeroCarreras: 18,
        uber: { app: 90 },
        freeNow: { tarjeta: 40 },
        taxiConvencional: { efectivo: 30 },
        gastos: { combustible: 30 }
      }
    ];

    describe('calculateMonthlyTotals', () => {
      it('should aggregate multiple records correctly', () => {
        const result = calculationService.calculateMonthlyTotals(sampleRegistros);

        expect(result.kmRecorridos).toBe(220);
        expect(result.numeroCarreras).toBe(33);
        expect(result.uberApp).toBe(170);
        expect(result.freeNowApp).toBe(60);
        expect(result.freeNowEfectivo).toBe(20);
        expect(result.taxiEfectivo).toBe(30);
        expect(result.gastosCombustible).toBe(55);
      });

      it('should return empty totals for empty array', () => {
        const result = calculationService.calculateMonthlyTotals([]);
        const empty = calculationService.getEmptyTotals();
        
        expect(result).toEqual(empty);
      });

      it('should handle null or undefined input', () => {
        const result = calculationService.calculateMonthlyTotals(null);
        const empty = calculationService.getEmptyTotals();
        
        expect(result).toEqual(empty);
      });
    });

    describe('calculateWeeklyTotals', () => {
      it('should use same logic as monthly totals', () => {
        const monthlyResult = calculationService.calculateMonthlyTotals(sampleRegistros);
        const weeklyResult = calculationService.calculateWeeklyTotals(sampleRegistros);
        
        expect(weeklyResult).toEqual(monthlyResult);
      });
    });
  });

  describe('Dashboard Metrics', () => {
    it('should calculate dashboard metrics correctly', () => {
      const registros = [
        {
          kmRecorridos: 100,
          numeroCarreras: 10,
          uber: { app: 100 },
          gastos: { combustible: 20 }
        }
      ];

      const result = calculationService.calculateDashboardMetrics(registros);
      const totals = calculationService.calculateMonthlyTotals(registros);

      expect(result.totalKm).toBe(totals.kmRecorridos);
      expect(result.totalCarreras).toBe(totals.numeroCarreras);
      expect(result.totalGanancias).toBe(totals.gananciaNeta);
    });
  });

  describe('Period Analysis', () => {
    const analysisRegistros = [
      {
        fecha: '2024-01-01',
        kmRecorridos: 100,
        numeroCarreras: 10,
        uber: { app: 100 },
        gastos: { combustible: 20 }
      },
      {
        fecha: '2024-01-02',
        kmRecorridos: 80,
        numeroCarreras: 8,
        uber: { app: 80 },
        gastos: { combustible: 15 }
      }
    ];

    describe('analyzePeriod', () => {
      it('should provide comprehensive period analysis', () => {
        const result = calculationService.analyzePeriod(analysisRegistros);

        expect(result.workingDays).toBe(2);
        expect(result.totals).toBeDefined();
        expect(result.averages).toBeDefined();
        expect(result.bestDay).toBeDefined();
        expect(result.worstDay).toBeDefined();
      });

      it('should calculate averages correctly', () => {
        const result = calculationService.analyzePeriod(analysisRegistros);
        const totals = result.totals;

        expect(result.averages.gananciaPorDia).toBe(totals.gananciaNeta / 2);
        expect(result.averages.kmPorDia).toBe(totals.kmRecorridos / 2);
        expect(result.averages.carrerasPorDia).toBe(totals.numeroCarreras / 2);
      });

      it('should identify best and worst days', () => {
        const result = calculationService.analyzePeriod(analysisRegistros);

        expect(result.bestDay.fecha).toBe('2024-01-01');
        expect(result.worstDay.fecha).toBe('2024-01-02');
        expect(result.bestDay.ganancia).toBeGreaterThan(result.worstDay.ganancia);
      });

      it('should handle empty period', () => {
        const result = calculationService.analyzePeriod([]);

        expect(result.workingDays).toBe(0);
        expect(result.bestDay).toBeNull();
        expect(result.worstDay).toBeNull();
        expect(result.totals).toEqual(calculationService.getEmptyTotals());
      });
    });

    describe('comparePeriods', () => {
      const currentPeriod = analysisRegistros;
      const previousPeriod = [
        {
          fecha: '2023-12-01',
          kmRecorridos: 90,
          numeroCarreras: 9,
          uber: { app: 90 },
          gastos: { combustible: 18 }
        }
      ];

      it('should compare two periods correctly', () => {
        const result = calculationService.comparePeriods(currentPeriod, previousPeriod);

        expect(result.current).toBeDefined();
        expect(result.previous).toBeDefined();
        expect(result.changes).toBeDefined();
        expect(result.changes.gananciaNeta).toBeDefined();
        expect(result.changes.kmRecorridos).toBeDefined();
        expect(result.changes.numeroCarreras).toBeDefined();
      });

      it('should calculate percentage changes', () => {
        const result = calculationService.comparePeriods(currentPeriod, previousPeriod);

        // Should return percentage changes
        expect(typeof result.changes.gananciaNeta).toBe('number');
        expect(typeof result.changes.kmRecorridos).toBe('number');
        expect(typeof result.changes.numeroCarreras).toBe('number');
      });

      it('should handle zero previous values', () => {
        const emptyPrevious = [];
        const result = calculationService.comparePeriods(currentPeriod, emptyPrevious);

        // When previous is 0 and current > 0, should return 100%
        expect(result.changes.gananciaNeta).toBe(100);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('roundToTwo', () => {
      it('should round to 2 decimal places', () => {
        expect(calculationService.roundToTwo(1.234)).toBe(1.23);
        expect(calculationService.roundToTwo(1.235)).toBe(1.24);
        expect(calculationService.roundToTwo(1.999)).toBe(2);
        expect(calculationService.roundToTwo(1)).toBe(1);
      });
    });

    describe('formatCurrency', () => {
      it('should format as EUR currency', () => {
        const formatted = calculationService.formatCurrency(123.45);
        expect(formatted).toContain('123,45');
        expect(formatted).toContain('€');
      });
    });

    describe('generateCalculationSummary', () => {
      it('should generate formula and breakdown', () => {
        const calculation = {
          gananciaBruta: 100,
          comisionVehiculo: 52,
          costoKilometraje: 5,
          comisionFreeNowEfectivo: 2,
          gastosCombustible: 20,
          gananciaNeta: 61
        };

        const summary = calculationService.generateCalculationSummary(calculation);

        expect(summary.formula).toContain('100€');
        expect(summary.formula).toContain('52€');
        expect(summary.formula).toContain('61€');
        expect(summary.breakdown).toBeDefined();
        expect(Object.keys(summary.breakdown)).toHaveLength(6);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle string numbers correctly', () => {
      const registro = {
        kmRecorridos: '100',
        uber: { app: '50' },
        gastos: { combustible: '20' }
      };

      const result = calculationService.calculateGananciaNeta(registro);
      expect(result.gananciaBruta).toBe(50);
      expect(result.costoKilometraje).toBe(5);
    });

    it('should handle invalid or NaN values', () => {
      const registro = {
        kmRecorridos: 'invalid',
        uber: { app: null },
        freeNow: { efectivo: undefined }
      };

      const result = calculationService.calculateGananciaNeta(registro);
      expect(result.gananciaBruta).toBe(0);
      expect(result.costoKilometraje).toBe(0);
      expect(result.comisionFreeNowEfectivo).toBe(0);
    });

    it('should handle negative values appropriately', () => {
      const registro = {
        kmRecorridos: -10,
        uber: { app: -50 }
      };

      const result = calculationService.calculateGananciaNeta(registro);
      // Should still calculate even with negative values
      expect(typeof result.gananciaNeta).toBe('number');
    });
  });
});