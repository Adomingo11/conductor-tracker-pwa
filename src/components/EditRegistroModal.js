import { ComparisonView } from './ComparisonView.js';

/**
 * EditRegistroModal Component
 * Modal para editar registros existentes con vista de comparación
 */
export class EditRegistroModal {
  constructor(dbService, calcService, validationService, historyService) {
    this.dbService = dbService;
    this.calcService = calcService;
    this.validationService = validationService;
    this.historyService = historyService;
    this.modal = null;
    this.originalData = null;
    this.currentData = null;
    this.comparisonView = null;
    this.hasUnsavedChanges = false;
  }

  /**
   * Abre el modal con los datos del registro
   * @param {number} registroId - ID del registro a editar
   */
  async open(registroId) {
    try {
      // Load registro data
      const registro = await this.loadRegistro(registroId);
      if (!registro) {
        throw new Error('Registro no encontrado');
      }

      this.originalData = { ...registro };
      this.currentData = { ...registro };

      // Create modal HTML
      this.createModalHTML();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize comparison view
      this.comparisonView = new ComparisonView('comparison-container');

      // Pre-fill form
      this.fillForm(registro);

      // Show modal
      this.show();
    } catch (error) {
      console.error('Error opening edit modal:', error);
      if (window.app) {
        window.app.showNotification(
          'Error al abrir el editor: ' + error.message,
          'error'
        );
      }
    }
  }

  /**
   * Carga el registro desde la base de datos
   * @param {number} registroId - ID del registro
   * @returns {Promise<Object>} - Datos del registro
   */
  async loadRegistro(registroId) {
    return await this.dbService.getRegistroById(registroId);
  }

  /**
   * Crea el HTML del modal
   */
  createModalHTML() {
    const modalHTML = `
      <div id="edit-registro-modal" class="modal-overlay">
        <div class="modal-content edit-modal-content">
          <div class="modal-header">
            <h2>Editar Registro - <span id="edit-modal-fecha"></span></h2>
            <button class="modal-close" id="edit-modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <form id="edit-registro-form" class="edit-form">
              <!-- Fecha y datos básicos -->
              <div class="form-section">
                <h3>Información Básica</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-fecha">Fecha</label>
                    <input type="date" id="edit-fecha" name="fecha" required>
                  </div>
                  <div class="form-group">
                    <label for="edit-km">Km Recorridos</label>
                    <input type="number" id="edit-km" name="kmRecorridos" min="0" step="0.1">
                  </div>
                  <div class="form-group">
                    <label for="edit-carreras">Nº Carreras</label>
                    <input type="number" id="edit-carreras" name="numeroCarreras" min="0">
                  </div>
                </div>
              </div>

              <!-- Uber -->
              <div class="form-section">
                <h3>Uber</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-uber-app">App (€)</label>
                    <input type="number" id="edit-uber-app" name="uber.app" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-uber-propinas">Propinas (€)</label>
                    <input type="number" id="edit-uber-propinas" name="uber.propinas" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- FreeNow -->
              <div class="form-section">
                <h3>FreeNow</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-freenow-app">App (€)</label>
                    <input type="number" id="edit-freenow-app" name="freeNow.app" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-freenow-tarjeta">Tarjeta (€)</label>
                    <input type="number" id="edit-freenow-tarjeta" name="freeNow.tarjeta" min="0" step="0.01">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-freenow-efectivo">Efectivo (€)</label>
                    <input type="number" id="edit-freenow-efectivo" name="freeNow.efectivo" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-freenow-propinas">Propinas (€)</label>
                    <input type="number" id="edit-freenow-propinas" name="freeNow.propinas" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- Taxi Convencional -->
              <div class="form-section">
                <h3>Taxi Convencional</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-taxi-tarjeta">Tarjeta (€)</label>
                    <input type="number" id="edit-taxi-tarjeta" name="taxiConvencional.tarjeta" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-taxi-efectivo">Efectivo (€)</label>
                    <input type="number" id="edit-taxi-efectivo" name="taxiConvencional.efectivo" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- Gastos -->
              <div class="form-section">
                <h3>Gastos</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-combustible">Combustible (€)</label>
                    <input type="number" id="edit-combustible" name="gastos.combustible" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- Vista de comparación -->
              <div id="comparison-container" class="comparison-section"></div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="edit-cancel-btn">Cancelar</button>
            <button type="button" class="btn-primary" id="edit-save-btn">Guardar Cambios</button>
          </div>
        </div>
      </div>
    `;

    // Add to body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    this.modal = tempDiv.firstElementChild;
    document.body.appendChild(this.modal);
  }

