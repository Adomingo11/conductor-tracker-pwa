/**
 * EditStatistics Component
 * Muestra estadísticas sobre las ediciones de registros
 */
export class EditStatistics {
  constructor(historyService) {
    this.historyService = historyService;
    this.stats = null;
  }

  /**
   * Carga las estadísticas de edición
   * @returns {Promise<Object>} - Estadísticas de edición
   */
  async loadStatistics() {
    try {
      this.stats = await this.historyService.getEditStatistics();
      return this.stats;
    } catch (error) {
      console.error('Error loading edit statistics:', error);
      return {
        totalEdits: 0,
        editedRegistros: 0,
        averageEditsPerRegistro: 0,
        mostEditedFields: {}
      };
    }
  }

  /**
   * Renderiza las estadísticas en un contenedor
   * @param {string|HTMLElement} container - Contenedor donde renderizar
   */
  async render(container) {
    const targetContainer = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;
    
    if (!targetContainer) {
      console.error('EditStatistics: Container not found');
      return;
    }

    // Load statistics
    await this.loadStatistics();

    // Render HTML
    targetContainer.innerHTML = this.generateHTML();
  }

  /**
   * Genera el HTML de las estadísticas
   * @returns {string} - HTML de las estadísticas
   */
  generateHTML() {
    if (!this.stats) {
      return '<div class="edit-stats-loading">Cargando estadísticas...</div>';
    }

    const { totalEdits, editedRegistros, averageEditsPerRegistro, mostEditedFields } = this.stats;

    // Get top 5 most edited fields
    const topFields = Object.entries(mostEditedFields)
      .slice(0, 5)
      .map(([field, count]) => ({ field, count }));

    return `
      <div class="edit-statistics">
        <div class="stats-header">
          <h3>📊 Estadísticas de Ediciones</h3>
          <p class="stats-description">
            Análisis de tus patrones de edición de registros
          </p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">✏️</div>
            <div class="stat-content">
              <div class="stat-value">${totalEdits}</div>
              <div class="stat-label">Total de Ediciones</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <div class="stat-value">${editedRegistros}</div>
              <div class="stat-label">Registros Editados</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-value">${averageEditsPerRegistro}</div>
              <div class="stat-label">Promedio por Registro</div>
            </div>
          </div>

          <div class="stat-card efficiency-card">
            <div class="stat-icon">${this.getEfficiencyIcon()}</div>
            <div class="stat-content">
              <div class="stat-value">${this.getEfficiencyLabel()}</div>
              <div class="stat-label">Precisión de Entrada</div>
            </div>
          </div>
        </div>

        ${topFields.length > 0 ? `
          <div class="most-edited-section">
            <h4>Campos Más Editados</h4>
            <div class="most-edited-list">
              ${topFields.map((item, index) => `
                <div class="edited-field-item">
                  <div class="field-rank">#${index + 1}</div>
                  <div class="field-info">
                    <div class="field-name">${this.formatFieldName(item.field)}</div>
                    <div class="field-count">${item.count} ${item.count === 1 ? 'edición' : 'ediciones'}</div>
                  </div>
                  <div class="field-bar">
                    <div class="field-bar-fill" style="width: ${(item.count / topFields[0].count) * 100}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${this.generateInsights()}
      </div>
    `;
  }

  /**
   * Obtiene el icono de eficiencia basado en las estadísticas
   * @returns {string} - Emoji del icono
   */
  getEfficiencyIcon() {
    const efficiency = this.getEfficiencyScore();
    if (efficiency >= 90) return '🎯';
    if (efficiency >= 75) return '👍';
    if (efficiency >= 50) return '⚠️';
    return '🔄';
  }

  /**
   * Obtiene la etiqueta de eficiencia
   * @returns {string} - Etiqueta de eficiencia
   */
  getEfficiencyLabel() {
    const efficiency = this.getEfficiencyScore();
    if (efficiency >= 90) return 'Excelente';
    if (efficiency >= 75) return 'Buena';
    if (efficiency >= 50) return 'Regular';
    return 'Mejorable';
  }

  /**
   * Calcula un score de eficiencia basado en las ediciones
   * @returns {number} - Score de eficiencia (0-100)
   */
  getEfficiencyScore() {
    if (!this.stats || this.stats.editedRegistros === 0) return 100;
    
    // Lower average edits per registro = higher efficiency
    const avgEdits = parseFloat(this.stats.averageEditsPerRegistro);
    if (avgEdits <= 1.2) return 95;
    if (avgEdits <= 1.5) return 85;
    if (avgEdits <= 2.0) return 75;
    if (avgEdits <= 3.0) return 60;
    return 40;
  }

  /**
   * Genera insights basados en las estadísticas
   * @returns {string} - HTML de insights
   */
  generateInsights() {
    if (!this.stats || this.stats.totalEdits === 0) {
      return `
        <div class="insights-section">
          <h4>💡 Insights</h4>
          <div class="insight-item">
            <div class="insight-icon">🎉</div>
            <div class="insight-text">
              ¡Perfecto! No has necesitado editar ningún registro. 
              Esto indica una excelente precisión en la entrada de datos.
            </div>
          </div>
        </div>
      `;
    }

    const insights = [];
    const avgEdits = parseFloat(this.stats.averageEditsPerRegistro);
    const mostEditedField = Object.keys(this.stats.mostEditedFields)[0];

    // Efficiency insight
    if (avgEdits <= 1.5) {
      insights.push({
        icon: '🎯',
        text: 'Excelente precisión en la entrada de datos. Mantienes un promedio muy bajo de ediciones por registro.'
      });
    } else if (avgEdits > 2.5) {
      insights.push({
        icon: '💡',
        text: 'Considera revisar los datos antes de guardar para reducir la necesidad de ediciones posteriores.'
      });
    }

    // Most edited field insight
    if (mostEditedField) {
      const fieldName = this.formatFieldName(mostEditedField);
      insights.push({
        icon: '📊',
        text: `El campo "${fieldName}" es el que más editas. Considera prestar especial atención a este dato al registrar.`
      });
    }

    // Volume insight
    if (this.stats.totalEdits > 20) {
      insights.push({
        icon: '🔄',
        text: 'Has realizado muchas ediciones. Esto muestra que utilizas activamente la función de corrección de datos.'
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: '📈',
        text: 'Continúa registrando tus datos diarios para obtener más insights sobre tus patrones de edición.'
      });
    }

    return `
      <div class="insights-section">
        <h4>💡 Insights</h4>
        <div class="insights-list">
          ${insights.map(insight => `
            <div class="insight-item">
              <div class="insight-icon">${insight.icon}</div>
              <div class="insight-text">${insight.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Formatea el nombre de un campo para mostrar al usuario
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
   * Actualiza las estadísticas (llamar después de ediciones)
   */
  async refresh() {
    await this.loadStatistics();
  }
}