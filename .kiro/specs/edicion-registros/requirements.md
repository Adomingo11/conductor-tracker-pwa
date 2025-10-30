# Documento de Requisitos - Edición de Registros Existentes

## Introducción

La funcionalidad de Edición de Registros Existentes permite a los conductores modificar registros diarios previamente guardados, manteniendo un historial completo de cambios para auditoría y trazabilidad. Esta característica incluye capacidades de comparación visual antes/después de realizar ediciones, garantizando transparencia y control total sobre los datos históricos.

## Glosario

- **Sistema_Conductor**: La aplicación web de seguimiento de actividad para conductores
- **Usuario_Conductor**: Persona que utiliza la aplicación para registrar su actividad como conductor
- **Registro_Diario**: Entrada de datos correspondiente a un día específico de trabajo
- **Historial_Cambios**: Registro cronológico de todas las modificaciones realizadas a un Registro_Diario
- **Entrada_Historial**: Registro individual que documenta una modificación específica con fecha, hora y valores anteriores
- **Vista_Edicion**: Interfaz que permite modificar los datos de un Registro_Diario existente
- **Vista_Comparacion**: Interfaz que muestra lado a lado los valores originales y modificados de un registro
- **Boton_Editar**: Control de interfaz que activa el modo de edición para un Registro_Diario específico
- **Modal_Edicion**: Ventana emergente que contiene el formulario de edición de un registro
- **Confirmacion_Cambios**: Diálogo que solicita al usuario verificar las modificaciones antes de guardarlas
- **Auditoria_Registro**: Capacidad de revisar el historial completo de cambios de un Registro_Diario
- **Reversion_Cambios**: Capacidad de restaurar un Registro_Diario a un estado anterior del historial
- **Indicador_Modificado**: Marca visual que señala que un Registro_Diario ha sido editado después de su creación
- **Timestamp_Modificacion**: Fecha y hora exacta en que se realizó una modificación
- **Usuario_Modificador**: Identificación del usuario que realizó una modificación (en este caso, siempre el conductor)

## Requisitos

### Requisito 1

**Historia de Usuario:** Como conductor, quiero ver un botón de edición en cada registro del historial, para que pueda identificar fácilmente qué registros puedo modificar.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor visualiza el historial de registros, THE Sistema_Conductor SHALL mostrar un Boton_Editar junto a cada Registro_Diario
2. THE Sistema_Conductor SHALL hacer el Boton_Editar claramente visible con un icono de lápiz o texto "Editar"
3. THE Sistema_Conductor SHALL posicionar el Boton_Editar de forma consistente en cada fila del historial
4. WHEN el Usuario_Conductor pasa el cursor sobre el Boton_Editar, THE Sistema_Conductor SHALL mostrar un tooltip con el texto "Editar registro"
5. THE Sistema_Conductor SHALL mantener el Boton_Editar habilitado para todos los registros sin restricciones de fecha

### Requisito 2

**Historia de Usuario:** Como conductor, quiero abrir un formulario de edición al hacer clic en el botón de editar, para que pueda modificar los datos de un registro específico.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor hace clic en el Boton_Editar, THE Sistema_Conductor SHALL abrir un Modal_Edicion con los datos del registro seleccionado
2. THE Sistema_Conductor SHALL pre-cargar todos los campos del formulario con los valores actuales del Registro_Diario
3. THE Sistema_Conductor SHALL mostrar el título del modal indicando la fecha del registro que se está editando
4. THE Sistema_Conductor SHALL incluir un botón "Cancelar" que cierre el modal sin guardar cambios
5. THE Sistema_Conductor SHALL incluir un botón "Guardar Cambios" que valide y persista las modificaciones

### Requisito 3

**Historia de Usuario:** Como conductor, quiero modificar cualquier campo del registro en el formulario de edición, para que pueda corregir errores o actualizar información incompleta.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL permitir modificar la fecha del Registro_Diario
2. THE Sistema_Conductor SHALL permitir modificar kilómetros recorridos y número de carreras
3. THE Sistema_Conductor SHALL permitir modificar todos los campos de ingresos de Uber, FreeNow y Taxi Convencional
4. THE Sistema_Conductor SHALL permitir modificar los gastos de combustible
5. THE Sistema_Conductor SHALL recalcular automáticamente la ganancia neta cuando se modifique cualquier campo numérico

### Requisito 4

