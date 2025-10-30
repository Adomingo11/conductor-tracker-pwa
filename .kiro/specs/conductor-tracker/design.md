# Documento de Diseño - Aplicación de Seguimiento de Actividad para Conductores

## Visión General

La aplicación será una Single Page Application (SPA) desarrollada con tecnologías web modernas que funciona completamente en el navegador local. Utilizará IndexedDB para almacenamiento persistente y proporcionará una interfaz intuitiva basada en los diseños proporcionados con tema oscuro.

## Arquitectura

### Arquitectura General
```
┌─────────────────────────────────────────┐
│              Frontend (SPA)              │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │     UI      │ │    Controllers      │ │
│  │ Components  │ │   (Business Logic)  │ │
│  └─────────────┘ └─────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │           Services Layer            │ │
│  │  (Data Management & Calculations)   │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Browser Storage Layer          │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │  IndexedDB  │ │   LocalStorage      │ │
│  │ (Main Data) │ │ (Settings/Cache)    │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
```

### Stack Tecnológico
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Base de Datos**: IndexedDB con Dexie.js
- **Servidor de Desarrollo**: Node.js + Express (solo para desarrollo)
- **Generación PDF**: jsPDF
- **Gráficos**: Chart.js para visualizaciones interactivas
- **Bundling**: Vite (para desarrollo y build)
- **Estilos**: CSS moderno con variables CSS

## Componentes y Interfaces

### 1. Estructura de Directorios
```
conductor-tracker/
├── src/
│   ├── components/
│   │   ├── Dashboard.js
│   │   ├── RegistroDiario.js
│   │   ├── Informes.js
│   │   ├── Ajustes.js
│   │   ├── Navigation.js
│   │   ├── GraficosTendencias.js
│   │   └── DashboardVisual.js
│   ├── services/
│   │   ├── DatabaseService.js
│   │   ├── CalculationService.js
│   │   ├── PDFService.js
│   │   ├── StorageService.js
│   │   └── ChartService.js
│   ├── models/
│   │   ├── RegistroDiario.js
│   │   ├── Conductor.js
│   │   └── Configuracion.js
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── formatUtils.js
│   │   └── validationUtils.js
│   ├── styles/
│   │   ├── main.css
│   │   ├── components.css
│   │   └── themes.css
│   ├── index.html
│   └── main.js
├── package.json
├── vite.config.js
└── README.md
```

### 2. Componentes Principales

#### Dashboard Component
- **Responsabilidad**: Mostrar métricas totales y botón de registro
- **Estado**: Km totales, carreras totales, ganancia neta total
- **Interacciones**: Navegación a registro diario, actualización automática

#### RegistroDiario Component
- **Responsabilidad**: Formulario de entrada de datos diarios
- **Estado**: Fecha, km, carreras, ingresos por plataforma, gastos
- **Validaciones**: Campos numéricos, fechas válidas, cálculos automáticos

#### Informes Component
- **Responsabilidad**: Visualización de datos por períodos
- **Estado**: Filtros de fecha, datos agregados, vista semanal/mensual
- **Funcionalidades**: Generación de PDF, exportación de datos

#### Ajustes Component
- **Responsabilidad**: Configuración de perfil y preferencias
- **Estado**: Datos del conductor, días libres, vacaciones
- **Persistencia**: Guardado automático de configuraciones

#### DashboardVisual Component
- **Responsabilidad**: Mostrar gráficos de tendencias y métricas visuales
- **Estado**: Período seleccionado, datos agregados, configuración de gráficos
- **Interacciones**: Filtros de período, zoom, tooltips interactivos

#### GraficosTendencias Component
- **Responsabilidad**: Renderizar gráficos específicos (líneas, barras, circular)
- **Estado**: Datos del gráfico, configuración visual, estado de carga
- **Funcionalidades**: Interactividad, responsividad, animaciones

### 3. Interfaces de Servicios

#### DatabaseService
```javascript
class DatabaseService {
  async initDatabase()
  async saveRegistroDiario(registro)
  async getRegistrosByDateRange(startDate, endDate)
  async getAllRegistros()
  async updateRegistro(id, data)
  async deleteRegistro(id)
}
```

#### CalculationService
```javascript
class CalculationService {
  calculateGananciaNeta(registroDiario)
  calculateMonthlyTotals(registros)
  applyComisionVehiculo(gananciabruta)
  applyCostoKilometraje(kilometros)
  applyComisionFreeNowEfectivo(efectivo)
}
```

#### PDFService
```javascript
class PDFService {
  generateMonthlyReport(monthData, conductorInfo)
  formatReportData(data)
  downloadPDF(filename, content)
}
```

