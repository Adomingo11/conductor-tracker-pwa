# Documento de Requisitos - Aplicación de Seguimiento de Actividad para Conductores

## Introducción

La Aplicación de Seguimiento de Actividad para Conductores es un sistema web local que permite a los conductores de servicios de transporte registrar, gestionar y analizar su actividad diaria, incluyendo ingresos, gastos, kilómetros recorridos y número de carreras realizadas a través de diferentes plataformas como Uber, FreeNow y taxi convencional.

## Glosario

- **Sistema_Conductor**: La aplicación web de seguimiento de actividad para conductores
- **Usuario_Conductor**: Persona que utiliza la aplicación para registrar su actividad como conductor
- **Registro_Diario**: Entrada de datos correspondiente a un día específico de trabajo
- **Plataforma_Transporte**: Servicio de transporte como Uber, FreeNow o taxi convencional
- **Dashboard**: Panel principal que muestra resúmenes y métricas totales
- **Informe_Actividad**: Reporte generado con datos de actividad por período
- **Base_Datos_Local**: Sistema de almacenamiento IndexedDB integrado en el navegador
- **Persistencia_Datos**: Capacidad de mantener los datos guardados entre sesiones del navegador
- **Ganancia_Bruta**: Total de ingresos antes de aplicar descuentos y comisiones
- **Ganancia_Neta**: Beneficio final después de aplicar todos los descuentos y gastos
- **Comision_Vehiculo**: Descuento del 52% aplicado sobre la ganancia bruta por uso del vehículo
- **Costo_Kilometraje**: Descuento de 0.05€ por cada kilómetro recorrido
- **Comision_FreeNow_Efectivo**: Descuento del 6% aplicado sobre pagos en efectivo de FreeNow
- **Grafico_Tendencia**: Visualización gráfica que muestra la evolución temporal de métricas
- **Dashboard_Visual**: Panel con gráficos interactivos para análisis de tendencias
- **Periodo_Analisis**: Rango de fechas seleccionado para mostrar datos en gráficos
- **Metrica_Temporal**: Datos agregados por día, semana o mes para visualización gráfica

## Requisitos

### Requisito 1

**Historia de Usuario:** Como conductor, quiero acceder a un dashboard principal, para que pueda ver un resumen de mi actividad total de forma rápida.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor accede a la aplicación, THE Sistema_Conductor SHALL mostrar el dashboard con métricas totales
2. THE Sistema_Conductor SHALL mostrar kilómetros totales recorridos en formato numérico
3. THE Sistema_Conductor SHALL mostrar número total de carreras realizadas
4. THE Sistema_Conductor SHALL mostrar ganancia neta total en euros
5. THE Sistema_Conductor SHALL proporcionar un botón "Registrar Nuevo Día" para crear nuevos registros

### Requisito 2

**Historia de Usuario:** Como conductor, quiero registrar mi actividad diaria, para que pueda llevar un control detallado de mis ingresos y gastos por día.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor selecciona registrar nuevo día, THE Sistema_Conductor SHALL mostrar un formulario de registro diario
2. THE Sistema_Conductor SHALL permitir seleccionar la fecha del registro
3. THE Sistema_Conductor SHALL permitir ingresar kilómetros recorridos y número de carreras totales
4. THE Sistema_Conductor SHALL permitir registrar ingresos de Uber App y propinas Uber por separado
5. THE Sistema_Conductor SHALL permitir registrar ingresos de FreeNow por App, Tarjeta, Efectivo y Propinas

### Requisito 3

**Historia de Usuario:** Como conductor, quiero registrar diferentes tipos de servicios de transporte, para que pueda diferenciar mis ingresos por plataforma.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL permitir registrar ingresos de taxi convencional por tarjeta y efectivo
2. THE Sistema_Conductor SHALL permitir registrar gastos de combustible
3. WHEN el Usuario_Conductor completa el registro, THE Sistema_Conductor SHALL calcular automáticamente la Ganancia_Neta aplicando todas las fórmulas de descuento
4. THE Sistema_Conductor SHALL guardar todos los datos del registro diario
5. THE Sistema_Conductor SHALL actualizar las métricas totales del dashboard

### Requisito 4

