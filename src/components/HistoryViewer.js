/**
 * HistoryViewer Component
 * Muestra el historial completo de cambios de un registro
 */
export class HistoryViewer {
  constructor(historyService, dbService, calcService) {
    this.historyService = historyService;
    this.dbService = dbService;
    this.calcService = calcService;
    this.modal = null;
    this.currentRegistroId = null;
    this.historyEntries = [];
  }

  /**
   * Abre el visor de historial para un registro
   * @param {number} registroId - ID del registro
   */
  async open(registroId) {
    try {
      this.currentRegistroId = registroId;
      
      // Load registro and history
      const registro = await this.dbService.getRegistroById(registroId);
      const history = await this.loadHistory(registroId);
      
      if (!registro) {
        throw new Error('Registro no encontrado');
      }

      // Create modal HTML
      this.createModalHTML(registro);
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Render history entries
      this.renderHistoryEntries(history);
      
      // Show modal
      this.show();
    } catch (error) {
      console.error('Error opening history viewer:', error);
      if (window.app) {
        window.app.showNotification(
          'Error al abrir el historial: ' + error.message,
          'error'
        );
      }
    }
  }

  /**
   * Carga el historial del registro
   * @param {number} registroId - ID del registro
   * @returns {Promise<Array>} - Entradas del historial
   */
  async loadHistory(registroId) {
    try {
      this.historyEntries = await this.historyService.getHistory(registroId);
      return this.historyEntries;
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Crea el HTML del modal
   * @param {Object} registro - Datos del registro
   */
  createModalHTML(registro) {
    const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
    
    const modalHTML = `
      <div id="history-viewer-modal" class="modal-overlay">
        <div class="modal-content history-modal-content">
          <div class="modal-header">
            <h2>📋 Historial de Cambios - ${fecha}</h2>
            <button class="modal-close" id="history-modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="history-info">
              <div class="history-stats">
                <div class="stat-item">
                  <span class="stat-label">Total de ediciones:</span>
                  <span class="stat-value" id="total-edits">${registro.editCount || 0}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Última edición:</span>
                  <span class="stat-value" id="last-edit">
                    ${registro.lastEditedAt 
                      ? new Date(registro.lastEditedAt).toLocaleString('es-ES')
                      : 'Nunca'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div id="history-timeline" class="history-timeline">
              <!-- Timeline entries will be rendered here -->
            </div>
            
            <div id="history-empty" class="history-empty" style="display: none;">
              <p>No hay historial de cambios para este registro.</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="close-history-btn">Cerrar</button>
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
   * Configura los event listeners del modal
   */
  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById('history-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close button in footer
    const closeFooterBtn = document.getElementById('close-history-btn');
    if (closeFooterBtn) {
      closeFooterBtn.addEventListener('click', () => this.close());
    }

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Escape key to close
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Renderiza las entradas del historial
   * @param {Array} entries - Entradas del historial
   */
  renderHistoryEntries(entries) {
    const timeline = document.getElementById('history-timeline');
    const emptyDiv = document.getElementById('history-empty');
    
    if (!timeline) return;

    if (entries.length === 0) {
      timeline.style.display = 'none';
      emptyDiv.style.display = 'block';
      return;
    }

    timeline.style.display = 'block';
    emptyDiv.style.display = 'none';

    // Limit to first 10 entries with "Load more" option
    const displayEntries = entries.slice(0, 10);
    const hasMore = entries.length > 10;

    const entriesHTML = displayEntries.map((entry, index) => 
      this.renderHistoryEntry(entry, index)
    ).join('');

    const loadMoreHTML = hasMore ? `
      <div class="load-more-container">
        <button class="btn-secondary load-more-btn" data-loaded="10">
          Ver más entradas (${entries.length - 10} restantes)
        </button>
      </div>
    ` : '';

    timeline.innerHTML = entriesHTML + loadMoreHTML;

    // Setup load more functionality
    if (hasMore) {
      const loadMoreBtn = timeline.querySelector('.load-more-btn');
      loadMoreBtn.addEventListener('click', () => this.loadMoreEntries());
    }

    // Setup restore buttons
    this.setupRestoreButtons();
  }

  /**
   * Renderiza una entrada individual del historial
   * @param {Object} entry - Entrada del historial
   * @param {number} index - Índice de la entrada
   * @returns {string} - HTML de la entrada
   */
  renderHistoryEntry(entry, index) {
    const formattedEntry = this.historyService.formatHistoryEntry(entry);
    const isFirst = index === 0;
    
    return `
      <div class="history-entry ${isFirst ? 'latest' : ''}" data-entry-id="${entry.id}">
        <div class="history-timeline-marker">
          <div class="timeline-dot ${isFirst ? 'latest-dot' : ''}"></div>
          ${index < 9 ? '<div class="timeline-line"></div>' : ''}
        </div>
        
        <div class="history-content">
          <div class="history-header">
            <div class="history-date">
              ${formattedEntry.date}
              ${isFirst ? '<span class="latest-badge">Más reciente</span>' : ''}
            </div>
            <button class="btn-restore" data-entry-id="${entry.id}" title="Restaurar a esta versión">
              ↶ Restaurar
            </button>
          </div>
          
          <div class="history-changes">
            <div class="changes-summary">
              <strong>${formattedEntry.changedFields.length} campo${formattedEntry.changedFields.length !== 1 ? 's' : ''} modificado${formattedEntry.changedFields.length !== 1 ? 's' : ''}</strong>
              ${formattedEntry.gananciaDiff !== 0 ? `
                <span class="ganancia-impact ${formattedEntry.gananciaDiff > 0 ? 'positive' : 'negative'}">
                  ${formattedEntry.gananciaDiff > 0 ? '+' : ''}${formattedEntry.gananciaDiff.toFixed(2)}€
                </span>
              ` : ''}
            </div>
            
            <div class="changes-details">
              ${formattedEntry.changes.map(change => `
                <div class="change-item">
                  <span class="change-field">${change.field}:</span>
                  <span class="change-values">
                    <span class="old-value">${change.previousValue}</span>
                    <span class="arrow">→</span>
                    <span class="new-value">${change.newValue}</span>
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Carga más entradas del historial
   */
  loadMoreEntries() {
    const timeline = document.getElementById('history-timeline');
    const loadMoreBtn = timeline.querySelector('.load-more-btn');
    const loaded = parseInt(loadMoreBtn.dataset.loaded);
    const nextBatch = this.historyEntries.slice(loaded, loaded + 10);
    
    // Render next batch
    const nextHTML = nextBatch.map((entry, index) => 
      this.renderHistoryEntry(entry, loaded + index)
    ).join('');
    
    // Insert before load more button
    const loadMoreContainer = timeline.querySelector('.load-more-container');
    loadMoreContainer.insertAdjacentHTML('beforebegin', nextHTML);
    
    // Update loaded count
    const newLoaded = loaded + nextBatch.length;
    loadMoreBtn.dataset.loaded = newLoaded;
    
    // Update button text or hide if all loaded
    const remaining = this.historyEntries.length - newLoaded;
    if (remaining > 0) {
      loadMoreBtn.textContent = `Ver más entradas (${remaining} restantes)`;
    } else {
      loadMoreContainer.style.display = 'none';
    }
    
    // Setup restore buttons for new entries
    this.setupRestoreButtons();
  }

  /**
   * Configura los botones de restauración
   */
  setupRestoreButtons() {
    const restoreButtons = document.querySelectorAll('.btn-restore');
    restoreButtons.forEach(btn => {
      // Remove existing listeners to avoid duplicates
      btn.replaceWith(btn.cloneNode(true));
    });
    
    // Add new listeners
    document.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryId = parseInt(e.target.dataset.entryId);
        this.showRestoreConfirmation(entryId);
      });
    });
  }

  /**
   * Muestra confirmación de restauración
   * @param {number} entryId - ID de la entrada del historial
   */
  async showRestoreConfirmation(entryId) {
    const entry = this.historyEntries.find(e => e.id === entryId);
    if (!entry) return;

    const formattedEntry = this.historyService.formatHistoryEntry(entry);
    const changesList = formattedEntry.changes.map(change => 
      `• ${change.field}: ${change.newValue} → ${change.previousValue}`
    ).join('\n');

    const message = `¿Deseas restaurar el registro a esta versión?\n\nFecha: ${formattedEntry.date}\n\nCambios que se aplicarán:\n${changesList}\n\n⚠️ Esta acción creará una nueva entrada en el historial.`;

    if (confirm(message)) {
      await this.restoreVersion(entryId);
    }
  }

  /**
   * Restaura una versión del historial
   * @param {number} entryId - ID de la entrada del historial
   */
  async restoreVersion(entryId) {
    try {
      const restoreBtn = document.querySelector(`[data-entry-id="${entryId}"]`);
      if (restoreBtn) {
        restoreBtn.disabled = true;
        restoreBtn.textContent = 'Restaurando...';
      }

      // Restore the version
      await this.historyService.restoreVersion(this.currentRegistroId, entryId);

      // Emit event to update other components
      if (window.eventBus) {
        window.eventBus.emit('registro-updated', {
          registroId: this.currentRegistroId,
          restored: true
        });
      }

      // Show success message
      if (window.app) {
        window.app.showNotification('Registro restaurado correctamente', 'success');
      }

      // Close modal and refresh
      this.close();

    } catch (error) {
      console.error('Error restoring version:', error);
      if (window.app) {
        window.app.showNotification(
          'Error al restaurar la versión: ' + error.message,
          'error'
        );
      }
    } finally {
      const restoreBtn = document.querySelector(`[data-entry-id="${entryId}"]`);
      if (restoreBtn) {
        restoreBtn.disabled = false;
        restoreBtn.textContent = '↶ Restaurar';
      }
    }
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

    // Reset state
    this.modal = null;
    this.currentRegistroId = null;
    this.historyEntries = [];
  }
}