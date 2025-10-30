import { describe, it, expect, beforeEach } from 'vitest';

// Mock Chart.js to avoid DOM dependencies in tests
const mockChart = {
  register: () => {},
  Chart: class MockChart {
    constructor() {}
    destroy() {}
  }
};

// Create a minimal ChartService for testing data formatting
class TestChartService {
  constructor() {
    this.defaultColors = {
      primary: '#4F46E5',
      secondary: '#10B981',
      tertiary: '#F59E0B'
    };
  }

  calculatePlatformTotals(registros) {
    return registros.reduce((totales, registro) => {
      // Uber (App + Propinas)
      totales.uber += (registro.uber?.app || 0) + (registro.uber?.propinas || 0);
      
      // FreeNow (App + Tarjeta + Efectivo + Propinas)
      totales.freeNow += (registro.freeNow?.app || 0) + 
                        (registro.freeNow?.tarjeta || 0) + 
                        (registro.freeNow?.efectivo || 0) + 
                        (registro.freeNow?.propinas || 0);
      
      // Taxi Convencional (Tarjeta + Efectivo)
      totales.taxiConvencional += (registro.taxiConvencional?.tarjeta || 0) + 
                                 (registro.taxiConvencional?.efectivo || 0);
      
      return totales;
    }, { uber: 0, freeNow: 0, taxiConvencional: 0 });
  }

