# Documento de Diseño - Edición de Registros Existentes

## Visión General

La funcionalidad de Edición de Registros Existentes extiende la aplicación actual permitiendo modificar registros diarios previamente guardados. El diseño se enfoca en mantener la integridad de datos mediante un sistema robusto de historial de cambios, proporcionar una experiencia de usuario intuitiva con comparaciones visuales, y garantizar que todas las vistas de la aplicación se mantengan sincronizadas después de las ediciones.

## Arquitectura

### Arquitectura de Componentes
```
┌─────────────────────────────────────────────────────┐
│              Frontend Components                     │
│  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │  Historial   │  │   EditRegistroModal         │  │
│  │  Component   │  │   - EditForm                │  │
│  │  + Edit Btn  │  │   - ComparisonView          │  │
│  └──────────────┘  │   - ConfirmationDialog      │  │
│                    │   - HistoryViewer           │  │
│                    └─────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│              Services Layer                          │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ DatabaseService  │  │  HistoryService         │  │
│  │ + updateRegistro │  │  + createHistoryEntry   │  │
│  │ + getRegistro    │  │  + getHistory           │  │
│  │                  │  │  + restoreVersion       │  │
│  └──────────────────┘  └─────────────────────────┘  │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │CalculationService│  │  ValidationService      │  │
│  │ (existing)       │  │  (existing)             │  │
│  └──────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│          IndexedDB Storage                           │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │  registros       │  │  historial_cambios      │  │
│  │  (existing)      │  │  (new table)            │  │
│  └──────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Flujo de Datos para Edición
```
1. Usuario hace clic en "Editar" → Historial Component
2. Cargar registro actual → DatabaseService.getRegistro()
3. Abrir modal con datos → EditRegistroModal.open()
4. Usuario modifica campos → Validación en tiempo real
5. Mostrar comparación → ComparisonView.update()
6. Usuario guarda → ConfirmationDialog.show()
7. Confirmar cambios → HistoryService.createHistoryEntry()
8. Actualizar registro → DatabaseService.updateRegistro()
9. Refrescar vistas → EventBus.emit('registro-updated')
10. Cerrar modal → Mostrar notificación de éxito
```

## Componentes y Interfaces

### 1. Nuevos Componentes

#### EditRegistroModal Component
**Responsabilidad**: Gestionar el flujo completo de edición de un registro

**Estructura**:
```javascript
class EditRegistroModal {
  constructor(dbService, calcService, validationService, historyService)
  
  // Métodos principales
  open(registroId)                    // Abre el modal con datos del registro
  close()                             // Cierra el modal
  loadRegistro(registroId)            // Carga datos del registro a editar
  handleFieldChange(field, value)     // Maneja cambios en campos
  updateComparison()                  // Actualiza vista de comparación
  validateForm()                      // Valida el formulario completo
  showConfirmation()                  // Muestra diálogo de confirmación
  saveChanges()                       // Guarda los cambios confirmados
  cancel()                            // Cancela la edición
  
  // Estado interno
  originalData                        // Datos originales del registro
  currentData                         // Datos actuales en el formulario
  changedFields                       // Campos que han sido modificados
  isValid                            // Estado de validación
}
```

**Interfaz HTML**:
```html
<div id="edit-registro-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Editar Registro - <span id="edit-fecha"></span></h2>
      <button class="close-btn">&times;</button>
    </div>
    
    <div class="modal-body">
      <!-- Formulario de edición (similar a RegistroDiario) -->
      <form id="edit-registro-form">
        <!-- Campos del formulario -->
      </form>
      
      <!-- Vista de comparación -->
      <div id="comparison-view" class="comparison-section">
        <h3>Cambios Realizados</h3>
        <div id="comparison-list"></div>
      </div>
    </div>
    
    <div class="modal-footer">
      <button id="cancel-edit-btn" class="btn-secondary">Cancelar</button>
      <button id="save-changes-btn" class="btn-primary">Guardar Cambios</button>
    </div>
  </div>
</div>
```

#### ComparisonView Component
**Responsabilidad**: Mostrar comparación visual de valores originales vs modificados

**Estructura**:
```javascript
class ComparisonView {
  constructor(container)
  
  update(originalData, currentData)   // Actualiza la comparación
  highlightChanges(changedFields)     // Resalta campos modificados
  calculateDifferences()              // Calcula diferencias numéricas
  render()                            // Renderiza la vista
  clear()                             // Limpia la vista
}
```

**Formato de Visualización**:
```
Campo: Km Recorridos
Antes: 150 km  →  Después: 175 km  [+25 km] ✓

