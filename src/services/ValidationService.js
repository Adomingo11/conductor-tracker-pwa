/**
 * ValidationService - Servicio de validación de entrada con mensajes claros
 */
export class ValidationService {
  constructor(errorHandlingService) {
    this.errorHandlingService = errorHandlingService;
    this.validationRules = this.setupValidationRules();
  }

  setupValidationRules() {
    return {
      fecha: {
        required: true,
        type: 'date',
        custom: (value) => this.validateDate(value)
      },
      kmRecorridos: {
        required: false,
        type: 'number',
        min: 0,
        max: 1000,
        step: 0.1
      },
      numeroCarreras: {
        required: false,
        type: 'integer',
        min: 0,
        max: 100
      },
      uberApp: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        step: 0.01
      },
      uberPropinas: {
        required: false,
        type: 'number',
        min: 0,
        max: 1000,
        step: 0.01
      },
      freeNowApp: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        step: 0.01
      },
      freeNowTarjeta: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        step: 0.01
      },
      freeNowEfectivo: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        step: 0.01
      },
      freeNowPropinas: {
        required: false,
        type: 'number',
        min: 0,
        max: 1000,
        step: 0.01
      },
      taxiTarjeta: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        step: 0.01
      },
      taxiEfectivo: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        step: 0.01
      },
      combustible: {
        required: false,
        type: 'number',
        min: 0,
        max: 500,
        step: 0.01
      },
      nombre: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
      },
      apellido: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
      }
    };
  }

  /**
   * Valida un campo individual
   * @param {string} fieldName - Nombre del campo
   * @param {any} value - Valor a validar
   * @param {Object} customRules - Reglas personalizadas opcionales
   * @returns {Object} Resultado de validación
   */
  validateField(fieldName, value, customRules = {}) {
    const rules = { ...this.validationRules[fieldName], ...customRules };
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!rules) {
      return result;
    }

    // Check required
    if (rules.required && this.isEmpty(value)) {
      result.isValid = false;
      result.errors.push({
        rule: 'required',
        message: this.getFieldDisplayName(fieldName) + ' es requerido'
      });
      return result;
    }

    // Skip other validations if empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return result;
    }

    // Type validation
    if (rules.type) {
      const typeValidation = this.validateType(value, rules.type);
      if (!typeValidation.isValid) {
        result.isValid = false;
        result.errors.push({
          rule: 'type',
          message: typeValidation.message
        });
        return result;
      }
    }

    // Numeric validations
    if (rules.type === 'number' || rules.type === 'integer') {
      const numValue = parseFloat(value);
      
      if (rules.min !== undefined && numValue < rules.min) {
        result.isValid = false;
        result.errors.push({
          rule: 'min',
          message: `${this.getFieldDisplayName(fieldName)} debe ser mayor o igual a ${rules.min}`
        });
      }

      if (rules.max !== undefined && numValue > rules.max) {
        result.isValid = false;
        result.errors.push({
          rule: 'max',
          message: `${this.getFieldDisplayName(fieldName)} no puede ser mayor a ${rules.max}`
        });
      }

      // Warning for high values
      if (rules.max !== undefined && numValue > rules.max * 0.8) {
        result.warnings.push({
          rule: 'highValue',
          message: `${this.getFieldDisplayName(fieldName)} tiene un valor alto`
        });
      }
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        result.isValid = false;
        result.errors.push({
          rule: 'minLength',
          message: `${this.getFieldDisplayName(fieldName)} debe tener al menos ${rules.minLength} caracteres`
        });
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        result.isValid = false;
        result.errors.push({
          rule: 'maxLength',
          message: `${this.getFieldDisplayName(fieldName)} no puede tener más de ${rules.maxLength} caracteres`
        });
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        result.isValid = false;
        result.errors.push({
          rule: 'pattern',
          message: `${this.getFieldDisplayName(fieldName)} contiene caracteres no válidos`
        });
      }
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (!customResult.isValid) {
        result.isValid = false;
        result.errors.push({
          rule: 'custom',
          message: customResult.message
        });
      }
    }

    return result;
  }

  /**
   * Valida múltiples campos
   * @param {Object} data - Objeto con los datos a validar
   * @param {Array} fields - Array de nombres de campos a validar
   * @returns {Object} Resultado de validación
   */
  validateFields(data, fields = null) {
    const fieldsToValidate = fields || Object.keys(data);
    const result = {
      isValid: true,
      errors: {},
      warnings: {},
      summary: {
        totalErrors: 0,
        totalWarnings: 0
      }
    };

    fieldsToValidate.forEach(fieldName => {
      const value = data[fieldName];
      const fieldResult = this.validateField(fieldName, value);
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors[fieldName] = fieldResult.errors;
        result.summary.totalErrors += fieldResult.errors.length;
      }

      if (fieldResult.warnings.length > 0) {
        result.warnings[fieldName] = fieldResult.warnings;
        result.summary.totalWarnings += fieldResult.warnings.length;
      }
    });

    return result;
  }

  /**
   * Valida datos de registro diario
   * @param {Object} registroData - Datos del registro
   * @returns {Object} Resultado de validación
   */
  validateRegistroDiario(registroData) {
    const flatData = this.flattenRegistroData(registroData);
    const result = this.validateFields(flatData);

    // Validaciones adicionales específicas para registro diario
    const additionalValidations = this.validateRegistroBusinessRules(registroData);
    
    if (!additionalValidations.isValid) {
      result.isValid = false;
      Object.assign(result.errors, additionalValidations.errors);
      result.summary.totalErrors += additionalValidations.totalErrors;
    }

    return result;
  }

  /**
   * Valida reglas de negocio específicas del registro
   */
  validateRegistroBusinessRules(registroData) {
    const result = {
      isValid: true,
      errors: {},
      totalErrors: 0
    };

    // Verificar que al menos algunos datos estén ingresados
    const hasData = this.hasMinimumData(registroData);
    if (!hasData) {
      result.isValid = false;
      result.errors.general = [{
        rule: 'minimumData',
        message: 'Debe ingresar al menos algunos datos de actividad (km, carreras o ingresos)'
      }];
      result.totalErrors++;
    }

    // Verificar coherencia entre km y carreras
    if (registroData.kmRecorridos > 0 && registroData.numeroCarreras === 0) {
      if (!result.warnings) result.warnings = {};
      result.warnings.coherencia = [{
        rule: 'coherence',
        message: 'Has registrado kilómetros pero no carreras. ¿Es correcto?'
      }];
    }

    // Verificar valores muy altos
    const totalIngresos = this.calculateTotalIngresos(registroData);
    if (totalIngresos > 1000) {
      if (!result.warnings) result.warnings = {};
      result.warnings.ingresos = [{
        rule: 'highIncome',
        message: 'Los ingresos totales son muy altos para un día. Verifica los valores.'
      }];
    }

    return result;
  }

  /**
   * Valida tipo de dato
   */
  validateType(value, type) {
    switch (type) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          return {
            isValid: false,
            message: 'Debe ser un número válido'
          };
        }
        return { isValid: true };

      case 'integer':
        const int = parseInt(value);
        if (isNaN(int) || int !== parseFloat(value)) {
          return {
            isValid: false,
            message: 'Debe ser un número entero'
          };
        }
        return { isValid: true };

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            isValid: false,
            message: 'Debe ser una fecha válida'
          };
        }
        return { isValid: true };

      case 'string':
        if (typeof value !== 'string') {
          return {
            isValid: false,
            message: 'Debe ser texto válido'
          };
        }
        return { isValid: true };

      default:
        return { isValid: true };
    }
  }

  /**
   * Valida fecha específicamente
   */
  validateDate(value) {
    const date = new Date(value);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    if (date > today) {
      return {
        isValid: false,
        message: 'No se pueden registrar fechas futuras'
      };
    }

    if (date < oneYearAgo) {
      return {
        isValid: false,
        message: 'La fecha es muy antigua (más de 1 año)'
      };
    }

    return { isValid: true };
  }

  /**
   * Verifica si un valor está vacío
   */
  isEmpty(value) {
    return value === null || 
           value === undefined || 
           value === '' || 
           (typeof value === 'string' && value.trim() === '');
  }

  /**
   * Obtiene el nombre de visualización del campo
   */
  getFieldDisplayName(fieldName) {
    const displayNames = {
      fecha: 'Fecha',
      kmRecorridos: 'Kilómetros recorridos',
      numeroCarreras: 'Número de carreras',
      uberApp: 'Uber App',
      uberPropinas: 'Propinas Uber',
      freeNowApp: 'FreeNow App',
      freeNowTarjeta: 'FreeNow Tarjeta',
      freeNowEfectivo: 'FreeNow Efectivo',
      freeNowPropinas: 'Propinas FreeNow',
      taxiTarjeta: 'Taxi Tarjeta',
      taxiEfectivo: 'Taxi Efectivo',
      combustible: 'Gastos de combustible',
      nombre: 'Nombre',
      apellido: 'Apellido'
    };

    return displayNames[fieldName] || fieldName;
  }

  /**
   * Aplana los datos del registro para validación
   */
  flattenRegistroData(registroData) {
    return {
      fecha: registroData.fecha,
      kmRecorridos: registroData.kmRecorridos,
      numeroCarreras: registroData.numeroCarreras,
      uberApp: registroData.uber?.app,
      uberPropinas: registroData.uber?.propinas,
      freeNowApp: registroData.freeNow?.app,
      freeNowTarjeta: registroData.freeNow?.tarjeta,
      freeNowEfectivo: registroData.freeNow?.efectivo,
      freeNowPropinas: registroData.freeNow?.propinas,
      taxiTarjeta: registroData.taxiConvencional?.tarjeta,
      taxiEfectivo: registroData.taxiConvencional?.efectivo,
      combustible: registroData.gastos?.combustible
    };
  }

  /**
   * Verifica si hay datos mínimos
   */
  hasMinimumData(registroData) {
    return registroData.kmRecorridos > 0 || 
           registroData.numeroCarreras > 0 ||
           (registroData.uber && (registroData.uber.app > 0 || registroData.uber.propinas > 0)) ||
           (registroData.freeNow && (
             registroData.freeNow.app > 0 || 
             registroData.freeNow.tarjeta > 0 || 
             registroData.freeNow.efectivo > 0 || 
             registroData.freeNow.propinas > 0
           )) ||
           (registroData.taxiConvencional && (
             registroData.taxiConvencional.tarjeta > 0 || 
             registroData.taxiConvencional.efectivo > 0
           )) ||
           (registroData.gastos && registroData.gastos.combustible > 0);
  }

  /**
   * Calcula ingresos totales
   */
  calculateTotalIngresos(registroData) {
    let total = 0;
    
    if (registroData.uber) {
      total += (registroData.uber.app || 0) + (registroData.uber.propinas || 0);
    }
    
    if (registroData.freeNow) {
      total += (registroData.freeNow.app || 0) + 
               (registroData.freeNow.tarjeta || 0) + 
               (registroData.freeNow.efectivo || 0) + 
               (registroData.freeNow.propinas || 0);
    }
    
    if (registroData.taxiConvencional) {
      total += (registroData.taxiConvencional.tarjeta || 0) + 
               (registroData.taxiConvencional.efectivo || 0);
    }
    
    return total;
  }

  /**
   * Muestra errores de validación en la UI
   */
  displayValidationErrors(validationResult, formElement) {
    // Clear previous errors
    this.clearValidationErrors(formElement);

    if (!validationResult.isValid) {
      Object.entries(validationResult.errors).forEach(([fieldName, errors]) => {
        const input = formElement.querySelector(`#${fieldName}`) || 
                     formElement.querySelector(`[name="${fieldName}"]`);
        
        if (input) {
          input.classList.add('error');
          
          errors.forEach(error => {
            const errorElement = document.createElement('span');
            errorElement.className = 'input-error';
            errorElement.textContent = error.message;
            input.parentNode.appendChild(errorElement);
          });
        }
      });

      // Show general errors
      if (validationResult.errors.general) {
        validationResult.errors.general.forEach(error => {
          this.errorHandlingService.handleValidationError('Formulario', error.message);
        });
      }
    }

    // Show warnings
    if (validationResult.warnings) {
      Object.entries(validationResult.warnings).forEach(([fieldName, warnings]) => {
        warnings.forEach(warning => {
          this.errorHandlingService.errorHandlingService?.warning?.(warning.message);
        });
      });
    }
  }

  /**
   * Limpia errores de validación de la UI
   */
  clearValidationErrors(formElement) {
    // Remove error classes
    formElement.querySelectorAll('.error').forEach(element => {
      element.classList.remove('error');
    });

    // Remove error messages
    formElement.querySelectorAll('.input-error').forEach(element => {
      element.remove();
    });
  }
}