  /**
   * Rellena el formulario con los datos del registro
   * @param {Object} registro - Datos del registro
   */
  fillForm(registro) {
    // Update modal title
    const fechaElement = document.getElementById('edit-modal-fecha');
    if (fechaElement) {
      fechaElement.textContent = new Date(registro.fecha).toLocaleDateString(
        'es-ES'
      );
    }

    // Fill form fields
    document.getElementById('edit-fecha').value = registro.fecha;
    document.getElementById('edit-km').value = registro.kmRecorridos || 0;
    document.getElementById('edit-carreras').value =
      registro.numeroCarreras || 0;

    // Uber
    document.getElementById('edit-uber-app').value = registro.uber?.app || 0;
    document.getElementById('edit-uber-propinas').value =
      registro.uber?.propinas || 0;

    // FreeNow
    document.getElementById('edit-freenow-app').value =
      registro.freeNow?.app || 0;
    document.getElementById('edit-freenow-tarjeta').value =
      registro.freeNow?.tarjeta || 0;
    document.getElementById('edit-freenow-efectivo').value =
      registro.freeNow?.efectivo || 0;
    document.getElementById('edit-freenow-propinas').value =
      registro.freeNow?.propinas || 0;

    // Taxi
    document.getElementById('edit-taxi-tarjeta').value =
      registro.taxiConvencional?.tarjeta || 0;
    document.getElementById('edit-taxi-efectivo').value =
      registro.taxiConvencional?.efectivo || 0;

    // Gastos
    document.getElementById('edit-combustible').value =
      registro.gastos?.combustible || 0;
  }

  /**
   * Configura los event listeners del modal
   */
  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById('edit-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleCancel());
    }

