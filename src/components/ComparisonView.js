/**
 * ComparisonView Component
 * Muestra comparación visual de valores originales vs modificados
 */
export class ComparisonView {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.getElementById(container)
        : container;
    this.originalData = null;
    this.currentData = null;
    this.changedFields = [];
  }

  /**
   * Actualiza la comparación con nuevos datos
   * @param {Object} originalData - Datos originales
   * @param {Object} currentData - Datos actuales
   */
  update(originalData, currentData) {
    this.originalData = originalData;
    this.currentData = currentData;
    this.changedFields = this.detectChanges(originalData, currentData);
    this.render();
  }

  /**
   * Detecta campos que han cambiado
   * @param {Object} original - Datos originales
   * @param {Object} current - Datos actuales
   * @returns {Array} - Lista de campos modificados
   */
  detectChanges(original, current) {
    const changes = [];

    const compare = (obj1, obj2, prefix = '') => {
      const allKeys = new Set([
        ...Object.keys(obj1 || {}),
        ...Object.keys(obj2 || {}),
      ]);

      allKeys.forEach((key) => {
        // Skip internal fields
        if (
          [
            'id',
            'createdAt',
            'updatedAt',
            'editCount',
            'lastEditedAt',
            'isModified',
            'gananciaBruta',
            'gananciaNeta',
          ].includes(key)
        ) {
          return;
        }

        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        // Handle nested objects
        if (
          typeof val2 === 'object' &&
          val2 !== null &&
          !Array.isArray(val2) &&
          !(val2 instanceof Date)
        ) {
          compare(val1 || {}, val2, fullKey);
        } else if (val1 !== val2) {
          changes.push({
            field: fullKey,
            oldValue: val1,
            newValue: val2,
          });
        }
      });
    };

    compare(original, current);
    return changes;
  }

  /**
   * Resalta campos modificados
   * @param {Array} fields - Lista de campos a resaltar
   */
  highlightChanges(fields) {
    if (!this.container) return;

    const changeItems = this.container.querySelectorAll('.comparison-item');
    changeItems.forEach((item) => {
      const fieldName = item.dataset.field;
      if (fields.includes(fieldName)) {
        item.classList.add('highlighted');
      } else {
        item.classList.remove('highlighted');
      }
    });
  }

  /**
   * Calcula diferencias numéricas
   * @returns {Object} - Objeto con diferencias calculadas
   */
  calculateDifferences() {
    const differences = {};

    this.changedFields.forEach(({ field, oldValue, newValue }) => {
      if (typeof oldValue === 'number' && typeof newValue === 'number') {
        differences[field] = {
          absolute: newValue - oldValue,
          percentage:
            oldValue !== 0 ? ((newValue - oldValue) / oldValue) * 100 : 0,
        };
      }
    });

    return differences;
  }

  /**
   * Renderiza la vista de comparación
   */
  render() {
    if (!this.container) return;

    if (this.changedFields.length === 0) {
      this.container.innerHTML = `
        <div class="comparison-empty">
          <p>No hay cambios para mostrar</p>
        </div>
      `;
      return;
    }

    const differences = this.calculateDifferences();

    const html = `
      <div class="comparison-header">
        <h4>Cambios Realizados (${this.changedFields.length})</h4>
      </div>
      <div class="comparison-list">
        ${this.changedFields
          .map((change) => this.renderComparisonItem(change, differences))
          .join('')}
      </div>
      ${this.renderGananciaDiff()}
    `;

    this.container.innerHTML = html;
    this.addAnimations();
  }

  /**
   * Renderiza un item de comparación
   * @param {Object} change - Objeto con información del cambio
   * @param {Object} differences - Diferencias calculadas
   * @returns {string} - HTML del item
   */
  renderComparisonItem(change, differences) {
    const { field, oldValue, newValue } = change;
    const fieldName = this.formatFieldName(field);
    const formattedOld = this.formatValue(oldValue, field);
    const formattedNew = this.formatValue(newValue, field);

    let diffBadge = '';
    if (differences[field]) {
      const { absolute, percentage } = differences[field];
      const sign = absolute > 0 ? '+' : '';
      const color = absolute > 0 ? 'positive' : 'negative';
      diffBadge = `
        <span class="diff-badge ${color}">
          ${sign}${this.formatValue(absolute, field)}
          ${percentage !== 0 ? `(${sign}${percentage.toFixed(1)}%)` : ''}
        </span>
      `;
    }

    return `
      <div class="comparison-item" data-field="${field}">
        <div class="comparison-field-name">${fieldName}</div>
        <div class="comparison-values">
          <div class="comparison-old">
            <span class="label">Antes:</span>
            <span class="value">${formattedOld}</span>
          </div>
          <div class="comparison-arrow">→</div>
          <div class="comparison-new">
            <span class="label">Después:</span>
            <span class="value">${formattedNew}</span>
          </div>
          ${diffBadge}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza la diferencia de ganancia neta
   * @returns {string} - HTML de la diferencia
   */
  renderGananciaDiff() {
    if (!this.originalData || !this.currentData) return '';

    const oldGanancia = this.originalData.gananciaNeta || 0;
    const newGanancia = this.currentData.gananciaNeta || 0;
    const diff = newGanancia - oldGanancia;

    if (diff === 0) return '';

    const sign = diff > 0 ? '+' : '';
    const color = diff > 0 ? 'positive' : 'negative';
    const icon = diff > 0 ? '📈' : '📉';

    return `
      <div class="comparison-summary ${color}">
        <div class="summary-icon">${icon}</div>
        <div class="summary-content">
          <div class="summary-label">Impacto en Ganancia Neta</div>
          <div class="summary-value">
            ${sign}${diff.toFixed(2)}€
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Formatea el nombre de un campo
   * @param {string} fieldName - Nombre del campo
   * @returns {string} - Nombre formateado
   */
  formatFieldName(fieldName) {
    const fieldNames = {
      fecha: 'Fecha',
      kmRecorridos: 'Km Recorridos',
      numeroCarreras: 'Número de Carreras',
      'uber.app': 'Uber App',
      'uber.propinas': 'Propinas Uber',
      'freeNow.app': 'FreeNow App',
      'freeNow.tarjeta': 'FreeNow Tarjeta',
      'freeNow.efectivo': 'FreeNow Efectivo',
      'freeNow.propinas': 'Propinas FreeNow',
      'taxiConvencional.tarjeta': 'Taxi Tarjeta',
      'taxiConvencional.efectivo': 'Taxi Efectivo',
      'gastos.combustible': 'Gastos Combustible',
    };

    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Formatea un valor para mostrar
   * @param {*} value - Valor a formatear
   * @param {string} field - Nombre del campo (para contexto)
   * @returns {string} - Valor formateado
   */
  formatValue(value, field = '') {
    if (value === null || value === undefined) {
      return '-';
    }

    if (field === 'fecha') {
      return new Date(value).toLocaleDateString('es-ES');
    }

    if (typeof value === 'number') {
      if (field.includes('km') || field === 'kmRecorridos') {
        return `${value.toFixed(1)} km`;
      }
      if (field.includes('carreras') || field === 'numeroCarreras') {
        return `${Math.round(value)} carreras`;
      }
      return `${value.toFixed(2)}€`;
    }

    return String(value);
  }

  /**
   * Añade animaciones a los elementos
   */
  addAnimations() {
    if (!this.container) return;

    const items = this.container.querySelectorAll('.comparison-item');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('fade-in');
      }, index * 50);
    });
  }

  /**
   * Limpia la vista
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.originalData = null;
    this.currentData = null;
    this.changedFields = [];
  }

  /**
   * Obtiene el número de cambios
   * @returns {number} - Número de campos modificados
   */
  getChangeCount() {
    return this.changedFields.length;
  }

  /**
   * Verifica si hay cambios
   * @returns {boolean} - True si hay cambios
   */
  hasChanges() {
    return this.changedFields.length > 0;
  }

  /**
   * Obtiene lista de campos modificados
   * @returns {Array<string>} - Lista de nombres de campos
   */
  getChangedFieldNames() {
    return this.changedFields.map((c) => c.field);
  }
}
