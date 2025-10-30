import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    Interaction,
    Decimation
} from 'chart.js';

// Registrar componentes necesarios de Chart.js
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    Interaction,
    Decimation
);

// Variable para almacenar el plugin de zoom si está disponible
let zoomPluginAvailable = false;

/**
 * Servicio para gestión de gráficos con Chart.js
 * Proporciona funciones para crear diferentes tipos de gráficos y formatear datos
 */
class ChartService {
    constructor() {
        this.charts = new Map(); // Almacenar instancias de gráficos activos
        this.resizeObserver = null; // Observer para cambios de tamaño
        this.loadingStates = new Map(); // Estados de carga por gráfico
        this.touchSupport = this.detectTouchSupport(); // Detectar soporte táctil
        this.devicePixelRatio = window.devicePixelRatio || 1; // Ratio de píxeles del dispositivo
        
        this.defaultColors = {
            primary: '#4F46E5',
            secondary: '#10B981',
            tertiary: '#F59E0B',
            quaternary: '#EF4444',
            background: 'rgba(79, 70, 229, 0.1)',
            border: 'rgba(79, 70, 229, 0.8)'
        };
        
        // Intentar cargar el plugin de zoom
        this.initZoomPlugin();
        
        // Configurar observer de redimensionamiento
        this.initResizeObserver();
        
        // Configurar optimizaciones de rendimiento
        this.initPerformanceOptimizations();
    }

    /**
     * Inicializar plugin de zoom si está disponible
     */
    async initZoomPlugin() {
        try {
            const zoomModule = await import('chartjs-plugin-zoom');
            Chart.register(zoomModule.default);
            zoomPluginAvailable = true;
            console.log('Chart.js zoom plugin loaded successfully');
        } catch (error) {
            console.warn('Chart.js zoom plugin not available, zoom functionality disabled');
            zoomPluginAvailable = false;
        }
    }