**Historia de Usuario:** Como conductor, quiero configurar mi perfil y ajustes, para que pueda personalizar la aplicación según mis necesidades.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL permitir configurar el nombre y apellido del conductor
2. THE Sistema_Conductor SHALL permitir configurar días libres semanales
3. THE Sistema_Conductor SHALL permitir configurar períodos de vacaciones con fechas de inicio y fin
4. THE Sistema_Conductor SHALL mostrar un resumen de la configuración actual
5. THE Sistema_Conductor SHALL guardar todas las configuraciones del perfil

### Requisito 5

**Historia de Usuario:** Como conductor, quiero ver informes de mi actividad, para que pueda analizar mi rendimiento por períodos específicos.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL proporcionar informes semanales y mensuales
2. WHEN no hay datos registrados, THE Sistema_Conductor SHALL mostrar un mensaje indicando la ausencia de datos
3. THE Sistema_Conductor SHALL sugerir empezar por añadir un registro diario cuando no hay datos
4. THE Sistema_Conductor SHALL permitir alternar entre vista semanal y mensual
5. THE Sistema_Conductor SHALL calcular y mostrar ganancias y rendimiento por período seleccionado

### Requisito 6

**Historia de Usuario:** Como conductor, quiero que la aplicación funcione localmente en mi navegador, para que pueda usarla sin conexión a internet.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL ejecutarse completamente en el navegador web local
2. THE Sistema_Conductor SHALL funcionar sin requerir conexión a internet
3. THE Sistema_Conductor SHALL ser accesible a través de una URL local (localhost)
4. THE Sistema_Conductor SHALL utilizar un servidor de desarrollo local para servir la aplicación
5. THE Sistema_Conductor SHALL mantener compatibilidad con navegadores modernos

### Requisito 7

**Historia de Usuario:** Como conductor, quiero que mis datos se guarden de forma segura y gratuita, para que no pierda mi información y no tenga costos adicionales.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL utilizar IndexedDB como Base_Datos_Local para almacenar todos los registros
2. THE Sistema_Conductor SHALL mantener Persistencia_Datos entre sesiones del navegador
3. THE Sistema_Conductor SHALL funcionar completamente offline sin requerir servicios externos
4. WHEN el Usuario_Conductor cierra y reabre la aplicación, THE Sistema_Conductor SHALL cargar todos los datos previamente guardados
5. THE Sistema_Conductor SHALL proporcionar almacenamiento gratuito ilimitado dentro de los límites del navegador

### Requisito 8

**Historia de Usuario:** Como conductor, quiero que el sistema calcule automáticamente mis ganancias netas aplicando las reglas de negocio correctas, para que tenga un cálculo preciso de mis beneficios reales.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL aplicar Comision_Vehiculo del 52% sobre la Ganancia_Bruta total diaria
2. THE Sistema_Conductor SHALL aplicar Costo_Kilometraje de 0.05€ por cada kilómetro registrado
3. THE Sistema_Conductor SHALL aplicar Comision_FreeNow_Efectivo del 6% sobre los ingresos en efectivo de FreeNow
4. THE Sistema_Conductor SHALL sumar los gastos de combustible al final sin aplicar descuentos
5. THE Sistema_Conductor SHALL calcular Ganancia_Neta usando la fórmula: (Ganancia_Bruta - Comision_Vehiculo - Costo_Kilometraje - Comision_FreeNow_Efectivo) + Gastos_Combustible

### Requisito 9

**Historia de Usuario:** Como conductor, quiero ver informes mensuales con cálculos detallados, para que pueda analizar mis ganancias reales y tomar decisiones informadas.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL mostrar en informes mensuales la Ganancia_Bruta total del período
2. THE Sistema_Conductor SHALL mostrar el desglose de todos los descuentos aplicados (52%, kilometraje, FreeNow efectivo)
3. THE Sistema_Conductor SHALL mostrar el total de gastos de combustible del período
4. THE Sistema_Conductor SHALL mostrar la Ganancia_Neta final del mes
5. THE Sistema_Conductor SHALL proporcionar un resumen detallado de la fórmula de cálculo aplicada

### Requisito 10

