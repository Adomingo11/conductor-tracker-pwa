export class Dashboard {
  constructor(dbService, calcService) {
    this.dbService = dbService;
    this.calcService = calcService;
    this.isLoading = false;
  }

  /**
   * Inicializa el dashboard y configura event listeners
   */
  init() {
    this.setupEventListeners();
    this.setupEventBusListeners();
    this.loadData();
  }

  /**
   * Configura los event listeners del dashboard
   */
  setupEventListeners() {
    const registrarBtn = document.getElementById('registrar-nuevo-dia');
    if (registrarBtn) {
      registrarBtn.addEventListener('click', () => {
        if (window.app) {
          window.app.navigateTo('registro');
        }
      });
    }
  }

  /**
   * Configura listeners del EventBus
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

      // Escuchar evento de perfil de conductor actualizado
      window.eventBus.on('conductor-profile-updated', (data) => {
        this.handleProfileUpdate(data);
      });
    }
  }

  /**
   * Carga los datos del dashboard desde la base de datos
   */
  async loadData() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      this.showLoadingState();
      
      // Load conductor profile and registros
      const [conductor, registros] = await Promise.all([
        this.dbService.getConductor(),
        this.dbService.getAllRegistros()
      ]);
      
      const metrics = this.calcService.calculateDashboardMetrics(registros);
      
      this.updateWelcomeMessage(conductor);
      this.updateMetrics(metrics);
      this.hideLoadingState();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showError('Error al cargar los datos del dashboard');
      this.hideLoadingState();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Actualiza las métricas mostradas en el dashboard
   * @param {Object} metrics - Métricas calculadas
   */
  updateMetrics(metrics) {
    const totalKmElement = document.getElementById('total-km');
    const totalCarrerasElement = document.getElementById('total-carreras');
    const totalGananciasElement = document.getElementById('total-ganancias');

    if (totalKmElement) {
      totalKmElement.textContent = this.formatNumber(metrics.totalKm);
    }
    
    if (totalCarrerasElement) {
      totalCarrerasElement.textContent = this.formatNumber(metrics.totalCarreras);
    }
    
    if (totalGananciasElement) {
      totalGananciasElement.textContent = this.formatNumber(metrics.totalGanancias);
    }

    // Handle empty state
    if (metrics.totalKm === 0 && metrics.totalCarreras === 0 && metrics.totalGanancias === 0) {
      this.handleEmptyState();
    }

    // Add animation effect after a short delay
    setTimeout(() => {
      this.animateMetrics();
    }, 100);
  }

  /**
   * Anima las tarjetas de métricas con efecto de escala
   */
  animateMetrics() {
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
      setTimeout(() => {
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
          card.style.transform = 'scale(1)';
        }, 200);
      }, index * 100);
    });
  }

  /**
   * Muestra el estado de carga en las métricas
   */
  showLoadingState() {
    const metricValues = document.querySelectorAll('.metric-value');
    metricValues.forEach(element => {
      element.textContent = '...';
      element.classList.add('loading');
    });
  }

  /**
   * Oculta el estado de carga
   */
  hideLoadingState() {
    const metricValues = document.querySelectorAll('.metric-value');
    metricValues.forEach(element => {
      element.classList.remove('loading');
    });
  }

  /**
   * Formatea números para mostrar en las métricas
   * @param {number} value - Valor a formatear
   * @returns {string} - Valor formateado
   */
  formatNumber(value) {
    if (value === 0 || value === null || value === undefined) return '0';
    
    // Format with thousands separator for large numbers
    if (value >= 1000) {
      return new Intl.NumberFormat('es-ES').format(Math.round(value));
    }
    
    // Format with 1 decimal for smaller numbers
    return Math.round(value * 10) / 10;
  }

  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   */
  showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    // Insert error message before metrics grid
    const metricsGrid = document.querySelector('.metrics-grid');
    if (metricsGrid) {
      metricsGrid.parentNode.insertBefore(errorDiv, metricsGrid);
    }

    // Also show notification if available
    if (window.app && window.app.showNotification) {
      window.app.showNotification(message, 'error');
    }

    // Auto-remove error message after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  /**
   * Actualiza los datos del dashboard (llamado desde otros componentes)
   */
  async refresh() {
    await this.loadData();
  }

  /**
   * Actualiza el mensaje de bienvenida con el nombre del conductor
   * @param {Object} conductor - Datos del conductor
   */
  updateWelcomeMessage(conductor) {
    const welcomeTitle = document.querySelector('.welcome-section h1');
    const welcomeText = document.querySelector('.welcome-section p');
    
    if (conductor && conductor.nombre && conductor.apellido) {
      const currentHour = new Date().getHours();
      let greeting = 'Buen día';
      
      if (currentHour < 12) {
        greeting = 'Buenos días';
      } else if (currentHour < 18) {
        greeting = 'Buenas tardes';
      } else {
        greeting = 'Buenas noches';
      }
      
      if (welcomeTitle) {
        welcomeTitle.textContent = `${greeting}, ${conductor.nombre}`;
        welcomeTitle.setAttribute('data-conductor', `${conductor.nombre} ${conductor.apellido}`);
      }
      
      if (welcomeText) {
        welcomeText.textContent = 'Aquí tienes un resumen de tu actividad total como conductor.';
      }
      
      // Update any profile display elements
      this.updateProfileDisplay(conductor);
      
    } else {
      // Default messages when no profile is set
      if (welcomeTitle) {
        welcomeTitle.textContent = 'Bienvenido al Panel de Control';
        welcomeTitle.removeAttribute('data-conductor');
      }
      
      if (welcomeText) {
        welcomeText.textContent = 'Configura tu perfil en Ajustes para personalizar tu experiencia.';
      }
      
      // Clear profile display
      this.clearProfileDisplay();
    }
  }

  /**
   * Actualiza elementos de visualización del perfil en el dashboard
   * @param {Object} conductor - Datos del conductor
   */
  updateProfileDisplay(conductor) {
    // Update profile badge if it exists
    let profileBadge = document.querySelector('.profile-badge');
    
    if (!profileBadge) {
      // Create profile badge if it doesn't exist
      profileBadge = this.createProfileBadge();
    }
    
    if (profileBadge && conductor.nombre && conductor.apellido) {
      const initials = `${conductor.nombre.charAt(0)}${conductor.apellido.charAt(0)}`.toUpperCase();
      const fullName = `${conductor.nombre} ${conductor.apellido}`;
      
      profileBadge.innerHTML = `
        <div class="profile-avatar">${initials}</div>
        <div class="profile-info">
          <div class="profile-name">${fullName}</div>
          <div class="profile-role">Conductor</div>
        </div>
      `;
      
      profileBadge.style.display = 'flex';
      profileBadge.setAttribute('title', `Perfil: ${fullName}`);
    }
  }

  /**
   * Crea el badge del perfil si no existe
   * @returns {HTMLElement} Elemento del badge del perfil
   */
  createProfileBadge() {
    const welcomeSection = document.querySelector('.welcome-section');
    
    if (!welcomeSection) return null;
    
    const profileBadge = document.createElement('div');
    profileBadge.className = 'profile-badge';
    profileBadge.style.cssText = `
      display: none;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 12px 16px;
      background: rgba(79, 70, 229, 0.1);
      border: 1px solid rgba(79, 70, 229, 0.2);
      border-radius: 12px;
      transition: all 0.3s ease;
    `;
    
    // Add hover effect
    profileBadge.addEventListener('mouseenter', () => {
      profileBadge.style.background = 'rgba(79, 70, 229, 0.15)';
      profileBadge.style.transform = 'translateY(-2px)';
    });
    
    profileBadge.addEventListener('mouseleave', () => {
      profileBadge.style.background = 'rgba(79, 70, 229, 0.1)';
      profileBadge.style.transform = 'translateY(0)';
    });
    
    welcomeSection.appendChild(profileBadge);
    
    // Add CSS for profile elements
    this.addProfileStyles();
    
    return profileBadge;
  }

  /**
   * Añade estilos CSS para los elementos del perfil
   */
  addProfileStyles() {
    if (document.getElementById('profile-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'profile-styles';
    style.textContent = `
      .profile-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--accent-primary, #4F46E5);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        flex-shrink: 0;
      }
      
      .profile-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .profile-name {
        font-weight: 600;
        color: var(--text-primary, #E5E7EB);
        font-size: 14px;
      }
      
      .profile-role {
        font-size: 12px;
        color: var(--text-secondary, #9CA3AF);
      }
      
      @media (max-width: 768px) {
        .profile-badge {
          padding: 10px 12px !important;
          gap: 10px !important;
        }
        
        .profile-avatar {
          width: 36px !important;
          height: 36px !important;
          font-size: 14px !important;
        }
        
        .profile-name {
          font-size: 13px !important;
        }
        
        .profile-role {
          font-size: 11px !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Limpia la visualización del perfil
   */
  clearProfileDisplay() {
    const profileBadge = document.querySelector('.profile-badge');
    if (profileBadge) {
      profileBadge.style.display = 'none';
    }
  }

  /**
   * Maneja el estado vacío cuando no hay datos
   */
  handleEmptyState() {
    const welcomeSection = document.querySelector('.welcome-section p');
    if (welcomeSection) {
      welcomeSection.textContent = 'No tienes registros aún. ¡Comienza registrando tu primer día de trabajo!';
    }
  }

  /**
   * Maneja la actualización del perfil del conductor
   * @param {Object} data - Datos del evento de actualización del perfil
   */
  async handleProfileUpdate(data) {
    try {
      // Update welcome message immediately with the new data
      if (data.conductor) {
        this.updateWelcomeMessage(data.conductor);
      }
      
      // Add visual feedback for the profile update
      this.showProfileUpdateFeedback(data.nombre, data.apellido);
      
      // Optionally reload all data to ensure consistency
      // We can skip this if we only want to update the welcome message
      // await this.loadData();
      
    } catch (error) {
      console.error('Error handling profile update:', error);
    }
  }

  /**
   * Muestra feedback visual cuando se actualiza el perfil
   * @param {string} nombre - Nombre del conductor
   * @param {string} apellido - Apellido del conductor
   */
  showProfileUpdateFeedback(nombre, apellido) {
    const welcomeTitle = document.querySelector('.welcome-section h1');
    
    if (welcomeTitle) {
      // Add a subtle animation to highlight the change
      welcomeTitle.style.transition = 'all 0.3s ease';
      welcomeTitle.style.transform = 'scale(1.05)';
      welcomeTitle.style.color = 'var(--accent-primary)';
      
      // Reset the animation after a short delay
      setTimeout(() => {
        welcomeTitle.style.transform = 'scale(1)';
        welcomeTitle.style.color = '';
      }, 600);
      
      // Show a subtle notification in the dashboard
      this.showProfileUpdateNotification(nombre, apellido);
    }
  }

  /**
   * Muestra una notificación sutil de actualización del perfil
   * @param {string} nombre - Nombre del conductor
   * @param {string} apellido - Apellido del conductor
   */
  showProfileUpdateNotification(nombre, apellido) {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = 'profile-update-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">✅</span>
        <span class="notification-text">Perfil actualizado: ${nombre} ${apellido}</span>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-color, #10B981);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      font-size: 14px;
      font-weight: 500;
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}