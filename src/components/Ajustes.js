import { ExportImportService } from '../services/ExportImportService.js';
import { EditStatistics } from './EditStatistics.js';

export class Ajustes {
  constructor(dbService, historyService = null) {
    this.dbService = dbService;
    this.historyService = historyService;
    this.conductor = null;
    this.exportImportService = new ExportImportService(dbService);
    this.editStatistics = historyService ? new EditStatistics(historyService) : null;
    this.selectedFile = null;
    this.importData = null;
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Perfil del conductor
    const guardarPerfilBtn = document.getElementById('guardar-perfil');
    if (guardarPerfilBtn) {
      guardarPerfilBtn.addEventListener('click', () => {
        this.guardarPerfil();
      });
    }

    // Día libre semanal
    const guardarDiaLibreBtn = document.getElementById('guardar-dia-libre');
    const limpiarDiaLibreBtn = document.getElementById('limpiar-dia-libre');
    
    if (guardarDiaLibreBtn) {
      guardarDiaLibreBtn.addEventListener('click', () => {
        this.guardarDiaLibre();
      });
    }
    
    if (limpiarDiaLibreBtn) {
      limpiarDiaLibreBtn.addEventListener('click', () => {
        this.limpiarDiaLibre();
      });
    }

    // Vacaciones
    const guardarVacacionesBtn = document.getElementById('guardar-vacaciones');
    const limpiarVacacionesBtn = document.getElementById('limpiar-vacaciones');
    
    if (guardarVacacionesBtn) {
      guardarVacacionesBtn.addEventListener('click', () => {
        this.guardarVacaciones();
      });
    }
    
    if (limpiarVacacionesBtn) {
      limpiarVacacionesBtn.addEventListener('click', () => {
        this.limpiarVacaciones();
      });
    }

    // Export/Import functionality
    this.setupExportImportListeners();
  }

