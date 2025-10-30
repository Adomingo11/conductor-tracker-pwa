/**
 * ErrorHandlingService - Manejo centralizado de errores
 */
export class ErrorHandlingService {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.errorLog = [];
    this.maxLogSize = 100;
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, 'Promise no manejada');
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.handleError(event.error, 'Error de JavaScript');
    });
  }

  /**
   * Maneja errores de forma centralizada
   * @param {Error} error - Error a manejar
   * @param {string} context - Contexto donde ocurrió el error
   * @param {Object} options - Opciones adicionales
   */
  handleError(error, context = 'Operación', options = {}) {
    const {
      showNotification = true,
      logError = true,
      userMessage = null,
      actions = []
    } = options;

    // Log error
    if (logError) {
      this.logError(error, context);
    }

    // Show notification if requested
    if (showNotification) {
      const message = userMessage || this.getErrorMessage(error, context);
      this.notificationService.error(message, { actions });
    }

    return {
      handled: true,
      message: this.getErrorMessage(error, context),
      timestamp: new Date()
    };
  }

  /**
   * Maneja errores de base de datos
   */
  handleDatabaseError(error, operation = 'base de datos') {
    console.error(`Database error during ${operation}:`, error);
    
    let message = `Error en operación de ${operation}`;
    let actions = [];

    // Handle specific database errors
    switch (error.name) {
      case 'QuotaExceededError':
        message = 'Espacio de almacenamiento insuficiente. El navegador ha alcanzado el límite de almacenamiento.';
        actions = [
          {
            id: 'export',
            label: 'Exportar Datos',
            primary: true,
            callback: () => this.handleStorageQuotaExceeded()
          },
          {
            id: 'clear',
            label: 'Limpiar Datos Antiguos',
            callback: () => this.handleClearOldData()
          }
        ];
        break;

      case 'InvalidStateError':
        message = 'Error de estado de la base de datos. La conexión se ha perdido.';
        actions = [
          {
            id: 'reload',
            label: 'Recargar Aplicación',
            primary: true,
            callback: () => window.location.reload()
          }
        ];
        break;

      case 'DataError':
        message = 'Error en los datos. Algunos valores no son válidos.';
        break;

      case 'ConstraintError':
        message = 'Error de restricción. Los datos no cumplen con las reglas establecidas.';
        break;

      case 'AbortError':
        message = 'Operación cancelada. La transacción fue abortada.';
        break;

      default:
        if (error.message) {
          message = `${message}: ${error.message}`;
        }
    }

    this.logError(error, `Database ${operation}`);
    return this.notificationService.error(message, { 
      actions, 
      persistent: error.name === 'QuotaExceededError' || error.name === 'InvalidStateError'
    });
  }

  /**
   * Maneja errores de validación
   */
  handleValidationError(field, value, rule, customMessage = null) {
    const message = customMessage || this.getValidationMessage(field, value, rule);
    
    this.logError(new Error(`Validation failed: ${field} = ${value}, rule: ${rule}`), 'Validation');
    
    return this.notificationService.warning(message, { 
      duration: 3000,
      title: 'Error de Validación'
    });
  }

  /**
   * Maneja errores de cálculo
   */
  handleCalculationError(error, calculationType = 'cálculo') {
    console.error(`Calculation error in ${calculationType}:`, error);
    
    const message = `Error en ${calculationType}. Verifica que todos los valores sean números válidos.`;
    
    this.logError(error, `Calculation ${calculationType}`);
    
    return this.notificationService.error(message, {
      actions: [
        {
          id: 'reset',
          label: 'Restablecer Valores',
          callback: () => this.handleResetCalculation()
        }
      ]
    });
  }

  /**
   * Maneja errores de importación/exportación
   */
  handleImportExportError(error, operation = 'importación') {
    console.error(`Import/Export error during ${operation}:`, error);
    
    let message = `Error durante ${operation}`;
    let actions = [];

    if (operation === 'importación') {
      if (error.message.includes('Invalid')) {
        message = 'Archivo de importación no válido. Verifica que sea un archivo JSON exportado por esta aplicación.';
      } else if (error.message.includes('parse')) {
        message = 'Error al leer el archivo. El formato JSON no es válido.';
      } else {
        message = `Error durante la importación: ${error.message}`;
      }
      
      actions = [
        {
          id: 'help',
          label: 'Ver Ayuda',
          callback: () => this.showImportHelp()
        }
      ];
    } else {
      message = `Error durante la exportación: ${error.message}`;
      actions = [
        {
          id: 'retry',
          label: 'Reintentar',
          primary: true,
          callback: () => this.retryExport()
        }
      ];
    }

    this.logError(error, `ImportExport ${operation}`);
    return this.notificationService.error(message, { actions });
  }

  /**
   * Maneja errores de PDF
   */
  handlePDFError(error, operation = 'generación de PDF') {
    console.error(`PDF error during ${operation}:`, error);
    
    const message = `Error en ${operation}. No se pudo generar el documento PDF.`;
    
    this.logError(error, `PDF ${operation}`);
    
    return this.notificationService.error(message, {
      actions: [
        {
          id: 'retry',
          label: 'Reintentar',
          primary: true,
          callback: () => this.retryPDFGeneration()
        },
        {
          id: 'export',
          label: 'Exportar Datos',
          callback: () => this.fallbackToDataExport()
        }
      ]
    });
  }

  /**
   * Obtiene mensaje de error apropiado
   */
  getErrorMessage(error, context) {
    if (!error) return `Error desconocido en ${context}`;
    
    if (typeof error === 'string') return error;
    
    if (error.message) {
      return `${context}: ${error.message}`;
    }
    
    return `Error inesperado en ${context}`;
  }

  /**
   * Obtiene mensaje de validación
   */
  getValidationMessage(field, value, rule) {
    const fieldNames = {
      fecha: 'Fecha',
      kmRecorridos: 'Kilómetros recorridos',
      numeroCarreras: 'Número de carreras',
      uberApp: 'Uber App',
      freeNowApp: 'FreeNow App',
      combustible: 'Gastos de combustible'
    };

    const fieldName = fieldNames[field] || field;

    switch (rule) {
      case 'required':
        return `${fieldName} es requerido`;
      case 'numeric':
        return `${fieldName} debe ser un número válido`;
      case 'positive':
        return `${fieldName} debe ser un valor positivo`;
      case 'maxValue':
        return `${fieldName} tiene un valor muy alto`;
      case 'futureDate':
        return `${fieldName} no puede ser una fecha futura`;
      case 'oldDate':
        return `${fieldName} es una fecha muy antigua`;
      default:
        return `${fieldName} no es válido`;
    }
  }

  /**
   * Registra error en el log
   */
  logError(error, context) {
    const logEntry = {
      timestamp: new Date(),
      context,
      error: {
        name: error?.name || 'Unknown',
        message: error?.message || 'No message',
        stack: error?.stack || 'No stack trace'
      },
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLog.push(logEntry);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('conductor-tracker-error-log', JSON.stringify(this.errorLog));
    } catch (e) {
      console.warn('Could not save error log to localStorage:', e);
    }
  }

  /**
   * Obtiene el log de errores
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Limpia el log de errores
   */
  clearErrorLog() {
    this.errorLog = [];
    try {
      localStorage.removeItem('conductor-tracker-error-log');
    } catch (e) {
      console.warn('Could not clear error log from localStorage:', e);
    }
  }

  /**
   * Carga el log de errores desde localStorage
   */
  loadErrorLog() {
    try {
      const stored = localStorage.getItem('conductor-tracker-error-log');
      if (stored) {
        this.errorLog = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load error log from localStorage:', e);
      this.errorLog = [];
    }
  }

  // Handler methods for specific actions
  handleStorageQuotaExceeded() {
    if (window.app?.components?.ajustes?.exportData) {
      window.app.components.ajustes.exportData();
    } else {
      this.notificationService.info('Navega a Ajustes para exportar tus datos.');
    }
  }

  handleClearOldData() {
    const message = '¿Estás seguro de que quieres eliminar registros antiguos? Esta acción no se puede deshacer.';
    if (confirm(message)) {
      // Implementation would go here
      this.notificationService.info('Función de limpieza de datos antiguos en desarrollo.');
    }
  }

  handleResetCalculation() {
    if (window.app?.components?.registro?.resetForm) {
      window.app.components.registro.resetForm();
    }
  }

  showImportHelp() {
    const helpMessage = `Para importar datos:
1. El archivo debe ser un JSON exportado por esta aplicación
2. Usa la función "Exportar Datos" para crear un respaldo válido
3. El archivo debe tener la estructura correcta de datos`;
    
    this.notificationService.info(helpMessage, { 
      title: 'Ayuda de Importación',
      duration: 8000 
    });
  }

  retryExport() {
    if (window.app?.components?.ajustes?.exportData) {
      window.app.components.ajustes.exportData();
    }
  }

  retryPDFGeneration() {
    if (window.app?.components?.informes?.generatePDF) {
      window.app.components.informes.generatePDF();
    }
  }

  fallbackToDataExport() {
    this.notificationService.info('Como alternativa, puedes exportar los datos en formato JSON desde Ajustes.');
  }
}