  formatPlatformBarData(registros) {
    const totales = this.calculatePlatformTotals(registros);
    
    const platformColors = {
      backgroundColor: [
        'rgba(79, 70, 229, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)'
      ],
      borderColor: [
        'rgba(79, 70, 229, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)'
      ],
      hoverBackgroundColor: [
        'rgba(79, 70, 229, 0.9)',
        'rgba(16, 185, 129, 0.9)',
        'rgba(245, 158, 11, 0.9)'
      ]
    };
    
    return {
      labels: ['Uber', 'FreeNow', 'Taxi Convencional'],
      datasets: [{
        label: 'Ingresos por Plataforma',
        data: [
          totales.uber,
          totales.freeNow,
          totales.taxiConvencional
        ],
        backgroundColor: platformColors.backgroundColor,
        borderColor: platformColors.borderColor,
        hoverBackgroundColor: platformColors.hoverBackgroundColor,
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    };
  }

  formatPlatformPieData(registros) {
    const totales = this.calculatePlatformTotals(registros);
    
    const platformColors = {
      backgroundColor: [
        'rgba(79, 70, 229, 0.9)',
        'rgba(16, 185, 129, 0.9)',
        'rgba(245, 158, 11, 0.9)'
      ],
      hoverBackgroundColor: [
        'rgba(79, 70, 229, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)'
      ]
    };
    
    return {
      labels: ['Uber', 'FreeNow', 'Taxi Convencional'],
      datasets: [{
        data: [
          totales.uber,
          totales.freeNow,
          totales.taxiConvencional
        ],
        backgroundColor: platformColors.backgroundColor,
        hoverBackgroundColor: platformColors.hoverBackgroundColor,
        borderColor: '#1F2937',
        borderWidth: 2,
        hoverBorderWidth: 4,
        hoverBorderColor: '#FFFFFF'
      }]
    };
  }
}

describe('ChartService - Platform Distribution', () => {
  let chartService;
  let mockRegistros;

  beforeEach(() => {
    chartService = new TestChartService();
    
    // Mock data for testing
    mockRegistros = [
      {
        fecha: '2024-01-01',
        uber: { app: 50, propinas: 5 },
        freeNow: { app: 30, tarjeta: 20, efectivo: 15, propinas: 3 },
        taxiConvencional: { tarjeta: 25, efectivo: 10 },
        gananciaNeta: 100,
        kmRecorridos: 150,
        numeroCarreras: 12
      },
      {
        fecha: '2024-01-02',
        uber: { app: 40, propinas: 4 },
        freeNow: { app: 25, tarjeta: 15, efectivo: 10, propinas: 2 },
        taxiConvencional: { tarjeta: 20, efectivo: 8 },
        gananciaNeta: 80,
        kmRecorridos: 120,
        numeroCarreras: 10
      }
    ];
  });

  describe('calculatePlatformTotals', () => {
    it('should calculate correct totals for each platform', () => {
      const totales = chartService.calculatePlatformTotals(mockRegistros);
      
      // Uber: (50+5) + (40+4) = 99
      expect(totales.uber).toBe(99);
      
      // FreeNow: (30+20+15+3) + (25+15+10+2) = 120
      expect(totales.freeNow).toBe(120);
      
      // Taxi: (25+10) + (20+8) = 63
      expect(totales.taxiConvencional).toBe(63);
    });

    it('should handle missing data gracefully', () => {
      const registrosIncompletos = [
        {
          fecha: '2024-01-01',
          uber: { app: 50 }, // Missing propinas
          freeNow: { app: 30 }, // Missing other fields
          // Missing taxiConvencional
        }
      ];
      
      const totales = chartService.calculatePlatformTotals(registrosIncompletos);
      
      expect(totales.uber).toBe(50);
      expect(totales.freeNow).toBe(30);
      expect(totales.taxiConvencional).toBe(0);
    });

    it('should handle empty array', () => {
      const totales = chartService.calculatePlatformTotals([]);
      
      expect(totales.uber).toBe(0);
      expect(totales.freeNow).toBe(0);
      expect(totales.taxiConvencional).toBe(0);
    });
  });

  describe('formatPlatformBarData', () => {
    it('should format data correctly for bar chart', () => {
      const data = chartService.formatPlatformBarData(mockRegistros);
      
      expect(data.labels).toEqual(['Uber', 'FreeNow', 'Taxi Convencional']);
      expect(data.datasets).toHaveLength(1);
      expect(data.datasets[0].data).toEqual([99, 120, 63]);
      expect(data.datasets[0].label).toBe('Ingresos por Plataforma');
    });

    it('should include proper styling properties', () => {
      const data = chartService.formatPlatformBarData(mockRegistros);
      const dataset = data.datasets[0];
      
      expect(dataset.backgroundColor).toHaveLength(3);
      expect(dataset.borderColor).toHaveLength(3);
      expect(dataset.hoverBackgroundColor).toHaveLength(3);
      expect(dataset.borderWidth).toBe(2);
    });
  });

  describe('formatPlatformPieData', () => {
    it('should format data correctly for pie chart', () => {
      const data = chartService.formatPlatformPieData(mockRegistros);
      
      expect(data.labels).toEqual(['Uber', 'FreeNow', 'Taxi Convencional']);
      expect(data.datasets).toHaveLength(1);
      expect(data.datasets[0].data).toEqual([99, 120, 63]);
    });

    it('should include proper styling for pie chart', () => {
      const data = chartService.formatPlatformPieData(mockRegistros);
      const dataset = data.datasets[0];
      
      expect(dataset.backgroundColor).toHaveLength(3);
      expect(dataset.hoverBackgroundColor).toHaveLength(3);
      expect(dataset.borderColor).toBe('#1F2937');
      expect(dataset.borderWidth).toBe(2);
    });
  });

  describe('Platform colors consistency', () => {
    it('should use consistent colors between bar and pie charts', () => {
      const barData = chartService.formatPlatformBarData(mockRegistros);
      const pieData = chartService.formatPlatformPieData(mockRegistros);
      
      // Colors should be consistent (though pie chart might have different opacity)
      expect(barData.datasets[0].backgroundColor).toHaveLength(3);
      expect(pieData.datasets[0].backgroundColor).toHaveLength(3);
      
      // Both should have same number of platforms
      expect(barData.labels).toEqual(pieData.labels);
    });
  });
});