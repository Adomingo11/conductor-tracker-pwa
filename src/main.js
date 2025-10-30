// Main application entry point
import { DatabaseService } from './services/DatabaseService.js';
import { CalculationService } from './services/CalculationService.js';
import { HistoryService } from './services/HistoryService.js';
import { AIService } from './services/AIService.js';
import { NotificationService } from './services/NotificationService.js';
import { ErrorHandlingService } from './services/ErrorHandlingService.js';
import { ValidationService } from './services/ValidationService.js';
import { PerformanceService } from './services/PerformanceService.js';
import eventBus from './services/EventBus.js';
import { Navigation } from './components/Navigation.js';
import { Dashboard } from './components/Dashboard.js';
import { RegistroDiario } from './components/RegistroDiario.js';
import { Historial } from './components/Historial.js';
import { Informes } from './components/Informes.js';
import { DashboardVisual } from './components/DashboardVisual.js';
import { AIAssistant } from './components/AIAssistant.js';
import { Ajustes } from './components/Ajustes.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    
    // Initialize core services
    this.notificationService = new NotificationService();
    this.errorHandlingService = new ErrorHandlingService(this.notificationService);
    this.validationService = new ValidationService(this.errorHandlingService);
    this.performanceService = new PerformanceService();
    this.dbService = new DatabaseService();
    this.calcService = new CalculationService();
    this.historyService = new HistoryService(this.dbService);
    this.aiService = new AIService();
    
    // Make services globally available
    window.notificationService = this.notificationService;
    window.errorHandlingService = this.errorHandlingService;
    window.validationService = this.validationService;
    window.performanceService = this.performanceService;
    window.eventBus = eventBus;
    
    // Set services in database service
    this.dbService.setErrorHandler(this.errorHandlingService);
    this.dbService.setPerformanceService(this.performanceService);
    
    // Initialize navigation component
    this.navigation = new Navigation();
    
    // Initialize core components immediately
    this.components = {
      dashboard: new Dashboard(this.dbService, this.calcService),
      registro: new RegistroDiario(this.dbService, this.calcService, this.validationService, this.errorHandlingService)
    };
    
    // Setup lazy loading for heavy components
    this.lazyComponents = new Map();
    this.componentFactories = {
      historial: () => new Historial(this.dbService, this.calcService, this.historyService, this.validationService, this.performanceService),
      informes: () => new Informes(this.dbService, this.calcService),
      'dashboard-visual': () => new DashboardVisual(this.dbService, this.calcService),
      aiAssistant: () => new AIAssistant(this.dbService, this.calcService, this.aiService),
      ajustes: () => new Ajustes(this.dbService, this.historyService)
    };
    
    this.init();
  }

  async init() {
    try {
      // Show loading state
      this.performanceService.setLoadingState(document.body, true);
      
      // Load error log from previous sessions
      this.errorHandlingService.loadErrorLog();
      
      // Start performance monitoring
      this.performanceService.startPerformanceMonitoring();
      
      await this.dbService.initDatabase();
      this.setupNavigationIntegration();
      this.setupComponents();
      await this.loadInitialData();
      
      // Start preloading critical components in background
      this.preloadCriticalComponents();
      
      this.notificationService.success('Aplicación cargada correctamente');
    } catch (error) {
      this.errorHandlingService.handleError(error, 'inicialización de la aplicación');
    } finally {
      // Remove loading state
      this.performanceService.setLoadingState(document.body, false);
    }
  }

  setupNavigationIntegration() {
    // Listen for navigation events from the Navigation component
    window.addEventListener('navigation', async (e) => {
      const { view } = e.detail;
      this.currentView = view;
      
      // Lazy load component if needed
      await this.ensureComponentLoaded(view);
      
      // Load component data when navigating
      if (this.components[view] && this.components[view].loadData) {
        this.components[view].loadData();
      }
    });

    // Handle "Registrar Nuevo Día" button
    const registrarBtn = document.getElementById('registrar-nuevo-dia');
    if (registrarBtn) {
      registrarBtn.addEventListener('click', () => {
        this.navigation.navigateTo('registro');
      });
    }

    // Setup AI tabs
    this.setupAITabs();
  }

  setupAITabs() {
    const aiTabButtons = document.querySelectorAll('.ai-tab-btn');
    aiTabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchAITab(tab);
      });
    });
  }

  switchAITab(tab) {
    // Update tab buttons
    document.querySelectorAll('.ai-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.ai-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`ai-${tab}-tab`).classList.add('active');
  }

  setupComponents() {
    Object.values(this.components).forEach(component => {
      if (component.init) {
        component.init();
      }
    });
  }

  async loadInitialData() {
    // Load dashboard data
    await this.components.dashboard.loadData();
    
    // Set today's date in registro form
    const fechaInput = document.getElementById('fecha-registro');
    if (fechaInput) {
      fechaInput.value = new Date().toISOString().split('T')[0];
    }
  }

  navigateTo(view) {
    // Use the Navigation component for routing
    this.navigation.navigateTo(view);
  }

  /**
   * Refresh dashboard data (called when new records are added)
   */
  async refreshDashboard() {
    if (this.components.dashboard) {
      await this.components.dashboard.refresh();
    }
  }

  showNotification(message, type = 'success') {
    // Delegate to notification service
    this.notificationService.show(message, type);
  }

  /**
   * Ensure component is loaded (lazy loading)
   * @param {string} componentName - Name of the component
   */
  async ensureComponentLoaded(componentName) {
    // If component is already loaded, return
    if (this.components[componentName]) {
      return;
    }

    // If component factory exists, lazy load it
    if (this.componentFactories[componentName]) {
      try {
        // Show loading indicator for the component
        const loadingKey = `component-${componentName}`;
        this.performanceService.setLoadingState(`#${componentName}`, true, 'Cargando...');

        // Use performance service for lazy loading
        const component = await this.performanceService.lazyLoadComponent(
          componentName,
          () => Promise.resolve(this.componentFactories[componentName]())
        );

        // Initialize the component
        if (component.init) {
          component.init();
        }

        // Store the component
        this.components[componentName] = component;

        // Hide loading indicator
        this.performanceService.setLoadingState(`#${componentName}`, false);

        console.log(`Lazy loaded component: ${componentName}`);
      } catch (error) {
        this.errorHandlingService.handleError(error, `lazy loading component ${componentName}`);
        this.performanceService.setLoadingState(`#${componentName}`, false);
      }
    }
  }

  /**
   * Preload critical components in the background
   */
  async preloadCriticalComponents() {
    const criticalComponents = ['historial', 'dashboard-visual'];
    
    // Preload with low priority
    setTimeout(async () => {
      for (const componentName of criticalComponents) {
        try {
          await this.ensureComponentLoaded(componentName);
        } catch (error) {
          console.warn(`Failed to preload component ${componentName}:`, error);
        }
      }
    }, 2000); // Delay preloading by 2 seconds
  }

  /**
   * Get component with lazy loading
   * @param {string} componentName - Name of the component
   * @returns {Promise<Object>} Component instance
   */
  async getComponent(componentName) {
    await this.ensureComponentLoaded(componentName);
    return this.components[componentName];
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});