Campo: Uber App
Antes: 85.50€  →  Después: 92.00€  [+6.50€] ✓

Campo: Ganancia Neta
Antes: 45.30€  →  Después: 52.15€  [+6.85€] ✓
```

#### HistoryViewer Component
**Responsabilidad**: Mostrar historial completo de cambios de un registro

**Estructura**:
```javascript
class HistoryViewer {
  constructor(historyService)
  
  open(registroId)                    // Abre el visor de historial
  loadHistory(registroId)             // Carga historial del registro
  renderHistoryEntries(entries)       // Renderiza entradas del historial
  showRestoreConfirmation(entry)      // Muestra confirmación de restauración
  restoreVersion(entryId)             // Restaura una versión anterior
  close()                             // Cierra el visor
}
```

**Interfaz HTML**:
```html
<div id="history-viewer-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Historial de Cambios</h2>
      <button class="close-btn">&times;</button>
    </div>
    
    <div class="modal-body">
      <div id="history-timeline">
        <!-- Entradas del historial -->
      </div>
    </div>
    
    <div class="modal-footer">
      <button id="close-history-btn" class="btn-secondary">Cerrar</button>
    </div>
  </div>
</div>
```

### 2. Modificaciones a Componentes Existentes

#### Historial Component (Modificado)
**Nuevas funcionalidades**:
- Añadir botón "Editar" a cada fila del historial
- Mostrar indicador de "modificado" en registros editados
- Integrar con EditRegistroModal
- Actualizar vista después de ediciones

**Código a añadir**:
```javascript
// En el método renderRegistros()
renderEditButton(registro) {
  return `
    <button class="btn-edit" data-id="${registro.id}" title="Editar registro">
      <i class="icon-edit">✏️</i>
    </button>
  `;
}

renderModifiedIndicator(registro) {
  if (registro.historialCambios && registro.historialCambios.length > 0) {
    return `
      <span class="modified-indicator" 
            data-id="${registro.id}" 
            title="Editado ${registro.historialCambios.length} veces">
        <i class="icon-history">🕐</i>
        <span class="edit-count">${registro.historialCambios.length}</span>
      </span>
    `;
  }
  return '';
}
```

#### DatabaseService (Modificado)
**Nuevos métodos**:
```javascript
// Actualizar registro existente
async updateRegistro(id, data) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    await this.db.registros.update(id, updateData);
    
    // Clear caches
    if (this.performanceService) {
      this.performanceService.clearCache('all-registros');
      this.clearDateRangeCaches(data.fecha);
    }
    
    return await this.db.registros.get(id);
  } catch (error) {
    console.error('Error updating registro:', error);
    throw error;
  }
}

// Obtener un registro específico por ID
async getRegistroById(id) {
  try {
    return await this.db.registros.get(id);
  } catch (error) {
    console.error('Error getting registro by id:', error);
    throw error;
  }
}
```

### 3. Nuevo Servicio: HistoryService

**Responsabilidad**: Gestionar el historial de cambios de los registros

**Estructura completa**:
```javascript
class HistoryService {
  constructor(dbService) {
    this.dbService = dbService;
  }
  
  /**
   * Crea una entrada en el historial antes de modificar un registro
   * @param {number} registroId - ID del registro
   * @param {Object} originalData - Datos originales antes del cambio
   * @param {Object} newData - Nuevos datos después del cambio
   * @param {Array} changedFields - Lista de campos modificados
   */
  async createHistoryEntry(registroId, originalData, newData, changedFields) {
    const entry = {
      registroId: registroId,
      timestamp: new Date(),
      changedFields: changedFields,
      previousValues: this.extractChangedValues(originalData, changedFields),
      newValues: this.extractChangedValues(newData, changedFields),
      previousGananciaNeta: originalData.gananciaNeta,
      newGananciaNeta: newData.gananciaNeta
    };
    
    return await this.dbService.db.historial_cambios.add(entry);
  }
  
  /**
   * Obtiene el historial completo de un registro
   * @param {number} registroId - ID del registro
   * @returns {Array} - Lista de entradas del historial
   */
  async getHistory(registroId) {
    return await this.dbService.db.historial_cambios
      .where('registroId')
      .equals(registroId)
      .reverse()
      .sortBy('timestamp');
  }
  
  /**
   * Obtiene el número de ediciones de un registro
   * @param {number} registroId - ID del registro
   * @returns {number} - Cantidad de ediciones
   */
  async getEditCount(registroId) {
    return await this.dbService.db.historial_cambios
      .where('registroId')
      .equals(registroId)
      .count();
  }
  
