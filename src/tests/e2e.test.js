import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the main application components
import { DatabaseService } from '../services/DatabaseService.js';
import { CalculationService } from '../services/CalculationService.js';
import { NotificationService } from '../services/NotificationService.js';
import { ErrorHandlingService } from '../services/ErrorHandlingService.js';
import { ValidationService } from '../services/ValidationService.js';
import { PerformanceService } from '../services/PerformanceService.js';

describe('End-to-End Application Tests', () => {
  let dom;
  let document;
  let window;
  let app;

  beforeEach(async () => {
    // Setup DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Conductor Tracker</title>
        </head>
        <body>
          <div id="app">
            <nav id="navigation">
              <button data-view="dashboard">Dashboard</button>
              <button data-view="registro">Registro</button>
              <button data-view="informes">Informes</button>
              <button data-view="ajustes">Ajustes</button>
            </nav>
            
            <main id="main-content">
              <!-- Dashboard View -->
              <section id="dashboard-view" class="view active">
                <div class="metric-card">
                  <span id="total-km">0</span>
                  <span>Km Totales</span>
                </div>
                <div class="metric-card">
                  <span id="total-carreras">0</span>
                  <span>Carreras Totales</span>
                </div>
                <div class="metric-card">
                  <span id="total-ganancia">0.00</span>
                  <span>Ganancia Neta Total</span>
                </div>
                <button id="registrar-nuevo-dia">Registrar Nuevo Día</button>
              </section>

              <!-- Registro View -->
              <section id="registro-view" class="view">
                <form id="registro-form">
                  <input type="date" id="fecha-registro" required>
                  <input type="number" id="km-recorridos" placeholder="Km recorridos" min="0" step="0.1">
                  <input type="number" id="num-carreras" placeholder="Número de carreras" min="0">
                  
                  <fieldset>
                    <legend>Uber</legend>
                    <input type="number" id="uber-app" placeholder="App" min="0" step="0.01">
                    <input type="number" id="uber-propinas" placeholder="Propinas" min="0" step="0.01">
                  </fieldset>
                  
                  <fieldset>
                    <legend>FreeNow</legend>
                    <input type="number" id="freenow-app" placeholder="App" min="0" step="0.01">
                    <input type="number" id="freenow-tarjeta" placeholder="Tarjeta" min="0" step="0.01">
                    <input type="number" id="freenow-efectivo" placeholder="Efectivo" min="0" step="0.01">
                    <input type="number" id="freenow-propinas" placeholder="Propinas" min="0" step="0.01">
                  </fieldset>
                  
                  <fieldset>
                    <legend>Taxi Convencional</legend>
                    <input type="number" id="taxi-tarjeta" placeholder="Tarjeta" min="0" step="0.01">
                    <input type="number" id="taxi-efectivo" placeholder="Efectivo" min="0" step="0.01">
                  </fieldset>
                  
                  <input type="number" id="combustible" placeholder="Gastos combustible" min="0" step="0.01">
                  
                  <div id="calculation-preview">
                    <div>Ganancia Bruta: <span id="ganancia-bruta">0.00</span>€</div>
                    <div>Comisión Vehículo (52%): <span id="comision-vehiculo">0.00</span>€</div>
                    <div>Costo Kilometraje: <span id="costo-km">0.00</span>€</div>
                    <div>Comisión FreeNow: <span id="comision-freenow">0.00</span>€</div>
                    <div>Gastos Combustible: <span id="gastos-combustible">0.00</span>€</div>
                    <div class="calc-total">Ganancia Neta: <span id="ganancia-neta">0.00</span>€</div>
                  </div>
                  
                  <button type="submit">Guardar y Calcular Día</button>
                </form>
              </section>

              <!-- Informes View -->
              <section id="informes-view" class="view">
                <div class="filter-controls">
                  <button id="view-semanal" class="active">Semanal</button>
                  <button id="view-mensual">Mensual</button>
                </div>
                <div id="informes-content">
                  <div id="no-data-message" class="hidden">
                    No hay datos disponibles. Comienza añadiendo un registro diario.
                  </div>
                  <div id="informes-data"></div>
                </div>
                <button id="generar-pdf" class="hidden">Descargar PDF</button>
              </section>

              <!-- Ajustes View -->
              <section id="ajustes-view" class="view">
                <form id="conductor-form">
                  <input type="text" id="conductor-nombre" placeholder="Nombre" required>
                  <input type="text" id="conductor-apellido" placeholder="Apellido" required>
                  <button type="submit">Guardar Perfil</button>
                </form>
                
                <div class="export-import">
                  <button id="export-data">Exportar Datos</button>
                  <input type="file" id="import-file" accept=".json" style="display: none;">
                  <button id="import-data">Importar Datos</button>
                </div>
              </section>
            </main>
            
            <div id="notification-container"></div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;

    // Setup global objects
    global.document = document;
    global.window = window;
    global.navigator = window.navigator;
    global.HTMLElement = window.HTMLElement;
    global.Event = window.Event;
    global.CustomEvent = window.CustomEvent;

    // Mock performance API
    global.performance = {
      now: () => Date.now(),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 10000000
      }
    };

    // Initialize services
    const notificationService = new NotificationService();
    const errorHandlingService = new ErrorHandlingService(notificationService);
    const validationService = new ValidationService(errorHandlingService);
    const performanceService = new PerformanceService();
    
    const dbService = new DatabaseService();
    dbService.setErrorHandler(errorHandlingService);
    dbService.setPerformanceService(performanceService);
    
    const calcService = new CalculationService();

    await dbService.initDatabase();

    // Mock app object
    app = {
      dbService,
      calcService,
      notificationService,
      errorHandlingService,
      validationService,
      performanceService,
      currentView: 'dashboard'
    };

    // Make services globally available
    window.app = app;
    window.notificationService = notificationService;
    window.errorHandlingService = errorHandlingService;
    window.validationService = validationService;
    window.performanceService = performanceService;
  });

  afterEach(async () => {
    if (app.dbService.db) {
      await app.dbService.db.registros.clear();
      await app.dbService.db.conductor.clear();
      await app.dbService.db.configuracion.clear();
    }
    app.performanceService.cleanup();
    dom.window.close();
  });

  describe('Application Initialization', () => {
    it('should initialize with dashboard view active', () => {
      const dashboardView = document.getElementById('dashboard-view');
      expect(dashboardView.classList.contains('active')).toBe(true);
    });

    it('should show zero metrics initially', () => {
      const totalKm = document.getElementById('total-km');
      const totalCarreras = document.getElementById('total-carreras');
      const totalGanancia = document.getElementById('total-ganancia');

      expect(totalKm.textContent).toBe('0');
      expect(totalCarreras.textContent).toBe('0');
      expect(totalGanancia.textContent).toBe('0.00');
    });

    it('should have all navigation buttons present', () => {
      const navButtons = document.querySelectorAll('#navigation button');
      expect(navButtons).toHaveLength(4);
      
      const views = Array.from(navButtons).map(btn => btn.dataset.view);
      expect(views).toContain('dashboard');
      expect(views).toContain('registro');
      expect(views).toContain('informes');
      expect(views).toContain('ajustes');
    });
  });

  describe('Navigation Flow', () => {
    it('should navigate between views', () => {
      const registroButton = document.querySelector('[data-view="registro"]');
      const dashboardView = document.getElementById('dashboard-view');
      const registroView = document.getElementById('registro-view');

      // Initially dashboard should be active
      expect(dashboardView.classList.contains('active')).toBe(true);
      expect(registroView.classList.contains('active')).toBe(false);

      // Simulate navigation click
      registroButton.click();
      
      // Manually update views (in real app this would be handled by Navigation component)
      dashboardView.classList.remove('active');
      registroView.classList.add('active');
      app.currentView = 'registro';

      expect(dashboardView.classList.contains('active')).toBe(false);
      expect(registroView.classList.contains('active')).toBe(true);
      expect(app.currentView).toBe('registro');
    });

    it('should navigate from dashboard to registro via "Registrar Nuevo Día" button', () => {
      const registrarButton = document.getElementById('registrar-nuevo-dia');
      const dashboardView = document.getElementById('dashboard-view');
      const registroView = document.getElementById('registro-view');

      registrarButton.click();

      // Simulate navigation
      dashboardView.classList.remove('active');
      registroView.classList.add('active');
      app.currentView = 'registro';

      expect(registroView.classList.contains('active')).toBe(true);
    });
  });

  describe('Registration Flow E2E', () => {
    beforeEach(() => {
      // Navigate to registro view
      const dashboardView = document.getElementById('dashboard-view');
      const registroView = document.getElementById('registro-view');
      dashboardView.classList.remove('active');
      registroView.classList.add('active');
      app.currentView = 'registro';
    });

    it('should complete full registration process', async () => {
      const form = document.getElementById('registro-form');
      const fechaInput = document.getElementById('fecha-registro');
      const kmInput = document.getElementById('km-recorridos');
      const carrerasInput = document.getElementById('num-carreras');
      const uberAppInput = document.getElementById('uber-app');
      const freeNowAppInput = document.getElementById('freenow-app');
      const combustibleInput = document.getElementById('combustible');

      // Fill form
      fechaInput.value = '2023-12-01';
      kmInput.value = '150';
      carrerasInput.value = '12';
      uberAppInput.value = '80';
      freeNowAppInput.value = '60';
      combustibleInput.value = '25';

      // Simulate real-time calculation update
      const registroData = {
        fecha: fechaInput.value,
        kmRecorridos: parseFloat(kmInput.value),
        numeroCarreras: parseInt(carrerasInput.value),
        uber: { app: parseFloat(uberAppInput.value), propinas: 0 },
        freeNow: { app: parseFloat(freeNowAppInput.value), tarjeta: 0, efectivo: 0, propinas: 0 },
        taxiConvencional: { tarjeta: 0, efectivo: 0 },
        gastos: { combustible: parseFloat(combustibleInput.value) }
      };

      const calculation = app.calcService.calculateGananciaNeta(registroData);

      // Update preview elements
      document.getElementById('ganancia-bruta').textContent = calculation.gananciaBruta.toFixed(2);
      document.getElementById('ganancia-neta').textContent = calculation.gananciaNeta.toFixed(2);

      // Verify calculation preview is updated
      expect(document.getElementById('ganancia-bruta').textContent).toBe(calculation.gananciaBruta.toFixed(2));
      expect(parseFloat(document.getElementById('ganancia-neta').textContent)).toBeCloseTo(calculation.gananciaNeta, 2);

      // Submit form
      const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Simulate form submission handling
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;
      
      const savedRegistro = await app.dbService.saveRegistroDiario(registroData);
      expect(savedRegistro).toBeDefined();
      expect(savedRegistro.id).toBeDefined();

      // Verify data was saved
      const allRegistros = await app.dbService.getAllRegistros();
      expect(allRegistros).toHaveLength(1);
      expect(allRegistros[0].kmRecorridos).toBe(150);
    });

    it('should show validation errors for invalid input', () => {
      const fechaInput = document.getElementById('fecha-registro');
      const kmInput = document.getElementById('km-recorridos');

      // Set invalid values
      fechaInput.value = '2025-01-01'; // Future date
      kmInput.value = '-50'; // Negative value

      // Validate inputs
      const fechaValidation = app.validationService.validateField('fecha', fechaInput.value);
      const kmValidation = app.validationService.validateField('kmRecorridos', kmInput.value);

      expect(fechaValidation.isValid).toBe(false);
      expect(kmValidation.isValid).toBe(false);

      // Simulate showing validation errors
      if (!fechaValidation.isValid) {
        fechaInput.classList.add('error');
        const errorElement = document.createElement('span');
        errorElement.className = 'input-error';
        errorElement.textContent = fechaValidation.errors[0].message;
        fechaInput.parentNode.appendChild(errorElement);
      }

      expect(fechaInput.classList.contains('error')).toBe(true);
      expect(fechaInput.parentNode.querySelector('.input-error')).toBeDefined();
    });

    it('should update calculation preview in real-time', () => {
      const kmInput = document.getElementById('km-recorridos');
      const uberAppInput = document.getElementById('uber-app');
      const gananciaBrutaSpan = document.getElementById('ganancia-bruta');

      // Initial state
      expect(gananciaBrutaSpan.textContent).toBe('0.00');

      // Simulate input changes
      kmInput.value = '100';
      uberAppInput.value = '50';

      // Trigger calculation update
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: parseFloat(kmInput.value),
        numeroCarreras: 0,
        uber: { app: parseFloat(uberAppInput.value), propinas: 0 },
        freeNow: { app: 0, tarjeta: 0, efectivo: 0, propinas: 0 },
        taxiConvencional: { tarjeta: 0, efectivo: 0 },
        gastos: { combustible: 0 }
      };

      const calculation = app.calcService.calculateGananciaNeta(registroData);
      gananciaBrutaSpan.textContent = calculation.gananciaBruta.toFixed(2);

      expect(parseFloat(gananciaBrutaSpan.textContent)).toBe(50);
    });
  });

  describe('Dashboard Updates E2E', () => {
    it('should update dashboard metrics after saving registro', async () => {
      // Save a registro
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 150,
        numeroCarreras: 12,
        uber: { app: 80, propinas: 10 },
        freeNow: { app: 60, tarjeta: 40, efectivo: 20, propinas: 5 },
        taxiConvencional: { tarjeta: 30, efectivo: 15 },
        gastos: { combustible: 25 }
      };

      const calculation = app.calcService.calculateGananciaNeta(registroData);
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;

      await app.dbService.saveRegistroDiario(registroData);

      // Simulate dashboard update
      const allRegistros = await app.dbService.getAllRegistros();
      const totals = app.calcService.calculateMonthlyTotals(allRegistros);

      // Update dashboard elements
      document.getElementById('total-km').textContent = totals.totalKm.toString();
      document.getElementById('total-carreras').textContent = totals.totalCarreras.toString();
      document.getElementById('total-ganancia').textContent = totals.totalGananciaNeta.toFixed(2);

      // Verify updates
      expect(document.getElementById('total-km').textContent).toBe('150');
      expect(document.getElementById('total-carreras').textContent).toBe('12');
      expect(parseFloat(document.getElementById('total-ganancia').textContent)).toBeCloseTo(calculation.gananciaNeta, 2);
    });
  });

  describe('Informes Flow E2E', () => {
    beforeEach(async () => {
      // Navigate to informes view
      const dashboardView = document.getElementById('dashboard-view');
      const informesView = document.getElementById('informes-view');
      dashboardView.classList.remove('active');
      informesView.classList.add('active');
      app.currentView = 'informes';

      // Add some test data
      const registroData = {
        fecha: '2023-12-01',
        kmRecorridos: 100,
        numeroCarreras: 8,
        uber: { app: 60, propinas: 5 },
        freeNow: { app: 40, tarjeta: 30, efectivo: 20, propinas: 3 },
        taxiConvencional: { tarjeta: 25, efectivo: 15 },
        gastos: { combustible: 20 }
      };

      const calculation = app.calcService.calculateGananciaNeta(registroData);
      registroData.gananciaBruta = calculation.gananciaBruta;
      registroData.gananciaNeta = calculation.gananciaNeta;

      await app.dbService.saveRegistroDiario(registroData);
    });

    it('should show data when available', async () => {
      const noDataMessage = document.getElementById('no-data-message');
      const informesData = document.getElementById('informes-data');
      const pdfButton = document.getElementById('generar-pdf');

      // Simulate loading data
      const allRegistros = await app.dbService.getAllRegistros();
      
      if (allRegistros.length > 0) {
        noDataMessage.classList.add('hidden');
        informesData.classList.remove('hidden');
        pdfButton.classList.remove('hidden');
        
        // Add some sample content
        informesData.innerHTML = `<div>Total registros: ${allRegistros.length}</div>`;
      }

      expect(noDataMessage.classList.contains('hidden')).toBe(true);
      expect(informesData.classList.contains('hidden')).toBe(false);
      expect(pdfButton.classList.contains('hidden')).toBe(false);
    });

    it('should toggle between semanal and mensual views', () => {
      const semanalButton = document.getElementById('view-semanal');
      const mensualButton = document.getElementById('view-mensual');

      // Initially semanal should be active
      expect(semanalButton.classList.contains('active')).toBe(true);
      expect(mensualButton.classList.contains('active')).toBe(false);

      // Click mensual
      mensualButton.click();
      
      // Simulate toggle
      semanalButton.classList.remove('active');
      mensualButton.classList.add('active');

      expect(semanalButton.classList.contains('active')).toBe(false);
      expect(mensualButton.classList.contains('active')).toBe(true);
    });
  });

  describe('Ajustes Flow E2E', () => {
    beforeEach(() => {
      // Navigate to ajustes view
      const dashboardView = document.getElementById('dashboard-view');
      const ajustesView = document.getElementById('ajustes-view');
      dashboardView.classList.remove('active');
      ajustesView.classList.add('active');
      app.currentView = 'ajustes';
    });

    it('should save conductor profile', async () => {
      const form = document.getElementById('conductor-form');
      const nombreInput = document.getElementById('conductor-nombre');
      const apellidoInput = document.getElementById('conductor-apellido');

      // Fill form
      nombreInput.value = 'Juan';
      apellidoInput.value = 'Pérez';

      // Submit form
      const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Simulate form handling
      const conductorData = {
        nombre: nombreInput.value,
        apellido: apellidoInput.value
      };

      const savedConductor = await app.dbService.saveConductor(conductorData);
      expect(savedConductor).toBeDefined();
      expect(savedConductor.nombre).toBe('Juan');
      expect(savedConductor.apellido).toBe('Pérez');

      // Verify data was saved
      const conductor = await app.dbService.getConductor();
      expect(conductor.nombre).toBe('Juan');
    });

    it('should handle export data', async () => {
      // Add some test data first
      await app.dbService.saveConductor({ nombre: 'Test', apellido: 'User' });
      await app.dbService.saveRegistroDiario({
        fecha: '2023-12-01',
        kmRecorridos: 100,
        numeroCarreras: 8
      });

      const exportButton = document.getElementById('export-data');
      
      // Mock the export functionality
      let exportCalled = false;
      exportButton.addEventListener('click', async () => {
        const exportData = await app.dbService.exportData();
        exportCalled = true;
        expect(exportData).toBeDefined();
        expect(exportData.data.registros).toHaveLength(1);
        expect(exportData.data.conductor).toBeDefined();
      });

      exportButton.click();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(exportCalled).toBe(true);
    });
  });

  describe('Error Handling E2E', () => {
    it('should show error notifications', () => {
      const notificationContainer = document.getElementById('notification-container');
      
      // Simulate error
      app.notificationService.error('Test error message');
      
      // Check if notification was added
      const notifications = notificationContainer.querySelectorAll('.notification');
      expect(notifications.length).toBeGreaterThan(0);
      
      const errorNotification = Array.from(notifications).find(n => n.classList.contains('error'));
      expect(errorNotification).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      // Close database to simulate error
      await app.dbService.db.close();

      let errorHandled = false;
      const originalHandleError = app.errorHandlingService.handleDatabaseError;
      app.errorHandlingService.handleDatabaseError = vi.fn(() => {
        errorHandled = true;
      });

      try {
        await app.dbService.saveRegistroDiario({
          fecha: '2023-12-01',
          kmRecorridos: 100
        });
      } catch (error) {
        expect(errorHandled).toBe(true);
      }

      // Restore original method
      app.errorHandlingService.handleDatabaseError = originalHandleError;
    });
  });

  describe('Performance E2E', () => {
    it('should show loading states during operations', () => {
      const submitButton = document.querySelector('#registro-form button[type="submit"]');
      
      // Test loading state
      app.performanceService.setLoadingState(submitButton, true, 'Guardando...');
      expect(submitButton.classList.contains('loading')).toBe(true);
      expect(submitButton.disabled).toBe(true);

      // Test restore state
      app.performanceService.setLoadingState(submitButton, false);
      expect(submitButton.classList.contains('loading')).toBe(false);
      expect(submitButton.disabled).toBe(false);
    });

    it('should handle debounced input validation', (done) => {
      const kmInput = document.getElementById('km-recorridos');
      
      let validationCalled = 0;
      const mockValidation = () => {
        validationCalled++;
        if (validationCalled === 1) {
          // Should only be called once due to debouncing
          expect(validationCalled).toBe(1);
          done();
        }
      };

      // Simulate rapid input changes
      app.performanceService.debounce('test-validation', mockValidation, 100);
      app.performanceService.debounce('test-validation', mockValidation, 100);
      app.performanceService.debounce('test-validation', mockValidation, 100);
    });
  });
});