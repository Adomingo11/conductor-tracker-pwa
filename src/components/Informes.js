import { PDFService } from '../services/PDFService.js';

export class Informes {
  constructor(dbService, calcService) {
    this.dbService = dbService;
    this.calcService = calcService;
    this.pdfService = new PDFService(dbService, calcService);
    this.currentPeriod = 'semanal';
    this.isLoading = false;
  }

  init() {
    this.setupEventListeners();
    this.setupEventBusListeners();
    this.loadData(); // Load initial data
  }

  setupEventListeners() {
    // Period filter tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = e.target.dataset.period;
        if (period && period !== this.currentPeriod) {
          this.changePeriod(period);
        }
      });
    });
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

  changePeriod(period) {
    if (this.isLoading) return; // Prevent multiple simultaneous requests
    
    this.currentPeriod = period;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-period="${period}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // Load data for new period
    this.loadData();
  }

  async loadData() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      this.showLoading();
      
      const registros = await this.dbService.getAllRegistros();
      
      if (registros.length === 0) {
        this.showNoData();
        return;
      }

      let filteredRegistros;
      if (this.currentPeriod === 'semanal') {
        filteredRegistros = this.getThisWeekRegistros(registros);
      } else {
        filteredRegistros = this.getThisMonthRegistros(registros);
      }

      if (filteredRegistros.length === 0) {
        this.showNoDataForPeriod();
        return;
      }

      this.displayInformes(filteredRegistros);
    } catch (error) {
      console.error('Error loading informes data:', error);
      this.showError('Error al cargar los informes');
    } finally {
      this.isLoading = false;
    }
  }

  getThisWeekRegistros(registros) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    return registros.filter(registro => {
      const fecha = new Date(registro.fecha);
      return fecha >= startOfWeek && fecha <= endOfWeek;
    });
  }

  getThisMonthRegistros(registros) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return registros.filter(registro => {
      const fecha = new Date(registro.fecha);
      return fecha >= startOfMonth && fecha <= endOfMonth;
    });
  }

  displayInformes(registros) {
    const totals = this.calcService.calculateMonthlyTotals(registros);
    const analysis = this.calcService.analyzePeriod(registros);
    const content = document.querySelector('.informes-content');
    
    if (!content) return;

    const periodText = this.currentPeriod === 'semanal' ? 'esta semana' : 'este mes';
    const dateRange = this.getDateRangeText(registros);
    
    content.innerHTML = `
      <div class="informes-data">
        <div class="informes-header">
          <h3>Resumen de ${periodText}</h3>
          <p class="period-dates">${dateRange}</p>
          <p class="working-days">Días trabajados: ${analysis.workingDays}</p>
        </div>
        
        <div class="informes-grid">
          <div class="informe-card">
            <h4>📊 Actividad General</h4>
            <div class="informe-item">
              <span>Km Recorridos:</span>
              <span>${totals.kmRecorridos.toFixed(1)} km</span>
            </div>
            <div class="informe-item">
              <span>Carreras Totales:</span>
              <span>${totals.numeroCarreras}</span>
            </div>
            <div class="informe-item">
              <span>Promedio Km/día:</span>
              <span>${analysis.averages.kmPorDia.toFixed(1)} km</span>
            </div>
            <div class="informe-item">
              <span>Promedio Carreras/día:</span>
              <span>${analysis.averages.carrerasPorDia.toFixed(1)}</span>
            </div>
          </div>

          <div class="informe-card">
            <h4>💰 Ingresos por Plataforma</h4>
            <div class="informe-item">
              <span>Uber App:</span>
              <span>${totals.uberApp.toFixed(2)}€</span>
            </div>
            <div class="informe-item">
              <span>FreeNow App:</span>
              <span>${totals.freeNowApp.toFixed(2)}€</span>
            </div>
            <div class="informe-item">
              <span>FreeNow Tarjeta:</span>
              <span>${totals.freeNowTarjeta.toFixed(2)}€</span>
            </div>
            <div class="informe-item">
              <span>FreeNow Efectivo:</span>
              <span>${totals.freeNowEfectivo.toFixed(2)}€</span>
            </div>
            <div class="informe-item">
              <span>Taxi Tarjeta:</span>
              <span>${totals.taxiTarjeta.toFixed(2)}€</span>
            </div>
            <div class="informe-item">
              <span>Taxi Efectivo:</span>
              <span>${totals.taxiEfectivo.toFixed(2)}€</span>
            </div>
          </div>

          <div class="informe-card">
            <h4>🧮 Cálculo de Ganancias</h4>
            <div class="informe-item">
              <span>Ganancia Bruta:</span>
              <span>${totals.gananciaBruta.toFixed(2)}€</span>
            </div>
            <div class="informe-item negative">
              <span>- Comisión Vehículo (52%):</span>
              <span>${totals.comisionVehiculo.toFixed(2)}€</span>
            </div>
            <div class="informe-item negative">
              <span>- Costo Kilometraje (0.05€/km):</span>
              <span>${totals.costoKilometraje.toFixed(2)}€</span>
            </div>
            <div class="informe-item negative">
              <span>- Comisión FreeNow Efectivo (6%):</span>
              <span>${totals.comisionFreeNowEfectivo.toFixed(2)}€</span>
            </div>
            <div class="informe-item positive">
              <span>+ Gastos Combustible:</span>
              <span>${totals.gastosCombustible.toFixed(2)}€</span>
            </div>
            <div class="informe-item total">
              <span><strong>Ganancia Neta:</strong></span>
              <span><strong>${totals.gananciaNeta.toFixed(2)}€</strong></span>
            </div>
          </div>

          <div class="informe-card">
            <h4>📈 Métricas de Rendimiento</h4>
            <div class="informe-item">
              <span>Ganancia por día:</span>
              <span>${analysis.averages.gananciaPorDia.toFixed(2)}€</span>
            </div>
            <div class="informe-item">
              <span>Ganancia por carrera:</span>
              <span>${analysis.averages.gananciaPorCarrera.toFixed(2)}€</span>
            </div>
            <div class="informe-item">
              <span>Ganancia por km:</span>
              <span>${analysis.averages.gananciaPorKm.toFixed(2)}€</span>
            </div>
            ${analysis.bestDay ? `
              <div class="informe-item positive">
                <span>Mejor día:</span>
                <span>${this.formatDate(analysis.bestDay.fecha)} (${analysis.bestDay.ganancia.toFixed(2)}€)</span>
              </div>
            ` : ''}
            ${analysis.worstDay ? `
              <div class="informe-item negative">
                <span>Peor día:</span>
                <span>${this.formatDate(analysis.worstDay.fecha)} (${analysis.worstDay.ganancia.toFixed(2)}€)</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${this.currentPeriod === 'mensual' ? this.createPDFButton() : ''}
      </div>
    `;

    // Add PDF download functionality if monthly
    if (this.currentPeriod === 'mensual') {
      this.setupPDFButtons(registros);
    }
  }

  getDateRangeText(registros) {
    if (!registros || registros.length === 0) return '';
    
    const dates = registros.map(r => new Date(r.fecha)).sort((a, b) => a - b);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    if (startDate.getTime() === endDate.getTime()) {
      return this.formatDate(startDate);
    }
    
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  setupPDFButtons(registros) {
    const monthlyBtn = document.querySelector('#download-pdf-monthly');
    const advancedBtn = document.querySelector('#download-pdf-advanced');
    
    if (monthlyBtn) {
      monthlyBtn.addEventListener('click', () => {
        this.downloadMonthlyPDF(registros);
      });
    }
    
    if (advancedBtn) {
      advancedBtn.addEventListener('click', () => {
        this.downloadAdvancedPDF(registros);
      });
    }
  }

  createPDFButton() {
    return `
      <div class="pdf-section">
        <h4>📄 Exportar Informe</h4>
        <div class="pdf-options">
          <button id="download-pdf-monthly" class="btn-primary">📄 Descargar PDF</button>
          <button id="download-pdf-advanced" class="btn-secondary">📊 PDF Profesional</button>
        </div>
        <p class="pdf-description">El PDF mensual incluye todos los totales y cálculos detallados según los requisitos.</p>
      </div>
    `;
  }

  // New monthly PDF download method using PDFService (Requirements 10.1, 9.4)
  async downloadMonthlyPDF(registros) {
    try {
      // Show loading state
      const monthlyBtn = document.querySelector('#download-pdf-monthly');
      if (monthlyBtn) {
        monthlyBtn.disabled = true;
        monthlyBtn.textContent = 'Generando PDF...';
      }

      // Generate PDF using PDFService
      const result = await this.pdfService.generateMonthlyReport(registros);
      
      if (result.success) {
        this.showSuccess(`PDF descargado: ${result.filename}`);
      } else {
        throw new Error('Error en la generación del PDF');
      }
    } catch (error) {
      console.error('Error generating monthly PDF:', error);
      this.showError('Error al generar el PDF mensual. Por favor, inténtalo de nuevo.');
    } finally {
      // Restore button state
      const monthlyBtn = document.querySelector('#download-pdf-monthly');
      if (monthlyBtn) {
        monthlyBtn.disabled = false;
        monthlyBtn.textContent = '📄 Descargar PDF';
      }
    }
  }

  // Advanced PDF download method
  async downloadAdvancedPDF(registros) {
    try {
      // Show loading state
      const advancedBtn = document.querySelector('#download-pdf-advanced');
      if (advancedBtn) {
        advancedBtn.disabled = true;
        advancedBtn.textContent = 'Generando PDF...';
      }

      // Generate advanced PDF using PDFService
      const result = await this.pdfService.generateAdvancedPDF(registros, 'mensual');
      
      if (result.success) {
        this.showSuccess(`PDF profesional descargado: ${result.filename}`);
      } else {
        throw new Error('Error en la generación del PDF profesional');
      }
    } catch (error) {
      console.error('Error generating advanced PDF:', error);
      this.showError('Error al generar el PDF profesional. Por favor, inténtalo de nuevo.');
    } finally {
      // Restore button state
      const advancedBtn = document.querySelector('#download-pdf-advanced');
      if (advancedBtn) {
        advancedBtn.disabled = false;
        advancedBtn.textContent = '📊 PDF Profesional';
      }
    }
  }

  showNoData() {
    const content = document.querySelector('.informes-content');
    if (content) {
      content.innerHTML = `
        <div class="no-data">
          <p>No hay datos registrados para mostrar informes.</p>
          <p>Empieza por añadir un registro diario.</p>
        </div>
      `;
    }
  }

  showNoDataForPeriod() {
    const content = document.querySelector('.informes-content');
    const periodText = this.currentPeriod === 'semanal' ? 'esta semana' : 'este mes';
    
    if (content) {
      content.innerHTML = `
        <div class="no-data">
          <p>No hay datos registrados para ${periodText}.</p>
          <p>Los registros aparecerán aquí cuando añadas actividad.</p>
        </div>
      `;
    }
  }

  showLoading() {
    const content = document.querySelector('.informes-content');
    if (content) {
      content.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando informes...</p>
        </div>
      `;
    }
  }

  showSuccess(message) {
    if (window.app) {
      window.app.showNotification(message, 'success');
    }
  }

  showError(message) {
    const content = document.querySelector('.informes-content');
    if (content) {
      content.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <button class="btn-secondary" onclick="window.location.reload()">Reintentar</button>
        </div>
      `;
    }
    
    if (window.app) {
      window.app.showNotification(message, 'error');
    }
  }
}