  /**
   * Restaura un registro a una versión anterior
   * @param {number} registroId - ID del registro
   * @param {number} historyEntryId - ID de la entrada del historial
   */
  async restoreVersion(registroId, historyEntryId) {
    const historyEntry = await this.dbService.db.historial_cambios.get(historyEntryId);
    if (!historyEntry) {
      throw new Error('Entrada de historial no encontrada');
    }
    
    const currentRegistro = await this.dbService.getRegistroById(registroId);
    
    // Crear entrada de historial para la restauración
    await this.createHistoryEntry(
      registroId,
      currentRegistro,
      { ...currentRegistro, ...historyEntry.previousValues },
      historyEntry.changedFields
    );
    
    // Restaurar valores anteriores
    const restoredData = {
      ...currentRegistro,
      ...historyEntry.previousValues
    };
    
    return await this.dbService.updateRegistro(registroId, restoredData);
  }
  
  /**
   * Obtiene estadísticas de ediciones
   */
  async getEditStatistics() {
    const allHistory = await this.dbService.db.historial_cambios.toArray();
    
    const stats = {
      totalEdits: allHistory.length,
      editedRegistros: new Set(allHistory.map(h => h.registroId)).size,
      averageEditsPerRegistro: 0,
      mostEditedFields: {}
    };
    
    // Calcular promedio
    if (stats.editedRegistros > 0) {
      stats.averageEditsPerRegistro = stats.totalEdits / stats.editedRegistros;
    }
    
    // Contar campos más editados
    allHistory.forEach(entry => {
      entry.changedFields.forEach(field => {
        stats.mostEditedFields[field] = (stats.mostEditedFields[field] || 0) + 1;
      });
    });
    
    return stats;
  }
  
  /**
   * Extrae solo los valores de los campos modificados
   */
  extractChangedValues(data, changedFields) {
    const values = {};
    changedFields.forEach(field => {
      values[field] = this.getNestedValue(data, field);
    });
    return values;
  }
  
  /**
   * Obtiene valor de campo anidado (ej: "uber.app")
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Compara dos objetos y retorna lista de campos modificados
   */
  compareObjects(original, modified) {
    const changedFields = [];
    
    const compare = (obj1, obj2, prefix = '') => {
      Object.keys(obj2).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
          compare(obj1[key] || {}, obj2[key], fullKey);
        } else if (obj1[key] !== obj2[key]) {
          changedFields.push(fullKey);
        }
      });
    };
    
    compare(original, modified);
    return changedFields;
  }
}
```

## Modelos de Datos

### Extensión del Modelo RegistroDiario
```javascript
// Añadir al modelo existente
{
  // ... campos existentes ...
  editCount: number,              // Número de veces que ha sido editado
  lastEditedAt: Date,            // Fecha de la última edición
  isModified: boolean            // Flag indicando si ha sido modificado
}
```

### Nuevo Modelo: HistorialCambios
```javascript
{
  id: number,                    // ID único de la entrada
  registroId: number,            // ID del registro modificado
  timestamp: Date,               // Fecha y hora de la modificación
  changedFields: Array<string>,  // Lista de campos modificados
  previousValues: Object,        // Valores anteriores de los campos
  newValues: Object,             // Nuevos valores de los campos
  previousGananciaNeta: number,  // Ganancia neta anterior
  newGananciaNeta: number        // Nueva ganancia neta
}
```

### Esquema de Base de Datos (Actualización)
```javascript
// En DatabaseService.setupSchema()
this.db.version(2).stores({
  registros: '++id, fecha, kmRecorridos, numeroCarreras, uber, freeNow, taxiConvencional, gastos, gananciaBruta, gananciaNeta, createdAt, updatedAt, editCount, lastEditedAt, isModified',
  historial_cambios: '++id, registroId, timestamp, changedFields, previousValues, newValues',
  conductor: '++id, nombre, apellido, configuracion, createdAt, updatedAt',
  configuracion: '++id, tema, idioma, moneda, formatoFecha, backupAutomatico, updatedAt'
});
```

## Flujos de Interacción

### Flujo 1: Editar un Registro
```
1. Usuario ve lista de registros en Historial
2. Usuario hace clic en botón "Editar" de un registro
3. Sistema carga datos del registro desde DB
4. Sistema abre EditRegistroModal con datos pre-cargados
5. Usuario modifica uno o más campos
6. Sistema valida campos en tiempo real
7. Sistema actualiza ComparisonView mostrando cambios
8. Usuario hace clic en "Guardar Cambios"
9. Sistema muestra ConfirmationDialog con resumen
10. Usuario confirma los cambios
11. Sistema crea entrada en historial_cambios
12. Sistema actualiza el registro en DB
13. Sistema actualiza flags (editCount, lastEditedAt, isModified)
14. Sistema emite evento 'registro-updated'
15. Todos los componentes se actualizan automáticamente
16. Sistema cierra modal y muestra notificación de éxito
```

### Flujo 2: Ver Historial de Cambios
```
1. Usuario ve indicador "modificado" en un registro
2. Usuario hace clic en el indicador
3. Sistema abre HistoryViewer modal
4. Sistema carga historial del registro desde DB
5. Sistema renderiza timeline de cambios
6. Usuario puede ver detalles de cada modificación
7. Usuario puede hacer clic en "Restaurar" en una versión
8. Sistema muestra confirmación de restauración
9. Usuario confirma restauración
10. Sistema ejecuta flujo de restauración (similar a edición)
11. Sistema cierra modal y actualiza vistas
```

### Flujo 3: Cancelar Edición
```
1. Usuario está editando un registro
2. Usuario hace cambios en el formulario
3. Usuario hace clic en "Cancelar" o fuera del modal
4. SI hay cambios sin guardar:
   - Sistema muestra diálogo de confirmación
   - Usuario confirma cancelación
