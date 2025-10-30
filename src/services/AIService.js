import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
    this.apiKey = 'AIzaSyAtdlOnTQNdWz7Um-lsaIVOL-pg0Wa2MmI'; // API Key integrada
  }

  async initialize(apiKey = null) {
    try {
      // Usar la API key integrada o la proporcionada
      const keyToUse = apiKey || this.apiKey;
      
      if (!keyToUse) {
        throw new Error('API Key de Google AI Studio es requerida');
      }

      this.genAI = new GoogleGenerativeAI(keyToUse);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      this.isInitialized = true;
      
      console.log('AI Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing AI Service:', error);
      throw error;
    }
  }

  // Método para inicializar automáticamente con la API key integrada
  async autoInitialize() {
    return await this.initialize();
  }

  /**
   * Analiza los datos del conductor y genera insights inteligentes
   */
  async analyzeDriverData(registros, conductor) {
    if (!this.isInitialized) {
      throw new Error('AI Service no está inicializado');
    }

    try {
      const dataAnalysis = this.prepareDataForAnalysis(registros);
      
      const prompt = `
Eres un experto analista de datos para conductores de servicios de transporte (Uber, FreeNow, Taxi). 
Analiza los siguientes datos y proporciona insights valiosos:

DATOS DEL CONDUCTOR:
- Nombre: ${conductor?.nombre || 'No especificado'} ${conductor?.apellido || ''}
- Registros totales: ${registros.length}

ANÁLISIS DE DATOS:
${JSON.stringify(dataAnalysis, null, 2)}

PROPORCIONA:
1. **Análisis de Rendimiento**: Tendencias de ganancias, días más rentables
2. **Recomendaciones Estratégicas**: Mejores horarios, plataformas más rentables
3. **Predicciones**: Estimaciones para el próximo mes basadas en patrones
4. **Alertas**: Posibles problemas o oportunidades detectadas
5. **Consejos Personalizados**: Sugerencias específicas para mejorar ingresos

Responde en español, de forma clara y práctica para un conductor profesional.
Usa formato markdown para mejor legibilidad.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing driver data:', error);
      throw error;
    }
  }

  /**
   * Genera predicciones de ingresos basadas en patrones históricos
   */
  async generatePredictions(registros) {
    if (!this.isInitialized) {
      throw new Error('AI Service no está inicializado');
    }

    try {
      const patterns = this.analyzePatterns(registros);
      
      const prompt = `
Como experto en análisis predictivo para conductores de transporte, analiza estos patrones:

PATRONES DETECTADOS:
${JSON.stringify(patterns, null, 2)}

GENERA PREDICCIONES PARA:
1. **Ingresos del próximo mes** (rango mínimo-máximo)
2. **Mejores días de la semana** para trabajar
3. **Horarios más rentables** basados en datos históricos
4. **Plataforma más rentable** (Uber vs FreeNow vs Taxi)
5. **Tendencia general** (creciente, estable, decreciente)

Proporciona números específicos y justificaciones basadas en los datos.
Responde en español con formato JSON válido:
{
  "ingresosPredictosProximoMes": {
    "minimo": number,
    "maximo": number,
    "promedio": number
  },
  "mejoresDias": ["dia1", "dia2", "dia3"],
  "mejoresHorarios": "descripción",
  "plataformaMasRentable": "nombre",
  "tendencia": "descripción",
  "confianza": "porcentaje"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      try {
        return JSON.parse(response.text());
      } catch (parseError) {
        // Si no puede parsear JSON, devolver texto plano
        return { error: 'No se pudo generar predicción estructurada', text: response.text() };
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  /**
   * Chat inteligente para consultas del conductor
   */
  async chatWithAssistant(message, registros, conductor) {
    if (!this.isInitialized) {
      throw new Error('AI Service no está inicializado');
    }

    try {
      const context = this.prepareContextForChat(registros, conductor);
      
      const prompt = `
Eres un asistente virtual especializado en ayudar a conductores de servicios de transporte.
Tienes acceso a todos los datos del conductor y puedes responder preguntas específicas.

CONTEXTO DEL CONDUCTOR:
${JSON.stringify(context, null, 2)}

PREGUNTA DEL CONDUCTOR: "${message}"

INSTRUCCIONES:
- Responde de forma conversacional y amigable
- Usa los datos específicos del conductor para dar respuestas precisas
- Si no tienes suficientes datos, menciona qué información necesitarías
- Proporciona consejos prácticos y accionables
- Responde en español
- Sé conciso pero informativo

RESPUESTA:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in chat assistant:', error);
      throw error;
    }
  }

  /**
   * Genera un resumen inteligente automático
   */
  async generateSmartSummary(registros, period = 'monthly') {
    if (!this.isInitialized) {
      throw new Error('AI Service no está inicializado');
    }

    try {
      const summary = this.calculateSummaryStats(registros, period);
      
      const prompt = `
Genera un resumen inteligente y motivacional para un conductor basado en estos datos:

PERÍODO: ${period === 'monthly' ? 'Mensual' : 'Semanal'}
ESTADÍSTICAS:
${JSON.stringify(summary, null, 2)}

GENERA UN RESUMEN QUE INCLUYA:
1. **Logros destacados** del período
2. **Comparación** con períodos anteriores (si es posible)
3. **Puntos de mejora** identificados
4. **Motivación personalizada** basada en el rendimiento
5. **Próximos objetivos** sugeridos

Usa un tono positivo y motivacional. Responde en español.
Máximo 200 palabras, formato markdown.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating smart summary:', error);
      throw error;
    }
  }

  /**
   * Detecta anomalías y genera alertas
   */
  async detectAnomalies(registros) {
    if (!this.isInitialized) {
      throw new Error('AI Service no está inicializado');
    }

    try {
      const anomalies = this.findAnomalies(registros);
      
      if (anomalies.length === 0) {
        return { hasAnomalies: false, message: 'No se detectaron anomalías en tus datos.' };
      }

      const prompt = `
Como sistema de detección de anomalías para conductores, analiza estas irregularidades:

ANOMALÍAS DETECTADAS:
${JSON.stringify(anomalies, null, 2)}

GENERA ALERTAS ÚTILES:
1. **Descripción** de cada anomalía encontrada
2. **Posibles causas** de estas irregularidades
3. **Recomendaciones** para investigar o corregir
4. **Nivel de prioridad** (Alta, Media, Baja)

Responde en español, formato JSON:
{
  "hasAnomalies": true,
  "alerts": [
    {
      "type": "tipo_anomalia",
      "description": "descripción",
      "priority": "Alta|Media|Baja",
      "recommendation": "recomendación"
    }
  ]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      try {
        return JSON.parse(response.text());
      } catch (parseError) {
        return { hasAnomalies: true, error: 'Error procesando alertas', text: response.text() };
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  // Métodos auxiliares para preparar datos

  prepareDataForAnalysis(registros) {
    if (!registros || registros.length === 0) {
      return { message: 'No hay datos suficientes para análisis' };
    }

    const totalRegistros = registros.length;
    const totalKm = registros.reduce((sum, r) => sum + (parseFloat(r.kmRecorridos) || 0), 0);
    const totalCarreras = registros.reduce((sum, r) => sum + (parseInt(r.numeroCarreras) || 0), 0);
    const totalGanancias = registros.reduce((sum, r) => sum + (parseFloat(r.gananciaNeta) || 0), 0);
    
    const promedioGananciaDiaria = totalGanancias / totalRegistros;
    const promedioKmDiario = totalKm / totalRegistros;
    const promedioCarrerasDiarias = totalCarreras / totalRegistros;

    // Análisis por plataforma
    const uberTotal = registros.reduce((sum, r) => sum + (parseFloat(r.uber?.app) || 0), 0);
    const freeNowTotal = registros.reduce((sum, r) => sum + (parseFloat(r.freeNow?.app) || 0) + (parseFloat(r.freeNow?.tarjeta) || 0) + (parseFloat(r.freeNow?.efectivo) || 0), 0);
    const taxiTotal = registros.reduce((sum, r) => sum + (parseFloat(r.taxiConvencional?.tarjeta) || 0) + (parseFloat(r.taxiConvencional?.efectivo) || 0), 0);

    // Análisis por día de la semana
    const gananciasPorDia = {};
    registros.forEach(registro => {
      const fecha = new Date(registro.fecha);
      const dia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      if (!gananciasPorDia[dia]) gananciasPorDia[dia] = [];
      gananciasPorDia[dia].push(parseFloat(registro.gananciaNeta) || 0);
    });

    const promediosPorDia = {};
    Object.keys(gananciasPorDia).forEach(dia => {
      const ganancias = gananciasPorDia[dia];
      promediosPorDia[dia] = ganancias.reduce((sum, g) => sum + g, 0) / ganancias.length;
    });

    return {
      resumen: {
        totalRegistros,
        totalKm,
        totalCarreras,
        totalGanancias,
        promedioGananciaDiaria,
        promedioKmDiario,
        promedioCarrerasDiarias
      },
      plataformas: {
        uber: uberTotal,
        freeNow: freeNowTotal,
        taxi: taxiTotal
      },
      rendimientoPorDia: promediosPorDia,
      periodoAnalisis: {
        desde: registros[registros.length - 1]?.fecha,
        hasta: registros[0]?.fecha
      }
    };
  }

  analyzePatterns(registros) {
    if (!registros || registros.length < 7) {
      return { message: 'Necesitas al menos 7 días de datos para análisis de patrones' };
    }

    // Tendencia de ganancias (últimos 30 días vs anteriores)
    const recent = registros.slice(0, Math.min(30, registros.length));
    const older = registros.slice(30, Math.min(60, registros.length));

    const recentAvg = recent.reduce((sum, r) => sum + (parseFloat(r.gananciaNeta) || 0), 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, r) => sum + (parseFloat(r.gananciaNeta) || 0), 0) / older.length : recentAvg;

    const tendencia = recentAvg > olderAvg ? 'creciente' : recentAvg < olderAvg ? 'decreciente' : 'estable';
    const cambioPortcentual = older.length > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0;

    return {
      tendenciaGanancias: {
        tipo: tendencia,
        cambioPortcentual: cambioPortcentual.toFixed(2),
        promedioReciente: recentAvg.toFixed(2),
        promedioAnterior: olderAvg.toFixed(2)
      },
      diasConDatos: registros.length,
      rangoFechas: {
        desde: registros[registros.length - 1]?.fecha,
        hasta: registros[0]?.fecha
      }
    };
  }

  prepareContextForChat(registros, conductor) {
    const analysis = this.prepareDataForAnalysis(registros);
    
    return {
      conductor: {
        nombre: conductor?.nombre || 'No especificado',
        apellido: conductor?.apellido || '',
        configuracion: conductor?.configuracion || {}
      },
      estadisticas: analysis,
      ultimosRegistros: registros.slice(0, 5).map(r => ({
        fecha: r.fecha,
        gananciaNeta: r.gananciaNeta,
        kmRecorridos: r.kmRecorridos,
        numeroCarreras: r.numeroCarreras
      }))
    };
  }

  calculateSummaryStats(registros, period) {
    const now = new Date();
    let filteredRegistros;

    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredRegistros = registros.filter(r => new Date(r.fecha) >= weekAgo);
    } else {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredRegistros = registros.filter(r => new Date(r.fecha) >= monthAgo);
    }

    return this.prepareDataForAnalysis(filteredRegistros);
  }

  findAnomalies(registros) {
    const anomalies = [];
    
    if (registros.length < 5) return anomalies;

    // Calcular promedios
    const avgGanancias = registros.reduce((sum, r) => sum + (parseFloat(r.gananciaNeta) || 0), 0) / registros.length;
    const avgKm = registros.reduce((sum, r) => sum + (parseFloat(r.kmRecorridos) || 0), 0) / registros.length;

    // Detectar días con ganancias muy bajas o muy altas
    registros.forEach(registro => {
      const ganancias = parseFloat(registro.gananciaNeta) || 0;
      const km = parseFloat(registro.kmRecorridos) || 0;

      if (ganancias < avgGanancias * 0.3 && ganancias > 0) {
        anomalies.push({
          type: 'ganancias_bajas',
          fecha: registro.fecha,
          valor: ganancias,
          promedio: avgGanancias
        });
      }

      if (ganancias > avgGanancias * 2) {
        anomalies.push({
          type: 'ganancias_altas',
          fecha: registro.fecha,
          valor: ganancias,
          promedio: avgGanancias
        });
      }

      if (km > avgKm * 2) {
        anomalies.push({
          type: 'kilometraje_alto',
          fecha: registro.fecha,
          valor: km,
          promedio: avgKm
        });
      }
    });

    return anomalies;
  }

  // Método para verificar si el servicio está disponible
  isAvailable() {
    return this.isInitialized;
  }
}