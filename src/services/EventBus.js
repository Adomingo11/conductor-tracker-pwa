/**
 * EventBus
 * Sistema de comunicación entre componentes mediante eventos
 * Permite que los componentes se comuniquen sin acoplamiento directo
 */
export class EventBus {
  constructor() {
    this.events = {};
    this.eventHistory = [];
    this.maxHistorySize = 50;
  }

  /**
   * Registra un listener para un evento específico
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar cuando se emita el evento
   * @returns {Function} - Función para desregistrar el listener
   */
  on(event, callback) {
    if (!event || typeof event !== 'string') {
      console.error('EventBus.on: event name must be a non-empty string');
      return () => {};
    }

    if (typeof callback !== 'function') {
      console.error('EventBus.on: callback must be a function');
      return () => {};
    }

    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Emite un evento con datos opcionales
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a pasar a los listeners
   */
  emit(event, data) {
    if (!event || typeof event !== 'string') {
      console.error('EventBus.emit: event name must be a non-empty string');
      return;
    }

    // Add to history
    this.addToHistory(event, data);

    // Execute all callbacks for this event
    if (this.events[event]) {
      this.events[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
          // Continue executing other callbacks even if one fails
        }
      });
    }

    // Log event emission for debugging
    console.log(`[EventBus] Event emitted: ${event}`, data);
  }

  /**
   * Desregistra un listener específico de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a desregistrar
   */
  off(event, callback) {
    if (!event || typeof event !== 'string') {
      console.error('EventBus.off: event name must be a non-empty string');
      return;
    }

    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);

      // Clean up empty event arrays
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    }
  }

  /**
   * Desregistra todos los listeners de un evento
   * @param {string} event - Nombre del evento
   */
  offAll(event) {
    if (!event || typeof event !== 'string') {
      console.error('EventBus.offAll: event name must be a non-empty string');
      return;
    }

    delete this.events[event];
  }

  /**
   * Registra un listener que se ejecuta solo una vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} - Función para desregistrar el listener
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };

    return this.on(event, onceCallback);
  }

  /**
   * Obtiene el número de listeners registrados para un evento
   * @param {string} event - Nombre del evento
   * @returns {number} - Número de listeners
   */
  listenerCount(event) {
    return this.events[event]?.length || 0;
  }

  /**
   * Obtiene todos los eventos registrados
   * @returns {Array<string>} - Lista de nombres de eventos
   */
  getRegisteredEvents() {
    return Object.keys(this.events);
  }

  /**
   * Limpia todos los listeners de todos los eventos
   */
  clear() {
    this.events = {};
    console.log('[EventBus] All event listeners cleared');
  }

  /**
   * Añade un evento al historial
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos del evento
   */
  addToHistory(event, data) {
    this.eventHistory.push({
      event,
      data,
      timestamp: new Date(),
    });

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Obtiene el historial de eventos emitidos
   * @param {number} limit - Número máximo de eventos a retornar
   * @returns {Array} - Historial de eventos
   */
  getHistory(limit = 10) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Obtiene estadísticas del EventBus
   * @returns {Object} - Estadísticas
   */
  getStats() {
    const stats = {
      totalEvents: this.getRegisteredEvents().length,
      totalListeners: 0,
      eventDetails: {},
      historySize: this.eventHistory.length,
    };

    Object.entries(this.events).forEach(([event, listeners]) => {
      stats.totalListeners += listeners.length;
      stats.eventDetails[event] = listeners.length;
    });

    return stats;
  }

  /**
   * Habilita o deshabilita el modo debug
   * @param {boolean} enabled - Si el modo debug está habilitado
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      console.log('[EventBus] Debug mode enabled');
    }
  }
}

// Create and export global instance
const eventBus = new EventBus();

// Make it available globally for easy access
if (typeof window !== 'undefined') {
  window.eventBus = eventBus;
}

export default eventBus;