**Historia de Usuario:** Como conductor, quiero ver una vista de comparación antes de guardar los cambios, para que pueda verificar qué valores estoy modificando.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor hace cambios en el formulario de edición, THE Sistema_Conductor SHALL mostrar una Vista_Comparacion con valores originales y nuevos
2. THE Sistema_Conductor SHALL resaltar visualmente los campos que han sido modificados
3. THE Sistema_Conductor SHALL mostrar el valor original y el nuevo valor lado a lado para cada campo modificado
4. THE Sistema_Conductor SHALL calcular y mostrar la diferencia en la ganancia neta resultante de los cambios
5. THE Sistema_Conductor SHALL actualizar la Vista_Comparacion en tiempo real mientras el usuario edita los campos

### Requisito 5

**Historia de Usuario:** Como conductor, quiero confirmar los cambios antes de guardarlos permanentemente, para que pueda revisar y cancelar si detecto algún error.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor hace clic en "Guardar Cambios", THE Sistema_Conductor SHALL mostrar una Confirmacion_Cambios con resumen de modificaciones
2. THE Sistema_Conductor SHALL listar todos los campos modificados con sus valores anteriores y nuevos en la confirmación
3. THE Sistema_Conductor SHALL incluir botones "Confirmar" y "Revisar" en el diálogo de confirmación
4. WHEN el Usuario_Conductor hace clic en "Confirmar", THE Sistema_Conductor SHALL guardar las modificaciones y cerrar el modal
5. WHEN el Usuario_Conductor hace clic en "Revisar", THE Sistema_Conductor SHALL regresar al formulario de edición sin guardar

### Requisito 6

**Historia de Usuario:** Como conductor, quiero que el sistema guarde un historial de todos los cambios realizados a un registro, para que pueda auditar las modificaciones posteriores.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor confirma cambios en un Registro_Diario, THE Sistema_Conductor SHALL crear una Entrada_Historial con los valores anteriores
2. THE Sistema_Conductor SHALL almacenar en la Entrada_Historial el Timestamp_Modificacion exacto de la modificación
3. THE Sistema_Conductor SHALL guardar en la Entrada_Historial todos los campos que fueron modificados con sus valores previos
4. THE Sistema_Conductor SHALL mantener el Historial_Cambios ordenado cronológicamente de más reciente a más antiguo
5. THE Sistema_Conductor SHALL asociar cada Entrada_Historial con el Registro_Diario correspondiente mediante su identificador único

### Requisito 7

**Historia de Usuario:** Como conductor, quiero ver un indicador visual en los registros que han sido editados, para que pueda identificar rápidamente cuáles han sido modificados.

#### Criterios de Aceptación

1. WHEN un Registro_Diario ha sido modificado después de su creación, THE Sistema_Conductor SHALL mostrar un Indicador_Modificado junto al registro
2. THE Sistema_Conductor SHALL usar un icono distintivo (como un reloj o historial) para el Indicador_Modificado
3. THE Sistema_Conductor SHALL mostrar el número de veces que el registro ha sido editado en el Indicador_Modificado
4. WHEN el Usuario_Conductor pasa el cursor sobre el Indicador_Modificado, THE Sistema_Conductor SHALL mostrar la fecha de la última modificación
5. THE Sistema_Conductor SHALL diferenciar visualmente los registros modificados de los registros originales sin ediciones

### Requisito 8

**Historia de Usuario:** Como conductor, quiero acceder al historial completo de cambios de un registro, para que pueda ver todas las modificaciones realizadas a lo largo del tiempo.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor hace clic en el Indicador_Modificado, THE Sistema_Conductor SHALL mostrar el Historial_Cambios completo del registro
2. THE Sistema_Conductor SHALL mostrar cada Entrada_Historial con fecha, hora y campos modificados
3. THE Sistema_Conductor SHALL presentar los valores anteriores y nuevos para cada modificación en el historial
4. THE Sistema_Conductor SHALL ordenar las entradas del historial de más reciente a más antigua
5. THE Sistema_Conductor SHALL incluir un botón "Cerrar" para salir de la vista del historial

### Requisito 9

**Historia de Usuario:** Como conductor, quiero restaurar un registro a una versión anterior del historial, para que pueda deshacer cambios incorrectos.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor visualiza el Historial_Cambios, THE Sistema_Conductor SHALL mostrar un botón "Restaurar" junto a cada Entrada_Historial
2. WHEN el Usuario_Conductor hace clic en "Restaurar", THE Sistema_Conductor SHALL mostrar una confirmación antes de proceder
3. WHEN el Usuario_Conductor confirma la restauración, THE Sistema_Conductor SHALL revertir el Registro_Diario a los valores de la versión seleccionada
4. THE Sistema_Conductor SHALL crear una nueva Entrada_Historial documentando la Reversion_Cambios
5. THE Sistema_Conductor SHALL recalcular la ganancia neta con los valores restaurados