  setupExportImportListeners() {
    // Export data
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData();
      });
    }

    // Import file selection
    const selectFileBtn = document.getElementById('select-import-file');
    const fileInput = document.getElementById('import-file');
    
    if (selectFileBtn && fileInput) {
      selectFileBtn.addEventListener('click', () => {
        fileInput.click();
      });
      
      fileInput.addEventListener('change', (event) => {
        this.handleFileSelection(event);
      });
    }

    // Import confirmation
    const confirmImportBtn = document.getElementById('confirm-import');
    const cancelImportBtn = document.getElementById('cancel-import');
    
    if (confirmImportBtn) {
      confirmImportBtn.addEventListener('click', () => {
        this.confirmImport();
      });
    }
    
    if (cancelImportBtn) {
      cancelImportBtn.addEventListener('click', () => {
        this.cancelImport();
      });
    }
  }

  async loadData() {
    try {
      this.conductor = await this.dbService.getConductor();
      this.updateUI();
      
      // Load edit statistics if available
      if (this.editStatistics) {
        await this.loadEditStatistics();
      }
    } catch (error) {
      console.error('Error loading ajustes data:', error);
      this.showError('Error al cargar la configuración');
    }
  }

  /**
   * Carga las estadísticas de edición
   */
  async loadEditStatistics() {
    try {
      const statsContainer = document.getElementById('edit-statistics-container');
      if (statsContainer && this.editStatistics) {
        await this.editStatistics.render(statsContainer);
      }
    } catch (error) {
      console.error('Error loading edit statistics:', error);
    }
  }

  updateUI() {
    // Update perfil fields
    const nombreInput = document.getElementById('conductor-nombre');
    const apellidoInput = document.getElementById('conductor-apellido');
    
    if (this.conductor) {
      if (nombreInput) nombreInput.value = this.conductor.nombre || '';
      if (apellidoInput) apellidoInput.value = this.conductor.apellido || '';
      
      // Update día libre
      const diaLibreSelect = document.getElementById('dia-libre');
      if (diaLibreSelect && this.conductor.configuracion?.diaLibreSemanal) {
        diaLibreSelect.value = this.conductor.configuracion.diaLibreSemanal;
      }
      
      // Update vacaciones
      const vacacionesInicio = document.getElementById('vacaciones-inicio');
      const vacacionesFin = document.getElementById('vacaciones-fin');
      
      if (this.conductor.configuracion?.vacaciones) {
        if (vacacionesInicio && this.conductor.configuracion.vacaciones.inicio) {
          vacacionesInicio.value = this.formatDateForInput(this.conductor.configuracion.vacaciones.inicio);
        }
        if (vacacionesFin && this.conductor.configuracion.vacaciones.fin) {
          vacacionesFin.value = this.formatDateForInput(this.conductor.configuracion.vacaciones.fin);
        }
      }
    }
    
    this.updateResumenConfiguracion();
  }

  async guardarPerfil() {
    try {
      const nombreInput = document.getElementById('conductor-nombre');
      const apellidoInput = document.getElementById('conductor-apellido');
      
      const nombre = nombreInput?.value?.trim();
      const apellido = apellidoInput?.value?.trim();
      
      // Validation
      if (!nombre || !apellido) {
        throw new Error('Nombre y apellido son requeridos');
      }
      
      if (nombre.length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }
      
      if (apellido.length < 2) {
        throw new Error('El apellido debe tener al menos 2 caracteres');
      }
      
      // Check for valid characters (letters, spaces, hyphens, apostrophes)
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/;
      if (!nameRegex.test(nombre)) {
        throw new Error('El nombre solo puede contener letras, espacios, guiones y apostrofes');
      }
      
      if (!nameRegex.test(apellido)) {
        throw new Error('El apellido solo puede contener letras, espacios, guiones y apostrofes');
      }

      // Show loading state
      const guardarBtn = document.getElementById('guardar-perfil');
      const originalText = guardarBtn?.textContent;
      if (guardarBtn) {
        guardarBtn.textContent = 'Guardando...';
        guardarBtn.disabled = true;
      }

      const conductorData = {
        nombre: this.capitalizeWords(nombre),
        apellido: this.capitalizeWords(apellido),
        configuracion: this.conductor?.configuracion || {},
        updatedAt: new Date()
      };

      this.conductor = await this.dbService.saveConductor(conductorData);
      this.updateResumenConfiguracion();
      
      // Emit event to update dashboard and other components
      if (window.eventBus) {
        window.eventBus.emit('conductor-profile-updated', {
          conductor: this.conductor,
          nombre: conductorData.nombre,
          apellido: conductorData.apellido
        });
      }
      
      // Fallback: Update dashboard directly if EventBus is not available
      if (window.app && window.app.components.dashboard) {
        await window.app.components.dashboard.loadData();
      }
      
      this.showSuccess(`¡Perfil guardado correctamente! Bienvenido/a, ${conductorData.nombre} ${conductorData.apellido}`);
      
      // Restore button
      if (guardarBtn) {
        guardarBtn.textContent = originalText;
        guardarBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error saving perfil:', error);
      this.showError(error.message || 'Error al guardar el perfil');
      
      // Restore button on error
      const guardarBtn = document.getElementById('guardar-perfil');
      if (guardarBtn) {
        guardarBtn.textContent = 'Guardar Perfil';
        guardarBtn.disabled = false;
      }
    }
  }

  async guardarDiaLibre() {
    try {
      const diaLibreSelect = document.getElementById('dia-libre');
      const diaLibre = diaLibreSelect?.value;
      
      if (!diaLibre) {
        throw new Error('Selecciona un día de la semana');
      }

      // Show loading state
      const guardarBtn = document.getElementById('guardar-dia-libre');
      const originalText = guardarBtn?.textContent;
      if (guardarBtn) {
        guardarBtn.textContent = 'Guardando...';
        guardarBtn.disabled = true;
      }

      const conductorData = {
        nombre: this.conductor?.nombre || '',
        apellido: this.conductor?.apellido || '',
        configuracion: {
          ...this.conductor?.configuracion,
          diaLibreSemanal: diaLibre,
          updatedAt: new Date()
        }
      };

      this.conductor = await this.dbService.saveConductor(conductorData);
      this.updateResumenConfiguracion();
      
      // Emit event to notify other components of configuration update
      if (window.eventBus) {
        window.eventBus.emit('conductor-config-updated', {
          conductor: this.conductor,
          configType: 'diaLibre',
          value: diaLibre
        });
      }
      
      const diaCapitalizado = this.capitalizarPrimeraLetra(diaLibre);
      this.showSuccess(`Día libre configurado: ${diaCapitalizado}. Este día no aparecerá en tus estadísticas de trabajo.`);
      
      // Restore button
      if (guardarBtn) {
        guardarBtn.textContent = originalText;
        guardarBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error saving día libre:', error);
      this.showError(error.message || 'Error al guardar el día libre');
      
      // Restore button on error
      const guardarBtn = document.getElementById('guardar-dia-libre');
      if (guardarBtn) {
        guardarBtn.textContent = 'Guardar Día Libre';
        guardarBtn.disabled = false;
      }
    }
  }

  async limpiarDiaLibre() {
    try {
      // Confirm action
      const confirmClear = confirm('¿Estás seguro de que quieres eliminar la configuración de día libre?');
      if (!confirmClear) {
        return;
      }

      // Show loading state
      const limpiarBtn = document.getElementById('limpiar-dia-libre');
      const originalText = limpiarBtn?.textContent;
      if (limpiarBtn) {
        limpiarBtn.textContent = 'Limpiando...';
        limpiarBtn.disabled = true;
      }

      const conductorData = {
        nombre: this.conductor?.nombre || '',
        apellido: this.conductor?.apellido || '',
        configuracion: {
          ...this.conductor?.configuracion,
          diaLibreSemanal: null,
          updatedAt: new Date()
        }
      };

      this.conductor = await this.dbService.saveConductor(conductorData);
      
      // Clear UI
      const diaLibreSelect = document.getElementById('dia-libre');
      if (diaLibreSelect) diaLibreSelect.value = '';
      
      this.updateResumenConfiguracion();
      this.showSuccess('Día libre eliminado correctamente. Ahora todos los días se considerarán días laborables.');
      
      // Restore button
      if (limpiarBtn) {
        limpiarBtn.textContent = originalText;
        limpiarBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error clearing día libre:', error);
      this.showError('Error al limpiar el día libre');
      
      // Restore button on error
      const limpiarBtn = document.getElementById('limpiar-dia-libre');
      if (limpiarBtn) {
        limpiarBtn.textContent = 'Limpiar Día Libre';
        limpiarBtn.disabled = false;
      }
    }
  }

  async guardarVacaciones() {
    try {
      const vacacionesInicio = document.getElementById('vacaciones-inicio');
      const vacacionesFin = document.getElementById('vacaciones-fin');
      
      const inicio = vacacionesInicio?.value;
      const fin = vacacionesFin?.value;
      
      if (!inicio || !fin) {
        throw new Error('Ambas fechas de vacaciones son requeridas');
      }
      
      const fechaInicio = new Date(inicio);
      const fechaFin = new Date(fin);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Validation
      if (fechaFin <= fechaInicio) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      
      // Check if vacation period is too long (more than 1 year)
      const oneYearFromStart = new Date(fechaInicio);
      oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
      if (fechaFin > oneYearFromStart) {
        throw new Error('El período de vacaciones no puede ser mayor a un año');
      }
      
      // Calculate vacation days
      const vacationDays = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;

      // Show loading state
      const guardarBtn = document.getElementById('guardar-vacaciones');
      const originalText = guardarBtn?.textContent;
      if (guardarBtn) {
        guardarBtn.textContent = 'Guardando...';
        guardarBtn.disabled = true;
      }

      const conductorData = {
        nombre: this.conductor?.nombre || '',
        apellido: this.conductor?.apellido || '',
        configuracion: {
          ...this.conductor?.configuracion,
          vacaciones: {
            inicio: fechaInicio,
            fin: fechaFin,
            dias: vacationDays
          },
          updatedAt: new Date()
        }
      };

      this.conductor = await this.dbService.saveConductor(conductorData);
      this.updateResumenConfiguracion();
      
      // Emit event to notify other components of configuration update
      if (window.eventBus) {
        window.eventBus.emit('conductor-config-updated', {
          conductor: this.conductor,
          configType: 'vacaciones',
          value: { inicio: fechaInicio, fin: fechaFin, dias: vacationDays }
        });
      }
      
      const inicioFormatted = this.formatDateForDisplay(fechaInicio);
      const finFormatted = this.formatDateForDisplay(fechaFin);
      
      this.showSuccess(`Período de vacaciones guardado: ${inicioFormatted} - ${finFormatted} (${vacationDays} días). Los registros en este período no afectarán tus estadísticas.`);
      
      // Restore button
      if (guardarBtn) {
        guardarBtn.textContent = originalText;
        guardarBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error saving vacaciones:', error);
      this.showError(error.message || 'Error al guardar las vacaciones');
      
      // Restore button on error
      const guardarBtn = document.getElementById('guardar-vacaciones');
      if (guardarBtn) {
        guardarBtn.textContent = 'Guardar Vacaciones';
        guardarBtn.disabled = false;
      }
    }
  }

  async limpiarVacaciones() {
    try {
      // Confirm action
      const confirmClear = confirm('¿Estás seguro de que quieres eliminar el período de vacaciones configurado?');
      if (!confirmClear) {
        return;
      }

      // Show loading state
      const limpiarBtn = document.getElementById('limpiar-vacaciones');
      const originalText = limpiarBtn?.textContent;
      if (limpiarBtn) {
        limpiarBtn.textContent = 'Limpiando...';
        limpiarBtn.disabled = true;
      }

      const conductorData = {
        nombre: this.conductor?.nombre || '',
        apellido: this.conductor?.apellido || '',
        configuracion: {
          ...this.conductor?.configuracion,
          vacaciones: null,
          updatedAt: new Date()
        }
      };

      this.conductor = await this.dbService.saveConductor(conductorData);
      
      // Clear UI
      const vacacionesInicio = document.getElementById('vacaciones-inicio');
      const vacacionesFin = document.getElementById('vacaciones-fin');
      
      if (vacacionesInicio) vacacionesInicio.value = '';
      if (vacacionesFin) vacacionesFin.value = '';
      
      this.updateResumenConfiguracion();
      this.showSuccess('Período de vacaciones eliminado correctamente. Todos los días se considerarán días laborables.');
      
      // Restore button
      if (limpiarBtn) {
        limpiarBtn.textContent = originalText;
        limpiarBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error clearing vacaciones:', error);
      this.showError('Error al limpiar las vacaciones');
      
      // Restore button on error
      const limpiarBtn = document.getElementById('limpiar-vacaciones');
      if (limpiarBtn) {
        limpiarBtn.textContent = 'Limpiar Vacaciones';
        limpiarBtn.disabled = false;
      }
    }
  }

  updateResumenConfiguracion() {
    const resumenDiaLibre = document.getElementById('resumen-dia-libre');
    const resumenVacaciones = document.getElementById('resumen-vacaciones');
    
    if (resumenDiaLibre) {
      const diaLibre = this.conductor?.configuracion?.diaLibreSemanal;
      if (diaLibre) {
        resumenDiaLibre.textContent = `${this.capitalizarPrimeraLetra(diaLibre)} (día libre semanal)`;
        resumenDiaLibre.style.color = 'var(--accent-primary)';
      } else {
        resumenDiaLibre.textContent = 'Ninguno configurado - Todos los días son laborables';
        resumenDiaLibre.style.color = 'var(--text-secondary)';
      }
    }
    
    if (resumenVacaciones) {
      const vacaciones = this.conductor?.configuracion?.vacaciones;
      if (vacaciones && vacaciones.inicio && vacaciones.fin) {
        const inicio = this.formatDateForDisplay(vacaciones.inicio);
        const fin = this.formatDateForDisplay(vacaciones.fin);
        const dias = vacaciones.dias || this.calculateVacationDays(vacaciones.inicio, vacaciones.fin);
        
        // Check if vacation period is current
        const today = new Date();
        const inicioDate = new Date(vacaciones.inicio);
        const finDate = new Date(vacaciones.fin);
        
        if (today >= inicioDate && today <= finDate) {
          resumenVacaciones.textContent = `${inicio} - ${fin} (${dias} días) - ¡ACTUALMENTE DE VACACIONES!`;
          resumenVacaciones.style.color = 'var(--warning-color)';
          resumenVacaciones.style.fontWeight = 'bold';
        } else if (today < inicioDate) {
          const daysUntil = Math.ceil((inicioDate - today) / (1000 * 60 * 60 * 24));
          resumenVacaciones.textContent = `${inicio} - ${fin} (${dias} días) - Faltan ${daysUntil} días`;
          resumenVacaciones.style.color = 'var(--accent-primary)';
          resumenVacaciones.style.fontWeight = 'normal';
        } else {
          resumenVacaciones.textContent = `${inicio} - ${fin} (${dias} días) - Finalizadas`;
          resumenVacaciones.style.color = 'var(--text-secondary)';
          resumenVacaciones.style.fontWeight = 'normal';
        }
      } else {
        resumenVacaciones.textContent = 'Ninguno configurado - Sin períodos de vacaciones';
        resumenVacaciones.style.color = 'var(--text-secondary)';
        resumenVacaciones.style.fontWeight = 'normal';
      }
    }
    
    // Update profile summary if elements exist
    this.updateProfileSummary();
  }

  calculateVacationDays(inicio, fin) {
    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    return Math.ceil((finDate - inicioDate) / (1000 * 60 * 60 * 24)) + 1;
  }

  updateProfileSummary() {
    // Add profile info to summary if available
    const profileSummary = document.querySelector('.profile-summary');
    if (profileSummary && this.conductor) {
      const { nombre, apellido } = this.conductor;
      if (nombre && apellido) {
        profileSummary.innerHTML = `
          <p><strong>Conductor:</strong> ${nombre} ${apellido}</p>
          <p><strong>Perfil actualizado:</strong> ${this.formatDateForDisplay(this.conductor.updatedAt || new Date())}</p>
        `;
        profileSummary.style.display = 'block';
      } else {
        profileSummary.style.display = 'none';
      }
    }
  }

  formatDateForInput(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  formatDateForDisplay(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
  }

  capitalizarPrimeraLetra(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  capitalizeWords(str) {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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

  // Export/Import Methods
  async exportData() {
    try {
      const exportBtn = document.getElementById('export-data');
      const originalText = exportBtn?.textContent;
      
      if (exportBtn) {
        exportBtn.textContent = 'Exportando...';
        exportBtn.disabled = true;
      }

      const result = await this.exportImportService.downloadExport();
      
      this.showSuccess(`Datos exportados correctamente. Archivo: ${result.filename} (${result.recordCount} registros)`);
      
      if (exportBtn) {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showError(error.message || 'Error al exportar los datos');
      
      const exportBtn = document.getElementById('export-data');
      if (exportBtn) {
        exportBtn.textContent = 'Exportar Datos';
        exportBtn.disabled = false;
      }
    }
  }

  async handleFileSelection(event) {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    if (!file.name.endsWith('.json')) {
      this.showError('Por favor selecciona un archivo JSON válido');
      return;
    }
    
    try {
      const fileContent = await this.readFileAsText(file);
      const importData = JSON.parse(fileContent);
      
      const preview = this.exportImportService.getImportPreview(importData);
      
      if (!preview.isValid) {
        this.showError('Archivo inválido: ' + preview.errors.join(', '));
        return;
      }
      
      this.selectedFile = file;
      this.importData = importData;
      this.showImportPreview(preview);
      
    } catch (error) {
      console.error('Error reading file:', error);
      this.showError('Error al leer el archivo. Asegúrate de que sea un JSON válido.');
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  showImportPreview(preview) {
    const previewContainer = document.getElementById('import-preview');
    const previewContent = document.getElementById('import-preview-content');
    
    if (!previewContainer || !previewContent) {
      return;
    }
    
    let html = '';
    
    // Metadata section
    html += '<div class="preview-section">';
    html += '<h6>📋 Información del Archivo</h6>';
    html += `<div class="preview-item"><span class="preview-label">Aplicación:</span><span class="preview-value">${preview.metadata.appName}</span></div>`;
    html += `<div class="preview-item"><span class="preview-label">Versión:</span><span class="preview-value">${preview.metadata.version}</span></div>`;
    html += `<div class="preview-item"><span class="preview-label">Fecha de exportación:</span><span class="preview-value">${new Date(preview.metadata.exportDate).toLocaleString('es-ES')}</span></div>`;
    if (preview.metadata.conductorName) {
      html += `<div class="preview-item"><span class="preview-label">Conductor:</span><span class="preview-value">${preview.metadata.conductorName}</span></div>`;
    }
    html += '</div>';
    
    // Summary section
    html += '<div class="preview-section">';
    html += '<h6>📊 Resumen de Datos</h6>';
    html += `<div class="preview-item"><span class="preview-label">Registros diarios:</span><span class="preview-value">${preview.summary.registros}</span></div>`;
    html += `<div class="preview-item"><span class="preview-label">Perfil de conductor:</span><span class="preview-value">${preview.summary.conductor}</span></div>`;
    html += `<div class="preview-item"><span class="preview-label">Configuración:</span><span class="preview-value">${preview.summary.configuracion}</span></div>`;
    html += `<div class="preview-item"><span class="preview-label">Rango de fechas:</span><span class="preview-value">${preview.summary.dateRange}</span></div>`;
    html += '</div>';
    
    // Warnings
    if (preview.warnings && preview.warnings.length > 0) {
      html += '<div class="preview-warnings">';
      html += '<h6>⚠️ Advertencias</h6>';
      html += '<ul>';
      preview.warnings.forEach(warning => {
        html += `<li>${warning}</li>`;
      });
      html += '</ul>';
      html += '</div>';
    }
    
    previewContent.innerHTML = html;
    previewContainer.style.display = 'block';
  }

  async confirmImport() {
    if (!this.importData) {
      this.showError('No hay datos para importar');
      return;
    }
    
    try {
      const confirmBtn = document.getElementById('confirm-import');
      const originalText = confirmBtn?.textContent;
      
      if (confirmBtn) {
        confirmBtn.textContent = 'Importando...';
        confirmBtn.disabled = true;
      }

      // Ask for confirmation about overwriting data
      const hasExistingData = await this.checkExistingData();
      
      if (hasExistingData) {
        const confirmOverwrite = confirm(
          '⚠️ ADVERTENCIA: Esta acción sobrescribirá todos tus datos existentes.\n\n' +
          'Se eliminarán:\n' +
          '• Todos los registros diarios actuales\n' +
          '• Tu perfil de conductor actual\n' +
          '• Tu configuración actual\n\n' +
          '¿Estás seguro de que quieres continuar?'
        );
        
        if (!confirmOverwrite) {
          if (confirmBtn) {
            confirmBtn.textContent = originalText;
            confirmBtn.disabled = false;
          }
          return;
        }
      }
      
      const result = await this.exportImportService.importData(this.importData, { overwrite: true });
      
      if (result.success) {
        let message = `Importación completada exitosamente:\n`;
        message += `• ${result.results.registros} registros importados\n`;
        message += `• Perfil de conductor: ${result.results.conductor ? 'Importado' : 'No incluido'}\n`;
        message += `• Configuración: ${result.results.configuracion ? 'Importada' : 'No incluida'}`;
        
        if (result.warnings && result.warnings.length > 0) {
          message += `\n\nAdvertencias:\n• ${result.warnings.join('\n• ')}`;
        }
        
        this.showSuccess(message);
        
        // Reload data and update UI
        await this.loadData();
        
        // Update other components if needed
        if (window.app && window.app.components.dashboard) {
          await window.app.components.dashboard.loadData();
        }
        
        this.cancelImport();
      }
      
      if (confirmBtn) {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Error importing data:', error);
      this.showError(error.message || 'Error al importar los datos');
      
      const confirmBtn = document.getElementById('confirm-import');
      if (confirmBtn) {
        confirmBtn.textContent = 'Confirmar Importación';
        confirmBtn.disabled = false;
      }
    }
  }

  cancelImport() {
    const previewContainer = document.getElementById('import-preview');
    const fileInput = document.getElementById('import-file');
    
    if (previewContainer) {
      previewContainer.style.display = 'none';
    }
    
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.selectedFile = null;
    this.importData = null;
  }

  async checkExistingData() {
    try {
      const registros = await this.dbService.getAllRegistros();
      const conductor = await this.dbService.getConductor();
      
      return registros.length > 0 || conductor !== null;
    } catch (error) {
      console.error('Error checking existing data:', error);
      return false;
    }
  }
}