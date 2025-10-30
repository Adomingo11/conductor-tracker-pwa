# Plan de Implementación - Edición de Registros Existentes

- [ ] 1. Actualizar esquema de base de datos y crear HistoryService

- [x] 1.1 Actualizar DatabaseService con nueva versión de esquema



  - Modificar setupSchema() para incluir tabla historial_cambios con índices
  - Añadir campos editCount, lastEditedAt, isModified a tabla registros
  - Implementar migración automática de versión 1 a versión 2
  - Añadir método getRegistroById() para obtener registro específico
  - Actualizar método updateRegistro() para manejar flags de edición



  - _Requisitos: 6.1, 6.2, 6.5, 15.3_

- [ ] 1.2 Crear HistoryService para gestión de historial
  - Implementar createHistoryEntry() para crear entradas de historial
  - Crear getHistory() para obtener historial de un registro
  - Desarrollar compareObjects() para detectar campos modificados
  - Implementar restoreVersion() para restaurar versiones anteriores
  - Crear getEditCount() para obtener número de ediciones
  - Desarrollar getEditStatistics() para estadísticas de ediciones
  - Añadir métodos auxiliares extractChangedValues() y getNestedValue()
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.4, 14.1, 14.2, 14.3_

- [ ]* 1.3 Escribir tests unitarios para HistoryService
  - Crear tests para createHistoryEntry() con diferentes escenarios
  - Escribir tests para compareObjects() validando detección de cambios
  - Probar getHistory() verificando orden cronológico
  - Validar restoreVersion() con múltiples restauraciones


  - Probar getEditStatistics() con diferentes conjuntos de datos
  - _Requisitos: 6.5, 9.4, 14.5_

- [ ] 2. Implementar Event Bus para sincronización de componentes




- [ ] 2.1 Crear EventBus class para comunicación entre componentes
  - Implementar métodos on(), emit() y off()
  - Crear instancia global window.eventBus
  - Documentar eventos disponibles (registro-updated, registro-deleted)
  - Añadir manejo de errores en callbacks
  - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_



- [ ] 2.2 Integrar EventBus en componentes existentes
  - Modificar Dashboard para escuchar evento 'registro-updated'
  - Actualizar DashboardVisual para recargar gráficos en ediciones
  - Modificar Informes para recalcular totales en ediciones
  - Actualizar Historial para refrescar lista después de ediciones
  - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_



- [ ] 3. Crear componente ComparisonView

- [ ] 3.1 Implementar ComparisonView class
  - Crear constructor con referencia al contenedor DOM
  - Implementar update() para actualizar comparación con datos
  - Desarrollar highlightChanges() para resaltar campos modificados
  - Crear calculateDifferences() para calcular diferencias numéricas


  - Implementar render() para renderizar vista de comparación
  - Añadir clear() para limpiar la vista
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3.2 Crear estilos CSS para ComparisonView
  - Diseñar layout de dos columnas (antes/después)

  - Estilizar flechas de cambio y badges de diferencia

  - Añadir colores para aumentos (verde) y disminuciones (rojo)
  - Crear animaciones de actualización suave
  - Hacer diseño responsivo para móviles
  - _Requisitos: 4.1, 4.2, 4.3_

- [ ] 4. Crear componente EditRegistroModal


- [ ] 4.1 Implementar estructura HTML del modal de edición
  - Crear modal con header, body y footer
  - Añadir formulario de edición con todos los campos
  - Integrar sección de ComparisonView en el modal
  - Añadir botones "Cancelar" y "Guardar Cambios"
  - Crear overlay de fondo semi-transparente
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_


- [ ] 4.2 Implementar EditRegistroModal class
  - Crear constructor con dependencias (dbService, calcService, validationService, historyService)
  - Implementar open() para abrir modal con datos del registro
  - Desarrollar loadRegistro() para cargar datos desde DB
  - Crear handleFieldChange() para manejar cambios en campos
  - Implementar updateComparison() para actualizar vista de comparación en tiempo real
  - Añadir validateForm() para validación completa del formulario


  - Desarrollar close() para cerrar modal con confirmación si hay cambios
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 10.1, 10.2, 10.3, 10.4, 10.5_


