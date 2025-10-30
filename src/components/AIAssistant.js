export class AIAssistant {
  constructor(dbService, calcService, aiService) {
    this.dbService = dbService;
    this.calcService = calcService;
    this.aiService = aiService;
    this.isConfigured = false;
    this.currentAnalysis = null;
    this.chatHistory = [];
  }

  init() {
    this.setupEventListeners();
    this.checkAIConfiguration();
  }

  setupEventListeners() {
    // Configuración de API Key
    const configureBtn = document.getElementById('configure-ai');
    const apiKeyInput = document.getElementById('ai-api-key');
    
    if (configureBtn) {
      configureBtn.addEventListener('click', () => {
        this.configureAI();
      });
    }

    // Chat assistant
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
          this.sendChatMessage(message);
          chatInput.value = '';
        }
      });
    }

    // Análisis automático
    const analyzeBtn = document.getElementById('analyze-data');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        this.performFullAnalysis();
      });
    }

    // Generar predicciones
    const predictBtn = document.getElementById('generate-predictions');
    if (predictBtn) {
      predictBtn.addEventListener('click', () => {
        this.generatePredictions();
      });
    }
  }  async co
nfigureAI() {
    try {
      const apiKeyInput = document.getElementById('ai-api-key');
      const apiKey = apiKeyInput?.value?.trim();
      
      if (!apiKey) {
        throw new Error('Por favor, introduce tu API Key de Google AI Studio');
      }

      this.showLoading('Configurando IA...');
      
      await this.aiService.initialize(apiKey);
      
      // Guardar API Key en localStorage (encriptada básicamente)
      localStorage.setItem('ai_configured', btoa(apiKey));
      
      this.isConfigured = true;
      this.updateAIStatus();
      this.showSuccess('IA configurada correctamente');
      
      // Realizar análisis inicial
      await this.performInitialAnalysis();
      
    } catch (error) {
      console.error('Error configuring AI:', error);
      this.showError(error.message || 'Error al configurar la IA');
    }
  }

  async checkAIConfiguration() {
    try {
      // Intentar inicializar automáticamente con la API key integrada
      await this.aiService.autoInitialize();
      this.isConfigured = true;
      this.updateAIStatus();
      
      // Ocultar sección de configuración ya que está preconfigurada
      const configSection = document.getElementById('ai-config-section');
      if (configSection) {
        configSection.style.display = 'none';
      }
      
      // Mostrar sección de funcionalidades
      const featuresSection = document.getElementById('ai-features-section');
      if (featuresSection) {
        featuresSection.style.display = 'block';
      }
      
      // Cargar análisis previo si existe
      const savedAnalysis = localStorage.getItem('ai_last_analysis');
      if (savedAnalysis) {
        this.currentAnalysis = JSON.parse(savedAnalysis);
        this.displayAnalysis(this.currentAnalysis);
        }
      }
    } catch (error) {
      console.error('Error checking AI configuration:', error);
      this.isConfigured = false;
      this.updateAIStatus();
    }
  }

  updateAIStatus() {
    const statusElement = document.getElementById('ai-status');
    const configSection = document.getElementById('ai-config-section');
    const featuresSection = document.getElementById('ai-features-section');
    
    if (statusElement) {
      statusElement.textContent = this.isConfigured ? 
        '✅ IA Preconfigurada y Lista' : 
        '❌ IA No Disponible';
      statusElement.className = this.isConfigured ? 'ai-status active' : 'ai-status inactive';
    }
    
    if (configSection) {
      configSection.style.display = this.isConfigured ? 'none' : 'block';
    }
    
    if (featuresSection) {
      featuresSection.style.display = this.isConfigured ? 'block' : 'none';
    }
  }

  async performInitialAnalysis() {
    if (!this.isConfigured) return;
    
    try {
      this.showLoading('Realizando análisis inicial...');
      
      const registros = await this.dbService.getAllRegistros();
      const conductor = await this.dbService.getConductor();
      
      if (registros.length === 0) {
        this.showInfo('Añade algunos registros para obtener análisis de IA');
        return;
      }

      const analysis = await this.aiService.analyzeDriverData(registros, conductor);
      
      this.currentAnalysis = {
        timestamp: new Date().toISOString(),
        analysis,
        registrosCount: registros.length
      };
      
      // Guardar análisis
      localStorage.setItem('ai_last_analysis', JSON.stringify(this.currentAnalysis));
      
      this.displayAnalysis(this.currentAnalysis);
      this.hideLoading();
      
    } catch (error) {
      console.error('Error in initial analysis:', error);
      this.showError('Error al realizar análisis inicial');
    }
  }

  async performFullAnalysis() {
    if (!this.isConfigured) {
      this.showError('Configura la IA primero');
      return;
    }
    
    try {
      this.showLoading('Analizando todos tus datos...');
      
      const registros = await this.dbService.getAllRegistros();
      const conductor = await this.dbService.getConductor();
      
      if (registros.length === 0) {
        throw new Error('No hay datos para analizar');
      }

      // Análisis completo
      const analysis = await this.aiService.analyzeDriverData(registros, conductor);
      
      // Detectar anomalías
      const anomalies = await this.aiService.detectAnomalies(registros);
      
      // Generar resumen inteligente
      const smartSummary = await this.aiService.generateSmartSummary(registros, 'monthly');
      
      const fullAnalysis = {
        timestamp: new Date().toISOString(),
        analysis,
        anomalies,
        smartSummary,
        registrosCount: registros.length
      };
      
      this.currentAnalysis = fullAnalysis;
      localStorage.setItem('ai_last_analysis', JSON.stringify(fullAnalysis));
      
      this.displayAnalysis(fullAnalysis);
      this.hideLoading();
      
    } catch (error) {
      console.error('Error in full analysis:', error);
      this.showError(error.message || 'Error al realizar análisis completo');
    }
  }  async 
