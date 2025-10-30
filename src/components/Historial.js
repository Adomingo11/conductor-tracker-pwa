import { HistoryViewer } from './HistoryViewer.js';
import { EditRegistroModal } from './EditRegistroModal.js';

export class Historial {
  constructor(dbService, calcService, historyService, validationService, performanceService) {
    this.dbService = dbService;
    this.calcService = calcService;
    this.historyService = historyService;
    this.validationService = validationService;
    this.performanceService = performanceService;
    this.currentRegistros = [];
    this.filteredRegistros = [];
    this.historyViewer = null;
    this.editModal = null;
    
    // Pagination settings
    this.currentPage = 1;
    this.itemsPerPage = 50; // Default items per page
    this.totalPages = 1;
    
    // Virtual scrolling
    this.virtualScrolling = null;
    this.useVirtualScrolling = false;
    
    // Performance thresholds
    this.LARGE_DATASET_THRESHOLD = 200;
    this.VIRTUAL_SCROLL_THRESHOLD = 500;
  }

  init() {
    this.setupEventListeners();
    this.setupEventBusListeners();
    
    // Initialize HistoryViewer
    if (this.historyService) {
      this.historyViewer = new HistoryViewer(
        this.historyService, 
        this.dbService, 
        this.calcService
      );
    }

    // Initialize EditRegistroModal
    if (this.historyService && this.validationService) {
      this.editModal = new EditRegistroModal(
        this.dbService,
        this.calcService,
        this.validationService,
        this.historyService
      );
    }
  }