- [ ] 4.3 Implementar lógica de guardado con confirmación
  - Crear showConfirmation() para mostrar diálogo de confirmación
  - Implementar saveChanges() para guardar cambios confirmados
  - Integrar con HistoryService para crear entrada de historial
  - Actualizar flags del registro (editCount, lastEditedAt, isModified)
  - Emitir evento 'registro-updated' después de guardar
  - Mostrar notificación de éxito con resumen de cambios
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.4 Implementar lógica de cancelación
  - Crear cancel() para cerrar modal sin guardar
  - Detectar cambios sin guardar al intentar cerrar
  - Mostrar confirmación si hay cambios pendientes
  - Limpiar formulario al cancelar
  - Mostrar notificación de cancelación
  - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 4.5 Añadir estilos CSS para EditRegistroModal
  - Diseñar modal responsivo (80% viewport, max 900px)
  - Crear animaciones de apertura/cierre (fade + scale)
  - Estilizar formulario con mismo diseño que RegistroDiario
  - Añadir estilos para estados de validación
  - Crear diseño responsivo para móviles
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Modificar componente Historial para integrar edición

- [ ] 5.1 Añadir botón "Editar" a cada fila del historial
  - Crear método renderEditButton() para generar botón de edición
  - Añadir icono de lápiz (✏️) al botón
  - Posicionar botón de forma consistente en cada fila
  - Añadir tooltip "Editar registro" al botón
  - Configurar event listener para abrir EditRegistroModal
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 5.2 Añadir indicador de "modificado" a registros editados
  - Crear método renderModifiedIndicator() para mostrar indicador
  - Mostrar icono de historial (🕐) con badge de número de ediciones
  - Añadir tooltip con fecha de última edición
  - Aplicar estilos distintivos (color azul/morado)
  - Configurar event listener para abrir HistoryViewer
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5.3 Integrar EditRegistroModal en Historial
  - Instanciar EditRegistroModal en constructor de Historial
  - Conectar botones de edición con modal
  - Actualizar lista después de ediciones usando EventBus
  - Manejar errores de apertura de modal
  - _Requisitos: 2.1, 2.2, 11.4_

- [ ] 6. Crear componente HistoryViewer

- [ ] 6.1 Implementar estructura HTML del visor de historial
  - Crear modal con header y body
  - Diseñar timeline vertical para entradas de historial
  - Crear plantilla para cada entrada con detalles expandibles
  - Añadir botón "Restaurar" en cada entrada
  - Incluir botón "Cerrar" en footer
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.2 Implementar HistoryViewer class
  - Crear constructor con dependencia de HistoryService
  - Implementar open() para abrir visor con historial del registro
  - Desarrollar loadHistory() para cargar entradas desde DB
  - Crear renderHistoryEntries() para renderizar timeline
  - Implementar paginación para historiales extensos (>10 entradas)
  - Añadir close() para cerrar visor
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 15.1, 15.2_

- [ ] 6.3 Implementar funcionalidad de restauración
  - Crear showRestoreConfirmation() para confirmar restauración
  - Implementar restoreVersion() para ejecutar restauración
  - Integrar con HistoryService.restoreVersion()
  - Emitir evento 'registro-updated' después de restaurar
  - Cerrar visor y mostrar notificación de éxito
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6.4 Añadir estilos CSS para HistoryViewer
  - Diseñar timeline vertical con línea conectora
  - Estilizar tarjetas de entradas de historial
  - Crear animaciones de expansión para detalles
  - Añadir estilos para botones de restauración
  - Hacer diseño responsivo para móviles
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Actualizar ExportImportService para incluir historial

- [ ] 7.1 Modificar exportación para incluir historial de cambios
  - Actualizar exportData() para incluir tabla historial_cambios
  - Mantener relaciones entre registros y sus historiales
  - Añadir versión de esquema en exportación
  - Validar integridad de datos antes de exportar
  - _Requisitos: 13.1, 13.2, 13.5_

