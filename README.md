# Conductor Tracker - Aplicación de Seguimiento de Actividad

Una aplicación web local para conductores de servicios de transporte que permite registrar, gestionar y analizar la actividad diaria, incluyendo ingresos, gastos, kilómetros recorridos y número de carreras realizadas a través de diferentes plataformas como Uber, FreeNow y taxi convencional.

## 🚀 Características Principales

- **Funcionamiento 100% Local**: Sin necesidad de conexión a internet
- **Almacenamiento Seguro**: Todos los datos se guardan localmente en tu navegador
- **Dashboard Interactivo**: Visualiza métricas totales y tendencias con gráficos
- **Cálculos Automáticos**: Ganancia neta calculada automáticamente con todas las comisiones
- **Informes Detallados**: Genera informes semanales y mensuales en PDF
- **Exportación de Datos**: Respalda y restaura tus datos en formato JSON
- **Tema Oscuro**: Interfaz optimizada para uso nocturno

## 📋 Requisitos del Sistema

- **Navegador Web Moderno**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Node.js**: Versión 16 o superior (solo para desarrollo)
- **Espacio de Almacenamiento**: Mínimo 50MB libres en el navegador

## 🛠️ Instalación y Configuración

### Opción 1: Uso Directo (Recomendado)

1. **Descarga los archivos de la aplicación**
2. **Abre el archivo `conductor-tracker-standalone.html` en tu navegador**
3. **¡Listo! La aplicación está funcionando**

### Opción 2: Servidor de Desarrollo (Para desarrolladores)

1. **Clona o descarga el proyecto**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd conductor-tracker
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Accede a la aplicación**
   - Local: http://localhost:3000
   - Red local: http://[TU_IP]:3000

### Opción 3: Build de Producción

1. **Genera los archivos optimizados**
   ```bash
   npm run build
   ```

2. **Sirve los archivos estáticos**
   ```bash
   npm run serve
   ```
   O usa cualquier servidor web estático apuntando a la carpeta `dist/`

## 📱 Uso de la Aplicación

### Primer Uso

1. **Configura tu Perfil**
   - Ve a la sección "Ajustes"
   - Ingresa tu nombre y apellido
   - Configura días libres y vacaciones (opcional)

2. **Registra tu Primer Día**
   - Haz clic en "Registrar Nuevo Día" desde el Dashboard
   - Completa los campos con tu actividad diaria
   - La ganancia neta se calcula automáticamente

3. **Explora las Funcionalidades**
   - **Dashboard**: Métricas totales y acceso rápido
   - **Dashboard Visual**: Gráficos de tendencias interactivos
   - **Informes**: Reportes semanales y mensuales con PDF
   - **Ajustes**: Configuración de perfil y preferencias

### Flujo de Trabajo Diario

1. **Registra tu Actividad**
   - Kilómetros recorridos
   - Número total de carreras
   - Ingresos por plataforma (Uber, FreeNow, Taxi)
   - Gastos de combustible

2. **Revisa tus Cálculos**
   - La aplicación aplica automáticamente:
     - Comisión de vehículo (52%)
     - Costo por kilometraje (0.05€/km)
     - Comisión FreeNow efectivo (6%)

3. **Analiza tu Rendimiento**
   - Consulta gráficos de tendencias
   - Genera informes mensuales
   - Exporta datos para respaldo

## 🔧 Scripts Disponibles

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run dev:debug    # Servidor con modo debug activado
```

### Producción
```bash
npm run build        # Build optimizado para producción
npm run build:analyze # Build con análisis de bundle
npm run preview      # Preview del build de producción
npm run serve        # Sirve archivos desde dist/
```

### Testing
```bash
npm run test         # Ejecuta todos los tests
npm run test:watch   # Tests en modo watch
npm run test:integration # Tests de integración
npm run test:e2e     # Tests end-to-end
```

### Utilidades
```bash
npm run clean        # Limpia la carpeta dist/
npm start           # Servidor standalone (puerto 8080)
```

## 📊 Fórmulas de Cálculo

### Ganancia Neta
```
Ganancia Bruta = Uber App + FreeNow (App + Tarjeta + Efectivo) + Taxi (Tarjeta + Efectivo)

Descuentos:
- Comisión Vehículo: Ganancia Bruta × 52%
- Costo Kilometraje: Kilómetros × 0.05€
- Comisión FreeNow Efectivo: FreeNow Efectivo × 6%

Ganancia Neta = Ganancia Bruta - Comisión Vehículo - Costo Kilometraje - Comisión FreeNow Efectivo - Gastos Combustible
```

**Nota**: Las propinas no se incluyen en los cálculos de comisiones.

## 💾 Gestión de Datos

### Almacenamiento Local
- **IndexedDB**: Almacenamiento principal de registros
- **LocalStorage**: Configuraciones y cache
- **Capacidad**: Hasta varios GB según el navegador

### Exportación e Importación
- **Formato**: JSON estándar
- **Contenido**: Todos los registros, configuración y perfil
- **Uso**: Respaldo, migración entre dispositivos

### Seguridad
- **Datos Locales**: Nunca salen de tu dispositivo
- **Sin Tracking**: No se envían datos a servidores externos
- **Privacidad**: Cumple con GDPR por diseño

## 🔧 Configuración Avanzada

### Variables de Entorno (Desarrollo)
```bash
PORT=3000                    # Puerto del servidor de desarrollo
HOST=0.0.0.0                # Host del servidor (permite acceso desde red)
VITE_DEBUG=true             # Modo debug de Vite
```

### Personalización de Build
Edita `vite.config.js` para:
- Cambiar puertos por defecto
- Modificar configuración de chunks
- Ajustar optimizaciones

## 🐛 Solución de Problemas

### Problemas Comunes

**La aplicación no carga**
- Verifica que estés usando un navegador compatible
- Comprueba que JavaScript esté habilitado
- Intenta limpiar cache y cookies

**Datos perdidos**
- Los datos se guardan automáticamente en IndexedDB
- Verifica que no hayas limpiado datos del navegador
- Usa la función de exportación para respaldos regulares

**Errores de cálculo**
- Verifica que todos los campos numéricos sean válidos
- Revisa que las fechas estén en formato correcto
- Consulta la sección de fórmulas de cálculo

**Problemas de rendimiento**
- Limpia datos antiguos si tienes muchos registros
- Cierra otras pestañas del navegador
- Actualiza a la última versión del navegador

### Logs y Debug
- Abre las herramientas de desarrollador (F12)
- Consulta la consola para errores detallados
- Usa `npm run dev:debug` para más información

## 📞 Soporte

### Documentación Adicional
- **Requisitos Técnicos**: `.kiro/specs/conductor-tracker/requirements.md`
- **Diseño del Sistema**: `.kiro/specs/conductor-tracker/design.md`
- **Plan de Implementación**: `.kiro/specs/conductor-tracker/tasks.md`

### Reportar Problemas
1. Describe el problema detalladamente
2. Incluye pasos para reproducir el error
3. Adjunta capturas de pantalla si es necesario
4. Menciona tu navegador y versión

## 📄 Licencia

Este proyecto está desarrollado para uso personal y profesional de conductores de servicios de transporte.

---

**Versión**: 1.0.0  
**Última Actualización**: Octubre 2024  
**Compatibilidad**: Navegadores modernos con soporte ES6+