/**
 * HistoryService
 * Gestiona el historial de cambios de los registros diarios
 */
export class HistoryService {
  constructor(dbService) {
    this.dbService = dbService;
  }

  /**
   * Crea una entrada en el historial antes de modificar un registro
   * @param {number} registroId - ID del registro
   * @param {Object} originalData - Datos originales antes del cambio
   * @param {Object} newData - Nuevos datos después del cambio
   * @param {Array} changedFields - Lista de campos modificados
   * @returns {Promise<number>} - ID de la entrada creada
   */
  async createHistoryEntry(registroId, originalData, newData, changedFields) {
    try {
      const entry = {
        registroId: registroId,
        timestamp: new Date(),
        changedFields: changedFields,
        previousValues: this.extractChangedValues(originalData, changedFields),
        newValues: this.extractChangedValues(newData, changedFields),
        previousGananciaNeta: originalData.gananciaNeta || 0,
        newGananciaNeta: newData.gananciaNeta || 0,
      };

      const id = await this.dbService.db.historial_cambios.add(entry);
      console.log(`History entry created: ${id} for registro ${registroId}`);
      return id;
    } catch (error) {
      console.error('Error creating history entry:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial completo de un registro
   * @param {number} registroId - ID del registro
   * @returns {Promise<Array>} - Lista de entradas del historial ordenadas por fecha
   */
  async getHistory(registroId) {
    try {
      const history = await this.dbService.db.historial_cambios
        .where('registroId')
        .equals(registroId)
        .reverse()
        .sortBy('timestamp');

      return history;
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  }

  /**
   * Obtiene el número de ediciones de un registro
   * @param {number} registroId - ID del registro
   * @returns {Promise<number>} - Cantidad de ediciones
   */
  async getEditCount(registroId) {
    try {
      const count = await this.dbService.db.historial_cambios
        .where('registroId')
        .equals(registroId)
        .count();

      return count;
    } catch (error) {
      console.error('Error getting edit count:', error);
      return 0;
    }
  }

  /**
   * Restaura un registro a una versión anterior
   * @param {number} registroId - ID del registro
   * @param {number} historyEntryId - ID de la entrada del historial
   * @returns {Promise<Object>} - Registro restaurado
   */
  async restoreVersion(registroId, historyEntryId) {
    try {
      // Get the history entry
      const historyEntry =
        await this.dbService.db.historial_cambios.get(historyEntryId);
      if (!historyEntry) {
        throw new Error('Entrada de historial no encontrada');
      }

      // Verify it belongs to the correct registro
      if (historyEntry.registroId !== registroId) {
        throw new Error('La entrada de historial no pertenece a este registro');
      }

      // Get current registro
      const currentRegistro = await this.dbService.getRegistroById(registroId);

      // Detect which fields will change
      const changedFields = this.compareObjects(
        currentRegistro,
        historyEntry.previousValues
      );

      // Create a new history entry for the restoration
      await this.createHistoryEntry(
        registroId,
        currentRegistro,
        { ...currentRegistro, ...historyEntry.previousValues },
        changedFields
      );

      // Restore previous values
      const restoredData = {
        ...currentRegistro,
        ...historyEntry.previousValues,
      };

      // Update the registro
      const updated = await this.dbService.updateRegistro(
        registroId,
        restoredData
      );

      console.log(`Registro ${registroId} restored to version ${historyEntryId}`);
      return updated;
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de ediciones
   * @returns {Promise<Object>} - Estadísticas de ediciones
   */
  async getEditStatistics() {
    try {
      const allHistory = await this.dbService.db.historial_cambios.toArray();

      const stats = {
        totalEdits: allHistory.length,
        editedRegistros: new Set(allHistory.map((h) => h.registroId)).size,
        averageEditsPerRegistro: 0,
        mostEditedFields: {},
      };

      // Calculate average
      if (stats.editedRegistros > 0) {
        stats.averageEditsPerRegistro = (
          stats.totalEdits / stats.editedRegistros
        ).toFixed(2);
      }

      // Count most edited fields
      allHistory.forEach((entry) => {
        entry.changedFields.forEach((field) => {
          stats.mostEditedFields[field] =
            (stats.mostEditedFields[field] || 0) + 1;
        });
      });

      // Sort most edited fields
      stats.mostEditedFields = Object.entries(stats.mostEditedFields)
        .sort((a, b) => b[1] - a[1])
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});

      return stats;
    } catch (error) {
      console.error('Error getting edit statistics:', error);
      return {
        totalEdits: 0,
        editedRegistros: 0,
        averageEditsPerRegistro: 0,
        mostEditedFields: {},
      };
    }
  }

  /**
   * Extrae solo los valores de los campos modificados
   * @param {Object} data - Objeto con todos los datos
   * @param {Array} changedFields - Lista de campos modificados
   * @returns {Object} - Objeto con solo los valores de campos modificados
   */
  extractChangedValues(data, changedFields) {
    const values = {};
    changedFields.forEach((field) => {
      values[field] = this.getNestedValue(data, field);
    });
    return values;
  }

  /**
   * Obtiene valor de campo anidado (ej: "uber.app")
   * @param {Object} obj - Objeto del cual extraer el valor
   * @param {string} path - Ruta del campo (puede ser anidada con puntos)
   * @returns {*} - Valor del campo
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Establece valor de campo anidado (ej: "uber.app")
   * @param {Object} obj - Objeto en el cual establecer el valor
   * @param {string} path - Ruta del campo (puede ser anidada con puntos)
   * @param {*} value - Valor a establecer
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Compara dos objetos y retorna lista de campos modificados
   * @param {Object} original - Objeto original
   * @param {Object} modified - Objeto modificado
   * @returns {Array<string>} - Lista de campos que han cambiado
   */
  compareObjects(original, modified) {
    const changedFields = [];

    const compare = (obj1, obj2, prefix = '') => {
      // Get all keys from both objects
      const allKeys = new Set([
        ...Object.keys(obj1 || {}),
        ...Object.keys(obj2 || {}),
      ]);

      allKeys.forEach((key) => {
        // Skip internal fields
        if (
          [
            'id',
            'createdAt',
            'updatedAt',
            'editCount',
            'lastEditedAt',
            'isModified',
          ].includes(key)
        ) {
          return;
        }

        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        // Handle nested objects
        if (
          typeof val2 === 'object' &&
          val2 !== null &&
          !Array.isArray(val2) &&
          !(val2 instanceof Date)
        ) {
          compare(val1 || {}, val2, fullKey);
        } else if (val1 !== val2) {
          // Values are different
          changedFields.push(fullKey);
        }
      });
    };

    compare(original, modified);
    return changedFields;
  }

  /**
   * Formatea una entrada de historial para mostrar al usuario
   * @param {Object} entry - Entrada del historial
   * @returns {Object} - Entrada formateada
   */
  formatHistoryEntry(entry) {
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      date: new Date(entry.timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      changedFields: entry.changedFields,
      changes: entry.changedFields.map((field) => ({
        field: this.formatFieldName(field),
        previousValue: this.formatValue(entry.previousValues[field]),
        newValue: this.formatValue(entry.newValues[field]),
      })),
      gananciaDiff: entry.newGananciaNeta - entry.previousGananciaNeta,
    };
  }

  /**
   * Formatea el nombre de un campo para mostrar al usuario
   * @param {string} fieldName - Nombre del campo
   * @returns {string} - Nombre formateado
   */
  formatFieldName(fieldName) {
    const fieldNames = {
      fecha: 'Fecha',
      kmRecorridos: 'Km Recorridos',
      numeroCarreras: 'Número de Carreras',
      'uber.app': 'Uber App',
      'uber.propinas': 'Propinas Uber',
      'freeNow.app': 'FreeNow App',
      'freeNow.tarjeta': 'FreeNow Tarjeta',
      'freeNow.efectivo': 'FreeNow Efectivo',
      'freeNow.propinas': 'Propinas FreeNow',
      'taxiConvencional.tarjeta': 'Taxi Tarjeta',
      'taxiConvencional.efectivo': 'Taxi Efectivo',
      'gastos.combustible': 'Gastos Combustible',
      gananciaBruta: 'Ganancia Bruta',
      gananciaNeta: 'Ganancia Neta',
    };

    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Formatea un valor para mostrar al usuario
   * @param {*} value - Valor a formatear
   * @returns {string} - Valor formateado
   */
  formatValue(value) {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('es-ES');
    }
    return String(value);
  }

  /**
   * Elimina el historial de un registro (usar con precaución)
   * @param {number} registroId - ID del registro
   * @returns {Promise<number>} - Número de entradas eliminadas
   */
  async deleteHistory(registroId) {
    try {
      const deleted = await this.dbService.db.historial_cambios
        .where('registroId')
        .equals(registroId)
        .delete();

      console.log(`Deleted ${deleted} history entries for registro ${registroId}`);
      return deleted;
    } catch (error) {
      console.error('Error deleting history:', error);
      throw error;
    }
  }
}