generatePredictions() {
    if (!this.isConfigured) {
      this.showError('Configura la IA primero');
      return;
    }
    
    try {
      this.showLoading('Generando predicciones...');
      
      const registros = await this.dbService.getAllRegistros();
      
      if (registros.length < 7) {
        throw new Error('Necesitas al menos 7 días de datos para generar predicciones');
      }

      const predictions = await this.aiService.generatePredictions(registros);
      
      this.displayPredictions(predictions);
      this.hideLoading();
      
    } catch (error) {
      console.error('Error generating predictions:', error);
      this.showError(error.message || 'Error al generar predicciones');
    }
  }

  async sendChatMessage(message) {
    if (!this.isConfigured) {
      this.showError('Configura la IA primero');
      return;
    }
    
    try {
      // Añadir mensaje del usuario al chat
      this.addChatMessage('user', message);
      
      // Mostrar indicador de escritura
      this.showTypingIndicator();
      
      const registros = await this.dbService.getAllRegistros();
      const conductor = await this.dbService.getConductor();
      
      const response = await this.aiService.chatWithAssistant(message, registros, conductor);
      
      // Añadir respuesta de la IA
      this.addChatMessage('assistant', response);
      
      // Guardar historial
      this.chatHistory.push(
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() }
      );
      
      this.hideTypingIndicator();
      
    } catch (error) {
      console.error('Error in chat:', error);
      this.addChatMessage('assistant', 'Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.');
      this.hideTypingIndicator();
    }
  }

  displayAnalysis(analysisData) {
    const container = document.getElementById('ai-analysis-container');
    if (!container) return;
    
    const { analysis, anomalies, smartSummary, timestamp } = analysisData;
    
    container.innerHTML = `
      <div class="ai-analysis-content">
        <div class="analysis-header">
          <h3>📊 Análisis Inteligente</h3>
          <span class="analysis-timestamp">Actualizado: ${new Date(timestamp).toLocaleString('es-ES')}</span>
        </div>
        
        ${smartSummary ? `
          <div class="smart-summary">
            <h4>🎯 Resumen Inteligente</h4>
            <div class="summary-content">${this.formatMarkdown(smartSummary)}</div>
          </div>
        ` : ''}
        
        <div class="detailed-analysis">
          <h4>🔍 Análisis Detallado</h4>
          <div class="analysis-content">${this.formatMarkdown(analysis)}</div>
        </div>
        
        ${anomalies && anomalies.hasAnomalies ? `
          <div class="anomalies-section">
            <h4>⚠️ Alertas Detectadas</h4>
            <div class="anomalies-content">
              ${this.formatAnomalies(anomalies)}
            </div>
          </div>
        ` : ''}
        
        <div class="analysis-actions">
          <button class="btn-secondary" onclick="window.app.components.aiAssistant.performFullAnalysis()">
            🔄 Actualizar Análisis
          </button>
          <button class="btn-secondary" onclick="window.app.components.aiAssistant.generatePredictions()">
            🔮 Ver Predicciones
          </button>
        </div>
      </div>
    `;
  }

  displayPredictions(predictions) {
    const container = document.getElementById('ai-predictions-container');
    if (!container) return;
    
    if (predictions.error) {
      container.innerHTML = `
        <div class="predictions-error">
          <h4>Error en Predicciones</h4>
          <p>${predictions.error}</p>
          <pre>${predictions.text}</pre>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="predictions-content">
        <h3>🔮 Predicciones Inteligentes</h3>
        
        <div class="predictions-grid">
          <div class="prediction-card">
            <h4>💰 Ingresos Próximo Mes</h4>
            <div class="prediction-range">
              <span class="min">Mínimo: ${predictions.ingresosPredictosProximoMes?.minimo || 'N/A'}€</span>
              <span class="avg">Promedio: ${predictions.ingresosPredictosProximoMes?.promedio || 'N/A'}€</span>
              <span class="max">Máximo: ${predictions.ingresosPredictosProximoMes?.maximo || 'N/A'}€</span>
            </div>
          </div>
          
          <div class="prediction-card">
            <h4>📅 Mejores Días</h4>
            <div class="best-days">
              ${predictions.mejoresDias ? predictions.mejoresDias.map(dia => `<span class="day-tag">${dia}</span>`).join('') : 'No disponible'}
            </div>
          </div>
          
          <div class="prediction-card">
            <h4>🕐 Mejores Horarios</h4>
            <p>${predictions.mejoresHorarios || 'No disponible'}</p>
          </div>
          
          <div class="prediction-card">
            <h4>🚗 Plataforma Más Rentable</h4>
            <p><strong>${predictions.plataformaMasRentable || 'No disponible'}</strong></p>
          </div>
          
          <div class="prediction-card">
            <h4>📈 Tendencia</h4>
            <p>${predictions.tendencia || 'No disponible'}</p>
            <small>Confianza: ${predictions.confianza || 'N/A'}</small>
          </div>
        </div>
      </div>
    `;
  }  addChatM
essage(role, content) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    const timestamp = new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.formatMarkdown(content)}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  showTypingIndicator() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-animation">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  formatMarkdown(text) {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/#{1,6}\s*(.*)/g, '<h4>$1</h4>');
  }

  formatAnomalies(anomalies) {
    if (!anomalies.alerts) return '<p>No se pudieron procesar las alertas</p>';
    
    return anomalies.alerts.map(alert => `
      <div class="alert-item ${alert.priority?.toLowerCase()}">
        <div class="alert-header">
          <span class="alert-type">${alert.type}</span>
          <span class="alert-priority priority-${alert.priority?.toLowerCase()}">${alert.priority}</span>
        </div>
        <p class="alert-description">${alert.description}</p>
        <p class="alert-recommendation"><strong>Recomendación:</strong> ${alert.recommendation}</p>
      </div>
    `).join('');
  }

  async loadData() {
    if (this.isConfigured && this.currentAnalysis) {
      this.displayAnalysis(this.currentAnalysis);
    }
  }

  showLoading(message = 'Procesando...') {
    const loadingElement = document.getElementById('ai-loading');
    if (loadingElement) {
      loadingElement.textContent = message;
      loadingElement.style.display = 'block';
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById('ai-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  showSuccess(message) {
    if (window.app) {
      window.app.showNotification(message, 'success');
    }
  }

  showError(message) {
    if (window.app) {
      window.app.showNotification(message, 'error');
    }
  }

  showInfo(message) {
    if (window.app) {
      window.app.showNotification(message, 'info');
    }
  }
}