import { describe, it, expect } from 'vitest';
import { RegistroDiario } from '../models/RegistroDiario.js';
import { Conductor } from '../models/Conductor.js';
import { Configuracion } from '../models/Configuracion.js';

describe('RegistroDiario Model', () => {
  it('should create a new registro with default values', () => {
    const registro = new RegistroDiario();
    
    expect(registro.kmRecorridos).toBe(0);
    expect(registro.numeroCarreras).toBe(0);
    expect(registro.uber.app).toBe(0);
    expect(registro.uber.propinas).toBe(0);
    expect(registro.freeNow.app).toBe(0);
    expect(registro.freeNow.tarjeta).toBe(0);
    expect(registro.freeNow.efectivo).toBe(0);
    expect(registro.freeNow.propinas).toBe(0);
    expect(registro.taxiConvencional.tarjeta).toBe(0);
    expect(registro.taxiConvencional.efectivo).toBe(0);
    expect(registro.gastos.combustible).toBe(0);
  });

  it('should create a registro with provided data', () => {
    const data = {
      fecha: new Date('2023-12-01'),
      kmRecorridos: 150,
      numeroCarreras: 12,
      uber: { app: 80, propinas: 10 },
      freeNow: { app: 60, tarjeta: 40, efectivo: 20, propinas: 5 },
      taxiConvencional: { tarjeta: 30, efectivo: 15 },
      gastos: { combustible: 25 }
    };

    const registro = new RegistroDiario(data);
    
    expect(registro.kmRecorridos).toBe(150);
    expect(registro.numeroCarreras).toBe(12);
    expect(registro.uber.app).toBe(80);
    expect(registro.uber.propinas).toBe(10);
    expect(registro.freeNow.app).toBe(60);
    expect(registro.freeNow.tarjeta).toBe(40);
    expect(registro.freeNow.efectivo).toBe(20);
    expect(registro.freeNow.propinas).toBe(5);
    expect(registro.taxiConvencional.tarjeta).toBe(30);
    expect(registro.taxiConvencional.efectivo).toBe(15);
    expect(registro.gastos.combustible).toBe(25);
  });

  it('should validate registro data correctly', () => {
    const validRegistro = new RegistroDiario({
      fecha: new Date('2023-12-01'),
      kmRecorridos: 150,
      numeroCarreras: 12
    });

    const validation = validRegistro.validate();
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect validation errors', () => {
    const invalidRegistro = new RegistroDiario({
      fecha: null,
      kmRecorridos: -10,
      numeroCarreras: -5
    });

    const validation = invalidRegistro.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should calculate ganancia bruta correctly', () => {
    const registro = new RegistroDiario({
      uber: { app: 80, propinas: 10 },
      freeNow: { app: 60, tarjeta: 40, efectivo: 20, propinas: 5 },
      taxiConvencional: { tarjeta: 30, efectivo: 15 }
    });

    const gananciaBruta = registro.calculateGananciaBruta();
    // 80 + 60 + 40 + 20 + 30 + 15 = 245 (excluding tips)
    expect(gananciaBruta).toBe(245);
  });

  it('should calculate total tips correctly', () => {
    const registro = new RegistroDiario({
      uber: { app: 80, propinas: 10 },
      freeNow: { app: 60, tarjeta: 40, efectivo: 20, propinas: 5 }
    });

    const totalPropinas = registro.getTotalPropinas();
    expect(totalPropinas).toBe(15); // 10 + 5
  });

  it('should convert to JSON correctly', () => {
    const registro = new RegistroDiario({
      kmRecorridos: 150,
      numeroCarreras: 12
    });

    const json = registro.toJSON();
    expect(json.kmRecorridos).toBe(150);
    expect(json.numeroCarreras).toBe(12);
    expect(json).toHaveProperty('fecha');
    expect(json).toHaveProperty('createdAt');
    expect(json).toHaveProperty('updatedAt');
  });
});

