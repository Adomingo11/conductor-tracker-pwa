export class CalculationService {
  constructor() {
    this.COMISION_VEHICULO = 0.52; // 52%
    this.COSTO_KILOMETRAJE = 0.05; // 5 céntimos por km
    this.COMISION_FREENOW_EFECTIVO = 0.06; // 6%
  }

  /**
   * Calcula la ganancia neta aplicando todas las reglas de negocio
   * @param {Object} registroDiario - Datos del registro diario
   * @returns {Object} - Objeto con todos los cálculos desglosados
   */
  calculateGananciaNeta(registroDiario) {
    const {
      kmRecorridos = 0,
      uber = {},
      freeNow = {},
      taxiConvencional = {},
      gastos = {}
    } = registroDiario;

    // Calcular ganancia bruta (sin propinas)
    const uberApp = parseFloat(uber.app || 0);
    const freeNowApp = parseFloat(freeNow.app || 0);
    const freeNowTarjeta = parseFloat(freeNow.tarjeta || 0);
    const freeNowEfectivo = parseFloat(freeNow.efectivo || 0);
    const taxiTarjeta = parseFloat(taxiConvencional.tarjeta || 0);
    const taxiEfectivo = parseFloat(taxiConvencional.efectivo || 0);

    const gananciaBruta = uberApp + freeNowApp + freeNowTarjeta + 
                         freeNowEfectivo + taxiTarjeta + taxiEfectivo;

    // Aplicar descuentos
    const comisionVehiculo = this.applyComisionVehiculo(gananciaBruta);
    const costoKilometraje = this.applyCostoKilometraje(kmRecorridos);
    const comisionFreeNowEfectivo = this.applyComisionFreeNowEfectivo(freeNowEfectivo);
    
    // Gastos de combustible (se suman al final sin descuentos)
    const gastosCombustible = parseFloat(gastos.combustible || 0);

    // Cálculo final: (Ganancia Bruta - Descuentos) + Gastos Combustible
    const gananciaNeta = (gananciaBruta - comisionVehiculo - costoKilometraje - comisionFreeNowEfectivo) + gastosCombustible;

    return {
      gananciaBruta: this.roundToTwo(gananciaBruta),
      comisionVehiculo: this.roundToTwo(comisionVehiculo),
      costoKilometraje: this.roundToTwo(costoKilometraje),
      comisionFreeNowEfectivo: this.roundToTwo(comisionFreeNowEfectivo),
      gastosCombustible: this.roundToTwo(gastosCombustible),
      gananciaNeta: this.roundToTwo(gananciaNeta),
      detalles: {
        uberApp,
        freeNowApp,
        freeNowTarjeta,
        freeNowEfectivo,
        taxiTarjeta,
        taxiEfectivo,
        kmRecorridos: parseFloat(kmRecorridos || 0)
      }
    };
  }

  /**
   * Calcula totales mensuales agregando todos los registros del período
   * @param {Array} registros - Array de registros del mes
   * @returns {Object} - Totales mensuales calculados
   */
  calculateMonthlyTotals(registros) {
    if (!registros || registros.length === 0) {
      return this.getEmptyTotals();
    }

    const totals = registros.reduce((acc, registro) => {
      const calc = this.calculateGananciaNeta(registro);
      
      return {
        kmRecorridos: acc.kmRecorridos + (parseFloat(registro.kmRecorridos) || 0),
        numeroCarreras: acc.numeroCarreras + (parseFloat(registro.numeroCarreras) || 0),
        uberApp: acc.uberApp + (parseFloat(registro.uber?.app) || 0),
        freeNowApp: acc.freeNowApp + (parseFloat(registro.freeNow?.app) || 0),
        freeNowTarjeta: acc.freeNowTarjeta + (parseFloat(registro.freeNow?.tarjeta) || 0),
        freeNowEfectivo: acc.freeNowEfectivo + (parseFloat(registro.freeNow?.efectivo) || 0),
        taxiTarjeta: acc.taxiTarjeta + (parseFloat(registro.taxiConvencional?.tarjeta) || 0),
        taxiEfectivo: acc.taxiEfectivo + (parseFloat(registro.taxiConvencional?.efectivo) || 0),
        gastosCombustible: acc.gastosCombustible + (parseFloat(registro.gastos?.combustible) || 0),
        gananciaBruta: acc.gananciaBruta + calc.gananciaBruta,
        comisionVehiculo: acc.comisionVehiculo + calc.comisionVehiculo,
        costoKilometraje: acc.costoKilometraje + calc.costoKilometraje,
        comisionFreeNowEfectivo: acc.comisionFreeNowEfectivo + calc.comisionFreeNowEfectivo,
        gananciaNeta: acc.gananciaNeta + calc.gananciaNeta
      };
    }, this.getEmptyTotals());

    // Round all values
    Object.keys(totals).forEach(key => {
      totals[key] = this.roundToTwo(totals[key]);
    });

    return totals;
  }

  /**
   * Calcula totales semanales
   * @param {Array} registros - Array de registros de la semana
   * @returns {Object} - Totales semanales calculados
   */
  calculateWeeklyTotals(registros) {
    return this.calculateMonthlyTotals(registros); // Same logic
  }

  /**
   * Calcula métricas del dashboard (totales generales)
   * @param {Array} registros - Todos los registros
   * @returns {Object} - Métricas del dashboard
   */
  calculateDashboardMetrics(registros) {
    const totals = this.calculateMonthlyTotals(registros);
    
    return {
      totalKm: totals.kmRecorridos,
      totalCarreras: totals.numeroCarreras,
      totalGanancias: totals.gananciaNeta
    };
  }

  /**
   * Aplica comisión de vehículo (52%)
   * @param {number} gananciaBruta 
   * @returns {number}
   */
  applyComisionVehiculo(gananciaBruta) {
    const ganancia = parseFloat(gananciaBruta) || 0;
    return this.roundToTwo(ganancia * this.COMISION_VEHICULO);
  }

  /**
   * Aplica costo por kilometraje (0.05€ por km)
   * @param {number} kilometros 
   * @returns {number}
   */
  applyCostoKilometraje(kilometros) {
    const km = parseFloat(kilometros) || 0;
    return this.roundToTwo(km * this.COSTO_KILOMETRAJE);
  }

  /**
   * Aplica comisión FreeNow efectivo (6%)
   * @param {number} efectivo 
   * @returns {number}
   */
  applyComisionFreeNowEfectivo(efectivo) {
    const cash = parseFloat(efectivo) || 0;
    return this.roundToTwo(cash * this.COMISION_FREENOW_EFECTIVO);
  }

  /**
   * Obtiene estructura de totales vacía
   * @returns {Object}
   */
  getEmptyTotals() {
    return {
      kmRecorridos: 0,
      numeroCarreras: 0,
      uberApp: 0,
      freeNowApp: 0,
      freeNowTarjeta: 0,
      freeNowEfectivo: 0,
      taxiTarjeta: 0,
      taxiEfectivo: 0,
      gastosCombustible: 0,
      gananciaBruta: 0,
      comisionVehiculo: 0,
      costoKilometraje: 0,
      comisionFreeNowEfectivo: 0,
      gananciaNeta: 0
    };
  }

  /**
   * Redondea a 2 decimales
   * @param {number} value 
   * @returns {number}
   */
  roundToTwo(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Formatea número como moneda
   * @param {number} value 
   * @returns {string}
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  /**
   * Analiza registros por período específico con métricas adicionales
   * @param {Array} registros - Registros del período
   * @returns {Object} - Análisis completo del período
   */
  analyzePeriod(registros) {
    if (!registros || registros.length === 0) {
      return {
        totals: this.getEmptyTotals(),
        averages: this.getEmptyAverages(),
        workingDays: 0,
        bestDay: null,
        worstDay: null
      };
    }

    const totals = this.calculateMonthlyTotals(registros);
    const workingDays = registros.length;
    
    // Calcular promedios
    const averages = {
      gananciaPorDia: totals.gananciaNeta / workingDays,
      kmPorDia: totals.kmRecorridos / workingDays,
      carrerasPorDia: totals.numeroCarreras / workingDays,
      gananciaPorCarrera: totals.numeroCarreras > 0 ? totals.gananciaNeta / totals.numeroCarreras : 0,
      gananciaPorKm: totals.kmRecorridos > 0 ? totals.gananciaNeta / totals.kmRecorridos : 0
    };

    // Encontrar mejor y peor día
    let bestDay = null;
    let worstDay = null;
    let maxGanancia = -Infinity;
    let minGanancia = Infinity;

    registros.forEach(registro => {
      const calc = this.calculateGananciaNeta(registro);
      if (calc.gananciaNeta > maxGanancia) {
        maxGanancia = calc.gananciaNeta;
        bestDay = { fecha: registro.fecha, ganancia: calc.gananciaNeta };
      }
      if (calc.gananciaNeta < minGanancia) {
        minGanancia = calc.gananciaNeta;
        worstDay = { fecha: registro.fecha, ganancia: calc.gananciaNeta };
      }
    });

    // Redondear promedios
    Object.keys(averages).forEach(key => {
      averages[key] = this.roundToTwo(averages[key]);
    });

    return {
      totals,
      averages,
      workingDays,
      bestDay,
      worstDay
    };
  }

  /**
   * Compara dos períodos y calcula diferencias
   * @param {Array} currentPeriod - Registros del período actual
   * @param {Array} previousPeriod - Registros del período anterior
   * @returns {Object} - Comparación entre períodos
   */
  comparePeriods(currentPeriod, previousPeriod) {
    const currentAnalysis = this.analyzePeriod(currentPeriod);
    const previousAnalysis = this.analyzePeriod(previousPeriod);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return this.roundToTwo(((current - previous) / previous) * 100);
    };

    return {
      current: currentAnalysis,
      previous: previousAnalysis,
      changes: {
        gananciaNeta: calculateChange(currentAnalysis.totals.gananciaNeta, previousAnalysis.totals.gananciaNeta),
        kmRecorridos: calculateChange(currentAnalysis.totals.kmRecorridos, previousAnalysis.totals.kmRecorridos),
        numeroCarreras: calculateChange(currentAnalysis.totals.numeroCarreras, previousAnalysis.totals.numeroCarreras),
        gananciaPorDia: calculateChange(currentAnalysis.averages.gananciaPorDia, previousAnalysis.averages.gananciaPorDia),
        workingDays: calculateChange(currentAnalysis.workingDays, previousAnalysis.workingDays)
      }
    };
  }

  /**
   * Obtiene estructura de promedios vacía
   * @returns {Object}
   */
  getEmptyAverages() {
    return {
      gananciaPorDia: 0,
      kmPorDia: 0,
      carrerasPorDia: 0,
      gananciaPorCarrera: 0,
      gananciaPorKm: 0
    };
  }

  /**
   * Genera resumen de cálculo para mostrar en PDF o UI
   * @param {Object} calculation 
   * @returns {Object}
   */
  generateCalculationSummary(calculation) {
    return {
      formula: `(${calculation.gananciaBruta}€ - ${calculation.comisionVehiculo}€ - ${calculation.costoKilometraje}€ - ${calculation.comisionFreeNowEfectivo}€) + ${calculation.gastosCombustible}€ = ${calculation.gananciaNeta}€`,
      breakdown: {
        'Ganancia Bruta': this.formatCurrency(calculation.gananciaBruta),
        'Comisión Vehículo (52%)': `-${this.formatCurrency(calculation.comisionVehiculo)}`,
        'Costo Kilometraje': `-${this.formatCurrency(calculation.costoKilometraje)}`,
        'Comisión FreeNow Efectivo (6%)': `-${this.formatCurrency(calculation.comisionFreeNowEfectivo)}`,
        'Gastos Combustible': `+${this.formatCurrency(calculation.gastosCombustible)}`,
        'Ganancia Neta': this.formatCurrency(calculation.gananciaNeta)
      }
    };
  }
}