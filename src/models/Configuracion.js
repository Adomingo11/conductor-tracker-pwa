export class Configuracion {
  constructor(data = {}) {
    this.id = data.id || null;
    this.tema = data.tema || 'dark';
    this.idioma = data.idioma || 'es';
    this.moneda = data.moneda || 'EUR';
    this.formatoFecha = data.formatoFecha || 'dd/mm/yyyy';
    this.backupAutomatico = data.backupAutomatico || false;
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation methods
  validate() {
    const errors = [];

    // Validate theme
    const validThemes = ['dark', 'light'];
    if (!validThemes.includes(this.tema)) {
      errors.push('Tema debe ser "dark" o "light"');
    }

    // Validate language
    const validLanguages = ['es', 'en', 'fr', 'de'];
    if (!validLanguages.includes(this.idioma)) {
      errors.push('Idioma debe ser uno de: es, en, fr, de');
    }

    // Validate currency
    const validCurrencies = ['EUR', 'USD', 'GBP', 'JPY'];
    if (!validCurrencies.includes(this.moneda)) {
      errors.push('Moneda debe ser una de: EUR, USD, GBP, JPY');
    }

    // Validate date format
    const validDateFormats = ['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd'];
    if (!validDateFormats.includes(this.formatoFecha)) {
      errors.push('Formato de fecha debe ser uno de: dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd');
    }

    // Validate backup setting
    if (typeof this.backupAutomatico !== 'boolean') {
      errors.push('Backup automático debe ser verdadero o falso');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get available themes
  static getAvailableThemes() {
    return [
      { value: 'dark', label: 'Oscuro' },
      { value: 'light', label: 'Claro' }
    ];
  }

  // Get available languages
  static getAvailableLanguages() {
    return [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' },
      { value: 'fr', label: 'Français' },
      { value: 'de', label: 'Deutsch' }
    ];
  }

  // Get available currencies
  static getAvailableCurrencies() {
    return [
      { value: 'EUR', label: 'Euro (€)', symbol: '€' },
      { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
      { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
      { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' }
    ];
  }

  // Get available date formats
  static getAvailableDateFormats() {
    return [
      { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY (31/12/2023)' },
      { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY (12/31/2023)' },
      { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD (2023-12-31)' }
    ];
  }

  // Get currency symbol
  getCurrencySymbol() {
    const currencies = Configuracion.getAvailableCurrencies();
    const currency = currencies.find(c => c.value === this.moneda);
    return currency ? currency.symbol : '€';
  }

  // Format date according to configured format
  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (this.formatoFecha) {
      case 'dd/mm/yyyy':
        return `${day}/${month}/${year}`;
      case 'mm/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy-mm-dd':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }

  // Format currency amount
  formatCurrency(amount) {
    const symbol = this.getCurrencySymbol();
    const formattedAmount = Number(amount).toFixed(2);
    
    switch (this.moneda) {
      case 'USD':
      case 'GBP':
        return `${symbol}${formattedAmount}`;
      case 'JPY':
        return `${symbol}${Math.round(amount)}`;
      case 'EUR':
      default:
        return `${formattedAmount}${symbol}`;
    }
  }

  // Apply theme to document
  applyTheme() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.tema);
    }
  }

  // Set theme
  setTheme(theme) {
    const validThemes = ['dark', 'light'];
    if (!validThemes.includes(theme)) {
      throw new Error('Tema inválido');
    }
    
    this.tema = theme;
    this.touch();
    this.applyTheme();
  }

  // Set language
  setIdioma(idioma) {
    const validLanguages = ['es', 'en', 'fr', 'de'];
    if (!validLanguages.includes(idioma)) {
      throw new Error('Idioma inválido');
    }
    
    this.idioma = idioma;
    this.touch();
  }

  // Set currency
  setMoneda(moneda) {
    const validCurrencies = ['EUR', 'USD', 'GBP', 'JPY'];
    if (!validCurrencies.includes(moneda)) {
      throw new Error('Moneda inválida');
    }
    
    this.moneda = moneda;
    this.touch();
  }

  // Set date format
  setFormatoFecha(formato) {
    const validFormats = ['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd'];
    if (!validFormats.includes(formato)) {
      throw new Error('Formato de fecha inválido');
    }
    
    this.formatoFecha = formato;
    this.touch();
  }

  // Toggle automatic backup
  toggleBackupAutomatico() {
    this.backupAutomatico = !this.backupAutomatico;
    this.touch();
  }

  // Reset to defaults
  resetToDefaults() {
    this.tema = 'dark';
    this.idioma = 'es';
    this.moneda = 'EUR';
    this.formatoFecha = 'dd/mm/yyyy';
    this.backupAutomatico = false;
    this.touch();
  }

  // Convert to plain object for database storage
  toJSON() {
    return {
      id: this.id,
      tema: this.tema,
      idioma: this.idioma,
      moneda: this.moneda,
      formatoFecha: this.formatoFecha,
      backupAutomatico: this.backupAutomatico,
      updatedAt: this.updatedAt
    };
  }

  // Create from database object
  static fromJSON(data) {
    return new Configuracion(data);
  }

  // Update timestamp
  touch() {
    this.updatedAt = new Date();
  }
}