5. Sistema descarta todos los cambios
6. Sistema cierra modal sin guardar
7. Sistema muestra notificación de cancelación
```

## Manejo de Errores

### Estrategias Específicas

**Error de Validación**:
- Mostrar mensajes de error en campos específicos
- Deshabilitar botón "Guardar" hasta que se corrijan
- Resaltar campos con errores en rojo

**Error de Base de Datos**:
- Mostrar notificación de error al usuario
- Mantener datos en el formulario para no perder cambios
- Ofrecer opción de reintentar
- Log detallado en consola para debugging

**Conflicto de Concurrencia** (si el registro fue modificado por otro proceso):
- Detectar cambios en updatedAt
- Mostrar advertencia al usuario
- Ofrecer opciones: sobrescribir, cancelar, o ver diferencias

**Error de Restauración**:
- Validar que la entrada de historial existe
- Verificar integridad de datos antes de restaurar
- Crear backup automático antes de restaurar
- Rollback si falla la restauración

## Estrategia de Testing

### Tests Unitarios

**HistoryService**:
- `createHistoryEntry()` - Verifica creación correcta de entradas
- `getHistory()` - Verifica recuperación ordenada del historial
- `compareObjects()` - Verifica detección correcta de cambios
- `restoreVersion()` - Verifica restauración correcta de versiones
- `getEditStatistics()` - Verifica cálculo correcto de estadísticas

**EditRegistroModal**:
- `loadRegistro()` - Verifica carga correcta de datos
- `validateForm()` - Verifica validaciones
- `updateComparison()` - Verifica actualización de comparación
- `saveChanges()` - Verifica guardado correcto con historial

### Tests de Integración

**Flujo Completo de Edición**:
1. Crear registro inicial
2. Editar registro
3. Verificar que se creó entrada en historial
4. Verificar que se actualizaron flags
5. Verificar que se actualizaron todas las vistas

**Flujo de Restauración**:
1. Crear registro
2. Editarlo múltiples veces
3. Restaurar a versión anterior
4. Verificar que datos son correctos
5. Verificar que se creó entrada de restauración en historial

### Tests E2E

**Escenario 1: Edición Simple**:
- Navegar a Historial
- Hacer clic en "Editar"
- Modificar un campo
- Guardar cambios
- Verificar actualización en todas las vistas

**Escenario 2: Edición con Cancelación**:
- Abrir edición
- Hacer cambios
- Cancelar
- Verificar que no se guardaron cambios

**Escenario 3: Ver y Restaurar Historial**:
- Editar registro varias veces
- Abrir historial
- Restaurar versión anterior
- Verificar restauración correcta

## Consideraciones de Performance

### Optimizaciones

**Carga Lazy del Historial**:
- No cargar historial hasta que usuario lo solicite
- Paginar historial si tiene muchas entradas (>10)
- Cachear historial cargado durante la sesión

**Actualización Eficiente de Vistas**:
- Usar Event Bus para notificar cambios
- Solo actualizar componentes visibles
- Debouncing en comparación en tiempo real

**Indexación de Base de Datos**:
- Índice en `historial_cambios.registroId` para consultas rápidas
- Índice en `historial_cambios.timestamp` para ordenamiento
- Índice compuesto para consultas complejas

**Caché de Datos**:
- Cachear registro original durante edición
- Cachear historial cargado
- Invalidar caché solo cuando sea necesario

### Métricas Objetivo

- **Apertura de modal de edición**: < 200ms
- **Actualización de comparación**: < 100ms
- **Guardado de cambios**: < 500ms
- **Carga de historial**: < 300ms
- **Restauración de versión**: < 600ms

## Seguridad y Validación

### Validaciones

**Validación de Entrada**:
- Mismas validaciones que en registro nuevo
- Validación de que el registro existe antes de editar
- Validación de integridad de datos del historial

**Validación de Permisos**:
- Verificar que el registro pertenece al usuario actual
- Prevenir edición de registros corruptos o inválidos

**Validación de Integridad**:
- Verificar que los cálculos son correctos después de editar
- Validar que el historial está completo y ordenado
- Verificar que no hay pérdida de datos en restauraciones

## Estilos y UX

### Diseño Visual

**Modal de Edición**:
- Tamaño: 80% del viewport, máximo 900px
- Fondo semi-transparente oscuro
- Animación de apertura suave (fade + scale)
- Scroll interno si el contenido es largo

**Vista de Comparación**:
- Dos columnas: "Antes" y "Después"
- Flecha visual entre valores (→)
- Color verde para aumentos, rojo para disminuciones
- Resaltar diferencia numérica en badge

**Indicador de Modificado**:
- Icono de reloj o historial (🕐)
- Badge con número de ediciones
- Color distintivo (azul o morado)
- Tooltip con fecha de última edición

**Timeline de Historial**:
- Línea vertical conectando entradas
- Cada entrada como tarjeta expandible
- Timestamp prominente
- Botón "Restaurar" en cada entrada

### Animaciones

- Apertura/cierre de modales: 200ms ease-out
- Actualización de comparación: 150ms fade
- Resaltado de cambios: 300ms pulse
- Transición de valores: 200ms ease-in-out

## Integración con Sistema Existente

### Componentes a Actualizar

**Historial.js**:
- Añadir columna con botón "Editar"
- Añadir indicador de "modificado"
- Integrar con EditRegistroModal
- Actualizar después de ediciones

**Dashboard.js**:
- Escuchar evento 'registro-updated'
- Recalcular métricas después de ediciones

**DashboardVisual.js**:
- Escuchar evento 'registro-updated'
- Actualizar gráficos afectados

**Informes.js**:
- Escuchar evento 'registro-updated'
- Recalcular totales si el registro editado está en el período

**ExportImportService.js**:
- Incluir historial_cambios en exportaciones
- Restaurar historial en importaciones
- Validar integridad del historial

### Event Bus

**Implementación Simple**:
```javascript
class EventBus {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
  
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

// Uso global
window.eventBus = new EventBus();

// Emitir después de editar
window.eventBus.emit('registro-updated', { registroId, fecha });

// Escuchar en componentes
window.eventBus.on('registro-updated', (data) => {
  this.loadData(); // Recargar datos del componente
});
```

## Migración de Base de Datos

### Estrategia de Migración

**Versión 1 → Versión 2**:
```javascript
// En DatabaseService
this.db.version(2).stores({
  // ... esquemas actualizados ...
}).upgrade(tx => {
  // Añadir campos nuevos a registros existentes
  return tx.table('registros').toCollection().modify(registro => {
    registro.editCount = 0;
    registro.lastEditedAt = null;
    registro.isModified = false;
  });
});
```

**Compatibilidad hacia atrás**:
- Detectar versión de datos en exportaciones
- Migrar automáticamente datos antiguos al importar
- Mantener compatibilidad con exportaciones sin historial

## Documentación

### Documentación de Usuario

**Guía de Edición**:
- Cómo editar un registro
- Cómo ver el historial de cambios
- Cómo restaurar una versión anterior
- Qué significan los indicadores visuales

**FAQ**:
- ¿Puedo editar cualquier registro?
- ¿Se pierden los datos originales al editar?
- ¿Cuántas veces puedo editar un registro?
- ¿Puedo deshacer una edición?

### Documentación Técnica

**API del HistoryService**:
- Métodos disponibles
- Parámetros y tipos de retorno
- Ejemplos de uso
- Manejo de errores

**Estructura de Datos**:
- Esquema de historial_cambios
- Formato de entradas de historial
- Relaciones entre tablas
