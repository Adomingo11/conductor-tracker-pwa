export class RegistroDiario {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fecha = data.fecha || new Date();
    this.kmRecorridos = data.kmRecorridos || 0;
    this.numeroCarreras = data.numeroCarreras || 0;
    this.uber = {
      app: data.uber?.app || 0,
      propinas: data.uber?.propinas || 0
    };
    this.freeNow = {
      app: data.freeNow?.app || 0,
      tarjeta: data.freeNow?.tarjeta || 0,
      efectivo: data.freeNow?.efectivo || 0,
      propinas: data.freeNow?.propinas || 0
    };
    this.taxiConvencional = {
      tarjeta: data.taxiConvencional?.tarjeta || 0,
      efectivo: data.taxiConvencional?.efectivo || 0
    };
    this.gastos = {
      combustible: data.gastos?.combustible || 0
    };
    this.gananciaBruta = data.gananciaBruta || 0;
    this.gananciaNeta = data.gananciaNeta || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.fecha || !(this.fecha instanceof Date)) {
      errors.push('Fecha es requerida y debe ser una fecha válida');
    }

    if (this.kmRecorridos < 0) {
      errors.push('Kilómetros recorridos no puede ser negativo');
    }

    if (this.numeroCarreras < 0) {
      errors.push('Número de carreras no puede ser negativo');
    }

    // Validate numeric fields
    const numericFields = [
      'kmRecorridos', 'numeroCarreras',
      'uber.app', 'uber.propinas',
      'freeNow.app', 'freeNow.tarjeta', 'freeNow.efectivo', 'freeNow.propinas',
      'taxiConvencional.tarjeta', 'taxiConvencional.efectivo',
      'gastos.combustible'
    ];

    numericFields.forEach(field => {
      const value = this.getNestedValue(field);
      if (isNaN(value) || value < 0) {
        errors.push(`${field} debe ser un número válido y no negativo`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getNestedValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this);
  }

  // Calculate total gross income (excluding tips)
  calculateGananciaBruta() {
    this.gananciaBruta = 
      this.uber.app +
      this.freeNow.app +
      this.freeNow.tarjeta +
      this.freeNow.efectivo +
      this.taxiConvencional.tarjeta +
      this.taxiConvencional.efectivo;
    
    return this.gananciaBruta;
  }

  // Get total tips
  getTotalPropinas() {
    return this.uber.propinas + this.freeNow.propinas;
  }

  // Get total income including tips
  getTotalIngresos() {
    return this.calculateGananciaBruta() + this.getTotalPropinas();
  }

  // Convert to plain object for database storage
  toJSON() {
    return {
      id: this.id,
      fecha: this.fecha,
      kmRecorridos: this.kmRecorridos,
      numeroCarreras: this.numeroCarreras,
      uber: { ...this.uber },
      freeNow: { ...this.freeNow },
      taxiConvencional: { ...this.taxiConvencional },
      gastos: { ...this.gastos },
      gananciaBruta: this.gananciaBruta,
      gananciaNeta: this.gananciaNeta,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from database object
  static fromJSON(data) {
    return new RegistroDiario(data);
  }

  // Update timestamp
  touch() {
    this.updatedAt = new Date();
  }
}