    /**
     * Detectar soporte táctil del dispositivo
     * @returns {boolean} True si el dispositivo soporta touch
     */
    detectTouchSupport() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    }

    /**
     * Inicializar ResizeObserver para gráficos responsivos
     */
    initResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver((entries) => {
                // Debounce para evitar múltiples redimensionamientos
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.handleResize(entries);
                }, 150);
            });
        }
    }

    /**
     * Configurar optimizaciones de rendimiento
     */
    initPerformanceOptimizations() {
        // Configurar Chart.js para mejor rendimiento
        Chart.defaults.animation.duration = this.touchSupport ? 200 : 300;
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
        
        // Optimizar para dispositivos de alta densidad
        if (this.devicePixelRatio > 1) {
            Chart.defaults.devicePixelRatio = Math.min(this.devicePixelRatio, 2);
        }
    }

    /**
     * Manejar redimensionamiento de gráficos
     * @param {Array} entries - Entradas del ResizeObserver
     */
    handleResize(entries) {
        entries.forEach(entry => {
            const canvasId = entry.target.id;
            const chart = this.charts.get(canvasId);
            
            if (chart) {
                // Actualizar tamaño del gráfico de forma optimizada
                requestAnimationFrame(() => {
                    chart.resize();
                    this.optimizeChartForSize(chart, entry.contentRect);
                });
            }
        });
    }

    /**
     * Optimizar gráfico según el tamaño del contenedor
     * @param {Chart} chart - Instancia del gráfico
     * @param {DOMRect} rect - Dimensiones del contenedor
     */
    optimizeChartForSize(chart, rect) {
        const isMobile = rect.width < 768;
        const isSmall = rect.width < 480;
        
        // Ajustar configuración según el tamaño
        const updates = {
            plugins: {
                legend: {
                    display: !isSmall,
                    position: isMobile ? 'bottom' : 'top',
                    labels: {
                        boxWidth: isMobile ? 12 : 15,
                        padding: isMobile ? 10 : 20,
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    titleFont: {
                        size: isMobile ? 11 : 14
                    },
                    bodyFont: {
                        size: isMobile ? 10 : 12
                    },
                    padding: isMobile ? 8 : 12
                }
            },
            scales: chart.config.options.scales ? {
                x: {
                    ...chart.config.options.scales.x,
                    ticks: {
                        ...chart.config.options.scales.x?.ticks,
                        maxTicksLimit: isSmall ? 5 : isMobile ? 8 : 10,
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                y: {
                    ...chart.config.options.scales.y,
                    ticks: {
                        ...chart.config.options.scales.y?.ticks,
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    }
                }
            } : undefined
        };
        
        // Aplicar actualizaciones
        Object.assign(chart.options, updates);
        chart.update('none'); // Actualizar sin animación para mejor rendimiento
    }

    /**
     * Mostrar indicador de carga progresiva
     * @param {string} canvasId - ID del canvas
     */
    showLoadingIndicator(canvasId) {
        this.loadingStates.set(canvasId, true);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const container = canvas.parentElement;
        if (!container) return;
        
        // Crear indicador de carga si no existe
        let loadingIndicator = container.querySelector('.chart-loading');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'chart-loading';
            loadingIndicator.innerHTML = `
                <div class="chart-loading-spinner"></div>
                <div class="chart-loading-text">Cargando gráfico...</div>
            `;
            container.appendChild(loadingIndicator);
        }
        
        loadingIndicator.style.display = 'flex';
        canvas.style.opacity = '0.3';
    }

    /**
     * Ocultar indicador de carga
     * @param {string} canvasId - ID del canvas
     */
    hideLoadingIndicator(canvasId) {
        this.loadingStates.set(canvasId, false);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const container = canvas.parentElement;
        if (!container) return;
        
        const loadingIndicator = container.querySelector('.chart-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        canvas.style.opacity = '1';
    }

    /**
     * Crear gráfico de líneas para tendencias temporales
     * @param {string} canvasId - ID del elemento canvas
     * @param {Object} data - Datos del gráfico
     * @param {Object} options - Opciones adicionales
     * @returns {Chart} Instancia del gráfico
     */
    createLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error(`Canvas con ID ${canvasId} no encontrado`);
        }

        // Mostrar indicador de carga
        this.showLoadingIndicator(canvasId);

        // Destruir gráfico existente si existe
        this.destroyChart(canvasId);

        // Configurar opciones responsivas y táctiles
        const responsiveOptions = this.getResponsiveOptions(canvas);
        const touchOptions = this.getTouchOptions();

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: this.devicePixelRatio,
            interaction: {
                intersect: false,
                mode: 'index',
                ...touchOptions.interaction
            },
            plugins: {
                title: {
                    display: true,
                    text: options.title || 'Tendencia Temporal',
                    color: '#E5E7EB',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        color: '#E5E7EB'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#E5E7EB',
                    bodyColor: '#E5E7EB',
                    borderColor: '#4F46E5',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return `Fecha: ${context[0].label}`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const metricType = context.dataset.metricType || 'default';
                            
                            switch(metricType) {
                                case 'earnings':
                                    return `Ganancia Neta: ${value.toFixed(2)}€`;
                                case 'kilometers':
                                    return `Kilómetros: ${value.toFixed(1)} km`;
                                case 'rides':
                                    return `Carreras: ${Math.round(value)}`;
                                default:
                                    return `${context.dataset.label}: ${value.toFixed(2)}`;
                            }
                        },
                        afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            const dataset = context.dataset;
                            
                            if (dataset.trendData && dataset.trendData[dataIndex]) {
                                const trend = dataset.trendData[dataIndex];
                                if (trend.change !== 0) {
                                    const arrow = trend.change > 0 ? '↗' : '↘';
                                    const changeText = trend.change > 0 ? '+' : '';
                                    return `${arrow} ${changeText}${trend.change.toFixed(2)} vs día anterior`;
                                }
                            }
                            return null;
                        }
                    }
                },
                ...(zoomPluginAvailable && {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            scaleMode: 'x'
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                            scaleMode: 'x'
                        }
                    }
                })
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    },
                    ticks: {
                        color: '#9CA3AF',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 8,
                    borderWidth: 2,
                    hoverBorderWidth: 3
                },
                line: {
                    tension: 0.4,
                    borderWidth: 3
                }
            },
            onHover: (event, activeElements) => {
                if (!this.touchSupport) {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            },
            ...responsiveOptions,
            ...touchOptions.events
        };

        const mergedOptions = this.mergeOptions(defaultOptions, options);
        
        // Crear gráfico con manejo de errores
        let chart;
        try {
            chart = new Chart(canvas, {
                type: 'line',
                data: data,
                options: mergedOptions
            });

            // Configurar observador de redimensionamiento
            if (this.resizeObserver) {
                this.resizeObserver.observe(canvas);
            }

            // Configurar eventos táctiles si es necesario
            if (this.touchSupport) {
                this.setupTouchEvents(canvas, chart);
            }

            this.charts.set(canvasId, chart);
            
            // Ocultar indicador de carga cuando el gráfico esté listo
            chart.options.onAnimationComplete = () => {
                this.hideLoadingIndicator(canvasId);
            };
            
            // Fallback si no hay animación
            setTimeout(() => {
                this.hideLoadingIndicator(canvasId);
            }, 500);
            
            return chart;
        } catch (error) {
            this.hideLoadingIndicator(canvasId);
            console.error('Error creating line chart:', error);
            throw error;
        }
    }

    /**
     * Crear gráfico de barras para comparaciones
     * @param {string} canvasId - ID del elemento canvas
     * @param {Object} data - Datos del gráfico
     * @param {Object} options - Opciones adicionales
     * @returns {Chart} Instancia del gráfico
     */
    createBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error(`Canvas con ID ${canvasId} no encontrado`);
        }

        // Mostrar indicador de carga
        this.showLoadingIndicator(canvasId);

        this.destroyChart(canvasId);

        // Configurar opciones responsivas y táctiles
        const responsiveOptions = this.getResponsiveOptions(canvas);
        const touchOptions = this.getTouchOptions();

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: this.devicePixelRatio,
            interaction: {
                intersect: false,
                mode: 'index',
                ...touchOptions.interaction
            },
            plugins: {
                title: {
                    display: true,
                    text: options.title || 'Comparación por Plataforma',
                    color: '#E5E7EB',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        color: '#E5E7EB'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#E5E7EB',
                    bodyColor: '#E5E7EB',
                    borderColor: '#4F46E5',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return `Plataforma: ${context[0].label}`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            return `Ingresos: ${value.toFixed(2)}€`;
                        },
                        footer: function(context) {
                            return 'Haz clic para ver detalles';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                },
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
            elements: {
                bar: {
                    borderRadius: 4,
                    borderSkipped: false
                }
            },
            onHover: (event, activeElements) => {
                if (!this.touchSupport) {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            },
            ...responsiveOptions,
            ...touchOptions.events
        };

        const mergedOptions = this.mergeOptions(defaultOptions, options);

        // Crear gráfico con manejo de errores
        let chart;
        try {
            chart = new Chart(canvas, {
                type: 'bar',
                data: data,
                options: mergedOptions
            });

            // Configurar observador de redimensionamiento
            if (this.resizeObserver) {
                this.resizeObserver.observe(canvas);
            }

            // Configurar eventos táctiles si es necesario
            if (this.touchSupport) {
                this.setupTouchEvents(canvas, chart);
            }

            // Optimizar rendimiento
            this.optimizeChartPerformance(chart);

            this.charts.set(canvasId, chart);
            
            // Ocultar indicador de carga cuando el gráfico esté listo
            chart.options.onAnimationComplete = () => {
                this.hideLoadingIndicator(canvasId);
            };
            
            // Fallback si no hay animación
            setTimeout(() => {
                this.hideLoadingIndicator(canvasId);
            }, 500);
            
            return chart;
        } catch (error) {
            this.hideLoadingIndicator(canvasId);
            console.error('Error creating bar chart:', error);
            throw error;
        }
    }

    /**
     * Crear gráfico circular (pie chart) para distribución porcentual
     * @param {string} canvasId - ID del elemento canvas
     * @param {Object} data - Datos del gráfico
     * @param {Object} options - Opciones adicionales
     * @returns {Chart} Instancia del gráfico
     */
    createPieChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error(`Canvas con ID ${canvasId} no encontrado`);
        }

        // Mostrar indicador de carga
        this.showLoadingIndicator(canvasId);

        this.destroyChart(canvasId);

        // Configurar opciones responsivas y táctiles
        const responsiveOptions = this.getResponsiveOptions(canvas);
        const touchOptions = this.getTouchOptions();

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: this.devicePixelRatio,
            interaction: {
                intersect: false,
                ...touchOptions.interaction
            },
            plugins: {
                title: {
                    display: true,
                    text: options.title || 'Distribución por Plataforma',
                    color: '#E5E7EB',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#E5E7EB',
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#E5E7EB',
                    bodyColor: '#E5E7EB',
                    borderColor: '#4F46E5',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return `Plataforma: ${context[0].label}`;
                        },
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value.toFixed(2)}€ (${percentage}%)`;
                        },
                        footer: function(context) {
                            return 'Haz clic para ver detalles';
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 2,
                    borderColor: '#1F2937',
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#FFFFFF'
                }
            },
            onHover: (event, activeElements) => {
                if (!this.touchSupport) {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
            },
            ...responsiveOptions,
            ...touchOptions.events
        };

        const mergedOptions = this.mergeOptions(defaultOptions, options);

        // Crear gráfico con manejo de errores
        let chart;
        try {
            chart = new Chart(canvas, {
                type: 'pie',
                data: data,
                options: mergedOptions
            });

            // Configurar observador de redimensionamiento
            if (this.resizeObserver) {
                this.resizeObserver.observe(canvas);
            }

            // Configurar eventos táctiles si es necesario
            if (this.touchSupport) {
                this.setupTouchEvents(canvas, chart);
            }

            // Optimizar rendimiento
            this.optimizeChartPerformance(chart);

            this.charts.set(canvasId, chart);
            
            // Ocultar indicador de carga cuando el gráfico esté listo
            chart.options.onAnimationComplete = () => {
                this.hideLoadingIndicator(canvasId);
            };
            
            // Fallback si no hay animación
            setTimeout(() => {
                this.hideLoadingIndicator(canvasId);
            }, 500);
            
            return chart;
        } catch (error) {
            this.hideLoadingIndicator(canvasId);
            console.error('Error creating pie chart:', error);
            throw error;
        }
    }

    /**
     * Actualizar datos de un gráfico existente
     * @param {string} canvasId - ID del canvas del gráfico
     * @param {Object} newData - Nuevos datos
     */
    updateChartData(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`Gráfico con ID ${canvasId} no encontrado`);
            return;
        }

        chart.data = newData;
        chart.update('active');
    }

    /**
     * Destruir gráfico específico
     * @param {string} canvasId - ID del canvas del gráfico
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
        }
    }

    /**
     * Destruir todos los gráficos
     */
    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    /**
     * Resetear zoom de un gráfico específico
     * @param {string} canvasId - ID del canvas del gráfico
     */
    resetZoom(canvasId) {
        if (!zoomPluginAvailable) {
            console.warn('Zoom plugin not available');
            return;
        }
        
        const chart = this.charts.get(canvasId);
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }
    }

    /**
     * Resetear zoom de todos los gráficos
     */
    resetAllZoom() {
        if (!zoomPluginAvailable) {
            console.warn('Zoom plugin not available');
            return;
        }
        
        this.charts.forEach(chart => {
            if (chart.resetZoom) {
                chart.resetZoom();
            }
        });
    }

    /**
     * Formatear datos de registros para gráfico de líneas temporal
     * @param {Array} registros - Array de registros diarios
     * @param {string} metrica - Métrica a graficar ('gananciaNeta', 'kmRecorridos', 'numeroCarreras')
     * @param {number} dias - Número de días a incluir
     * @returns {Object} Datos formateados para Chart.js
     */
    formatTimeSeriesData(registros, metrica, dias = 30) {
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaFin.getDate() - dias);

        // Crear array de fechas para el período
        const fechas = [];
        const valores = [];
        const trendData = [];
        
        let valorAnterior = null;
        
        for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
            const fechaStr = d.toISOString().split('T')[0];
            fechas.push(this.formatDateForDisplay(d));
            
            // Buscar registro para esta fecha
            const registro = registros.find(r => 
                new Date(r.fecha).toISOString().split('T')[0] === fechaStr
            );
            
            const valor = registro ? registro[metrica] || 0 : 0;
            valores.push(valor);
            
            // Calcular cambio respecto al día anterior
            const cambio = valorAnterior !== null ? valor - valorAnterior : 0;
            trendData.push({
                change: cambio,
                previousValue: valorAnterior
            });
            
            valorAnterior = valor;
        }

        // Determinar colores según la métrica
        const colors = this.getMetricColors(metrica);

        return {
            labels: fechas,
            datasets: [{
                label: this.getMetricLabel(metrica),
                data: valores,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors.point,
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 8,
                pointHoverBorderWidth: 3,
                metricType: this.getMetricType(metrica),
                trendData: trendData
            }]
        };
    }

    /**
     * Formatear datos para gráfico de barras por plataforma
     * @param {Array} registros - Array de registros diarios
     * @returns {Object} Datos formateados para Chart.js
     */
    formatPlatformBarData(registros) {
        const totales = this.calculatePlatformTotals(registros);
        
        // Colores específicos para cada plataforma
        const platformColors = {
            backgroundColor: [
                'rgba(79, 70, 229, 0.8)',   // Uber - Azul índigo
                'rgba(16, 185, 129, 0.8)',  // FreeNow - Verde esmeralda
                'rgba(245, 158, 11, 0.8)'   // Taxi - Ámbar
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

    /**
     * Formatear datos para gráfico circular por plataforma
     * @param {Array} registros - Array de registros diarios
     * @returns {Object} Datos formateados para Chart.js
     */
    formatPlatformPieData(registros) {
        const totales = this.calculatePlatformTotals(registros);
        
        // Colores específicos para cada plataforma (más vibrantes para el pie chart)
        const platformColors = {
            backgroundColor: [
                'rgba(79, 70, 229, 0.9)',   // Uber - Azul índigo
                'rgba(16, 185, 129, 0.9)',  // FreeNow - Verde esmeralda
                'rgba(245, 158, 11, 0.9)'   // Taxi - Ámbar
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

    /**
     * Calcular métricas de tendencia comparando períodos
     * @param {Array} registrosActuales - Registros del período actual
     * @param {Array} registrosAnteriores - Registros del período anterior
     * @returns {Object} Métricas de tendencia
     */
    calculateTrendMetrics(registrosActuales, registrosAnteriores) {
        // Métricas básicas de tendencia
        const basicTrends = {
            gananciaNeta: this.calculateTrend(registrosActuales, registrosAnteriores, 'gananciaNeta'),
            kmRecorridos: this.calculateTrend(registrosActuales, registrosAnteriores, 'kmRecorridos'),
            numeroCarreras: this.calculateTrend(registrosActuales, registrosAnteriores, 'numeroCarreras')
        };

        // Métricas de rendimiento detalladas
        const performanceMetrics = this.calculatePerformanceMetrics(registrosActuales, registrosAnteriores);

        // Combinar todas las métricas
        const metricas = {
            ...basicTrends,
            gananciaPromedioPorCarrera: performanceMetrics.gananciaPromedioPorCarrera,
            gananciaPromedioPorKm: performanceMetrics.gananciaPromedioPorKm,
            carrerasPromedioPorDia: performanceMetrics.carrerasPromedioPorDia,
            rendimiento: performanceMetrics,
            resumen: this.generatePerformanceSummary(registrosActuales, registrosAnteriores, performanceMetrics)
        };

        return metricas;
    }

    /**
     * Generar resumen de rendimiento
     * @param {Array} registrosActuales - Registros actuales
     * @param {Array} registrosAnteriores - Registros anteriores
     * @param {Object} performanceMetrics - Métricas de rendimiento
     * @returns {Object} Resumen de rendimiento
     */
    generatePerformanceSummary(registrosActuales, registrosAnteriores, performanceMetrics) {
        const totalDiasActuales = registrosActuales.filter(r => (r.numeroCarreras || 0) > 0).length;
        const totalDiasAnteriores = registrosAnteriores.filter(r => (r.numeroCarreras || 0) > 0).length;
        
        const totalGananciasActuales = registrosActuales.reduce((sum, r) => sum + (r.gananciaNeta || 0), 0);
        const totalGananciasAnteriores = registrosAnteriores.reduce((sum, r) => sum + (r.gananciaNeta || 0), 0);

        // Determinar la métrica más destacada
        const { tendencias } = performanceMetrics;
        const mejorMetrica = this.findBestPerformingMetric(tendencias);
        const peorMetrica = this.findWorstPerformingMetric(tendencias);

        return {
            diasTrabajados: {
                actual: totalDiasActuales,
                anterior: totalDiasAnteriores,
                cambio: totalDiasActuales - totalDiasAnteriores
            },
            eficienciaGeneral: {
                actual: totalDiasActuales > 0 ? totalGananciasActuales / totalDiasActuales : 0,
                anterior: totalDiasAnteriores > 0 ? totalGananciasAnteriores / totalDiasAnteriores : 0
            },
            mejorMetrica,
            peorMetrica,
            recomendaciones: this.generateRecommendations(performanceMetrics)
        };
    }

    /**
     * Encontrar la métrica con mejor rendimiento
     * @param {Object} tendencias - Tendencias de métricas
     * @returns {Object} Mejor métrica
     */
    findBestPerformingMetric(tendencias) {
        const metricas = Object.entries(tendencias);
        const mejores = metricas.filter(([, data]) => data.tendencia === 'subida');
        
        if (mejores.length === 0) return null;
        
        // Encontrar la con mayor porcentaje de mejora
        const mejor = mejores.reduce((best, current) => {
            return current[1].porcentajeCambio > best[1].porcentajeCambio ? current : best;
        });

        return {
            nombre: mejor[0],
            porcentajeCambio: mejor[1].porcentajeCambio,
            valor: mejor[1].actual
        };
    }

    /**
     * Encontrar la métrica con peor rendimiento
     * @param {Object} tendencias - Tendencias de métricas
     * @returns {Object} Peor métrica
     */
    findWorstPerformingMetric(tendencias) {
        const metricas = Object.entries(tendencias);
        const peores = metricas.filter(([, data]) => data.tendencia === 'bajada');
        
        if (peores.length === 0) return null;
        
        // Encontrar la con mayor porcentaje de disminución
        const peor = peores.reduce((worst, current) => {
            return Math.abs(current[1].porcentajeCambio) > Math.abs(worst[1].porcentajeCambio) ? current : worst;
        });

        return {
            nombre: peor[0],
            porcentajeCambio: peor[1].porcentajeCambio,
            valor: peor[1].actual
        };
    }

    /**
     * Generar recomendaciones basadas en métricas
     * @param {Object} performanceMetrics - Métricas de rendimiento
     * @returns {Array} Array de recomendaciones
     */
    generateRecommendations(performanceMetrics) {
        const recomendaciones = [];
        const { gananciaPromedioPorCarrera, gananciaPromedioPorKm, carrerasPromedioPorDia, tendencias } = performanceMetrics;

        // Recomendaciones basadas en ganancia por carrera
        if (gananciaPromedioPorCarrera < 8) {
            recomendaciones.push({
                tipo: 'mejora',
                metrica: 'gananciaPromedioPorCarrera',
                mensaje: 'Considera trabajar en horarios de mayor demanda para aumentar la ganancia por carrera',
                prioridad: 'alta'
            });
        }

        // Recomendaciones basadas en ganancia por km
        if (gananciaPromedioPorKm < 0.8) {
            recomendaciones.push({
                tipo: 'eficiencia',
                metrica: 'gananciaPromedioPorKm',
                mensaje: 'Optimiza las rutas para reducir kilómetros sin pasajeros',
                prioridad: 'media'
            });
        }

        // Recomendaciones basadas en carreras por día
        if (carrerasPromedioPorDia < 12) {
            recomendaciones.push({
                tipo: 'productividad',
                metrica: 'carrerasPromedioPorDia',
                mensaje: 'Aumenta las horas de trabajo o busca zonas con mayor demanda',
                prioridad: 'media'
            });
        }

        // Recomendaciones basadas en tendencias negativas
        Object.entries(tendencias).forEach(([metrica, data]) => {
            if (data.tendencia === 'bajada' && data.significativo) {
                recomendaciones.push({
                    tipo: 'alerta',
                    metrica,
                    mensaje: `Atención: ${metrica} ha disminuido significativamente (${Math.abs(data.porcentajeCambio).toFixed(1)}%)`,
                    prioridad: 'alta'
                });
            }
        });

        return recomendaciones.slice(0, 3); // Limitar a 3 recomendaciones principales
    }

    /**
     * Calcular tendencia para una métrica específica
     * @param {Array} actual - Registros actuales
     * @param {Array} anterior - Registros anteriores
     * @param {string} metrica - Nombre de la métrica
     * @returns {Object} Datos de tendencia
     */
    calculateTrend(actual, anterior, metrica) {
        const totalActual = actual.reduce((sum, r) => sum + (r[metrica] || 0), 0);
        const totalAnterior = anterior.reduce((sum, r) => sum + (r[metrica] || 0), 0);
        
        const cambio = totalActual - totalAnterior;
        const porcentajeCambio = totalAnterior > 0 ? (cambio / totalAnterior) * 100 : 0;
        
        return {
            actual: totalActual,
            anterior: totalAnterior,
            cambio: cambio,
            porcentajeCambio: porcentajeCambio,
            tendencia: cambio > 0 ? 'subida' : cambio < 0 ? 'bajada' : 'estable'
        };
    }

    /**
     * Calcular ganancia promedio por carrera
     * @param {Array} registros - Array de registros
     * @returns {number} Ganancia promedio por carrera
     */
    calculateAverageEarningsPerRide(registros) {
        const totalGanancias = registros.reduce((sum, r) => sum + (r.gananciaNeta || 0), 0);
        const totalCarreras = registros.reduce((sum, r) => sum + (r.numeroCarreras || 0), 0);
        
        return totalCarreras > 0 ? totalGanancias / totalCarreras : 0;
    }

    /**
     * Calcular ganancia promedio por kilómetro
     * @param {Array} registros - Array de registros
     * @returns {number} Ganancia promedio por kilómetro
     */
    calculateAverageEarningsPerKm(registros) {
        const totalGanancias = registros.reduce((sum, r) => sum + (r.gananciaNeta || 0), 0);
        const totalKm = registros.reduce((sum, r) => sum + (r.kmRecorridos || 0), 0);
        
        return totalKm > 0 ? totalGanancias / totalKm : 0;
    }

    /**
     * Calcular promedio de carreras por día trabajado
     * @param {Array} registros - Array de registros
     * @returns {number} Promedio de carreras por día
     */
    calculateAverageRidesPerDay(registros) {
        const diasTrabajados = registros.filter(r => (r.numeroCarreras || 0) > 0).length;
        const totalCarreras = registros.reduce((sum, r) => sum + (r.numeroCarreras || 0), 0);
        
        return diasTrabajados > 0 ? totalCarreras / diasTrabajados : 0;
    }

    /**
     * Calcular métricas de rendimiento comparativas
     * @param {Array} registrosActuales - Registros del período actual
     * @param {Array} registrosAnteriores - Registros del período anterior
     * @returns {Object} Métricas comparativas detalladas
     */
    calculatePerformanceMetrics(registrosActuales, registrosAnteriores) {
        // Métricas del período actual
        const actualEarningsPerRide = this.calculateAverageEarningsPerRide(registrosActuales);
        const actualEarningsPerKm = this.calculateAverageEarningsPerKm(registrosActuales);
        const actualRidesPerDay = this.calculateAverageRidesPerDay(registrosActuales);

        // Métricas del período anterior
        const previousEarningsPerRide = this.calculateAverageEarningsPerRide(registrosAnteriores);
        const previousEarningsPerKm = this.calculateAverageEarningsPerKm(registrosAnteriores);
        const previousRidesPerDay = this.calculateAverageRidesPerDay(registrosAnteriores);

        // Calcular cambios y tendencias
        const earningsPerRideTrend = this.calculateMetricTrend(actualEarningsPerRide, previousEarningsPerRide);
        const earningsPerKmTrend = this.calculateMetricTrend(actualEarningsPerKm, previousEarningsPerKm);
        const ridesPerDayTrend = this.calculateMetricTrend(actualRidesPerDay, previousRidesPerDay);

        return {
            gananciaPromedioPorCarrera: actualEarningsPerRide,
            gananciaPromedioPorKm: actualEarningsPerKm,
            carrerasPromedioPorDia: actualRidesPerDay,
            tendencias: {
                gananciaPromedioPorCarrera: earningsPerRideTrend,
                gananciaPromedioPorKm: earningsPerKmTrend,
                carrerasPromedioPorDia: ridesPerDayTrend
            },
            comparacion: {
                gananciaPromedioPorCarrera: {
                    actual: actualEarningsPerRide,
                    anterior: previousEarningsPerRide,
                    cambio: actualEarningsPerRide - previousEarningsPerRide
                },
                gananciaPromedioPorKm: {
                    actual: actualEarningsPerKm,
                    anterior: previousEarningsPerKm,
                    cambio: actualEarningsPerKm - previousEarningsPerKm
                },
                carrerasPromedioPorDia: {
                    actual: actualRidesPerDay,
                    anterior: previousRidesPerDay,
                    cambio: actualRidesPerDay - previousRidesPerDay
                }
            }
        };
    }

    /**
     * Calcular tendencia de una métrica específica
     * @param {number} actual - Valor actual
     * @param {number} anterior - Valor anterior
     * @returns {Object} Datos de tendencia
     */
    calculateMetricTrend(actual, anterior) {
        const cambio = actual - anterior;
        const porcentajeCambio = anterior > 0 ? (cambio / anterior) * 100 : 0;
        
        let tendencia = 'estable';
        if (Math.abs(porcentajeCambio) > 5) { // Cambio significativo > 5%
            tendencia = cambio > 0 ? 'subida' : 'bajada';
        }

        return {
            actual,
            anterior,
            cambio,
            porcentajeCambio,
            tendencia,
            significativo: Math.abs(porcentajeCambio) > 10 // Cambio muy significativo > 10%
        };
    }

    /**
     * Calcular totales por plataforma
     * @param {Array} registros - Array de registros
     * @returns {Object} Totales por plataforma
     */
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

    /**
     * Obtener etiqueta para métrica
     * @param {string} metrica - Nombre de la métrica
     * @returns {string} Etiqueta formateada
     */
    getMetricLabel(metrica) {
        const labels = {
            gananciaNeta: 'Ganancia Neta (€)',
            kmRecorridos: 'Kilómetros Recorridos',
            numeroCarreras: 'Número de Carreras'
        };
        
        return labels[metrica] || metrica;
    }

    /**
     * Obtener tipo de métrica para tooltips
     * @param {string} metrica - Nombre de la métrica
     * @returns {string} Tipo de métrica
     */
    getMetricType(metrica) {
        const types = {
            gananciaNeta: 'earnings',
            kmRecorridos: 'kilometers',
            numeroCarreras: 'rides'
        };
        
        return types[metrica] || 'default';
    }

    /**
     * Obtener colores específicos para cada métrica
     * @param {string} metrica - Nombre de la métrica
     * @returns {Object} Colores para la métrica
     */
    getMetricColors(metrica) {
        const colorSchemes = {
            gananciaNeta: {
                border: '#10B981',
                background: 'rgba(16, 185, 129, 0.1)',
                point: '#10B981'
            },
            kmRecorridos: {
                border: '#3B82F6',
                background: 'rgba(59, 130, 246, 0.1)',
                point: '#3B82F6'
            },
            numeroCarreras: {
                border: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.1)',
                point: '#F59E0B'
            }
        };
        
        return colorSchemes[metrica] || {
            border: this.defaultColors.primary,
            background: this.defaultColors.background,
            point: this.defaultColors.primary
        };
    }

    /**
     * Formatear fecha para visualización
     * @param {Date} fecha - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatDateForDisplay(fecha) {
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit'
        });
    }

    /**
     * Obtener opciones responsivas según el tamaño del canvas
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @returns {Object} Opciones responsivas
     */
    getResponsiveOptions(canvas) {
        const container = canvas.parentElement;
        const containerWidth = container ? container.clientWidth : window.innerWidth;
        const isMobile = containerWidth < 768;
        const isSmall = containerWidth < 480;

        return {
            animation: {
                duration: isMobile ? 200 : 300,
                easing: 'easeOutQuart'
            },
            elements: {
                point: {
                    radius: isSmall ? 2 : isMobile ? 3 : 4,
                    hoverRadius: isSmall ? 4 : isMobile ? 6 : 8,
                    borderWidth: isSmall ? 1 : 2,
                    hoverBorderWidth: isSmall ? 2 : 3
                },
                line: {
                    tension: 0.4,
                    borderWidth: isSmall ? 2 : 3
                }
            }
        };
    }

    /**
     * Obtener opciones específicas para dispositivos táctiles
     * @returns {Object} Opciones táctiles
     */
    getTouchOptions() {
        if (!this.touchSupport) {
            return { interaction: {}, events: {} };
        }

        return {
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            events: {
                onTouchStart: (event, activeElements, chart) => {
                    this.handleTouchStart(event, activeElements, chart);
                },
                onTouchMove: (event, activeElements, chart) => {
                    this.handleTouchMove(event, activeElements, chart);
                },
                onTouchEnd: (event, activeElements, chart) => {
                    this.handleTouchEnd(event, activeElements, chart);
                }
            }
        };
    }

    /**
     * Configurar eventos táctiles personalizados
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @param {Chart} chart - Instancia del gráfico
     */
    setupTouchEvents(canvas, chart) {
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        let isLongPress = false;

        canvas.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isLongPress = false;

            // Detectar long press para mostrar tooltip
            setTimeout(() => {
                if (Date.now() - touchStartTime >= 500) {
                    isLongPress = true;
                    this.showTouchTooltip(chart, touch.clientX, touch.clientY);
                }
            }, 500);
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartX);
            const deltaY = Math.abs(touch.clientY - touchStartY);

            // Si hay movimiento significativo, cancelar long press
            if (deltaX > 10 || deltaY > 10) {
                isLongPress = false;
            }
        }, { passive: true });

        canvas.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            // Tap rápido para interacción
            if (touchDuration < 200 && !isLongPress) {
                const rect = canvas.getBoundingClientRect();
                const x = e.changedTouches[0].clientX - rect.left;
                const y = e.changedTouches[0].clientY - rect.top;
                
                // Simular click para activar tooltips
                const clickEvent = new MouseEvent('click', {
                    clientX: e.changedTouches[0].clientX,
                    clientY: e.changedTouches[0].clientY
                });
                canvas.dispatchEvent(clickEvent);
            }
        }, { passive: true });
    }

    /**
     * Manejar inicio de toque
     * @param {Event} event - Evento de toque
     * @param {Array} activeElements - Elementos activos
     * @param {Chart} chart - Instancia del gráfico
     */
    handleTouchStart(event, activeElements, chart) {
        if (activeElements.length > 0) {
            // Haptic feedback si está disponible
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }
    }

    /**
     * Manejar movimiento de toque
     * @param {Event} event - Evento de toque
     * @param {Array} activeElements - Elementos activos
     * @param {Chart} chart - Instancia del gráfico
     */
    handleTouchMove(event, activeElements, chart) {
        // Actualizar tooltip durante el movimiento
        if (activeElements.length > 0) {
            chart.tooltip.setActiveElements(activeElements, { x: event.x, y: event.y });
            chart.update('none');
        }
    }

    /**
     * Manejar fin de toque
     * @param {Event} event - Evento de toque
     * @param {Array} activeElements - Elementos activos
     * @param {Chart} chart - Instancia del gráfico
     */
    handleTouchEnd(event, activeElements, chart) {
        // Ocultar tooltip después de un delay
        setTimeout(() => {
            chart.tooltip.setActiveElements([], { x: 0, y: 0 });
            chart.update('none');
        }, 1500);
    }

    /**
     * Mostrar tooltip táctil personalizado
     * @param {Chart} chart - Instancia del gráfico
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    showTouchTooltip(chart, x, y) {
        const rect = chart.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;

        // Encontrar el punto más cercano
        const points = chart.getElementsAtEventForMode(
            { x: canvasX, y: canvasY },
            'nearest',
            { intersect: false },
            false
        );

        if (points.length > 0) {
            chart.tooltip.setActiveElements(points, { x: canvasX, y: canvasY });
            chart.update('none');
        }
    }

    /**
     * Optimizar rendimiento del gráfico
     * @param {Chart} chart - Instancia del gráfico
     */
    optimizeChartPerformance(chart) {
        const dataLength = chart.data.datasets[0]?.data?.length || 0;
        
        // Configurar decimation para datasets grandes
        if (dataLength > 100) {
            const samples = this.calculateOptimalSamples(dataLength);
            chart.options.plugins.decimation = {
                enabled: true,
                algorithm: 'lttb',
                samples: samples,
                threshold: 50
            };
        }

        // Configurar parsing optimizado
        chart.options.parsing = {
            xAxisKey: 'x',
            yAxisKey: 'y'
        };

        // Configurar animaciones optimizadas según el tamaño del dataset
        const animationDuration = this.calculateAnimationDuration(dataLength);
        chart.options.animation = {
            duration: animationDuration,
            easing: 'easeOutQuart'
        };

        // Optimizaciones específicas para dispositivos táctiles
        if (this.touchSupport) {
            chart.options.transitions = {
                active: {
                    animation: {
                        duration: Math.min(animationDuration, 100)
                    }
                }
            };
        }

        // Configurar responsive optimizations
        chart.options.responsive = true;
        chart.options.maintainAspectRatio = false;
        
        // Optimizar elementos según el tamaño del dataset
        if (dataLength > 200) {
            chart.options.elements = {
                ...chart.options.elements,
                point: {
                    ...chart.options.elements?.point,
                    radius: 2,
                    hoverRadius: 4,
                    borderWidth: 1
                }
            };
        }

        // Configurar lazy loading de tooltips para datasets grandes
        if (dataLength > 500) {
            this.setupLazyTooltips(chart);
        }
    }

    /**
     * Calculate optimal samples for decimation
     * @param {number} dataLength - Length of dataset
     * @returns {number} Optimal sample count
     */
    calculateOptimalSamples(dataLength) {
        if (dataLength > 1000) return this.touchSupport ? 100 : 200;
        if (dataLength > 500) return this.touchSupport ? 75 : 150;
        if (dataLength > 200) return this.touchSupport ? 50 : 100;
        return Math.min(dataLength, this.touchSupport ? 50 : 100);
    }

    /**
     * Calculate optimal animation duration based on dataset size
     * @param {number} dataLength - Length of dataset
     * @returns {number} Animation duration in milliseconds
     */
    calculateAnimationDuration(dataLength) {
        if (dataLength > 1000) return this.touchSupport ? 100 : 200;
        if (dataLength > 500) return this.touchSupport ? 150 : 250;
        if (dataLength > 200) return this.touchSupport ? 200 : 300;
        return this.touchSupport ? 200 : 300;
    }

    /**
     * Setup lazy tooltips for large datasets
     * @param {Chart} chart - Chart instance
     */
    setupLazyTooltips(chart) {
        let tooltipTimeout;
        
        const originalTooltipCallback = chart.options.plugins.tooltip.callbacks;
        
        chart.options.plugins.tooltip = {
            ...chart.options.plugins.tooltip,
            enabled: false, // Disable default tooltips
            external: (context) => {
                clearTimeout(tooltipTimeout);
                
                tooltipTimeout = setTimeout(() => {
                    this.showLazyTooltip(context, originalTooltipCallback);
                }, 100); // Delay tooltip display
            }
        };
    }

    /**
     * Show lazy tooltip with delay
     * @param {Object} context - Tooltip context
     * @param {Object} callbacks - Original tooltip callbacks
     */
    showLazyTooltip(context, callbacks) {
        const { chart, tooltip } = context;
        
        if (tooltip.opacity === 0) return;
        
        // Create custom tooltip element
        let tooltipEl = document.getElementById('chartjs-tooltip');
        
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.className = 'chartjs-tooltip';
            document.body.appendChild(tooltipEl);
        }
        
        // Generate tooltip content
        const tooltipModel = tooltip;
        let innerHtml = '';
        
        if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];
            const bodyLines = tooltipModel.body.map(b => b.lines);
            
            titleLines.forEach(title => {
                innerHtml += `<div class="tooltip-title">${title}</div>`;
            });
            
            bodyLines.forEach((body, i) => {
                const colors = tooltipModel.labelColors[i];
                const style = `background:${colors.backgroundColor}; border-color:${colors.borderColor}`;
                innerHtml += `<div class="tooltip-body">`;
                innerHtml += `<span class="tooltip-color" style="${style}"></span>`;
                innerHtml += `<span>${body}</span>`;
                innerHtml += `</div>`;
            });
        }
        
        tooltipEl.innerHTML = innerHtml;
        
        // Position tooltip
        const position = Chart.helpers.getRelativePosition(chart.canvas, chart.canvas);
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left = position.x + tooltipModel.caretX + 'px';
        tooltipEl.style.top = position.y + tooltipModel.caretY + 'px';
        tooltipEl.style.pointerEvents = 'none';
    }

    /**
     * Combinar opciones por defecto con opciones personalizadas
     * @param {Object} defaultOptions - Opciones por defecto
     * @param {Object} customOptions - Opciones personalizadas
     * @returns {Object} Opciones combinadas
     */
    mergeOptions(defaultOptions, customOptions) {
        return {
            ...defaultOptions,
            ...customOptions,
            plugins: {
                ...defaultOptions.plugins,
                ...customOptions.plugins
            },
            scales: {
                ...defaultOptions.scales,
                ...customOptions.scales
            }
        };
    }

    /**
     * Limpiar recursos al destruir el servicio
     */
    destroy() {
        // Desconectar ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Limpiar timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        // Destruir todos los gráficos
        this.destroyAllCharts();
    }
}

export default ChartService;