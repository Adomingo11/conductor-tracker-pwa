// Versión simplificada que funciona
import { DatabaseService } from './services/DatabaseService.js';
import { CalculationService } from './services/CalculationService.js';
import { Navigation } from './components/Navigation.js';
import { Dashboard } from './components/Dashboard.js';
import { Historial } from './components/Historial.js';

class SimpleApp {
  constructor() {
    this.dbService = new DatabaseService();
    this.calcService = new CalculationService();
    this.navigation = new Navigation();
    this.dashboard = new Dashboard(this.dbService, this.calcService);
    this.historial = new Historial(this.dbService, this.calcService);
    this.currentView = 'dashboard';
    this.init();
  }

  async init() {
    try {
      console.log('Inicializando aplicación...');
      await this.dbService.initDatabase();
      this.setupNavigation();
      this.setupRegistroForm();
      this.setupAjustesForm();
      this.dashboard.init();
      this.showNotification('Aplicación cargada correctamente', 'success');
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showNotification('Error al cargar la aplicación', 'error');
    }
  }

  setupNavigation() {
    // Listen for navigation events from the Navigation component
    window.addEventListener('navigation', (e) => {
      const { view } = e.detail;
      this.navigateTo(view);
    });

    // Setup navigation after a short delay to ensure DOM is ready
    setTimeout(() => {
      const navButtons = document.querySelectorAll('.nav-btn');
      navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const view = e.target.dataset.view;
          this.navigateTo(view);
        });
      });
    }, 100);
  }

  navigateTo(view) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');

    this.currentView = view;

    // Load specific view data
    if (view === 'registro') {
      this.setupRegistroForm();
    } else if (view === 'historial') {
      this.historial.init();
      this.historial.loadData();
    } else if (view === 'ajustes') {
      this.loadAjustes();
    }
  }

  setupRegistroForm() {
    const form = document.getElementById('registro-form');
    if (!form) return;

    // Set today's date
    const fechaInput = document.getElementById('fecha-registro');
    if (fechaInput) {
      fechaInput.value = new Date().toISOString().split('T')[0];
    }

    // Setup form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegistroSubmit();
    });

    // Setup real-time calculations
    const inputs = [
      'km-recorridos', 'num-carreras', 'uber-app', 'uber-propinas',
      'freenow-app', 'freenow-tarjeta', 'freenow-efectivo', 'freenow-propinas',
      'taxi-tarjeta', 'taxi-efectivo', 'combustible'
    ];

    inputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => {
          this.updateCalculationPreview();
        });
      }
    });

    // Initial calculation
    this.updateCalculationPreview();
  }

  updateCalculationPreview() {
    const registroData = this.getFormData();
    const calculation = this.calcService.calculateGananciaNeta(registroData);

    // Update preview elements
    document.getElementById('ganancia-bruta').textContent = calculation.gananciaBruta.toFixed(2);
    document.getElementById('comision-vehiculo').textContent = calculation.comisionVehiculo.toFixed(2);
    document.getElementById('costo-km').textContent = calculation.costoKilometraje.toFixed(2);
    document.getElementById('comision-freenow').textContent = calculation.comisionFreeNowEfectivo.toFixed(2);
    document.getElementById('gastos-combustible').textContent = calculation.gastosCombustible.toFixed(2);
    document.getElementById('ganancia-neta').textContent = calculation.gananciaNeta.toFixed(2);
  }

  getFormData() {
    return {
      fecha: document.getElementById('fecha-registro')?.value || new Date().toISOString().split('T')[0],
      kmRecorridos: parseFloat(document.getElementById('km-recorridos')?.value || 0),
      numeroCarreras: parseInt(document.getElementById('num-carreras')?.value || 0),
      uber: {
        app: parseFloat(document.getElementById('uber-app')?.value || 0),
        propinas: parseFloat(document.getElementById('uber-propinas')?.value || 0)
      },
      freeNow: {
        app: parseFloat(document.getElementById('freenow-app')?.value || 0),
        tarjeta: parseFloat(document.getElementById('freenow-tarjeta')?.value || 0),
        efectivo: parseFloat(document.getElementById('freenow-efectivo')?.value || 0),
        propinas: parseFloat(document.getElementById('freenow-propinas')?.value || 0)
      },
      taxiConvencional: {
        tarjeta: parseFloat(document.getElementById('taxi-tarjeta')?.value || 0),
        efectivo: parseFloat(document.getElementById('taxi-efectivo')?.value || 0)
      },
      gastos: {
        combustible: parseFloat(document.getElementById('combustible')?.value || 0)
      }
    };
  }

  async handleRegistroSubmit() {
    try {
      const registroData = this.getFormData();
      
      if (!registroData.fecha) {
        throw new Error('La fecha es requerida');
      }

      const calculation = this.calcService.calculateGananciaNeta(registroData);
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;

      await this.dbService.saveRegistroDiario(registroData);
      this.showNotification('Registro guardado correctamente', 'success');
      
      // Reset form
      document.getElementById('registro-form').reset();
      document.getElementById('fecha-registro').value = new Date().toISOString().split('T')[0];
      this.updateCalculationPreview();
      
      // Update dashboard
      await this.dashboard.refresh();

    } catch (error) {
      console.error('Error saving registro:', error);
      this.showNotification(error.message || 'Error al guardar el registro', 'error');
    }
  }

  /**
   * Refresh dashboard data (called when new records are added)
   */
  async refreshDashboard() {
    if (this.dashboard) {
      await this.dashboard.refresh();
    }
  }



  setupAjustesForm() {
    // Guardar perfil
    const guardarPerfilBtn = document.getElementById('guardar-perfil');
    if (guardarPerfilBtn) {
      guardarPerfilBtn.addEventListener('click', async () => {
        try {
          const nombre = document.getElementById('conductor-nombre')?.value?.trim();
          const apellido = document.getElementById('conductor-apellido')?.value?.trim();
          
          if (!nombre || !apellido) {
            throw new Error('Nombre y apellido son requeridos');
          }

          await this.dbService.saveConductor({ nombre, apellido });
          this.showNotification('Perfil guardado correctamente', 'success');
        } catch (error) {
          this.showNotification(error.message, 'error');
        }
      });
    }

    // Guardar día libre
    const guardarDiaLibreBtn = document.getElementById('guardar-dia-libre');
    if (guardarDiaLibreBtn) {
      guardarDiaLibreBtn.addEventListener('click', () => {
        const diaLibre = document.getElementById('dia-libre')?.value;
        if (diaLibre) {
          this.showNotification('Día libre guardado: ' + diaLibre, 'success');
        } else {
          this.showNotification('Selecciona un día de la semana', 'error');
        }
      });
    }

    // Limpiar día libre
    const limpiarDiaLibreBtn = document.getElementById('limpiar-dia-libre');
    if (limpiarDiaLibreBtn) {
      limpiarDiaLibreBtn.addEventListener('click', () => {
        document.getElementById('dia-libre').value = '';
        this.showNotification('Día libre eliminado', 'success');
      });
    }

    // Guardar vacaciones
    const guardarVacacionesBtn = document.getElementById('guardar-vacaciones');
    if (guardarVacacionesBtn) {
      guardarVacacionesBtn.addEventListener('click', () => {
        const inicio = document.getElementById('vacaciones-inicio')?.value;
        const fin = document.getElementById('vacaciones-fin')?.value;
        
        if (inicio && fin) {
          this.showNotification('Vacaciones guardadas correctamente', 'success');
        } else {
          this.showNotification('Ambas fechas son requeridas', 'error');
        }
      });
    }

    // Limpiar vacaciones
    const limpiarVacacionesBtn = document.getElementById('limpiar-vacaciones');
    if (limpiarVacacionesBtn) {
      limpiarVacacionesBtn.addEventListener('click', () => {
        document.getElementById('vacaciones-inicio').value = '';
        document.getElementById('vacaciones-fin').value = '';
        this.showNotification('Vacaciones eliminadas', 'success');
      });
    }
  }

  async loadAjustes() {
    try {
      const conductor = await this.dbService.getConductor();
      if (conductor) {
        document.getElementById('conductor-nombre').value = conductor.nombre || '';
        document.getElementById('conductor-apellido').value = conductor.apellido || '';
      }
    } catch (error) {
      console.error('Error loading ajustes:', error);
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 3000);
  }
}

// PWA functionality
let deferredPrompt;
let installButton;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA Install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  if (installButton) return; // Don't show multiple buttons
  
  installButton = document.createElement('button');
  installButton.textContent = '📱 Instalar App';
  installButton.className = 'btn-primary';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(79, 209, 199, 0.3);
  `;
  
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        if (window.app) {
          window.app.showNotification('App instalada correctamente! 🎉', 'success');
        }
      }
      deferredPrompt = null;
      installButton.remove();
      installButton = null;
    }
  });
  
  document.body.appendChild(installButton);
  
  // Auto-hide after 15 seconds
  setTimeout(() => {
    if (installButton && installButton.parentNode) {
      installButton.remove();
      installButton = null;
    }
  }, 15000);
}

// Handle app installed
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  if (window.app) {
    window.app.showNotification('¡App instalada correctamente! 🚀', 'success');
  }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SimpleApp();
  
  // Show install hint for mobile users
  if (window.matchMedia('(display-mode: browser)').matches && 
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches && !installButton) {
        if (window.app) {
          window.app.showNotification('💡 Añade esta app a tu pantalla de inicio para mejor experiencia', 'info');
        }
      }
    }, 5000);
  }
});