#### ChartService
```javascript
class ChartService {
  createLineChart(canvasId, data, options)
  createBarChart(canvasId, data, options)
  createPieChart(canvasId, data, options)
  updateChartData(chartInstance, newData)
  calculateTrendMetrics(data, period)
  formatChartData(registros, chartType, period)
}
```

## Modelos de Datos

### RegistroDiario Model
```javascript
{
  id: string,
  fecha: Date,
  kmRecorridos: number,
  numeroCarreras: number,
  uber: {
    app: number,
    propinas: number
  },
  freeNow: {
    app: number,
    tarjeta: number,
    efectivo: number,
    propinas: number
  },
  taxiConvencional: {
    tarjeta: number,
    efectivo: number
  },
  gastos: {
    combustible: number
  },
  gananciaBruta: number,
  ganancianeta: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Conductor Model
```javascript
{
  id: string,
  nombre: string,
  apellido: string,
  configuracion: {
    diaLibreSemanal: string,
    vacaciones: {
      inicio: Date,
      fin: Date
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Configuracion Model
```javascript
{
  id: string,
  tema: string,
  idioma: string,
  moneda: string,
  formatoFecha: string,
  backupAutomatico: boolean,
  updatedAt: Date
}
```

## Gestión de Estado

### Estado Global de la Aplicación
```javascript
const AppState = {
  currentView: 'dashboard',
  conductor: null,
  registros: [],
  configuracion: {},
  loading: false,
  error: null
}
```

### Flujo de Datos
1. **Carga inicial**: Cargar configuración y datos del conductor desde IndexedDB
2. **Navegación**: Cambio de vista actualiza el estado y renderiza componente
3. **Entrada de datos**: Validación → Cálculo → Persistencia → Actualización UI
4. **Informes**: Agregación de datos → Generación de vistas → Exportación PDF

## Manejo de Errores

### Estrategias de Error
- **Validación de entrada**: Mensajes de error en tiempo real
- **Errores de base de datos**: Fallback a LocalStorage temporal
- **Errores de cálculo**: Logs detallados y valores por defecto
- **Errores de exportación**: Notificaciones al usuario con opciones de reintento

### Logging
```javascript
const Logger = {
  error: (message, context) => console.error(`[ERROR] ${message}`, context),
  warn: (message, context) => console.warn(`[WARN] ${message}`, context),
  info: (message, context) => console.info(`[INFO] ${message}`, context)
}
```

## Estrategia de Testing

### Tipos de Testing
1. **Unit Tests**: Servicios de cálculo y utilidades
2. **Integration Tests**: Flujo completo de registro y cálculo
3. **E2E Tests**: Navegación y funcionalidades principales
4. **Performance Tests**: Carga de datos y renderizado

### Herramientas de Testing
- **Jest**: Unit e integration tests
- **Cypress**: E2E testing
- **Lighthouse**: Performance auditing

### Casos de Prueba Críticos
- Cálculo correcto de ganancia neta con todas las comisiones
- Persistencia de datos en IndexedDB
- Generación correcta de PDF mensual
- Importación/exportación de datos
- Funcionamiento offline completo

## Consideraciones de Performance

### Optimizaciones
- **Lazy loading**: Cargar componentes bajo demanda
- **Virtual scrolling**: Para listas largas de registros
- **Debouncing**: En campos de entrada numérica
- **Caching**: Resultados de cálculos complejos
- **Compression**: Datos almacenados en IndexedDB

### Métricas Objetivo
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle size**: < 500KB
- **Database operations**: < 100ms

## Seguridad y Privacidad

### Medidas de Seguridad
- **Validación de entrada**: Sanitización de todos los inputs
- **Encriptación local**: Datos sensibles en IndexedDB
- **No tracking**: Sin analytics externos
- **Datos locales**: Sin transmisión a servidores externos

### Privacidad
- Todos los datos permanecen en el dispositivo del usuario
- No se requiere registro ni autenticación
- Exportación de datos bajo control del usuario
- Cumplimiento con GDPR por diseño (datos locales)

## Deployment y Distribución

### Desarrollo Local
```bash
npm install
npm run dev  # Servidor de desarrollo en localhost:3000
```

### Build de Producción
```bash
npm run build  # Genera archivos estáticos optimizados
npm run preview  # Preview del build de producción
```

### Distribución
- **Archivos estáticos**: HTML, CSS, JS optimizados
- **Servidor simple**: Cualquier servidor HTTP estático
- **Offline-first**: Service Worker para funcionamiento sin conexión