**Historia de Usuario:** Como conductor, quiero descargar un informe mensual en PDF, para que pueda tener un documento oficial con el resumen detallado de mi actividad y cálculos.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL generar informes mensuales en formato PDF descargable
2. THE Sistema_Conductor SHALL incluir en el PDF el período de fechas del mes en formato dd/mm/aaaa
3. THE Sistema_Conductor SHALL incluir el nombre del conductor configurado en el perfil
4. THE Sistema_Conductor SHALL mostrar totales mensuales de: Km Recorridos, Número de Carreras, Uber App, FreeNow App, FreeNow Tarjeta, FreeNow Efectivo, Taxi Convencional Tarjeta, Taxi Convencional Efectivo, y Gastos de Combustible
5. THE Sistema_Conductor SHALL excluir las propinas del cálculo y mostrar la operación matemática completa del cálculo de ganancia neta

### Requisito 11

**Historia de Usuario:** Como conductor, quiero poder exportar mis datos, para que pueda hacer respaldos o usar la información en otras aplicaciones.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL permitir exportar todos los registros en formato JSON
2. THE Sistema_Conductor SHALL permitir importar datos desde un archivo JSON válido
3. THE Sistema_Conductor SHALL validar la integridad de los datos durante la importación
4. THE Sistema_Conductor SHALL mostrar confirmación antes de sobrescribir datos existentes
5. THE Sistema_Conductor SHALL mantener la estructura de datos consistente en exportaciones e importaciones

### Requisito 12

**Historia de Usuario:** Como conductor, quiero ver gráficos de tendencias en un dashboard visual, para que pueda analizar la evolución de mi actividad de forma intuitiva.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL mostrar un Dashboard_Visual con gráficos de tendencias interactivos
2. THE Sistema_Conductor SHALL proporcionar un selector de Periodo_Analisis con opciones de 7 días, 30 días, 3 meses y 6 meses
3. THE Sistema_Conductor SHALL mostrar un Grafico_Tendencia de ganancias netas por día en el período seleccionado
4. THE Sistema_Conductor SHALL mostrar un Grafico_Tendencia de kilómetros recorridos por día en el período seleccionado
5. THE Sistema_Conductor SHALL mostrar un Grafico_Tendencia de número de carreras por día en el período seleccionado

### Requisito 13

**Historia de Usuario:** Como conductor, quiero ver gráficos de distribución de ingresos por plataforma, para que pueda identificar cuáles son mis fuentes de ingresos más importantes.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL mostrar un gráfico de barras con ingresos totales por plataforma (Uber, FreeNow, Taxi Convencional)
2. THE Sistema_Conductor SHALL mostrar un gráfico circular (pie chart) con porcentaje de ingresos por plataforma
3. THE Sistema_Conductor SHALL actualizar los gráficos automáticamente según el Periodo_Analisis seleccionado
4. THE Sistema_Conductor SHALL mostrar valores numéricos y porcentajes en los gráficos
5. THE Sistema_Conductor SHALL permitir hacer clic en elementos del gráfico para ver detalles específicos

### Requisito 14

**Historia de Usuario:** Como conductor, quiero ver métricas de rendimiento en el dashboard de gráficos, para que pueda evaluar mi eficiencia y productividad.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL calcular y mostrar ganancia promedio por carrera en el período seleccionado
2. THE Sistema_Conductor SHALL calcular y mostrar ganancia promedio por kilómetro en el período seleccionado
3. THE Sistema_Conductor SHALL mostrar el número promedio de carreras por día trabajado
4. THE Sistema_Conductor SHALL mostrar un indicador de tendencia (subida/bajada) comparando con el período anterior
5. THE Sistema_Conductor SHALL resaltar visualmente las mejores y peores métricas del período

### Requisito 15

**Historia de Usuario:** Como conductor, quiero que los gráficos sean interactivos y responsivos, para que pueda explorar mis datos desde cualquier dispositivo.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL hacer los gráficos interactivos con tooltips que muestren valores exactos al pasar el cursor
2. THE Sistema_Conductor SHALL permitir hacer zoom y pan en gráficos de líneas temporales
3. THE Sistema_Conductor SHALL adaptar el tamaño y diseño de los gráficos a diferentes tamaños de pantalla
4. THE Sistema_Conductor SHALL mantener la funcionalidad táctil en dispositivos móviles
5. THE Sistema_Conductor SHALL cargar los gráficos de forma progresiva mostrando indicadores de carga