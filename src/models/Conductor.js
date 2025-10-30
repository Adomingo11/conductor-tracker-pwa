export class Conductor {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nombre = data.nombre || '';
    this.apellido = data.apellido || '';
    this.configuracion = {
      diaLibreSemanal: data.configuracion?.diaLibreSemanal || null,
      vacaciones: {
        inicio: data.configuracion?.vacaciones?.inicio || null,
        fin: data.configuracion?.vacaciones?.fin || null
      }
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.nombre || this.nombre.trim().length === 0) {
      errors.push('Nombre es requerido');
    }

    if (this.nombre && this.nombre.trim().length < 2) {
      errors.push('Nombre debe tener al menos 2 caracteres');
    }

    if (!this.apellido || this.apellido.trim().length === 0) {
      errors.push('Apellido es requerido');
    }

    if (this.apellido && this.apellido.trim().length < 2) {
      errors.push('Apellido debe tener al menos 2 caracteres');
    }

    // Validate día libre semanal
    if (this.configuracion.diaLibreSemanal) {
      const validDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      if (!validDays.includes(this.configuracion.diaLibreSemanal.toLowerCase())) {
        errors.push('Día libre semanal debe ser un día válido de la semana');
      }
    }

    // Validate vacation dates
    if (this.configuracion.vacaciones.inicio && this.configuracion.vacaciones.fin) {
      const inicio = new Date(this.configuracion.vacaciones.inicio);
      const fin = new Date(this.configuracion.vacaciones.fin);
      
      if (inicio >= fin) {
        errors.push('La fecha de fin de vacaciones debe ser posterior a la fecha de inicio');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get full name
  getNombreCompleto() {
    return `${this.nombre} ${this.apellido}`.trim();
  }

  // Check if a date is within vacation period
  isOnVacation(date) {
    if (!this.configuracion.vacaciones.inicio || !this.configuracion.vacaciones.fin) {
      return false;
    }

    const checkDate = new Date(date);
    const inicio = new Date(this.configuracion.vacaciones.inicio);
    const fin = new Date(this.configuracion.vacaciones.fin);

    return checkDate >= inicio && checkDate <= fin;
  }

  // Check if a date is the configured free day
  isFreeDay(date) {
    if (!this.configuracion.diaLibreSemanal) {
      return false;
    }

    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayOfWeek = dayNames[new Date(date).getDay()];
    
    return dayOfWeek === this.configuracion.diaLibreSemanal.toLowerCase();
  }

  // Set vacation period
  setVacaciones(inicio, fin) {
    if (inicio && fin) {
      const inicioDate = new Date(inicio);
      const finDate = new Date(fin);
      
      if (inicioDate >= finDate) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    this.configuracion.vacaciones = {
      inicio: inicio ? new Date(inicio) : null,
      fin: fin ? new Date(fin) : null
    };
    
    this.touch();
  }

  // Clear vacation period
  clearVacaciones() {
    this.configuracion.vacaciones = {
      inicio: null,
      fin: null
    };
    this.touch();
  }

  // Set free day
  setDiaLibre(dia) {
    const validDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
    if (dia && !validDays.includes(dia.toLowerCase())) {
      throw new Error('Día libre debe ser un día válido de la semana');
    }

    this.configuracion.diaLibreSemanal = dia ? dia.toLowerCase() : null;
    this.touch();
  }

  // Clear free day
  clearDiaLibre() {
    this.configuracion.diaLibreSemanal = null;
    this.touch();
  }

  // Get configuration summary
  getConfiguracionResumen() {
    const resumen = {
      diaLibre: this.configuracion.diaLibreSemanal || 'No configurado',
      vacaciones: 'No configuradas'
    };

    if (this.configuracion.vacaciones.inicio && this.configuracion.vacaciones.fin) {
      const inicio = new Date(this.configuracion.vacaciones.inicio).toLocaleDateString('es-ES');
      const fin = new Date(this.configuracion.vacaciones.fin).toLocaleDateString('es-ES');
      resumen.vacaciones = `${inicio} - ${fin}`;
    }

    return resumen;
  }

  // Convert to plain object for database storage
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      configuracion: {
        diaLibreSemanal: this.configuracion.diaLibreSemanal,
        vacaciones: {
          inicio: this.configuracion.vacaciones.inicio,
          fin: this.configuracion.vacaciones.fin
        }
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from database object
  static fromJSON(data) {
    return new Conductor(data);
  }

  // Update timestamp
  touch() {
    this.updatedAt = new Date();
  }
}