describe('Conductor Model', () => {
  it('should create a new conductor with default values', () => {
    const conductor = new Conductor();
    
    expect(conductor.nombre).toBe('');
    expect(conductor.apellido).toBe('');
    expect(conductor.configuracion.diaLibreSemanal).toBe(null);
    expect(conductor.configuracion.vacaciones.inicio).toBe(null);
    expect(conductor.configuracion.vacaciones.fin).toBe(null);
  });

  it('should create a conductor with provided data', () => {
    const data = {
      nombre: 'Juan',
      apellido: 'Pérez',
      configuracion: {
        diaLibreSemanal: 'domingo',
        vacaciones: {
          inicio: new Date('2023-12-20'),
          fin: new Date('2023-12-30')
        }
      }
    };

    const conductor = new Conductor(data);
    
    expect(conductor.nombre).toBe('Juan');
    expect(conductor.apellido).toBe('Pérez');
    expect(conductor.configuracion.diaLibreSemanal).toBe('domingo');
  });

  it('should validate conductor data correctly', () => {
    const validConductor = new Conductor({
      nombre: 'Juan',
      apellido: 'Pérez'
    });

    const validation = validConductor.validate();
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect validation errors', () => {
    const invalidConductor = new Conductor({
      nombre: '',
      apellido: 'A'
    });

    const validation = invalidConductor.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should get full name correctly', () => {
    const conductor = new Conductor({
      nombre: 'Juan',
      apellido: 'Pérez'
    });

    expect(conductor.getNombreCompleto()).toBe('Juan Pérez');
  });

  it('should check vacation dates correctly', () => {
    const conductor = new Conductor({
      configuracion: {
        vacaciones: {
          inicio: new Date('2023-12-20'),
          fin: new Date('2023-12-30')
        }
      }
    });

    expect(conductor.isOnVacation(new Date('2023-12-25'))).toBe(true);
    expect(conductor.isOnVacation(new Date('2023-12-15'))).toBe(false);
    expect(conductor.isOnVacation(new Date('2024-01-05'))).toBe(false);
  });

  it('should check free day correctly', () => {
    const conductor = new Conductor({
      configuracion: {
        diaLibreSemanal: 'domingo'
      }
    });

    // December 3, 2023 is a Sunday
    const sunday = new Date('2023-12-03');
    expect(conductor.isFreeDay(sunday)).toBe(true);

    // December 4, 2023 is a Monday
    const monday = new Date('2023-12-04');
    expect(conductor.isFreeDay(monday)).toBe(false);
  });

  it('should set and clear vacations correctly', () => {
    const conductor = new Conductor();

    conductor.setVacaciones(new Date('2023-12-20'), new Date('2023-12-30'));
    expect(conductor.configuracion.vacaciones.inicio).toBeInstanceOf(Date);
    expect(conductor.configuracion.vacaciones.fin).toBeInstanceOf(Date);

    conductor.clearVacaciones();
    expect(conductor.configuracion.vacaciones.inicio).toBe(null);
    expect(conductor.configuracion.vacaciones.fin).toBe(null);
  });

  it('should throw error for invalid vacation dates', () => {
    const conductor = new Conductor();

    expect(() => {
      conductor.setVacaciones(new Date('2023-12-30'), new Date('2023-12-20'));
    }).toThrow('La fecha de fin debe ser posterior a la fecha de inicio');
  });
});

describe('Configuracion Model', () => {
  it('should create a new configuration with default values', () => {
    const config = new Configuracion();
    
    expect(config.tema).toBe('dark');
    expect(config.idioma).toBe('es');
    expect(config.moneda).toBe('EUR');
    expect(config.formatoFecha).toBe('dd/mm/yyyy');
    expect(config.backupAutomatico).toBe(false);
  });

  it('should create a configuration with provided data', () => {
    const data = {
      tema: 'light',
      idioma: 'en',
      moneda: 'USD',
      formatoFecha: 'mm/dd/yyyy',
      backupAutomatico: true
    };

    const config = new Configuracion(data);
    
    expect(config.tema).toBe('light');
    expect(config.idioma).toBe('en');
    expect(config.moneda).toBe('USD');
    expect(config.formatoFecha).toBe('mm/dd/yyyy');
    expect(config.backupAutomatico).toBe(true);
  });

  it('should validate configuration correctly', () => {
    const validConfig = new Configuracion({
      tema: 'dark',
      idioma: 'es',
      moneda: 'EUR',
      formatoFecha: 'dd/mm/yyyy',
      backupAutomatico: false
    });

    const validation = validConfig.validate();
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect validation errors', () => {
    const invalidConfig = new Configuracion({
      tema: 'invalid',
      idioma: 'invalid',
      moneda: 'INVALID',
      formatoFecha: 'invalid'
    });

    const validation = invalidConfig.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should get currency symbol correctly', () => {
    const eurConfig = new Configuracion({ moneda: 'EUR' });
    expect(eurConfig.getCurrencySymbol()).toBe('€');

    const usdConfig = new Configuracion({ moneda: 'USD' });
    expect(usdConfig.getCurrencySymbol()).toBe('$');
  });

  it('should format date correctly', () => {
    const date = new Date('2023-12-25');

    const ddmmConfig = new Configuracion({ formatoFecha: 'dd/mm/yyyy' });
    expect(ddmmConfig.formatDate(date)).toBe('25/12/2023');

    const mmddConfig = new Configuracion({ formatoFecha: 'mm/dd/yyyy' });
    expect(mmddConfig.formatDate(date)).toBe('12/25/2023');

    const yyyyConfig = new Configuracion({ formatoFecha: 'yyyy-mm-dd' });
    expect(yyyyConfig.formatDate(date)).toBe('2023-12-25');
  });

  it('should format currency correctly', () => {
    const eurConfig = new Configuracion({ moneda: 'EUR' });
    expect(eurConfig.formatCurrency(123.45)).toBe('123.45€');

    const usdConfig = new Configuracion({ moneda: 'USD' });
    expect(usdConfig.formatCurrency(123.45)).toBe('$123.45');
  });

  it('should set theme correctly', () => {
    const config = new Configuracion();
    
    config.setTheme('light');
    expect(config.tema).toBe('light');

    expect(() => {
      config.setTheme('invalid');
    }).toThrow('Tema inválido');
  });

  it('should toggle backup setting', () => {
    const config = new Configuracion({ backupAutomatico: false });
    
    config.toggleBackupAutomatico();
    expect(config.backupAutomatico).toBe(true);

    config.toggleBackupAutomatico();
    expect(config.backupAutomatico).toBe(false);
  });

  it('should reset to defaults', () => {
    const config = new Configuracion({
      tema: 'light',
      idioma: 'en',
      moneda: 'USD'
    });

    config.resetToDefaults();
    
    expect(config.tema).toBe('dark');
    expect(config.idioma).toBe('es');
    expect(config.moneda).toBe('EUR');
    expect(config.formatoFecha).toBe('dd/mm/yyyy');
    expect(config.backupAutomatico).toBe(false);
  });
});