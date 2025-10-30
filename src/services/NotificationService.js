/**
 * NotificationService - Sistema de notificaciones para éxito/error/advertencia
 */
export class NotificationService {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.init();
  }

  init() {
    this.createNotificationContainer();
    this.setupStyles();
  }

  createNotificationContainer() {
    // Remove existing container if any
    const existing = document.getElementById('notification-container');
    if (existing) {
      existing.remove();
    }

    // Create new container
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }

  setupStyles() {
    // Add CSS if not already present
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
          pointer-events: none;
        }

        .notification {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transform: translateX(100%);
          transition: all 0.3s ease;
          pointer-events: auto;
          position: relative;
          max-width: 100%;
          word-wrap: break-word;
        }

        .notification.show {
          transform: translateX(0);
        }

        .notification.success {
          border-left: 4px solid #4CAF50;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), var(--card-bg));
        }

        .notification.error {
          border-left: 4px solid #f44336;
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.1), var(--card-bg));
        }

        .notification.warning {
          border-left: 4px solid #ff9800;
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), var(--card-bg));
        }

        .notification.info {
          border-left: 4px solid #2196F3;
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), var(--card-bg));
        }

        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .notification-icon {
          font-size: 18px;
          margin-right: 8px;
        }

        .notification-title {
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .notification-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .notification-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .notification-message {
          color: var(--text-secondary);
          line-height: 1.4;
          white-space: pre-line;
        }

        .notification-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .notification-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .notification-btn.primary {
          background: var(--primary-color);
          color: white;
        }

        .notification-btn.secondary {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .notification-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 0 0 8px 8px;
          transition: width linear;
        }

        @media (max-width: 480px) {
          .notification-container {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Mostrar notificación
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: success, error, warning, info
   * @param {Object} options - Opciones adicionales
   */
  show(message, type = 'info', options = {}) {
    const {
      title = this.getDefaultTitle(type),
      duration = this.getDefaultDuration(type),
      actions = [],
      persistent = false,
      id = null
    } = options;

    const notificationId = id || this.generateId();
    
    // Remove existing notification with same ID
    if (this.notifications.has(notificationId)) {
      this.remove(notificationId);
    }

    const notification = this.createNotificationElement(
      notificationId,
      message,
      type,
      title,
      actions,
      persistent
    );

    this.container.appendChild(notification);
    this.notifications.set(notificationId, notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Auto-remove if not persistent
    if (!persistent && duration > 0) {
      this.scheduleRemoval(notificationId, duration);
    }

    return notificationId;
  }

  createNotificationElement(id, message, type, title, actions, persistent) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.dataset.id = id;

    const icon = this.getIcon(type);
    
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-icon">${icon}</span>
        <span class="notification-title">${title}</span>
        <button class="notification-close" onclick="window.notificationService.remove('${id}')">&times;</button>
      </div>
      <div class="notification-message">${message}</div>
      ${actions.length > 0 ? this.createActionsHTML(actions, id) : ''}
      ${!persistent ? '<div class="notification-progress"></div>' : ''}
    `;

    return notification;
  }

  createActionsHTML(actions, notificationId) {
    const actionsHTML = actions.map(action => {
      const btnClass = action.primary ? 'primary' : 'secondary';
      return `<button class="notification-btn ${btnClass}" onclick="window.notificationService.handleAction('${notificationId}', '${action.id}')">${action.label}</button>`;
    }).join('');

    return `<div class="notification-actions">${actionsHTML}</div>`;
  }

  handleAction(notificationId, actionId) {
    const notification = this.notifications.get(notificationId);
    if (notification && notification.actions) {
      const action = notification.actions.find(a => a.id === actionId);
      if (action && action.callback) {
        action.callback();
      }
    }
    this.remove(notificationId);
  }

  scheduleRemoval(id, duration) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    const progressBar = notification.querySelector('.notification-progress');
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.style.transition = `width ${duration}ms linear`;
      
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });
    }

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.classList.remove('show');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300);
  }

  removeAll() {
    this.notifications.forEach((_, id) => {
      this.remove(id);
    });
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  getDefaultTitle(type) {
    const titles = {
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    };
    return titles[type] || titles.info;
  }

  getDefaultDuration(type) {
    const durations = {
      success: 4000,
      error: 6000,
      warning: 5000,
      info: 4000
    };
    return durations[type] || 4000;
  }

  generateId() {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  // Database error handler
  handleDatabaseError(error, operation = 'operación') {
    console.error(`Database error during ${operation}:`, error);
    
    let message = `Error en ${operation}`;
    let actions = [];

    if (error.name === 'QuotaExceededError') {
      message = 'Espacio de almacenamiento insuficiente. Considera exportar y limpiar datos antiguos.';
      actions = [
        {
          id: 'export',
          label: 'Exportar Datos',
          primary: true,
          callback: () => window.app?.components?.ajustes?.exportData?.()
        }
      ];
    } else if (error.name === 'InvalidStateError') {
      message = 'Error de conexión con la base de datos. Recarga la página.';
      actions = [
        {
          id: 'reload',
          label: 'Recargar',
          primary: true,
          callback: () => window.location.reload()
        }
      ];
    } else if (error.message) {
      message = `${message}: ${error.message}`;
    }

    return this.error(message, { actions, persistent: true });
  }

  // Validation error handler
  handleValidationError(field, message) {
    return this.warning(`${field}: ${message}`, { duration: 3000 });
  }

  // Network error handler (for future use)
  handleNetworkError(operation = 'operación') {
    return this.error(`Error de conexión durante ${operation}. Verifica tu conexión a internet.`, {
      actions: [
        {
          id: 'retry',
          label: 'Reintentar',
          primary: true,
          callback: () => window.location.reload()
        }
      ]
    });
  }
}

// Initialize global notification service
window.notificationService = new NotificationService();