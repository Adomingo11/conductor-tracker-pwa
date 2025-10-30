export class RegistroDiario {
  constructor(dbService, calcService, validationService, errorHandlingService) {
    this.dbService = dbService;
    this.calcService = calcService;
    this.validationService = validationService;
    this.errorHandlingService = errorHandlingService;
    this.form = null;
    this.inputs = {};
    this.debounceTimers = {};
  }

  init() {
    this.form = document.getElementById('registro-form');
    this.setupInputs();
    this.setupEventListeners();
    this.setTodayDate();
  }

  setupInputs() {
    // Get all form inputs
    this.inputs = {
      fecha: document.getElementById('fecha-registro'),
      kmRecorridos: document.getElementById('km-recorridos'),
      numeroCarreras: document.getElementById('num-carreras'),
      uberApp: document.getElementById('uber-app'),
      uberPropinas: document.getElementById('uber-propinas'),
      freeNowApp: document.getElementById('freenow-app'),
      freeNowTarjeta: document.getElementById('freenow-tarjeta'),
      freeNowEfectivo: document.getElementById('freenow-efectivo'),
      freeNowPropinas: document.getElementById('freenow-propinas'),
      taxiTarjeta: document.getElementById('taxi-tarjeta'),
      taxiEfectivo: document.getElementById('taxi-efectivo'),
      combustible: document.getElementById('combustible')
    };
  }

  setupEventListeners() {
    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Real-time calculation updates - usar setTimeout para asegurar que los elementos existen
    setTimeout(() => {
      Object.values(this.inputs).forEach(input => {
        if (input && (input.type === 'number' || input.type === 'date')) {
          // Add input validation
          input.addEventListener('input', (e) => {
            this.validateInput(e.target);
            this.updateCalculationPreview();
          });
          input.addEventListener('change', (e) => {
            this.validateInput(e.target);
            this.updateCalculationPreview();
          });
          input.addEventListener('blur', (e) => {
            this.validateInput(e.target);
          });
        }
      });
    }, 100);
  }

  setTodayDate() {
    if (this.inputs.fecha) {
      const today = new Date().toISOString().split('T')[0];
      this.inputs.fecha.value = today;
    }
  }

  updateCalculationPreview() {
    try {
      const registroData = this.getFormData();
      const calculation = this.calcService.calculateGananciaNeta(registroData);

      // Update preview elements with animation
      this.updatePreviewElement('ganancia-bruta', calculation.gananciaBruta);
      this.updatePreviewElement('comision-vehiculo', calculation.comisionVehiculo);
      this.updatePreviewElement('costo-km', calculation.costoKilometraje);
      this.updatePreviewElement('comision-freenow', calculation.comisionFreeNowEfectivo);
      this.updatePreviewElement('gastos-combustible', calculation.gastosCombustible);
      this.updatePreviewElement('ganancia-neta', calculation.gananciaNeta);

      // Add visual feedback for positive/negative values
      this.updateGananciaNeta(calculation.gananciaNeta);

      // Update calculation details if available
      this.updateCalculationDetails(calculation);
    } catch (error) {
      console.error('Error updating calculation preview:', error);
    }
  }

  updatePreviewElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      const formattedValue = value.toFixed(2);
      if (element.textContent !== formattedValue) {
        element.textContent = formattedValue;
        // Add subtle animation for value changes
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 150);
      }
    }
  }

  updateGananciaNeta(value) {
    const element = document.getElementById('ganancia-neta');
    if (element) {
      // Add color coding for positive/negative values
      const parent = element.closest('.calc-total');
      if (parent) {
        parent.classList.remove('positive', 'negative', 'zero');
        if (value > 0) {
          parent.classList.add('positive');
        } else if (value < 0) {
          parent.classList.add('negative');
        } else {
          parent.classList.add('zero');
        }
      }
    }
  }

  getFormData() {
    return {
      fecha: this.inputs.fecha?.value || new Date().toISOString().split('T')[0],
      kmRecorridos: parseFloat(this.inputs.kmRecorridos?.value || 0),
      numeroCarreras: parseInt(this.inputs.numeroCarreras?.value || 0),
      uber: {
        app: parseFloat(this.inputs.uberApp?.value || 0),
        propinas: parseFloat(this.inputs.uberPropinas?.value || 0)
      },
      freeNow: {
        app: parseFloat(this.inputs.freeNowApp?.value || 0),
        tarjeta: parseFloat(this.inputs.freeNowTarjeta?.value || 0),
        efectivo: parseFloat(this.inputs.freeNowEfectivo?.value || 0),
        propinas: parseFloat(this.inputs.freeNowPropinas?.value || 0)
      },
      taxiConvencional: {
        tarjeta: parseFloat(this.inputs.taxiTarjeta?.value || 0),
        efectivo: parseFloat(this.inputs.taxiEfectivo?.value || 0)
      },
      gastos: {
        combustible: parseFloat(this.inputs.combustible?.value || 0)
      }
    };
  }

  validateInput(input) {
    if (!input || !this.validationService) return true;

    // Clear previous errors
    input.classList.remove('error');
    this.removeErrorMessage(input);

    // Get field name from input id or name
    const fieldName = this.getFieldNameFromInput(input);
    if (!fieldName) return true;

    // Validate using validation service
    const result = this.validationService.validateField(fieldName, input.value);
    
    if (!result.isValid) {
      input.classList.add('error');
      result.errors.forEach(error => {
        this.showInputError(input, error.message);
      });
      return false;
    }

    // Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        this.showInputWarning(input, warning.message);
      });
    }

    return true;
  }

  showInputError(input, message) {
    input.classList.add('error');
    const errorElement = document.createElement('span');
    errorElement.className = 'input-error';
    errorElement.textContent = message;
    input.parentNode.appendChild(errorElement);
  }

  removeErrorMessage(input) {
    const errorElement = input.parentNode.querySelector('.input-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  validateForm() {
    if (!this.validationService) {
      return this.validateFormFallback();
    }

    const registroData = this.getFormData();
    const result = this.validationService.validateRegistroDiario(registroData);

    // Display validation errors in UI
    this.validationService.displayValidationErrors(result, this.form);

    return result.isValid;
  }

  validateFormFallback() {
    // Fallback validation if validation service is not available
    let isValid = true;
    const errors = [];

    if (!this.inputs.fecha?.value) {
      errors.push('La fecha es requerida');
      isValid = false;
    }

    Object.values(this.inputs).forEach(input => {
      if (input && !this.validateInput(input)) {
        isValid = false;
      }
    });

    const registroData = this.getFormData();
    const hasData = registroData.kmRecorridos > 0 || 
                   registroData.numeroCarreras > 0 ||
                   Object.values(registroData.uber).some(v => v > 0) ||
                   Object.values(registroData.freeNow).some(v => v > 0) ||
                   Object.values(registroData.taxiConvencional).some(v => v > 0) ||
                   registroData.gastos.combustible > 0;

    if (!hasData) {
      errors.push('Debe ingresar al menos algunos datos de actividad');
      isValid = false;
    }

    if (errors.length > 0) {
      this.showError(errors.join('. '));
    }

    return isValid;
  }

  async handleSubmit() {
    const submitButton = this.form.querySelector('button[type="submit"]');
    
    try {
      // Validate form before submission
      if (!this.validateForm()) {
        return;
      }

      const registroData = this.getFormData();
      
      // Check for date conflicts
      const hasConflict = await this.checkDateConflict(registroData.fecha);
      if (hasConflict) {
        const confirmSave = confirm(`Ya existe un registro para ${registroData.fecha}. ¿Deseas crear un nuevo registro para esta fecha?`);
        if (!confirmSave) {
          return;
        }
      }
      
      // Calculate final values
      const calculation = this.calcService.calculateGananciaNeta(registroData);
      
      // Add calculated values to registro
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;
      registroData.createdAt = new Date();
      registroData.updatedAt = new Date();

      // Show loading state using performance service
      if (window.performanceService) {
        window.performanceService.setLoadingState(submitButton, true, 'Guardando...');
      } else {
        submitButton.textContent = 'Guardando...';
        submitButton.disabled = true;
      }

      // Save to database
      const savedRecord = await this.dbService.saveRegistroDiario(registroData);

      // Emitir evento de creación
      if (window.eventBus) {
        window.eventBus.emit('registro-created', {
          registroId: savedRecord.id,
          fecha: registroData.fecha
        });
      }

      // Show success message with calculation summary
      const successMessage = `✅ Registro guardado correctamente para ${registroData.fecha}
      
📊 Resumen del día:
• Ganancia bruta: ${calculation.gananciaBruta.toFixed(2)}€
• Ganancia neta: ${calculation.gananciaNeta.toFixed(2)}€
• Km recorridos: ${registroData.kmRecorridos}
• Carreras: ${registroData.numeroCarreras}`;
      
      this.showSuccess(successMessage);

      // Reset form
      this.resetForm();

      // Restore button using performance service
      if (window.performanceService) {
        window.performanceService.setLoadingState(submitButton, false);
      } else {
        submitButton.textContent = 'Guardar y Calcular Día';
        submitButton.disabled = false;
      }

    } catch (error) {
      if (this.errorHandlingService) {
        this.errorHandlingService.handleDatabaseError(error, 'guardado de registro');
      } else {
        console.error('Error saving registro:', error);
        this.showError(error.message || 'Error al guardar el registro');
      }
      
      // Restore button on error
      if (window.performanceService) {
        window.performanceService.setLoadingState(submitButton, false);
      } else if (submitButton) {
        submitButton.textContent = 'Guardar y Calcular Día';
        submitButton.disabled = false;
      }
    }
  }



  resetForm() {
    if (this.form) {
      this.form.reset();
      this.clearValidationErrors();
      this.setTodayDate();
      this.updateCalculationPreview();
    }
  }

  loadData() {
    // Reset form when navigating to this view
    this.setTodayDate();
    this.updateCalculationPreview();
    this.checkForExistingRecord();
  }

  async checkForExistingRecord() {
    try {
      const selectedDate = this.inputs.fecha?.value || new Date().toISOString().split('T')[0];
      const existingRecords = await this.dbService.getRegistrosByDateRange(selectedDate, selectedDate);
      
      if (existingRecords && existingRecords.length > 0) {
        this.showWarning(`Ya existe un registro para ${selectedDate}. Si guardas, se creará un nuevo registro.`);
      }
    } catch (error) {
      console.error('Error checking existing records:', error);
    }
  }

  async checkDateConflict(date) {
    try {
      const existingRecords = await this.dbService.getRegistrosByDateRange(date, date);
      return existingRecords && existingRecords.length > 0;
    } catch (error) {
      console.error('Error checking date conflict:', error);
      return false;
    }
  }

  showWarning(message) {
    if (window.app) {
      window.app.showNotification(message, 'warning');
    }
  }

  updateCalculationDetails(calculation) {
    // Add tooltips or additional info to calculation elements
    const elements = {
      'comision-vehiculo': `52% de ${calculation.gananciaBruta.toFixed(2)}€`,
      'costo-km': `${calculation.detalles.kmRecorridos} km × 0.05€`,
      'comision-freenow': `6% de ${calculation.detalles.freeNowEfectivo.toFixed(2)}€ (efectivo)`
    };

    Object.entries(elements).forEach(([id, tooltip]) => {
      const element = document.getElementById(id);
      if (element) {
        element.parentElement.title = tooltip;
      }
    });
  }

  // Add method to clear all validation errors
  clearValidationErrors() {
    Object.values(this.inputs).forEach(input => {
      if (input) {
        input.classList.remove('error');
        this.removeErrorMessage(input);
      }
    });
  }

  showSuccess(message) {
    if (window.app) {
      window.app.showNotification(message, 'success');
    }
  }

  showError(message) {
    if (window.notificationService) {
      window.notificationService.error(message);
    } else if (window.app) {
      window.app.showNotification(message, 'error');
    }
  }

  // Helper methods for validation
  getFieldNameFromInput(input) {
    const idToFieldMap = {
      'fecha-registro': 'fecha',
      'km-recorridos': 'kmRecorridos',
      'num-carreras': 'numeroCarreras',
      'uber-app': 'uberApp',
      'uber-propinas': 'uberPropinas',
      'freenow-app': 'freeNowApp',
      'freenow-tarjeta': 'freeNowTarjeta',
      'freenow-efectivo': 'freeNowEfectivo',
      'freenow-propinas': 'freeNowPropinas',
      'taxi-tarjeta': 'taxiTarjeta',
      'taxi-efectivo': 'taxiEfectivo',
      'combustible': 'combustible'
    };

    return idToFieldMap[input.id] || input.name;
  }

  showInputWarning(input, message) {
    // Remove existing warnings
    const existingWarning = input.parentNode.querySelector('.input-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    const warningElement = document.createElement('span');
    warningElement.className = 'input-warning';
    warningElement.textContent = message;
    input.parentNode.appendChild(warningElement);

    // Auto-remove warning after 5 seconds
    setTimeout(() => {
      if (warningElement.parentNode) {
        warningElement.remove();
      }
    }, 5000);
  }

  // Enhanced input event handling with debouncing
  setupEventListeners() {
    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Real-time calculation updates with debouncing
    setTimeout(() => {
      Object.values(this.inputs).forEach(input => {
        if (input && (input.type === 'number' || input.type === 'date')) {
          // Add input validation with debouncing using performance service
          input.addEventListener('input', (e) => {
            this.handleInputChange(e.target);
          });
          
          input.addEventListener('change', (e) => {
            this.validateInput(e.target);
            this.updateCalculationPreview();
          });
          
          input.addEventListener('blur', (e) => {
            this.validateInput(e.target);
          });

          // Add visual feedback for typing
          input.addEventListener('focus', (e) => {
            e.target.classList.add('input-focused');
          });

          input.addEventListener('blur', (e) => {
            e.target.classList.remove('input-focused');
          });
        }
      });
    }, 100);
  }

  handleInputChange(input) {
    const fieldName = this.getFieldNameFromInput(input);
    if (!fieldName) return;

    // Add visual feedback for debouncing
    input.classList.add('input-debouncing');

    // Use performance service for debouncing
    if (window.performanceService) {
      window.performanceService.debounce(`validation-${fieldName}`, () => {
        this.validateInput(input);
        input.classList.remove('input-debouncing');
      }, 300);

      window.performanceService.debounce('calculation-update', () => {
        this.updateCalculationPreview();
      }, 150);
    } else {
      // Fallback to manual debouncing
      this.debouncedValidation(input);
      this.debouncedCalculationUpdate();
    }
  }

  debouncedValidation(input) {
    const fieldName = this.getFieldNameFromInput(input);
    if (!fieldName) return;

    // Clear existing timer
    if (this.debounceTimers[fieldName]) {
      clearTimeout(this.debounceTimers[fieldName]);
    }

    // Set new timer
    this.debounceTimers[fieldName] = setTimeout(() => {
      this.validateInput(input);
      input.classList.remove('input-debouncing');
    }, 300);
  }

  debouncedCalculationUpdate() {
    // Clear existing timer
    if (this.debounceTimers.calculation) {
      clearTimeout(this.debounceTimers.calculation);
    }

    // Set new timer
    this.debounceTimers.calculation = setTimeout(() => {
      this.updateCalculationPreview();
    }, 150);
  }
}