  setupEventListeners() {
    // Filtros de fecha personalizados
    const aplicarFiltrosBtn = document.getElementById('aplicar-filtros');
    const limpiarFiltrosBtn = document.getElementById('limpiar-filtros');
    
    if (aplicarFiltrosBtn) {
      aplicarFiltrosBtn.addEventListener('click', () => {
        this.aplicarFiltros();
      });
    }
    
    if (limpiarFiltrosBtn) {
      limpiarFiltrosBtn.addEventListener('click', () => {
        this.limpiarFiltros();
      });
    }

    // Filtros rápidos
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.aplicarFiltroRapido(filter);
        
        // Actualizar botón activo
        document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Setup pagination event listeners (delegated)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.pagination-btn[data-action]')) {
        this.handlePaginationAction(e.target.dataset.action);
      } else if (e.target.matches('.pagination-btn[data-page]')) {
        this.goToPage(parseInt(e.target.dataset.page));
      }
    });

    // Items per page change
    document.addEventListener('change', (e) => {
      if (e.target.matches('#items-per-page-select')) {
        this.changeItemsPerPage(parseInt(e.target.value));
      }
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

  async loadData() {
    try {
      // Use performance service for optimized loading
      const cacheKey = 'historial-all-registros';
      const registros = await this.performanceService.cachedQuery(
        cacheKey,
        () => this.dbService.getAllRegistros(),
        2 * 60 * 1000 // 2 minutes cache
      );
      
      this.currentRegistros = registros;
      this.filteredRegistros = [...registros];
      
      // Determine if we need performance optimizations
      this.determineOptimizationStrategy(registros.length);
      
      this.displayHistorial(this.filteredRegistros);
    } catch (error) {
      console.error('Error loading historial data:', error);
      this.showError('Error al cargar el historial');
    }
  }

  async aplicarFiltros() {
    try {
      const fechaDesde = document.getElementById('fecha-desde')?.value;
      const fechaHasta = document.getElementById('fecha-hasta')?.value;
      
      let registrosFiltrados = this.currentRegistros;
      
      if (fechaDesde || fechaHasta) {
        registrosFiltrados = this.currentRegistros.filter(registro => {
          const fechaRegistro = new Date(registro.fecha);
          
          if (fechaDesde && fechaHasta) {
            return fechaRegistro >= new Date(fechaDesde) && fechaRegistro <= new Date(fechaHasta);
          } else if (fechaDesde) {
            return fechaRegistro >= new Date(fechaDesde);
          } else if (fechaHasta) {
            return fechaRegistro <= new Date(fechaHasta);
          }
          
          return true;
        });
      }
      
      this.displayHistorial(registrosFiltrados);
      
      if (fechaDesde || fechaHasta) {
        const resultsDiv = document.getElementById('filter-results');
        const countSpan = document.getElementById('results-count');
        
        const desde = fechaDesde ? new Date(fechaDesde).toLocaleDateString('es-ES') : 'inicio';
        const hasta = fechaHasta ? new Date(fechaHasta).toLocaleDateString('es-ES') : 'hoy';
        
        countSpan.textContent = `${registrosFiltrados.length} registros encontrados desde ${desde} hasta ${hasta}`;
        resultsDiv.style.display = 'block';
        
        if (registrosFiltrados.length === 0) {
          this.showInfo('No se encontraron registros en el rango de fechas seleccionado');
        }
      } else {
        document.getElementById('filter-results').style.display = 'none';
      }
      
    } catch (error) {
      console.error('Error applying filters:', error);
      this.showError('Error al aplicar filtros');
    }
  }

  limpiarFiltros() {
    document.getElementById('fecha-desde').value = '';
    document.getElementById('fecha-hasta').value = '';
    document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filter-results').style.display = 'none';
    this.displayHistorial(this.currentRegistros);
  }

  aplicarFiltroRapido(filter) {
    // Use debounced filtering for better performance
    this.performanceService.debounce('filter-quick', () => {
      this._executeQuickFilter(filter);
    }, 150);
  }

  _executeQuickFilter(filter) {
    const now = new Date();
    let fechaDesde, fechaHasta;

    switch (filter) {
      case 'today':
        fechaDesde = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        fechaHasta = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunes
        startOfWeek.setHours(0, 0, 0, 0);
        fechaDesde = startOfWeek;
        fechaHasta = new Date(now);
        break;
      
      case 'month':
        fechaDesde = new Date(now.getFullYear(), now.getMonth(), 1);
        fechaHasta = new Date(now);
        break;
      
      case 'last30':
        fechaDesde = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        fechaHasta = new Date(now);
        break;
      
      case 'all':
        this.filteredRegistros = [...this.currentRegistros];
        this.resetPagination();
        this.displayHistorial(this.filteredRegistros);
        document.getElementById('filter-results').style.display = 'none';
        return;
    }

    // Aplicar filtro con optimización
    this.filteredRegistros = this.currentRegistros.filter(registro => {
      const fechaRegistro = new Date(registro.fecha);
      return fechaRegistro >= fechaDesde && fechaRegistro <= fechaHasta;
    });

    this.resetPagination();
    this.displayHistorial(this.filteredRegistros);
    this.showFilterResults(this.filteredRegistros.length, filter);
  }

  showFilterResults(count, filterType) {
    const resultsDiv = document.getElementById('filter-results');
    const countSpan = document.getElementById('results-count');
    
    const filterNames = {
      'today': 'hoy',
      'week': 'esta semana',
      'month': 'este mes',
      'last30': 'los últimos 30 días'
    };
    
    countSpan.textContent = `${count} registros encontrados para ${filterNames[filterType]}`;
    resultsDiv.style.display = 'block';
  }

  displayHistorial(registros) {
    const container = document.getElementById('historial-content');
    if (!container) return;
    
    if (registros.length === 0) {
      container.innerHTML = `
        <div class="historial-placeholder">
          <p>No hay registros para mostrar.</p>
          <p>Añade algunos registros diarios para verlos aquí.</p>
        </div>
      `;
      return;
    }

    // Calculate pagination
    this.calculatePagination(registros.length);
    
    // Get current page data
    const paginatedData = this.getPaginatedData(registros);
    
    const totalRegistros = registros.length;
    const totales = this.calcService.calculateMonthlyTotals(registros);
    
    container.innerHTML = `
      <div class="historial-summary">
        <h3>Resumen del Período</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Registros:</span>
            <span class="stat-value">${totalRegistros}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Km Totales:</span>
            <span class="stat-value">${totales.kmRecorridos} km</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Carreras:</span>
            <span class="stat-value">${totales.numeroCarreras}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ganancia Neta:</span>
            <span class="stat-value">${totales.gananciaNeta.toFixed(2)}€</span>
          </div>
        </div>
      </div>
      
      ${this.createPaginationControls()}
      
      <div class="historial-table-container" id="historial-table-container">
        ${this.useVirtualScrolling ? 
          this.createVirtualScrollContainer() : 
          this.createRegularTable(paginatedData)
        }
      </div>
      
      ${registros.length > this.itemsPerPage ? this.createPaginationControls() : ''}
    `;
    
    // Setup appropriate rendering method
    if (this.useVirtualScrolling) {
      this.setupVirtualScrolling(registros);
    } else {
      this.setupRowActions();
    }
  }

  createRegistroRow(registro) {
    const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
    const uber = (parseFloat(registro.uber?.app || 0)).toFixed(2);
    const freeNow = (
      (parseFloat(registro.freeNow?.app || 0)) +
      (parseFloat(registro.freeNow?.tarjeta || 0)) +
      (parseFloat(registro.freeNow?.efectivo || 0))
    ).toFixed(2);
    const taxi = (
      (parseFloat(registro.taxiConvencional?.tarjeta || 0)) +
      (parseFloat(registro.taxiConvencional?.efectivo || 0))
    ).toFixed(2);
    const combustible = (parseFloat(registro.gastos?.combustible || 0)).toFixed(2);
    const gananciaNeta = (parseFloat(registro.gananciaNeta || 0)).toFixed(2);
    
    // Generate modified indicator if record has been edited
    const modifiedIndicator = this.renderModifiedIndicator(registro);
    
    return `
      <tr data-registro-id="${registro.id}" class="${registro.isModified ? 'modified-record' : ''}">
        <td>
          ${fecha}
          ${modifiedIndicator}
        </td>
        <td>${registro.kmRecorridos || 0}</td>
        <td>${registro.numeroCarreras || 0}</td>
        <td>${uber}€</td>
        <td>${freeNow}€</td>
        <td>${taxi}€</td>
        <td>${combustible}€</td>
        <td class="ganancia-cell">${gananciaNeta}€</td>
        <td class="actions-cell">
          <button class="btn-action view-details" data-id="${registro.id}" title="Ver detalles">👁️</button>
          <button class="btn-action edit-registro" data-id="${registro.id}" title="Editar">✏️</button>
          <button class="btn-action delete-registro" data-id="${registro.id}" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }

  /**
   * Renderiza el indicador de registro modificado
   * @param {Object} registro - Datos del registro
   * @returns {string} - HTML del indicador
   */
  renderModifiedIndicator(registro) {
    if (!registro.isModified || !registro.editCount || registro.editCount === 0) {
      return '';
    }

    const lastEditDate = registro.lastEditedAt 
      ? new Date(registro.lastEditedAt).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Fecha desconocida';

    return `
      <span class="modified-indicator" 
            data-id="${registro.id}" 
            title="Editado ${registro.editCount} ${registro.editCount === 1 ? 'vez' : 'veces'}. Última edición: ${lastEditDate}">
        <i class="icon-history">🕐</i>
        <span class="edit-count">${registro.editCount}</span>
      </span>
    `;
  }

  setupRowActions() {
    // Ver detalles
    document.querySelectorAll('.view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.showRegistroDetails(id);
      });
    });
    
    // Modified indicator - show history
    document.querySelectorAll('.modified-indicator').forEach(indicator => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        this.showRegistroHistory(id);
      });
    });
    
    // Editar registro
    document.querySelectorAll('.edit-registro').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.editRegistroAdvanced(id);
      });
    });
    
    // Eliminar registro
    document.querySelectorAll('.delete-registro').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.confirmDeleteRegistro(id);
      });
    });
  }

  async showRegistroDetails(id) {
    const registro = this.currentRegistros.find(r => r.id == id);
    if (!registro) return;
    
    const calculation = this.calcService.calculateGananciaNeta(registro);
    const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Detalles del Registro - ${fecha}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-section">
              <h4>Actividad</h4>
              <p><strong>Km Recorridos:</strong> ${registro.kmRecorridos || 0}</p>
              <p><strong>Carreras:</strong> ${registro.numeroCarreras || 0}</p>
            </div>
            
            <div class="detail-section">
              <h4>Uber</h4>
              <p><strong>App:</strong> ${(registro.uber?.app || 0)}€</p>
              <p><strong>Propinas:</strong> ${(registro.uber?.propinas || 0)}€</p>
            </div>
            
            <div class="detail-section">
              <h4>FreeNow</h4>
              <p><strong>App:</strong> ${(registro.freeNow?.app || 0)}€</p>
              <p><strong>Tarjeta:</strong> ${(registro.freeNow?.tarjeta || 0)}€</p>
              <p><strong>Efectivo:</strong> ${(registro.freeNow?.efectivo || 0)}€</p>
              <p><strong>Propinas:</strong> ${(registro.freeNow?.propinas || 0)}€</p>
            </div>
            
            <div class="detail-section">
              <h4>Taxi Convencional</h4>
              <p><strong>Tarjeta:</strong> ${(registro.taxiConvencional?.tarjeta || 0)}€</p>
              <p><strong>Efectivo:</strong> ${(registro.taxiConvencional?.efectivo || 0)}€</p>
            </div>
            
            <div class="detail-section">
              <h4>Gastos</h4>
              <p><strong>Combustible:</strong> ${(registro.gastos?.combustible || 0)}€</p>
            </div>
            
            <div class="detail-section calculation-section">
              <h4>Cálculo de Ganancias</h4>
              <p><strong>Ganancia Bruta:</strong> ${calculation.gananciaBruta}€</p>
              <p><strong>- Comisión Vehículo (52%):</strong> ${calculation.comisionVehiculo}€</p>
              <p><strong>- Costo Kilometraje:</strong> ${calculation.costoKilometraje}€</p>
              <p><strong>- Comisión FreeNow Efectivo (6%):</strong> ${calculation.comisionFreeNowEfectivo}€</p>
              <p><strong>+ Gastos Combustible:</strong> ${calculation.gastosCombustible}€</p>
              <p class="ganancia-final"><strong>Ganancia Neta:</strong> ${calculation.gananciaNeta}€</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners para cerrar modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  async editRegistro(id) {
    const registro = this.currentRegistros.find(r => r.id == id);
    if (!registro) return;
    
    const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3>✏️ Editar Registro - ${fecha}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="edit-form" class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label for="edit-fecha">Fecha</label>
                <input type="date" id="edit-fecha" value="${registro.fecha}" required>
              </div>
              <div class="form-group">
                <label for="edit-km">Km Recorridos</label>
                <input type="number" id="edit-km" min="0" step="0.1" value="${registro.kmRecorridos || 0}">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="edit-carreras">Nº Carreras</label>
                <input type="number" id="edit-carreras" min="0" value="${registro.numeroCarreras || 0}">
              </div>
              <div class="form-group">
                <label for="edit-combustible">Combustible (€)</label>
                <input type="number" id="edit-combustible" min="0" step="0.01" value="${registro.gastos?.combustible || 0}">
              </div>
            </div>

            <div class="form-section">
              <h4>Uber</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-uber-app">App (€)</label>
                  <input type="number" id="edit-uber-app" min="0" step="0.01" value="${registro.uber?.app || 0}">
                </div>
                <div class="form-group">
                  <label for="edit-uber-propinas">Propinas (€)</label>
                  <input type="number" id="edit-uber-propinas" min="0" step="0.01" value="${registro.uber?.propinas || 0}">
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>FreeNow</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-freenow-app">App (€)</label>
                  <input type="number" id="edit-freenow-app" min="0" step="0.01" value="${registro.freeNow?.app || 0}">
                </div>
                <div class="form-group">
                  <label for="edit-freenow-tarjeta">Tarjeta (€)</label>
                  <input type="number" id="edit-freenow-tarjeta" min="0" step="0.01" value="${registro.freeNow?.tarjeta || 0}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-freenow-efectivo">Efectivo (€)</label>
                  <input type="number" id="edit-freenow-efectivo" min="0" step="0.01" value="${registro.freeNow?.efectivo || 0}">
                </div>
                <div class="form-group">
                  <label for="edit-freenow-propinas">Propinas (€)</label>
                  <input type="number" id="edit-freenow-propinas" min="0" step="0.01" value="${registro.freeNow?.propinas || 0}">
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Taxi Convencional</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-taxi-tarjeta">Tarjeta (€)</label>
                  <input type="number" id="edit-taxi-tarjeta" min="0" step="0.01" value="${registro.taxiConvencional?.tarjeta || 0}">
                </div>
                <div class="form-group">
                  <label for="edit-taxi-efectivo">Efectivo (€)</label>
                  <input type="number" id="edit-taxi-efectivo" min="0" step="0.01" value="${registro.taxiConvencional?.efectivo || 0}">
                </div>
              </div>
            </div>

            <div class="calculation-preview">
              <h4>Vista Previa del Cálculo</h4>
              <div class="calc-line">Ganancia Bruta: <span id="edit-ganancia-bruta">0.00</span>€</div>
              <div class="calc-line">- Comisión Vehículo (52%): <span id="edit-comision-vehiculo">0.00</span>€</div>
              <div class="calc-line">- Costo Kilometraje: <span id="edit-costo-km">0.00</span>€</div>
              <div class="calc-line">- Comisión FreeNow Efectivo (6%): <span id="edit-comision-freenow">0.00</span>€</div>
              <div class="calc-line">+ Gastos Combustible: <span id="edit-gastos-combustible">0.00</span>€</div>
              <div class="calc-total">Ganancia Neta: <span id="edit-ganancia-neta">0.00</span>€</div>
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
              <button type="button" class="btn-secondary modal-cancel">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup edit form functionality
    this.setupEditForm(modal, registro);
    
    // Event listeners para cerrar modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.modal-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  setupEditForm(modal, registro) {
    const form = modal.querySelector('#edit-form');
    const inputs = form.querySelectorAll('input[type="number"]');
    
    // Update calculations in real time
    const updateEditCalculations = () => {
      const data = this.getEditFormData(modal);
      const calculation = this.calcService.calculateGananciaNeta(data);
      
      modal.querySelector('#edit-ganancia-bruta').textContent = calculation.gananciaBruta.toFixed(2);
      modal.querySelector('#edit-comision-vehiculo').textContent = calculation.comisionVehiculo.toFixed(2);
      modal.querySelector('#edit-costo-km').textContent = calculation.costoKilometraje.toFixed(2);
      modal.querySelector('#edit-comision-freenow').textContent = calculation.comisionFreeNowEfectivo.toFixed(2);
      modal.querySelector('#edit-gastos-combustible').textContent = calculation.gastosCombustible.toFixed(2);
      modal.querySelector('#edit-ganancia-neta').textContent = calculation.gananciaNeta.toFixed(2);
    };
    
    // Add event listeners to all number inputs
    inputs.forEach(input => {
      input.addEventListener('input', updateEditCalculations);
    });
    
    // Initial calculation
    updateEditCalculations();
    
    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveEditedRegistro(modal, registro);
    });
  }

  getEditFormData(modal) {
    return {
      fecha: modal.querySelector('#edit-fecha').value,
      kmRecorridos: parseFloat(modal.querySelector('#edit-km').value || 0),
      numeroCarreras: parseInt(modal.querySelector('#edit-carreras').value || 0),
      uber: {
        app: parseFloat(modal.querySelector('#edit-uber-app').value || 0),
        propinas: parseFloat(modal.querySelector('#edit-uber-propinas').value || 0)
      },
      freeNow: {
        app: parseFloat(modal.querySelector('#edit-freenow-app').value || 0),
        tarjeta: parseFloat(modal.querySelector('#edit-freenow-tarjeta').value || 0),
        efectivo: parseFloat(modal.querySelector('#edit-freenow-efectivo').value || 0),
        propinas: parseFloat(modal.querySelector('#edit-freenow-propinas').value || 0)
      },
      taxiConvencional: {
        tarjeta: parseFloat(modal.querySelector('#edit-taxi-tarjeta').value || 0),
        efectivo: parseFloat(modal.querySelector('#edit-taxi-efectivo').value || 0)
      },
      gastos: {
        combustible: parseFloat(modal.querySelector('#edit-combustible').value || 0)
      }
    };
  }

  async saveEditedRegistro(modal, originalRegistro) {
    try {
      const updatedData = this.getEditFormData(modal);
      const calculation = this.calcService.calculateGananciaNeta(updatedData);
      
      updatedData.gananciaBruta = calculation.gananciaBruta;
      updatedData.gananciaNeta = calculation.gananciaNeta;
      
      await this.dbService.updateRegistro(originalRegistro.id, updatedData);
      
      // Emitir evento de actualización
      if (window.eventBus) {
        window.eventBus.emit('registro-updated', {
          registroId: originalRegistro.id,
          fecha: updatedData.fecha
        });
      }
      
      this.showSuccess('Registro actualizado correctamente');
      document.body.removeChild(modal);
      
      // Recargar datos
      await this.loadData();
      
    } catch (error) {
      console.error('Error updating registro:', error);
      this.showError('Error al actualizar el registro');
    }
  }

  async confirmDeleteRegistro(id) {
    const registro = this.currentRegistros.find(r => r.id == id);
    if (!registro) return;
    
    const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
    
    if (confirm(`¿Estás seguro de que quieres eliminar el registro del ${fecha}?`)) {
      try {
        await this.dbService.deleteRegistro(parseInt(id));
        
        // Emitir evento de eliminación
        if (window.eventBus) {
          window.eventBus.emit('registro-deleted', {
            registroId: parseInt(id),
            fecha: registro.fecha
          });
        }
        
        this.showSuccess('Registro eliminado correctamente');
        
        // Recargar datos
        await this.loadData();
        
      } catch (error) {
        console.error('Error deleting registro:', error);
        this.showError('Error al eliminar el registro');
      }
    }
  }

  showSuccess(message) {
    if (window.app) {
      window.app.showNotification(message, 'success');
    }
  }

  showError(message) {
    if (window.app) {
      window.app.showNotification(message, 'error');
    }
  }

  showInfo(message) {
    if (window.app) {
      window.app.showNotification(message, 'info');
    }
  }

  /**
   * Muestra el historial de cambios de un registro
   * @param {number} id - ID del registro
   */
  async showRegistroHistory(id) {
    if (!this.historyViewer) {
      this.showError('Visor de historial no disponible');
      return;
    }

    try {
      await this.historyViewer.open(parseInt(id));
    } catch (error) {
      console.error('Error showing registro history:', error);
      this.showError('Error al mostrar el historial del registro');
    }
  }

  /**
   * Abre el modal de edición avanzada para un registro
   * @param {number} id - ID del registro
   */
  async editRegistroAdvanced(id) {
    if (!this.editModal) {
      // Fallback to simple editing if advanced modal not available
      this.editRegistro(id);
      return;
    }

    try {
      await this.editModal.open(parseInt(id));
    } catch (error) {
      console.error('Error opening advanced edit modal:', error);
      this.showError('Error al abrir el editor avanzado');
      // Fallback to simple editing
      this.editRegistro(id);
    }
  }

  /**
   * Determine optimization strategy based on dataset size
   * @param {number} datasetSize - Size of the dataset
   */
  determineOptimizationStrategy(datasetSize) {
    if (datasetSize >= this.VIRTUAL_SCROLL_THRESHOLD) {
      this.useVirtualScrolling = true;
      this.itemsPerPage = 100; // Larger page size for virtual scrolling
    } else if (datasetSize >= this.LARGE_DATASET_THRESHOLD) {
      this.useVirtualScrolling = false;
      this.itemsPerPage = 50; // Standard pagination
    } else {
      this.useVirtualScrolling = false;
      this.itemsPerPage = datasetSize; // Show all items
    }
  }

  /**
   * Calculate pagination parameters
   * @param {number} totalItems - Total number of items
   */
  calculatePagination(totalItems) {
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
    
    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  /**
   * Get paginated data for current page
   * @param {Array} data - Full dataset
   * @returns {Array} Paginated data
   */
  getPaginatedData(data) {
    if (this.useVirtualScrolling || data.length <= this.itemsPerPage) {
      return data;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return data.slice(startIndex, endIndex);
  }

  /**
   * Reset pagination to first page
   */
  resetPagination() {
    this.currentPage = 1;
  }

  /**
   * Create pagination controls HTML
   * @returns {string} HTML for pagination controls
   */
  createPaginationControls() {
    if (this.totalPages <= 1) return '';
    
    const prevDisabled = this.currentPage <= 1 ? 'disabled' : '';
    const nextDisabled = this.currentPage >= this.totalPages ? 'disabled' : '';
    
    let paginationHTML = `
      <div class="pagination-controls">
        <div class="pagination-info">
          Página ${this.currentPage} de ${this.totalPages} 
          (${this.filteredRegistros.length} registros total)
        </div>
        <div class="pagination-buttons">
          <button class="pagination-btn" data-action="first" ${prevDisabled}>
            ⏮️ Primera
          </button>
          <button class="pagination-btn" data-action="prev" ${prevDisabled}>
            ⬅️ Anterior
          </button>
    `;
    
    // Add page numbers (show max 5 pages around current)
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      paginationHTML += `
        <button class="pagination-btn page-number ${activeClass}" data-page="${i}">
          ${i}
        </button>
      `;
    }
    
    paginationHTML += `
          <button class="pagination-btn" data-action="next" ${nextDisabled}>
            Siguiente ➡️
          </button>
          <button class="pagination-btn" data-action="last" ${nextDisabled}>
            Última ⏭️
          </button>
        </div>
        <div class="items-per-page">
          <label for="items-per-page-select">Registros por página:</label>
          <select id="items-per-page-select">
            <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100</option>
            <option value="200" ${this.itemsPerPage === 200 ? 'selected' : ''}>200</option>
          </select>
        </div>
      </div>
    `;
    
    return paginationHTML;
  }

  /**
   * Create virtual scroll container
   * @returns {string} HTML for virtual scroll container
   */
  createVirtualScrollContainer() {
    return `
      <div class="virtual-scroll-container" id="virtual-scroll-container">
        <div class="virtual-scroll-header">
          <div class="historial-table-header">
            <div class="header-cell">Fecha</div>
            <div class="header-cell">Km</div>
            <div class="header-cell">Carreras</div>
            <div class="header-cell">Uber</div>
            <div class="header-cell">FreeNow</div>
            <div class="header-cell">Taxi</div>
            <div class="header-cell">Combustible</div>
            <div class="header-cell">Ganancia Neta</div>
            <div class="header-cell">Acciones</div>
          </div>
        </div>
        <div class="virtual-scroll-viewport" id="virtual-scroll-viewport">
          <!-- Virtual scroll content will be inserted here -->
        </div>
      </div>
    `;
  }

  /**
   * Create regular table HTML
   * @param {Array} data - Data to display
   * @returns {string} HTML for regular table
   */
  createRegularTable(data) {
    return `
      <table class="historial-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Km</th>
            <th>Carreras</th>
            <th>Uber</th>
            <th>FreeNow</th>
            <th>Taxi</th>
            <th>Combustible</th>
            <th>Ganancia Neta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(registro => this.createRegistroRow(registro)).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Setup virtual scrolling for large datasets
   * @param {Array} registros - Full dataset
   */
  setupVirtualScrolling(registros) {
    const container = document.getElementById('virtual-scroll-viewport');
    if (!container) return;
    
    // Destroy existing virtual scrolling if any
    if (this.virtualScrolling) {
      this.virtualScrolling.destroy();
    }
    
    // Create virtual scrolling instance
    this.virtualScrolling = this.performanceService.setupVirtualScrolling(
      container,
      registros,
      (registro, index) => this.createVirtualScrollItem(registro, index),
      60, // Item height
      Math.floor(container.clientHeight / 60) || 10 // Visible count
    );
  }

  /**
   * Create virtual scroll item
   * @param {Object} registro - Registro data
   * @param {number} index - Item index
   * @returns {HTMLElement} Virtual scroll item element
   */
  createVirtualScrollItem(registro, index) {
    const item = document.createElement('div');
    item.className = 'virtual-scroll-item historial-row';
    item.dataset.registroId = registro.id;
    
    const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
    const uber = (parseFloat(registro.uber?.app || 0)).toFixed(2);
    const freeNow = (
      (parseFloat(registro.freeNow?.app || 0)) +
      (parseFloat(registro.freeNow?.tarjeta || 0)) +
      (parseFloat(registro.freeNow?.efectivo || 0))
    ).toFixed(2);
    const taxi = (
      (parseFloat(registro.taxiConvencional?.tarjeta || 0)) +
      (parseFloat(registro.taxiConvencional?.efectivo || 0))
    ).toFixed(2);
    const combustible = (parseFloat(registro.gastos?.combustible || 0)).toFixed(2);
    const gananciaNeta = (parseFloat(registro.gananciaNeta || 0)).toFixed(2);
    
    const modifiedIndicator = this.renderModifiedIndicator(registro);
    
    item.innerHTML = `
      <div class="row-cell">
        ${fecha}
        ${modifiedIndicator}
      </div>
      <div class="row-cell">${registro.kmRecorridos || 0}</div>
      <div class="row-cell">${registro.numeroCarreras || 0}</div>
      <div class="row-cell">${uber}€</div>
      <div class="row-cell">${freeNow}€</div>
      <div class="row-cell">${taxi}€</div>
      <div class="row-cell">${combustible}€</div>
      <div class="row-cell ganancia-cell">${gananciaNeta}€</div>
      <div class="row-cell actions-cell">
        <button class="btn-action view-details" data-id="${registro.id}" title="Ver detalles">👁️</button>
        <button class="btn-action edit-registro" data-id="${registro.id}" title="Editar">✏️</button>
        <button class="btn-action delete-registro" data-id="${registro.id}" title="Eliminar">🗑️</button>
      </div>
    `;
    
    // Add event listeners for this item
    this.setupItemActions(item);
    
    return item;
  }

  /**
   * Setup event listeners for a single item (used in virtual scrolling)
   * @param {HTMLElement} item - Item element
   */
  setupItemActions(item) {
    // Ver detalles
    const viewBtn = item.querySelector('.view-details');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.showRegistroDetails(id);
      });
    }
    
    // Modified indicator
    const modifiedIndicator = item.querySelector('.modified-indicator');
    if (modifiedIndicator) {
      modifiedIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        this.showRegistroHistory(id);
      });
    }
    
    // Editar registro
    const editBtn = item.querySelector('.edit-registro');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.editRegistroAdvanced(id);
      });
    }
    
    // Eliminar registro
    const deleteBtn = item.querySelector('.delete-registro');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.confirmDeleteRegistro(id);
      });
    }
  }

  /**
   * Handle pagination actions
   * @param {string} action - Pagination action (first, prev, next, last)
   */
  handlePaginationAction(action) {
    switch (action) {
      case 'first':
        this.goToPage(1);
        break;
      case 'prev':
        this.goToPage(Math.max(1, this.currentPage - 1));
        break;
      case 'next':
        this.goToPage(Math.min(this.totalPages, this.currentPage + 1));
        break;
      case 'last':
        this.goToPage(this.totalPages);
        break;
    }
  }

  /**
   * Go to specific page
   * @param {number} page - Page number
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    this.displayHistorial(this.filteredRegistros);
    
    // Scroll to top of table
    const container = document.getElementById('historial-content');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Change items per page
   * @param {number} itemsPerPage - New items per page count
   */
  changeItemsPerPage(itemsPerPage) {
    this.itemsPerPage = itemsPerPage;
    this.resetPagination();
    
    // Re-determine optimization strategy
    this.determineOptimizationStrategy(this.filteredRegistros.length);
    
    this.displayHistorial(this.filteredRegistros);
  }}
