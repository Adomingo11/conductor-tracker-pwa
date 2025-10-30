import ChartService from '../services/ChartService.js';

/**
 * DashboardVisual Component
 * Proporciona una interfaz visual con gráficos de tendencias y métricas de rendimiento
 */
export class DashboardVisual {
  constructor(dbService, calcService) {
    this.dbService = dbService;
    this.calcService = calcService;
    this.chartService = new ChartService();
    this.currentPeriod = 30; // Período por defecto: 30 días
    this.charts = {}; // Almacenar referencias a los gráficos
    this.isLoading = false;
  }

  /**
   * Inicializar el componente
   */
  init() {
    this.setupEventListeners();
    this.setupEventBusListeners();
  }

  /**
   * Configurar listeners del EventBus
   */
  setupEventBusListeners() {
    if (window.eventBus) {
      // Escuchar evento de registro actualizado
      window.eventBus.on('registro-updated', () => {
        this.loadData();
      });

      // Escuchar evento de registro eliminado
      window.eventBus.on('registro-deleted', () => {
        this.loadData();
      });

      // Escuchar evento de registro creado
      window.eventBus.on('registro-created', () => {
        this.loadData();
      });
    }
  }

  /**
   * Configurar event listeners para los controles del dashboard
   */
  setupEventListeners() {
    // Selector de período
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = parseInt(e.target.dataset.period);
        this.changePeriod(period);
      });
    });

    // Botón de actualizar datos
    const refreshBtn = document.getElementById('refresh-charts');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
      });
    }

    // Botón de resetear zoom (si existe)
    const resetZoomBtn = document.getElementById('reset-zoom');
    if (resetZoomBtn) {
      resetZoomBtn.addEventListener('click', () => {
        this.chartService.resetAllZoom();
      });
    }

    // Doble clic en gráficos para resetear zoom (solo en desktop)
    if (!this.chartService.touchSupport) {
      const chartCanvases = ['earnings-chart', 'kilometers-chart', 'rides-chart'];
      chartCanvases.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
          canvas.addEventListener('dblclick', () => {
            this.chartService.resetZoom(canvasId);
          });
        }
      });
    }

    // Configurar eventos de redimensionamiento de ventana
    this.setupResizeHandlers();

    // Configurar eventos de orientación para móviles
    this.setupOrientationHandlers();
  }

  /**
   * Configurar manejadores de redimensionamiento
   */
  setupResizeHandlers() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleWindowResize();
      }, 250);
    });
  }

  /**
   * Configurar manejadores de cambio de orientación
   */
  setupOrientationHandlers() {
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        // Delay para permitir que el layout se ajuste
        setTimeout(() => {
          this.handleOrientationChange();
        }, 300);
      });
    } else {
      // Fallback para navegadores más antiguos
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.handleOrientationChange();
        }, 300);
      });
    }
  }

  /**
   * Manejar redimensionamiento de ventana
   */
  handleWindowResize() {
    // Recalcular layout de gráficos
    this.optimizeChartsLayout();
    
    // Actualizar métricas si es necesario
    this.updateMetricsLayout();
  }

  /**
   * Manejar cambio de orientación
   */
  handleOrientationChange() {
    // Forzar recálculo de dimensiones
    this.handleWindowResize();
    
    // Recargar gráficos si es necesario en móviles
    if (this.chartService.touchSupport) {
      setTimeout(() => {
        this.refreshChartsForOrientation();
      }, 100);
    }
  }

  /**
   * Optimizar layout de gráficos según el tamaño de pantalla
   */
  optimizeChartsLayout() {
    const chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) return;

    const containerWidth = chartsContainer.clientWidth;
    const isMobile = containerWidth < 768;
    const isSmall = containerWidth < 480;

    // Ajustar grid de gráficos
    const chartsGrid = chartsContainer.querySelector('.charts-grid');
    if (chartsGrid) {
      if (isSmall) {
        chartsGrid.style.gridTemplateColumns = '1fr';
      } else if (isMobile) {
        chartsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
      } else {
        chartsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
      }
    }

    // Ajustar altura de contenedores de gráficos
    const chartContainers = chartsContainer.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      if (isSmall) {
        container.style.height = '250px';
      } else if (isMobile) {
        container.style.height = '300px';
      } else {
        container.style.height = '400px';
      }
    });
  }

  /**
   * Actualizar layout de métricas
   */
  updateMetricsLayout() {
    const metricsContainer = document.querySelector('.performance-metrics');
    if (!metricsContainer) return;

    const containerWidth = metricsContainer.clientWidth;
    const isMobile = containerWidth < 768;

    if (isMobile) {
      metricsContainer.style.gridTemplateColumns = '1fr';
    } else {
      metricsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    }
  }

  /**
   * Refrescar gráficos después de cambio de orientación
   */
  refreshChartsForOrientation() {
    // Obtener datos actuales y regenerar gráficos
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.currentPeriod);
    
    this.dbService.getRegistrosByDateRange(startDate, endDate)
      .then(registros => {
        if (registros.length > 0) {
          // Regenerar solo los gráficos que puedan tener problemas de layout
          this.recreateChartsIfNeeded(registros);
        }
      })
      .catch(error => {
        console.error('Error refreshing charts for orientation:', error);
      });
  }

  /**
   * Recrear gráficos si es necesario
   * @param {Array} registros - Array de registros diarios
   */
  recreateChartsIfNeeded(registros) {
    // Verificar si los gráficos necesitan ser recreados
    const chartsToCheck = ['earnings-chart', 'kilometers-chart', 'rides-chart'];
    
    chartsToCheck.forEach(canvasId => {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        // Si el canvas tiene dimensiones incorrectas, recrear
        if (rect.width < 100 || rect.height < 100) {
          this.recreateSpecificChart(canvasId, registros);
        }
      }
    });
  }

  /**
   * Recrear un gráfico específico
   * @param {string} canvasId - ID del canvas
   * @param {Array} registros - Array de registros diarios
   */
  recreateSpecificChart(canvasId, registros) {
    switch (canvasId) {
      case 'earnings-chart':
        this.createEarningsChart(registros);
        break;
      case 'kilometers-chart':
        this.createKilometersChart(registros);
        break;
      case 'rides-chart':
        this.createRidesChart(registros);
        break;
    }
  }

  /**
   * Cambiar período de análisis y actualizar gráficos
   * @param {number} days - Número de días del período
   */
  async changePeriod(days) {
    if (this.isLoading) return;
    
    this.currentPeriod = days;
    
    // Actualizar botones activos
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-period="${days}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Mostrar indicador de actualización
    this.showPeriodUpdateIndicator();
    
    // Recargar datos con el nuevo período
    await this.loadData();
  }

  /**
   * Mostrar indicador visual de actualización de período
   */
  showPeriodUpdateIndicator() {
    const periodInfo = document.getElementById('period-info');
    if (periodInfo) {
      periodInfo.style.display = 'block';
      periodInfo.textContent = `Actualizando datos para ${this.currentPeriod} días...`;
      periodInfo.style.opacity = '0.7';
    }
  }

  /**
   * Cargar datos y generar gráficos
   */
  async loadData() {
    if (this.isLoading) return;
    
    try {
      this.setLoadingState(true);
      
      // Obtener registros del período actual
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - this.currentPeriod);
      
      const registros = await this.dbService.getRegistrosByDateRange(startDate, endDate);
      
      // Obtener registros del período anterior para comparación
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date();
      previousStartDate.setDate(previousEndDate.getDate() - this.currentPeriod);
      
      const registrosAnteriores = await this.dbService.getRegistrosByDateRange(previousStartDate, previousEndDate);
      
      // Generar gráficos y métricas
      await this.generateCharts(registros);
      this.updateMetrics(registros, registrosAnteriores);
      
      this.setLoadingState(false);
      
    } catch (error) {
      console.error('Error loading dashboard visual data:', error);
      this.showError('Error al cargar los datos del dashboard visual');
      this.setLoadingState(false);
    }
  }

  /**
   * Generar todos los gráficos del dashboard
   * @param {Array} registros - Array de registros diarios
   */
  async generateCharts(registros) {
    // Destruir gráficos existentes
    this.destroyAllCharts();
    
    if (registros.length === 0) {
      this.showNoDataMessage();
      return;
    }
    
    this.hideNoDataMessage();
    
    try {
      // Optimize dataset for large data
      const optimizedRegistros = this.optimizeDatasetForCharts(registros);
      
      // Create charts with progressive loading for better UX
      await this.createChartsProgressively(optimizedRegistros);
      
      // Actualizar información del período en la interfaz
      this.updatePeriodInfo(registros);
      
    } catch (error) {
      console.error('Error generating charts:', error);
      this.showError('Error al generar los gráficos');
    }
  }

  /**
   * Optimize dataset for chart rendering
   * @param {Array} registros - Original dataset
   * @returns {Array} Optimized dataset
   */
  optimizeDatasetForCharts(registros) {
    // For very large datasets, apply data reduction techniques
    if (registros.length > 365) {
      // Group by week for datasets larger than 1 year
      return this.groupDataByWeek(registros);
    } else if (registros.length > 90) {
      // Apply light decimation for datasets larger than 3 months
      return this.decimateData(registros, 0.8);
    }
    
    return registros;
  }

  /**
   * Group data by week for large datasets
   * @param {Array} registros - Original dataset
   * @returns {Array} Weekly grouped data
   */
  groupDataByWeek(registros) {
    const weeklyData = new Map();
    
    registros.forEach(registro => {
      const date = new Date(registro.fecha);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          fecha: weekStart,
          kmRecorridos: 0,
          numeroCarreras: 0,
          gananciaNeta: 0,
          uber: { app: 0, propinas: 0 },
          freeNow: { app: 0, tarjeta: 0, efectivo: 0, propinas: 0 },
          taxiConvencional: { tarjeta: 0, efectivo: 0 },
          gastos: { combustible: 0 },
          count: 0
        });
      }
      
      const week = weeklyData.get(weekKey);
      week.kmRecorridos += registro.kmRecorridos || 0;
      week.numeroCarreras += registro.numeroCarreras || 0;
      week.gananciaNeta += registro.gananciaNeta || 0;
      week.uber.app += registro.uber?.app || 0;
      week.uber.propinas += registro.uber?.propinas || 0;
      week.freeNow.app += registro.freeNow?.app || 0;
      week.freeNow.tarjeta += registro.freeNow?.tarjeta || 0;
      week.freeNow.efectivo += registro.freeNow?.efectivo || 0;
      week.freeNow.propinas += registro.freeNow?.propinas || 0;
      week.taxiConvencional.tarjeta += registro.taxiConvencional?.tarjeta || 0;
      week.taxiConvencional.efectivo += registro.taxiConvencional?.efectivo || 0;
      week.gastos.combustible += registro.gastos?.combustible || 0;
      week.count++;
    });
    
    return Array.from(weeklyData.values()).sort((a, b) => a.fecha - b.fecha);
  }

  /**
   * Decimate data using LTTB algorithm (simplified)
   * @param {Array} registros - Original dataset
   * @param {number} factor - Decimation factor (0-1)
   * @returns {Array} Decimated dataset
   */
  decimateData(registros, factor) {
    const targetLength = Math.floor(registros.length * factor);
    if (targetLength >= registros.length) return registros;
    
    const step = registros.length / targetLength;
    const decimated = [];
    
    for (let i = 0; i < registros.length; i += step) {
      decimated.push(registros[Math.floor(i)]);
    }
    
    return decimated;
  }

  /**
   * Create charts progressively for better UX
   * @param {Array} registros - Optimized dataset
   */
  async createChartsProgressively(registros) {
    const chartCreators = [
      () => this.createEarningsChart(registros),
      () => this.createKilometersChart(registros),
      () => this.createRidesChart(registros),
      () => this.createPlatformBarChart(registros),
      () => this.createPlatformPieChart(registros)
    ];
    
    // Create charts with small delays for progressive loading
    for (let i = 0; i < chartCreators.length; i++) {
      try {
        chartCreators[i]();
        
        // Small delay between chart creations to prevent blocking
        if (i < chartCreators.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`Error creating chart ${i}:`, error);
      }
    }
  }

  /**
   * Crear gráfico de tendencia de ganancias netas
   * @param {Array} registros - Array de registros diarios
   */
  createEarningsChart(registros) {
    const data = this.chartService.formatTimeSeriesData(registros, 'gananciaNeta', this.currentPeriod);
    
    this.charts.earnings = this.chartService.createLineChart('earnings-chart', data, {
      title: 'Evolución de Ganancias Netas',
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(75, 85, 99, 0.3)'
          },
          ticks: {
            color: '#9CA3AF',
            callback: function(value) {
              return value.toFixed(2) + '€';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
              const avg = total / data.datasets[0].data.length;
              return [`Promedio período: ${avg.toFixed(2)}€`];
            }
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          const value = data.datasets[0].data[dataIndex];
          const fecha = data.labels[dataIndex];
          this.showDataPointDetails('Ganancias', fecha, value, '€');
        }
      }
    });
  }

  /**
   * Crear gráfico de tendencia de kilómetros
   * @param {Array} registros - Array de registros diarios
   */
  createKilometersChart(registros) {
    const data = this.chartService.formatTimeSeriesData(registros, 'kmRecorridos', this.currentPeriod);
    
    this.charts.kilometers = this.chartService.createLineChart('kilometers-chart', data, {
      title: 'Evolución de Kilómetros Recorridos',
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(75, 85, 99, 0.3)'
          },
          ticks: {
            color: '#9CA3AF',
            callback: function(value) {
              return value.toFixed(1) + ' km';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
              const avg = total / data.datasets[0].data.length;
              return [`Promedio período: ${avg.toFixed(1)} km/día`];
            }
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          const value = data.datasets[0].data[dataIndex];
          const fecha = data.labels[dataIndex];
          this.showDataPointDetails('Kilómetros', fecha, value, 'km');
        }
      }
    });
  }

  /**
   * Crear gráfico de tendencia de carreras
   * @param {Array} registros - Array de registros diarios
   */
  createRidesChart(registros) {
    const data = this.chartService.formatTimeSeriesData(registros, 'numeroCarreras', this.currentPeriod);
    
    this.charts.rides = this.chartService.createLineChart('rides-chart', data, {
      title: 'Evolución del Número de Carreras',
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(75, 85, 99, 0.3)'
          },
          ticks: {
            color: '#9CA3AF',
            stepSize: 1,
            callback: function(value) {
              return Math.floor(value) + ' carreras';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
              const avg = total / data.datasets[0].data.length;
              return [`Promedio período: ${avg.toFixed(1)} carreras/día`];
            }
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          const value = data.datasets[0].data[dataIndex];
          const fecha = data.labels[dataIndex];
          this.showDataPointDetails('Carreras', fecha, value, 'carreras');
        }
      }
    });
  }

  /**
   * Crear gráfico de barras por plataforma
   * @param {Array} registros - Array de registros diarios
   */
  createPlatformBarChart(registros) {
    const data = this.chartService.formatPlatformBarData(registros);
    
    this.charts.platformBar = this.chartService.createBarChart('platform-bar-chart', data, {
      title: 'Ingresos Totales por Plataforma',
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value.toFixed(2)}€ (${percentage}%)`;
            },
            afterLabel: function(context) {
              const registros = context.chart.registros || [];
              const platformDetails = this.getPlatformBreakdown(registros, context.dataIndex);
              return platformDetails;
            }.bind(this)
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const platform = data.labels[index];
          const value = data.datasets[0].data[index];
          this.showPlatformDetails(platform, value, registros);
        }
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
      }
    });
    
    // Almacenar registros en el gráfico para uso en tooltips
    this.charts.platformBar.registros = registros;
  }

  /**
   * Crear gráfico circular por plataforma
   * @param {Array} registros - Array de registros diarios
   */
  createPlatformPieChart(registros) {
    const data = this.chartService.formatPlatformPieData(registros);
    
    this.charts.platformPie = this.chartService.createPieChart('platform-pie-chart', data, {
      title: 'Distribución Porcentual por Plataforma',
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value.toFixed(2)}€ (${percentage}%)`;
            },
            afterLabel: function(context) {
              const registros = context.chart.registros || [];
              const platformDetails = this.getPlatformBreakdown(registros, context.dataIndex);
              return platformDetails;
            }.bind(this)
          }
        },
        legend: {
          onClick: (event, legendItem, legend) => {
            // Personalizar comportamiento del clic en la leyenda
            const index = legendItem.index;
            const chart = legend.chart;
            const meta = chart.getDatasetMeta(0);
            
            // Toggle visibility
            meta.data[index].hidden = !meta.data[index].hidden;
            chart.update();
            
            // Mostrar detalles de la plataforma
            const platform = chart.data.labels[index];
            const value = chart.data.datasets[0].data[index];
            this.showPlatformDetails(platform, value, chart.registros);
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const platform = data.labels[index];
          const value = data.datasets[0].data[index];
          this.showPlatformDetails(platform, value, registros);
        }
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
      }
    });
    
    // Almacenar registros en el gráfico para uso en tooltips
    this.charts.platformPie.registros = registros;
  }

  /**
   * Actualizar métricas de rendimiento
   * @param {Array} registrosActuales - Registros del período actual
   * @param {Array} registrosAnteriores - Registros del período anterior
   */
  updateMetrics(registrosActuales, registrosAnteriores) {
    const metricas = this.chartService.calculateTrendMetrics(registrosActuales, registrosAnteriores);
    
    // Actualizar ganancia promedio por carrera
    this.updateMetricCard('avg-earnings-per-ride', metricas.gananciaPromedioPorCarrera, '€/carrera');
    
    // Actualizar ganancia promedio por kilómetro
    this.updateMetricCard('avg-earnings-per-km', metricas.gananciaPromedioPorKm, '€/km');
    
    // Actualizar carreras promedio por día
    this.updateMetricCard('avg-rides-per-day', metricas.carrerasPromedioPorDia, 'carreras/día');
    
    // Actualizar indicadores de tendencia
    this.updateTrendIndicators(metricas);
    
    // Aplicar resaltado visual para mejores/peores valores
    this.highlightBestWorstMetrics(metricas);
  }

  /**
   * Actualizar tarjeta de métrica individual
   * @param {string} elementId - ID del elemento
   * @param {number} value - Valor de la métrica
   * @param {string} unit - Unidad de medida
   */
  updateMetricCard(elementId, value, unit) {
    const element = document.getElementById(elementId);
    if (element) {
      const formattedValue = typeof value === 'number' ? value.toFixed(2) : '0.00';
      element.textContent = formattedValue;
      
      const unitElement = element.nextElementSibling;
      if (unitElement && unitElement.classList.contains('metric-unit')) {
        unitElement.textContent = unit;
      }
    }
  }

  /**
   * Actualizar indicadores de tendencia
   * @param {Object} metricas - Objeto con métricas calculadas
   */
  updateTrendIndicators(metricas) {
    const indicators = [
      { id: 'earnings-trend', metric: metricas.gananciaNeta, metricName: 'ganancias' },
      { id: 'km-trend', metric: metricas.kmRecorridos, metricName: 'kilometros' },
      { id: 'rides-trend', metric: metricas.numeroCarreras, metricName: 'carreras' }
    ];
    
    indicators.forEach(({ id, metric, metricName }) => {
      const element = document.getElementById(id);
      if (element) {
        const { tendencia, porcentajeCambio } = metric;
        
        // Limpiar clases anteriores y añadir nuevas
        element.className = `trend-indicator ${tendencia}`;
        
        let icon = '→';
        let colorClass = 'neutral';
        
        if (tendencia === 'subida') {
          icon = '↗';
          colorClass = 'positive';
        } else if (tendencia === 'bajada') {
          icon = '↘';
          colorClass = 'negative';
        }
        
        element.classList.add(colorClass);
        element.innerHTML = `${icon} ${Math.abs(porcentajeCambio).toFixed(1)}%`;
        
        // Añadir tooltip con información detallada
        const tooltipText = this.generateTrendTooltip(metric, metricName);
        element.setAttribute('title', tooltipText);
      }
    });
  }

  /**
   * Generar texto de tooltip para indicadores de tendencia
   * @param {Object} metric - Datos de la métrica
   * @param {string} metricName - Nombre de la métrica
   * @returns {string} Texto del tooltip
   */
  generateTrendTooltip(metric, metricName) {
    const { actual, anterior, cambio, porcentajeCambio, tendencia } = metric;
    
    let unit = '';
    let formatValue = (val) => val.toFixed(2);
    
    switch(metricName) {
      case 'ganancias':
        unit = '€';
        break;
      case 'kilometros':
        unit = ' km';
        formatValue = (val) => val.toFixed(1);
        break;
      case 'carreras':
        unit = ' carreras';
        formatValue = (val) => Math.round(val);
        break;
    }
    
    const tendenciaText = tendencia === 'subida' ? 'Mejora' : 
                         tendencia === 'bajada' ? 'Disminución' : 'Sin cambios';
    
    return `${tendenciaText} del ${Math.abs(porcentajeCambio).toFixed(1)}%
Período actual: ${formatValue(actual)}${unit}
Período anterior: ${formatValue(anterior)}${unit}
Cambio: ${cambio >= 0 ? '+' : ''}${formatValue(cambio)}${unit}`;
  }

  /**
   * Resaltar visualmente las mejores y peores métricas
   * @param {Object} metricas - Objeto con métricas calculadas
   */
  highlightBestWorstMetrics(metricas) {
    // Obtener todas las métricas de rendimiento
    const performanceMetrics = [
      { 
        id: 'avg-earnings-per-ride', 
        value: metricas.gananciaPromedioPorCarrera,
        trend: metricas.gananciaNeta?.tendencia || 'estable',
        type: 'earnings'
      },
      { 
        id: 'avg-earnings-per-km', 
        value: metricas.gananciaPromedioPorKm,
        trend: metricas.gananciaNeta?.tendencia || 'estable',
        type: 'earnings'
      },
      { 
        id: 'avg-rides-per-day', 
        value: metricas.carrerasPromedioPorDia,
        trend: metricas.numeroCarreras?.tendencia || 'estable',
        type: 'productivity'
      }
    ];

    // Limpiar clases de resaltado anteriores
    performanceMetrics.forEach(({ id }) => {
      const card = document.getElementById(id)?.closest('.metric-card');
      if (card) {
        card.classList.remove('best-metric', 'worst-metric', 'improved-metric', 'declined-metric');
      }
    });

    // Encontrar la mejor y peor métrica de ganancias
    const earningsMetrics = performanceMetrics.filter(m => m.type === 'earnings');
    if (earningsMetrics.length > 0) {
      const bestEarnings = earningsMetrics.reduce((best, current) => 
        current.value > best.value ? current : best
      );
      const worstEarnings = earningsMetrics.reduce((worst, current) => 
        current.value < worst.value ? current : worst
      );

      // Resaltar mejor métrica de ganancias
      if (bestEarnings.value > 0) {
        const bestCard = document.getElementById(bestEarnings.id)?.closest('.metric-card');
        if (bestCard) {
          bestCard.classList.add('best-metric');
        }
      }

      // Resaltar peor métrica de ganancias (solo si hay diferencia significativa)
      if (worstEarnings.value < bestEarnings.value * 0.8 && earningsMetrics.length > 1) {
        const worstCard = document.getElementById(worstEarnings.id)?.closest('.metric-card');
        if (worstCard) {
          worstCard.classList.add('worst-metric');
        }
      }
    }

    // Resaltar métricas con tendencias significativas
    performanceMetrics.forEach(({ id, trend }) => {
      const card = document.getElementById(id)?.closest('.metric-card');
      if (card) {
        if (trend === 'subida') {
          card.classList.add('improved-metric');
        } else if (trend === 'bajada') {
          card.classList.add('declined-metric');
        }
      }
    });

    // Añadir badges informativos
    this.addMetricBadges(performanceMetrics);
  }

  /**
   * Añadir badges informativos a las métricas
   * @param {Array} metrics - Array de métricas
   */
  addMetricBadges(metrics) {
    metrics.forEach(({ id, value, trend, type }) => {
      const card = document.getElementById(id)?.closest('.metric-card');
      if (!card) return;

      // Remover badges anteriores
      const existingBadge = card.querySelector('.metric-badge');
      if (existingBadge) {
        existingBadge.remove();
      }

      // Determinar si necesita badge
      let badgeText = '';
      let badgeClass = '';

      if (type === 'earnings' && value > 15) {
        badgeText = '⭐ Excelente';
        badgeClass = 'badge-excellent';
      } else if (type === 'earnings' && value > 10) {
        badgeText = '👍 Bueno';
        badgeClass = 'badge-good';
      } else if (type === 'earnings' && value < 5 && value > 0) {
        badgeText = '⚠️ Mejorable';
        badgeClass = 'badge-warning';
      } else if (type === 'productivity' && value > 20) {
        badgeText = '🚀 Muy Activo';
        badgeClass = 'badge-excellent';
      } else if (type === 'productivity' && value > 15) {
        badgeText = '💪 Activo';
        badgeClass = 'badge-good';
      }

      // Añadir badge de tendencia si es significativa
      if (trend === 'subida' && !badgeText) {
        badgeText = '📈 Mejorando';
        badgeClass = 'badge-improving';
      } else if (trend === 'bajada' && !badgeText) {
        badgeText = '📉 Atención';
        badgeClass = 'badge-attention';
      }

      // Crear y añadir badge si es necesario
      if (badgeText) {
        const badge = document.createElement('div');
        badge.className = `metric-badge ${badgeClass}`;
        badge.textContent = badgeText;
        
        const header = card.querySelector('.metric-header');
        if (header) {
          header.appendChild(badge);
        }
      }
    });
  }

  /**
   * Obtener desglose detallado de una plataforma
   * @param {Array} registros - Array de registros diarios
   * @param {number} platformIndex - Índice de la plataforma (0: Uber, 1: FreeNow, 2: Taxi)
   * @returns {Array} Array de strings con el desglose
   */
  getPlatformBreakdown(registros, platformIndex) {
    const breakdown = [];
    
    switch(platformIndex) {
      case 0: // Uber
        const uberApp = registros.reduce((sum, r) => sum + (r.uber?.app || 0), 0);
        const uberPropinas = registros.reduce((sum, r) => sum + (r.uber?.propinas || 0), 0);
        if (uberApp > 0) breakdown.push(`App: ${uberApp.toFixed(2)}€`);
        if (uberPropinas > 0) breakdown.push(`Propinas: ${uberPropinas.toFixed(2)}€`);
        break;
        
      case 1: // FreeNow
        const freeNowApp = registros.reduce((sum, r) => sum + (r.freeNow?.app || 0), 0);
        const freeNowTarjeta = registros.reduce((sum, r) => sum + (r.freeNow?.tarjeta || 0), 0);
        const freeNowEfectivo = registros.reduce((sum, r) => sum + (r.freeNow?.efectivo || 0), 0);
        const freeNowPropinas = registros.reduce((sum, r) => sum + (r.freeNow?.propinas || 0), 0);
        if (freeNowApp > 0) breakdown.push(`App: ${freeNowApp.toFixed(2)}€`);
        if (freeNowTarjeta > 0) breakdown.push(`Tarjeta: ${freeNowTarjeta.toFixed(2)}€`);
        if (freeNowEfectivo > 0) breakdown.push(`Efectivo: ${freeNowEfectivo.toFixed(2)}€`);
        if (freeNowPropinas > 0) breakdown.push(`Propinas: ${freeNowPropinas.toFixed(2)}€`);
        break;
        
      case 2: // Taxi Convencional
        const taxiTarjeta = registros.reduce((sum, r) => sum + (r.taxiConvencional?.tarjeta || 0), 0);
        const taxiEfectivo = registros.reduce((sum, r) => sum + (r.taxiConvencional?.efectivo || 0), 0);
        if (taxiTarjeta > 0) breakdown.push(`Tarjeta: ${taxiTarjeta.toFixed(2)}€`);
        if (taxiEfectivo > 0) breakdown.push(`Efectivo: ${taxiEfectivo.toFixed(2)}€`);
        break;
    }
    
    return breakdown;
  }

  /**
   * Mostrar detalles de plataforma al hacer clic en gráfico
   * @param {string} platform - Nombre de la plataforma
   * @param {number} value - Valor de ingresos
   * @param {Array} registros - Array de registros para mostrar desglose
   */
  showPlatformDetails(platform, value, registros = []) {
    const platformIndex = ['Uber', 'FreeNow', 'Taxi Convencional'].indexOf(platform);
    const breakdown = this.getPlatformBreakdown(registros, platformIndex);
    
    let message = `${platform}: ${value.toFixed(2)}€ en los últimos ${this.currentPeriod} días`;
    
    if (breakdown.length > 0) {
      message += '\n\nDesglose:\n' + breakdown.join('\n');
    }
    
    // Calcular estadísticas adicionales
    const diasConActividad = registros.filter(r => {
      switch(platformIndex) {
        case 0: return (r.uber?.app || 0) > 0 || (r.uber?.propinas || 0) > 0;
        case 1: return (r.freeNow?.app || 0) > 0 || (r.freeNow?.tarjeta || 0) > 0 || 
                      (r.freeNow?.efectivo || 0) > 0 || (r.freeNow?.propinas || 0) > 0;
        case 2: return (r.taxiConvencional?.tarjeta || 0) > 0 || (r.taxiConvencional?.efectivo || 0) > 0;
        default: return false;
      }
    }).length;
    
    if (diasConActividad > 0) {
      const promedioDiario = value / diasConActividad;
      message += `\n\nPromedio diario: ${promedioDiario.toFixed(2)}€ (${diasConActividad} días activos)`;
    }
    
    if (window.app) {
      window.app.showNotification(message, 'info');
    }
  }

  /**
   * Mostrar detalles de un punto de datos al hacer clic
   * @param {string} metricName - Nombre de la métrica
   * @param {string} fecha - Fecha del punto
   * @param {number} value - Valor del punto
   * @param {string} unit - Unidad de medida
   */
  showDataPointDetails(metricName, fecha, value, unit) {
    if (window.app) {
      let formattedValue;
      if (unit === '€') {
        formattedValue = value.toFixed(2);
      } else if (unit === 'km') {
        formattedValue = value.toFixed(1);
      } else {
        formattedValue = Math.round(value);
      }
      
      window.app.showNotification(
        `${metricName} - ${fecha}: ${formattedValue} ${unit}`,
        'info'
      );
    }
  }

  /**
   * Establecer estado de carga
   * @param {boolean} loading - Estado de carga
   */
  setLoadingState(loading) {
    this.isLoading = loading;
    
    const loadingElement = document.getElementById('dashboard-visual-loading');
    const contentElement = document.getElementById('dashboard-visual-content');
    
    if (loadingElement && contentElement) {
      if (loading) {
        loadingElement.style.display = 'flex';
        contentElement.style.opacity = '0.5';
      } else {
        loadingElement.style.display = 'none';
        contentElement.style.opacity = '1';
      }
    }
  }

  /**
   * Mostrar mensaje de sin datos
   */
  showNoDataMessage() {
    const noDataElement = document.getElementById('dashboard-visual-no-data');
    const chartsContainer = document.getElementById('charts-container');
    
    if (noDataElement && chartsContainer) {
      noDataElement.style.display = 'block';
      chartsContainer.style.display = 'none';
    }
  }

  /**
   * Ocultar mensaje de sin datos
   */
  hideNoDataMessage() {
    const noDataElement = document.getElementById('dashboard-visual-no-data');
    const chartsContainer = document.getElementById('charts-container');
    
    if (noDataElement && chartsContainer) {
      noDataElement.style.display = 'none';
      chartsContainer.style.display = 'block';
    }
  }

  /**
   * Destruir todos los gráficos
   */
  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
    this.chartService.destroyAllCharts();
  }

  /**
   * Mostrar mensaje de error
   * @param {string} message - Mensaje de error
   */
  showError(message) {
    if (window.app) {
      window.app.showNotification(message, 'error');
    }
  }

  /**
   * Actualizar información del período en la interfaz
   * @param {Array} registros - Array de registros diarios
   */
  updatePeriodInfo(registros) {
    const periodInfoElement = document.getElementById('period-info');
    if (periodInfoElement) {
      const diasConDatos = registros.filter(r => 
        (r.gananciaNeta || 0) > 0 || 
        (r.kmRecorridos || 0) > 0 || 
        (r.numeroCarreras || 0) > 0
      ).length;
      
      periodInfoElement.style.display = 'block';
      periodInfoElement.style.opacity = '1';
      periodInfoElement.textContent = `Mostrando ${this.currentPeriod} días (${diasConDatos} con actividad)`;
      
      // Calcular totales de plataforma para mostrar en el período info
      const totales = this.chartService.calculatePlatformTotals(registros);
      const totalIngresos = totales.uber + totales.freeNow + totales.taxiConvencional;
      
      if (totalIngresos > 0) {
        periodInfoElement.textContent += ` - Total ingresos: ${totalIngresos.toFixed(2)}€`;
      }
    }
  }

  /**
   * Actualizar gráficos de plataforma específicamente
   * @param {Array} registros - Array de registros diarios
   */
  updatePlatformCharts(registros) {
    try {
      // Actualizar gráfico de barras
      if (this.charts.platformBar) {
        const barData = this.chartService.formatPlatformBarData(registros);
        this.chartService.updateChartData('platform-bar-chart', barData);
        this.charts.platformBar.registros = registros;
      } else {
        this.createPlatformBarChart(registros);
      }
      
      // Actualizar gráfico circular
      if (this.charts.platformPie) {
        const pieData = this.chartService.formatPlatformPieData(registros);
        this.chartService.updateChartData('platform-pie-chart', pieData);
        this.charts.platformPie.registros = registros;
      } else {
        this.createPlatformPieChart(registros);
      }
      
    } catch (error) {
      console.error('Error updating platform charts:', error);
      // Si hay error, recrear los gráficos
      this.createPlatformBarChart(registros);
      this.createPlatformPieChart(registros);
    }
  }

  /**
   * Obtener datos de plataforma para el período actual
   * @returns {Object} Datos agregados por plataforma
   */
  async getCurrentPlatformData() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - this.currentPeriod);
      
      const registros = await this.dbService.getRegistrosByDateRange(startDate, endDate);
      return this.chartService.calculatePlatformTotals(registros);
    } catch (error) {
      console.error('Error getting platform data:', error);
      return { uber: 0, freeNow: 0, taxiConvencional: 0 };
    }
  }

  /**
   * Limpiar recursos al destruir el componente
   */
  destroy() {
    this.destroyAllCharts();
    
    // Limpiar event listeners
    window.removeEventListener('resize', this.handleWindowResize);
    
    if (screen.orientation) {
      screen.orientation.removeEventListener('change', this.handleOrientationChange);
    } else {
      window.removeEventListener('orientationchange', this.handleOrientationChange);
    }
    
    // Limpiar recursos del ChartService
    if (this.chartService) {
      this.chartService.destroy();
    }
  }
}