/**
 * Navigation Component
 * Manages the main navigation bar with 4 main sections and SPA routing
 */
export class Navigation {
  constructor() {
    this.currentView = 'dashboard';
    this.navigationElement = null;
    this.init();
  }

  init() {
    this.createNavigationStructure();
    this.setupEventListeners();
    this.updateActiveView(this.currentView);
  }

  createNavigationStructure() {
    // Find existing navigation or create new one
    this.navigationElement = document.querySelector('.navigation');
    
    if (!this.navigationElement) {
      this.navigationElement = document.createElement('nav');
      this.navigationElement.className = 'navigation';
      
      // Insert navigation at the beginning of the app
      const app = document.getElementById('app');
      app.insertBefore(this.navigationElement, app.firstChild);
    }

    // Define the 4 main navigation sections as per requirements
    const navigationItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'registro', label: 'Registro Diario', icon: '📝' },
      { id: 'informes', label: 'Informes', icon: '📈' },
      { id: 'ajustes', label: 'Ajustes', icon: '⚙️' }
    ];

    // Clear existing content and rebuild
    this.navigationElement.innerHTML = '';

    // Create navigation buttons
    navigationItems.forEach(item => {
      const button = document.createElement('button');
      button.className = 'nav-btn';
      button.dataset.view = item.id;
      button.innerHTML = `${item.icon} ${item.label}`;
      
      this.navigationElement.appendChild(button);
    });
  }

  setupEventListeners() {
    // Add click listeners to navigation buttons
    this.navigationElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-btn')) {
        const view = e.target.dataset.view;
        this.navigateTo(view);
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const view = e.state?.view || 'dashboard';
      this.navigateTo(view, false);
    });

    // Set initial state
    if (!window.history.state) {
      window.history.replaceState({ view: this.currentView }, '', `#${this.currentView}`);
    }
  }

  navigateTo(view, pushState = true) {
    // Validate view exists
    const validViews = ['dashboard', 'registro', 'informes', 'ajustes'];
    if (!validViews.includes(view)) {
      console.warn(`Invalid view: ${view}`);
      return;
    }

    // Update browser history
    if (pushState) {
      window.history.pushState({ view }, '', `#${view}`);
    }

    // Update current view
    this.currentView = view;

    // Update navigation UI
    this.updateActiveView(view);

    // Update main content views
    this.updateContentView(view);

    // Trigger custom navigation event for other components
    window.dispatchEvent(new CustomEvent('navigation', {
      detail: { view, previousView: this.currentView }
    }));
  }

  updateActiveView(view) {
    // Remove active class from all navigation buttons
    const navButtons = this.navigationElement.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));

    // Add active class to current view button
    const activeButton = this.navigationElement.querySelector(`[data-view="${view}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  updateContentView(view) {
    // Hide all views
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(v => v.classList.remove('active'));

    // Show current view
    const currentViewElement = document.getElementById(`${view}-view`);
    if (currentViewElement) {
      currentViewElement.classList.add('active');
    } else {
      console.warn(`View element not found: ${view}-view`);
    }
  }

  getCurrentView() {
    return this.currentView;
  }

  // Method to programmatically navigate (for use by other components)
  setView(view) {
    this.navigateTo(view);
  }
}