- [ ] 7.2 Modificar importación para restaurar historial
  - Actualizar importData() para importar historial_cambios
  - Validar integridad del historial durante importación
  - Restaurar relaciones entre registros y historiales
  - Preservar timestamps originales de modificaciones
  - Manejar importaciones sin historial (compatibilidad hacia atrás)
  - _Requisitos: 13.3, 13.4, 13.5_

- [ ] 8. Implementar vista de estadísticas de ediciones

- [ ] 8.1 Crear sección de estadísticas en Ajustes o Informes
  - Añadir nueva sección "Estadísticas de Ediciones"
  - Diseñar layout para mostrar métricas
  - Crear tarjetas para cada estadística
  - Añadir gráfico de campos más editados (opcional)
  - _Requisitos: 14.1, 14.2, 14.3, 14.4_

- [ ] 8.2 Integrar HistoryService.getEditStatistics()
  - Cargar estadísticas al abrir la sección
  - Mostrar total de registros editados
  - Mostrar promedio de ediciones por registro
  - Listar campos más frecuentemente editados
  - Actualizar estadísticas después de cada edición
  - _Requisitos: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 9. Optimización y manejo de errores

- [ ] 9.1 Implementar optimizaciones de performance
  - Añadir lazy loading del historial (solo cuando se solicita)
  - Implementar caché de registro durante edición
  - Optimizar actualización de vistas usando EventBus
  - Añadir debouncing en actualización de comparación
  - Implementar paginación en historiales extensos
  - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 9.2 Implementar manejo robusto de errores
  - Añadir try-catch en todas las operaciones de DB
  - Crear mensajes de error específicos para cada caso
  - Implementar rollback en caso de fallo al guardar
  - Añadir validación de integridad antes de restaurar
  - Manejar conflictos de concurrencia (registro modificado externamente)
  - Mostrar notificaciones de error amigables al usuario
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 9.3 Escribir tests de integración
  - Crear test de flujo completo de edición (crear → editar → verificar)
  - Escribir test de restauración múltiple (editar 3 veces → restaurar)
  - Probar sincronización de vistas después de ediciones
  - Validar exportación/importación con historial
  - Probar manejo de errores en diferentes escenarios
  - _Requisitos: 6.5, 9.4, 11.5, 13.5_

- [ ]* 9.4 Escribir tests E2E
  - Crear test E2E de edición simple desde historial
  - Escribir test de cancelación con cambios pendientes
  - Probar flujo completo de ver historial y restaurar
  - Validar actualización de todas las vistas después de editar
  - Probar edición en dispositivos móviles (responsividad)
  - _Requisitos: 1.5, 2.5, 4.5, 5.5, 8.5, 9.5, 11.5, 12.5_

- [ ] 10. Documentación y pulido final

- [ ] 10.1 Crear documentación de usuario
  - Escribir guía de cómo editar un registro
  - Documentar cómo ver el historial de cambios
  - Explicar cómo restaurar versiones anteriores
  - Crear FAQ sobre ediciones
  - Añadir tooltips y ayuda contextual en la UI
  - _Requisitos: 1.4, 7.4, 8.5_

- [ ] 10.2 Actualizar README con nueva funcionalidad
  - Añadir sección sobre edición de registros
  - Documentar estructura de historial_cambios
  - Explicar migración de base de datos
  - Incluir capturas de pantalla de la funcionalidad
  - _Requisitos: 6.5, 13.5_

- [ ] 10.3 Realizar pruebas de usabilidad y ajustes finales
  - Probar flujos completos en diferentes navegadores
  - Validar responsividad en móviles y tablets
  - Ajustar animaciones y transiciones
  - Optimizar mensajes de error y confirmación
  - Verificar accesibilidad (contraste, navegación por teclado)
  - _Requisitos: 1.5, 2.5, 4.5, 5.5, 12.5, 15.5_