### Requisito 10

**Historia de Usuario:** Como conductor, quiero que las validaciones del formulario de edición sean las mismas que en el registro nuevo, para que mantenga la integridad de los datos.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL validar que todos los campos numéricos contengan valores no negativos durante la edición
2. THE Sistema_Conductor SHALL validar que la fecha del registro sea válida y no esté en el futuro
3. THE Sistema_Conductor SHALL mostrar mensajes de error en tiempo real para campos inválidos durante la edición
4. THE Sistema_Conductor SHALL deshabilitar el botón "Guardar Cambios" mientras existan errores de validación
5. THE Sistema_Conductor SHALL aplicar las mismas reglas de cálculo de ganancia neta que en registros nuevos

### Requisito 11

**Historia de Usuario:** Como conductor, quiero que los cambios en un registro actualicen automáticamente todas las vistas relacionadas, para que vea información consistente en toda la aplicación.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor guarda cambios en un Registro_Diario, THE Sistema_Conductor SHALL actualizar las métricas totales del dashboard
2. THE Sistema_Conductor SHALL actualizar los gráficos del dashboard visual que incluyan el registro modificado
3. THE Sistema_Conductor SHALL actualizar los informes semanales y mensuales que contengan el registro editado
4. THE Sistema_Conductor SHALL actualizar la vista del historial mostrando los nuevos valores del registro
5. THE Sistema_Conductor SHALL refrescar todas las vistas abiertas sin requerir recarga manual de la página

### Requisito 12

**Historia de Usuario:** Como conductor, quiero cancelar la edición en cualquier momento sin perder el registro original, para que pueda explorar cambios sin comprometerme a guardarlos.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor hace clic en "Cancelar" en el Modal_Edicion, THE Sistema_Conductor SHALL cerrar el modal sin guardar cambios
2. WHEN el Usuario_Conductor hace clic fuera del Modal_Edicion, THE Sistema_Conductor SHALL mostrar una confirmación antes de cerrar si hay cambios sin guardar
3. THE Sistema_Conductor SHALL preservar todos los valores originales del Registro_Diario cuando se cancela la edición
4. THE Sistema_Conductor SHALL limpiar el formulario de edición al cancelar para evitar confusión en futuras ediciones
5. THE Sistema_Conductor SHALL mostrar una notificación confirmando que los cambios fueron descartados

### Requisito 13

**Historia de Usuario:** Como conductor, quiero que el historial de cambios se incluya en las exportaciones de datos, para que pueda mantener un registro completo de auditoría.

#### Criterios de Aceptación

1. WHEN el Usuario_Conductor exporta datos en formato JSON, THE Sistema_Conductor SHALL incluir el Historial_Cambios de cada Registro_Diario
2. THE Sistema_Conductor SHALL mantener la estructura del historial con todas las Entradas_Historial asociadas a cada registro
3. WHEN el Usuario_Conductor importa datos, THE Sistema_Conductor SHALL restaurar el Historial_Cambios completo de cada registro
4. THE Sistema_Conductor SHALL validar la integridad del historial durante la importación
5. THE Sistema_Conductor SHALL preservar los Timestamp_Modificacion originales en exportaciones e importaciones

### Requisito 14

**Historia de Usuario:** Como conductor, quiero ver estadísticas sobre mis ediciones de registros, para que pueda entender mis patrones de corrección de datos.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL calcular el número total de registros que han sido editados
2. THE Sistema_Conductor SHALL calcular el promedio de ediciones por registro modificado
3. THE Sistema_Conductor SHALL identificar los campos más frecuentemente editados
4. THE Sistema_Conductor SHALL mostrar estas estadísticas en una sección de la vista de ajustes o informes
5. THE Sistema_Conductor SHALL actualizar las estadísticas automáticamente después de cada edición

### Requisito 15

**Historia de Usuario:** Como conductor, quiero que el sistema mantenga el rendimiento óptimo incluso con historiales de cambios extensos, para que la aplicación siga siendo rápida y responsiva.

#### Criterios de Aceptación

1. THE Sistema_Conductor SHALL cargar el Historial_Cambios solo cuando el usuario lo solicite explícitamente
2. THE Sistema_Conductor SHALL limitar la visualización inicial del historial a las últimas 10 entradas con opción de "Ver más"
3. THE Sistema_Conductor SHALL indexar el Historial_Cambios en la base de datos para consultas rápidas
4. THE Sistema_Conductor SHALL completar operaciones de guardado de ediciones en menos de 500 milisegundos
5. THE Sistema_Conductor SHALL mantener la interfaz responsiva durante la carga y guardado de historiales extensos