    // Cancel button
    const cancelBtn = document.getElementById('edit-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }

    // Save button
    const saveBtn = document.getElementById('edit-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSave());
    }

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.handleCancel();
      }
    });

    // Field change listeners
    const form = document.getElementById('edit-registro-form');
    const inputs = form.querySelectorAll('input');
    inputs.forEach((input) => {
      input.addEventListener('input', () => this.handleFieldChange());
    });

    // Escape key to close
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.handleCancel();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Maneja cambios en los campos del formulario
   */
  handleFieldChange() {
    this.currentData = this.getFormData();
    this.hasUnsavedChanges = true;
    this.updateComparison();
  }

  /**
   * Obtiene los datos actuales del formulario
   * @returns {Object} - Datos del formulario
   */
  getFormData() {
    return {
      fecha: document.getElementById('edit-fecha').value,
      kmRecorridos: parseFloat(document.getElementById('edit-km').value || 0),
      numeroCarreras: parseInt(
        document.getElementById('edit-carreras').value || 0
      ),
      uber: {
        app: parseFloat(document.getElementById('edit-uber-app').value || 0),
        propinas: parseFloat(
          document.getElementById('edit-uber-propinas').value || 0
        ),
      },
      freeNow: {
        app: parseFloat(document.getElementById('edit-freenow-app').value || 0),
        tarjeta: parseFloat(
          document.getElementById('edit-freenow-tarjeta').value || 0
        ),
        efectivo: parseFloat(
          document.getElementById('edit-freenow-efectivo').value || 0
        ),
        propinas: parseFloat(
          document.getElementById('edit-freenow-propinas').value || 0
        ),
      },
      taxiConvencional: {
        tarjeta: parseFloat(
          document.getElementById('edit-taxi-tarjeta').value || 0
        ),
        efectivo: parseFloat(
          document.getElementById('edit-taxi-efectivo').value || 0
        ),
      },
      gastos: {
        combustible: parseFloat(
          document.getElementById('edit-combustible').value || 0
        ),
      },
    };
  }

  /**
   * Actualiza la vista de comparación
   */
  updateComparison() {
    if (!this.comparisonView) return;

    // Calculate ganancia neta for both
    const originalCalc = this.calcService.calculateGananciaNeta(
      this.originalData
    );
    const currentCalc = this.calcService.calculateGananciaNeta(
      this.currentData
    );

    const originalWithCalc = {
      ...this.originalData,
      gananciaNeta: originalCalc.gananciaNeta,
    };
    const currentWithCalc = {
      ...this.currentData,
      gananciaNeta: currentCalc.gananciaNeta,
    };

    this.comparisonView.update(originalWithCalc, currentWithCalc);
  }

  /**
   * Valida el formulario
   * @returns {boolean} - True si es válido
   */
  validateForm() {
    const data = this.getFormData();

    // Basic validation
    if (!data.fecha) {
      this.showError('La fecha es requerida');
      return false;
    }

    // Check if there are any changes
    if (!this.comparisonView.hasChanges()) {
      this.showError('No hay cambios para guardar');
      return false;
    }

    return true;
  }

  /**
   * Muestra confirmación de cambios
   * @returns {Promise<boolean>} - True si el usuario confirma
   */
  async showConfirmation() {
    const changes = this.comparisonView.getChangeCount();
    const message = `¿Deseas guardar ${changes} cambio${changes > 1 ? 's' : ''}?`;

    return confirm(message);
  }

  /**
   * Maneja el guardado de cambios
   */
  async handleSave() {
    try {
      // Validate
      if (!this.validateForm()) {
        return;
      }

      // Show confirmation
      const confirmed = await this.showConfirmation();
      if (!confirmed) {
        return;
      }

      // Save changes
      await this.saveChanges();
    } catch (error) {
      console.error('Error saving changes:', error);
      this.showError('Error al guardar los cambios: ' + error.message);
    }
  }

  /**
   * Guarda los cambios en la base de datos
   */
  async saveChanges() {
    try {
      const saveBtn = document.getElementById('edit-save-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
      }

      // Get current data
      const updatedData = this.getFormData();

      // Calculate ganancia neta
      const calculation = this.calcService.calculateGananciaNeta(updatedData);
      updatedData.gananciaBruta = calculation.gananciaBruta;
      updatedData.gananciaNeta = calculation.gananciaNeta;

      // Get changed fields
      const changedFields = this.comparisonView.getChangedFieldNames();

      // Create history entry
      await this.historyService.createHistoryEntry(
        this.originalData.id,
        this.originalData,
        updatedData,
        changedFields
      );

      // Update registro
      await this.dbService.updateRegistro(this.originalData.id, updatedData);

      // Emit event
      if (window.eventBus) {
        window.eventBus.emit('registro-updated', {
          registroId: this.originalData.id,
          fecha: updatedData.fecha,
        });
      }

      // Show success
      this.showSuccess('Registro actualizado correctamente');

      // Close modal
      this.close();
    } catch (error) {
      console.error('Error in saveChanges:', error);
      throw error;
    } finally {
      const saveBtn = document.getElementById('edit-save-btn');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Cambios';
      }
    }
  }

  /**
   * Maneja la cancelación
   */
  handleCancel() {
    if (this.hasUnsavedChanges) {
      const confirmed = confirm(
        '¿Estás seguro? Los cambios no guardados se perderán.'
      );
      if (!confirmed) {
        return;
      }
    }

    this.close();
  }

  /**
   * Muestra el modal
   */
  show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      // Trigger animation
      setTimeout(() => {
        this.modal.classList.add('show');
      }, 10);
    }
  }

  /**
   * Cierra el modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.remove('show');
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          document.body.removeChild(this.modal);
        }
        this.cleanup();
      }, 300);
    }
  }

  /**
   * Limpia recursos
   */
  cleanup() {
    // Remove escape key listener
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    // Clear comparison view
    if (this.comparisonView) {
      this.comparisonView.clear();
    }

    // Reset state
    this.modal = null;
    this.originalData = null;
    this.currentData = null;
    this.comparisonView = null;
    this.hasUnsavedChanges = false;
  }

  /**
   * Muestra mensaje de éxito
   * @param {string} message - Mensaje
   */
  showSuccess(message) {
    if (window.app) {
      window.app.showNotification(message, 'success');
    }
  }

  /**
   * Muestra mensaje de error
   * @param {string} message - Mensaje
   */
  showError(message) {
    if (window.app) {
      window.app.showNotification(message, 'error');
    }
  }
}
