import{X as E}from"./vendor-2jmnBxhj.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();class C{constructor(){this.db=new E("ConductorTrackerDB"),this.setupSchema(),this.errorHandler=null,this.performanceService=null,this.queryCache=new Map,this.cacheExpiry=new Map,this.defaultCacheTTL=2*60*1e3}setErrorHandler(e){this.errorHandler=e}setPerformanceService(e){this.performanceService=e}setupSchema(){this.db.version(1).stores({registros:"++id, fecha, kmRecorridos, numeroCarreras, uber, freeNow, taxiConvencional, gastos, gananciaBruta, gananciaNeta, createdAt, updatedAt",conductor:"++id, nombre, apellido, configuracion, createdAt, updatedAt",configuracion:"++id, tema, idioma, moneda, formatoFecha, backupAutomatico, updatedAt"}),this.db.version(2).stores({registros:"++id, fecha, kmRecorridos, numeroCarreras, uber, freeNow, taxiConvencional, gastos, gananciaBruta, gananciaNeta, createdAt, updatedAt, editCount, lastEditedAt, isModified",historial_cambios:"++id, registroId, timestamp, changedFields, previousValues, newValues",conductor:"++id, nombre, apellido, configuracion, createdAt, updatedAt",configuracion:"++id, tema, idioma, moneda, formatoFecha, backupAutomatico, updatedAt"}).upgrade(e=>e.table("registros").toCollection().modify(t=>{t.editCount=0,t.lastEditedAt=null,t.isModified=!1}))}async initDatabase(){try{return await this.db.open(),console.log("Database initialized successfully"),await this.db.configuracion.count()===0&&await this.createDefaultConfig(),!0}catch(e){throw console.error("Error initializing database:",e),this.errorHandler&&this.errorHandler.handleDatabaseError(e,"inicialización de base de datos"),e}}async createDefaultConfig(){const e={tema:"dark",idioma:"es",moneda:"EUR",formatoFecha:"dd/mm/yyyy",backupAutomatico:!1,updatedAt:new Date};return await this.db.configuracion.add(e)}async saveRegistroDiario(e){try{const t=new Date,a={...e,createdAt:t,updatedAt:t},i=()=>this.db.registros.add(a),o=this.performanceService?await this.performanceService.optimizedDBOperation(i,"saveRegistroDiario"):await i();if(this.performanceService){this.performanceService.clearCache("all-registros");const r=e.fecha;this.clearDateRangeCaches(r)}return{id:o,...a}}catch(t){throw console.error("Error saving registro:",t),this.errorHandler&&this.errorHandler.handleDatabaseError(t,"guardado de registro"),t}}clearDateRangeCaches(e){if(!this.performanceService)return;const t=new Date(e),a=t.getFullYear(),i=t.getMonth(),o=new Date(a,i,1).toISOString().split("T")[0],r=new Date(a,i+1,0).toISOString().split("T")[0];this.performanceService.clearCache(`registros-${o}-${r}`);const s=new Date(t);s.setDate(t.getDate()-t.getDay());const c=new Date(s);c.setDate(s.getDate()+6),this.performanceService.clearCache(`registros-${s.toISOString().split("T")[0]}-${c.toISOString().split("T")[0]}`)}async getRegistrosByDateRange(e,t){const a=`registros-${e}-${t}`;try{if(this.performanceService){const r=this.performanceService.getCache(a);if(r)return r}const i=()=>this.db.registros.where("fecha").between(e,t,!0,!0).toArray(),o=this.performanceService?await this.performanceService.optimizedDBOperation(i,"getRegistrosByDateRange"):await i();return this.performanceService&&this.performanceService.setCache(a,o,60*1e3),o}catch(i){throw console.error("Error getting registros by date range:",i),this.errorHandler&&this.errorHandler.handleDatabaseError(i,"consulta de registros por fecha"),i}}async getAllRegistros(){const e="all-registros";try{if(this.performanceService){const i=this.performanceService.getCache(e);if(i)return i}const t=()=>this.db.registros.orderBy("fecha").reverse().toArray(),a=this.performanceService?await this.performanceService.optimizedDBOperation(t,"getAllRegistros"):await t();return this.performanceService&&this.performanceService.setCache(e,a,this.defaultCacheTTL),a}catch(t){throw console.error("Error getting all registros:",t),this.errorHandler&&this.errorHandler.handleDatabaseError(t,"consulta de todos los registros"),t}}async getRegistroById(e){try{const t=await this.db.registros.get(e);if(!t)throw new Error(`Registro with id ${e} not found`);return t}catch(t){throw console.error("Error getting registro by id:",t),this.errorHandler&&this.errorHandler.handleDatabaseError(t,"consulta de registro por ID"),t}}async updateRegistro(e,t){try{const a=new Date,i=await this.db.registros.get(e);if(!i)throw new Error(`Registro with id ${e} not found`);const o={...t,updatedAt:a,editCount:(i.editCount||0)+1,lastEditedAt:a,isModified:!0};return await this.db.registros.update(e,o),this.performanceService&&(this.performanceService.clearCache("all-registros"),this.clearDateRangeCaches(t.fecha||i.fecha)),await this.db.registros.get(e)}catch(a){throw console.error("Error updating registro:",a),this.errorHandler&&this.errorHandler.handleDatabaseError(a,"actualización de registro"),a}}async deleteRegistro(e){try{return await this.db.registros.delete(e)}catch(t){throw console.error("Error deleting registro:",t),t}}async saveConductor(e){try{const t=await this.db.conductor.toArray(),a=new Date;if(t.length>0){const i=t[0].id;return await this.db.conductor.update(i,{...e,updatedAt:a}),await this.db.conductor.get(i)}else{const i={...e,createdAt:a,updatedAt:a};return{id:await this.db.conductor.add(i),...i}}}catch(t){throw console.error("Error saving conductor:",t),t}}async getConductor(){try{const e=await this.db.conductor.toArray();return e.length>0?e[0]:null}catch(e){throw console.error("Error getting conductor:",e),e}}async getConfiguracion(){try{const e=await this.db.configuracion.toArray();return e.length>0?e[0]:null}catch(e){throw console.error("Error getting configuracion:",e),e}}async updateConfiguracion(e){try{const t=await this.db.configuracion.toArray(),a=new Date;if(t.length>0){const i=t[0].id;return await this.db.configuracion.update(i,{...e,updatedAt:a}),await this.db.configuracion.get(i)}else{const i={...e,updatedAt:a};return{id:await this.db.configuracion.add(i),...i}}}catch(t){throw console.error("Error updating configuracion:",t),t}}async exportData(){try{const e=await this.getAllRegistros(),t=await this.getConductor(),a=await this.getConfiguracion();let i=[];try{i=await this.db.historial_cambios.toArray()}catch{console.log("historial_cambios table not found, skipping...")}return{version:"2.0.0",schemaVersion:2,exportDate:new Date().toISOString(),data:{registros:e,conductor:t,configuracion:a,historialCambios:i}}}catch(e){throw console.error("Error exporting data:",e),e}}async importData(e){try{if(!e.data)throw new Error("Invalid import data format");const{registros:t,conductor:a,configuracion:i,historialCambios:o}=e.data;await this.db.registros.clear(),await this.db.conductor.clear(),await this.db.configuracion.clear();try{await this.db.historial_cambios.clear()}catch{console.log("historial_cambios table not found during import, skipping...")}if(t&&t.length>0){const r=t.map(s=>({...s,editCount:s.editCount||0,lastEditedAt:s.lastEditedAt||null,isModified:s.isModified||!1}));await this.db.registros.bulkAdd(r)}if(a&&await this.db.conductor.add(a),i&&await this.db.configuracion.add(i),o&&o.length>0)try{await this.db.historial_cambios.bulkAdd(o)}catch(r){console.warn("Could not import historial_cambios:",r)}return this.performanceService&&this.performanceService.clearCache("all-registros"),!0}catch(t){throw console.error("Error importing data:",t),t}}}class S{constructor(){this.COMISION_VEHICULO=.52,this.COSTO_KILOMETRAJE=.05,this.COMISION_FREENOW_EFECTIVO=.06}calculateGananciaNeta(e){const{kmRecorridos:t=0,uber:a={},freeNow:i={},taxiConvencional:o={},gastos:r={}}=e,s=parseFloat(a.app||0),c=parseFloat(i.app||0),n=parseFloat(i.tarjeta||0),d=parseFloat(i.efectivo||0),l=parseFloat(o.tarjeta||0),u=parseFloat(o.efectivo||0),p=s+c+n+d+l+u,f=this.applyComisionVehiculo(p),g=this.applyCostoKilometraje(t),w=this.applyComisionFreeNowEfectivo(d),y=parseFloat(r.combustible||0),b=p-f-g-w+y;return{gananciaBruta:this.roundToTwo(p),comisionVehiculo:this.roundToTwo(f),costoKilometraje:this.roundToTwo(g),comisionFreeNowEfectivo:this.roundToTwo(w),gastosCombustible:this.roundToTwo(y),gananciaNeta:this.roundToTwo(b),detalles:{uberApp:s,freeNowApp:c,freeNowTarjeta:n,freeNowEfectivo:d,taxiTarjeta:l,taxiEfectivo:u,kmRecorridos:parseFloat(t||0)}}}calculateMonthlyTotals(e){if(!e||e.length===0)return this.getEmptyTotals();const t=e.reduce((a,i)=>{var r,s,c,n,d,l,u;const o=this.calculateGananciaNeta(i);return{kmRecorridos:a.kmRecorridos+(parseFloat(i.kmRecorridos)||0),numeroCarreras:a.numeroCarreras+(parseFloat(i.numeroCarreras)||0),uberApp:a.uberApp+(parseFloat((r=i.uber)==null?void 0:r.app)||0),freeNowApp:a.freeNowApp+(parseFloat((s=i.freeNow)==null?void 0:s.app)||0),freeNowTarjeta:a.freeNowTarjeta+(parseFloat((c=i.freeNow)==null?void 0:c.tarjeta)||0),freeNowEfectivo:a.freeNowEfectivo+(parseFloat((n=i.freeNow)==null?void 0:n.efectivo)||0),taxiTarjeta:a.taxiTarjeta+(parseFloat((d=i.taxiConvencional)==null?void 0:d.tarjeta)||0),taxiEfectivo:a.taxiEfectivo+(parseFloat((l=i.taxiConvencional)==null?void 0:l.efectivo)||0),gastosCombustible:a.gastosCombustible+(parseFloat((u=i.gastos)==null?void 0:u.combustible)||0),gananciaBruta:a.gananciaBruta+o.gananciaBruta,comisionVehiculo:a.comisionVehiculo+o.comisionVehiculo,costoKilometraje:a.costoKilometraje+o.costoKilometraje,comisionFreeNowEfectivo:a.comisionFreeNowEfectivo+o.comisionFreeNowEfectivo,gananciaNeta:a.gananciaNeta+o.gananciaNeta}},this.getEmptyTotals());return Object.keys(t).forEach(a=>{t[a]=this.roundToTwo(t[a])}),t}calculateWeeklyTotals(e){return this.calculateMonthlyTotals(e)}calculateDashboardMetrics(e){const t=this.calculateMonthlyTotals(e);return{totalKm:t.kmRecorridos,totalCarreras:t.numeroCarreras,totalGanancias:t.gananciaNeta}}applyComisionVehiculo(e){const t=parseFloat(e)||0;return this.roundToTwo(t*this.COMISION_VEHICULO)}applyCostoKilometraje(e){const t=parseFloat(e)||0;return this.roundToTwo(t*this.COSTO_KILOMETRAJE)}applyComisionFreeNowEfectivo(e){const t=parseFloat(e)||0;return this.roundToTwo(t*this.COMISION_FREENOW_EFECTIVO)}getEmptyTotals(){return{kmRecorridos:0,numeroCarreras:0,uberApp:0,freeNowApp:0,freeNowTarjeta:0,freeNowEfectivo:0,taxiTarjeta:0,taxiEfectivo:0,gastosCombustible:0,gananciaBruta:0,comisionVehiculo:0,costoKilometraje:0,comisionFreeNowEfectivo:0,gananciaNeta:0}}roundToTwo(e){return Math.round((e+Number.EPSILON)*100)/100}formatCurrency(e){return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(e)}analyzePeriod(e){if(!e||e.length===0)return{totals:this.getEmptyTotals(),averages:this.getEmptyAverages(),workingDays:0,bestDay:null,worstDay:null};const t=this.calculateMonthlyTotals(e),a=e.length,i={gananciaPorDia:t.gananciaNeta/a,kmPorDia:t.kmRecorridos/a,carrerasPorDia:t.numeroCarreras/a,gananciaPorCarrera:t.numeroCarreras>0?t.gananciaNeta/t.numeroCarreras:0,gananciaPorKm:t.kmRecorridos>0?t.gananciaNeta/t.kmRecorridos:0};let o=null,r=null,s=-1/0,c=1/0;return e.forEach(n=>{const d=this.calculateGananciaNeta(n);d.gananciaNeta>s&&(s=d.gananciaNeta,o={fecha:n.fecha,ganancia:d.gananciaNeta}),d.gananciaNeta<c&&(c=d.gananciaNeta,r={fecha:n.fecha,ganancia:d.gananciaNeta})}),Object.keys(i).forEach(n=>{i[n]=this.roundToTwo(i[n])}),{totals:t,averages:i,workingDays:a,bestDay:o,worstDay:r}}comparePeriods(e,t){const a=this.analyzePeriod(e),i=this.analyzePeriod(t),o=(r,s)=>s===0?r>0?100:0:this.roundToTwo((r-s)/s*100);return{current:a,previous:i,changes:{gananciaNeta:o(a.totals.gananciaNeta,i.totals.gananciaNeta),kmRecorridos:o(a.totals.kmRecorridos,i.totals.kmRecorridos),numeroCarreras:o(a.totals.numeroCarreras,i.totals.numeroCarreras),gananciaPorDia:o(a.averages.gananciaPorDia,i.averages.gananciaPorDia),workingDays:o(a.workingDays,i.workingDays)}}}getEmptyAverages(){return{gananciaPorDia:0,kmPorDia:0,carrerasPorDia:0,gananciaPorCarrera:0,gananciaPorKm:0}}generateCalculationSummary(e){return{formula:`(${e.gananciaBruta}€ - ${e.comisionVehiculo}€ - ${e.costoKilometraje}€ - ${e.comisionFreeNowEfectivo}€) + ${e.gastosCombustible}€ = ${e.gananciaNeta}€`,breakdown:{"Ganancia Bruta":this.formatCurrency(e.gananciaBruta),"Comisión Vehículo (52%)":`-${this.formatCurrency(e.comisionVehiculo)}`,"Costo Kilometraje":`-${this.formatCurrency(e.costoKilometraje)}`,"Comisión FreeNow Efectivo (6%)":`-${this.formatCurrency(e.comisionFreeNowEfectivo)}`,"Gastos Combustible":`+${this.formatCurrency(e.gastosCombustible)}`,"Ganancia Neta":this.formatCurrency(e.gananciaNeta)}}}}class N{constructor(){this.currentView="dashboard",this.navigationElement=null,this.init()}init(){this.createNavigationStructure(),this.setupEventListeners(),this.updateActiveView(this.currentView)}createNavigationStructure(){if(this.navigationElement=document.querySelector(".navigation"),!this.navigationElement){this.navigationElement=document.createElement("nav"),this.navigationElement.className="navigation";const t=document.getElementById("app");t.insertBefore(this.navigationElement,t.firstChild)}const e=[{id:"dashboard",label:"Dashboard",icon:"📊"},{id:"registro",label:"Registro Diario",icon:"📝"},{id:"informes",label:"Informes",icon:"📈"},{id:"ajustes",label:"Ajustes",icon:"⚙️"}];this.navigationElement.innerHTML="",e.forEach(t=>{const a=document.createElement("button");a.className="nav-btn",a.dataset.view=t.id,a.innerHTML=`${t.icon} ${t.label}`,this.navigationElement.appendChild(a)})}setupEventListeners(){this.navigationElement.addEventListener("click",e=>{if(e.target.classList.contains("nav-btn")){const t=e.target.dataset.view;this.navigateTo(t)}}),window.addEventListener("popstate",e=>{var a;const t=((a=e.state)==null?void 0:a.view)||"dashboard";this.navigateTo(t,!1)}),window.history.state||window.history.replaceState({view:this.currentView},"",`#${this.currentView}`)}navigateTo(e,t=!0){if(!["dashboard","registro","informes","ajustes"].includes(e)){console.warn(`Invalid view: ${e}`);return}t&&window.history.pushState({view:e},"",`#${e}`),this.currentView=e,this.updateActiveView(e),this.updateContentView(e),window.dispatchEvent(new CustomEvent("navigation",{detail:{view:e,previousView:this.currentView}}))}updateActiveView(e){this.navigationElement.querySelectorAll(".nav-btn").forEach(i=>i.classList.remove("active"));const a=this.navigationElement.querySelector(`[data-view="${e}"]`);a&&a.classList.add("active")}updateContentView(e){document.querySelectorAll(".view").forEach(i=>i.classList.remove("active"));const a=document.getElementById(`${e}-view`);a?a.classList.add("active"):console.warn(`View element not found: ${e}-view`)}getCurrentView(){return this.currentView}setView(e){this.navigateTo(e)}}class B{constructor(e,t){this.dbService=e,this.calcService=t,this.isLoading=!1}init(){this.setupEventListeners(),this.setupEventBusListeners(),this.loadData()}setupEventListeners(){const e=document.getElementById("registrar-nuevo-dia");e&&e.addEventListener("click",()=>{window.app&&window.app.navigateTo("registro")})}setupEventBusListeners(){window.eventBus&&(window.eventBus.on("registro-updated",()=>{this.loadData()}),window.eventBus.on("registro-deleted",()=>{this.loadData()}),window.eventBus.on("registro-created",()=>{this.loadData()}))}async loadData(){if(!this.isLoading)try{this.isLoading=!0,this.showLoadingState();const[e,t]=await Promise.all([this.dbService.getConductor(),this.dbService.getAllRegistros()]),a=this.calcService.calculateDashboardMetrics(t);this.updateWelcomeMessage(e),this.updateMetrics(a),this.hideLoadingState()}catch(e){console.error("Error loading dashboard data:",e),this.showError("Error al cargar los datos del dashboard"),this.hideLoadingState()}finally{this.isLoading=!1}}updateMetrics(e){const t=document.getElementById("total-km"),a=document.getElementById("total-carreras"),i=document.getElementById("total-ganancias");t&&(t.textContent=this.formatNumber(e.totalKm)),a&&(a.textContent=this.formatNumber(e.totalCarreras)),i&&(i.textContent=this.formatNumber(e.totalGanancias)),e.totalKm===0&&e.totalCarreras===0&&e.totalGanancias===0&&this.handleEmptyState(),setTimeout(()=>{this.animateMetrics()},100)}animateMetrics(){document.querySelectorAll(".metric-card").forEach((t,a)=>{setTimeout(()=>{t.style.transform="scale(1.05)",setTimeout(()=>{t.style.transform="scale(1)"},200)},a*100)})}showLoadingState(){document.querySelectorAll(".metric-value").forEach(t=>{t.textContent="...",t.classList.add("loading")})}hideLoadingState(){document.querySelectorAll(".metric-value").forEach(t=>{t.classList.remove("loading")})}formatNumber(e){return e===0||e===null||e===void 0?"0":e>=1e3?new Intl.NumberFormat("es-ES").format(Math.round(e)):Math.round(e*10)/10}showError(e){const t=document.querySelector(".error-message");t&&t.remove();const a=document.createElement("div");a.className="error-message",a.textContent=e;const i=document.querySelector(".metrics-grid");i&&i.parentNode.insertBefore(a,i),window.app&&window.app.showNotification&&window.app.showNotification(e,"error"),setTimeout(()=>{a.parentNode&&a.remove()},5e3)}async refresh(){await this.loadData()}updateWelcomeMessage(e){const t=document.querySelector(".welcome-section h1"),a=document.querySelector(".welcome-section p");if(e&&e.nombre&&e.apellido){const i=new Date().getHours();let o="Buen día";i<12?o="Buenos días":i<18?o="Buenas tardes":o="Buenas noches",t&&(t.textContent=`${o}, ${e.nombre}`),a&&(a.textContent="Aquí tienes un resumen de tu actividad total como conductor.")}else t&&(t.textContent="Bienvenido al Panel de Control"),a&&(a.textContent="Configura tu perfil en Ajustes para personalizar tu experiencia.")}handleEmptyState(){const e=document.querySelector(".welcome-section p");e&&(e.textContent="No tienes registros aún. ¡Comienza registrando tu primer día de trabajo!")}}class D{constructor(e,t,a){this.historyService=e,this.dbService=t,this.calcService=a,this.modal=null,this.currentRegistroId=null,this.historyEntries=[]}async open(e){try{this.currentRegistroId=e;const t=await this.dbService.getRegistroById(e),a=await this.loadHistory(e);if(!t)throw new Error("Registro no encontrado");this.createModalHTML(t),this.setupEventListeners(),this.renderHistoryEntries(a),this.show()}catch(t){console.error("Error opening history viewer:",t),window.app&&window.app.showNotification("Error al abrir el historial: "+t.message,"error")}}async loadHistory(e){try{return this.historyEntries=await this.historyService.getHistory(e),this.historyEntries}catch(t){return console.error("Error loading history:",t),[]}}createModalHTML(e){const a=`
      <div id="history-viewer-modal" class="modal-overlay">
        <div class="modal-content history-modal-content">
          <div class="modal-header">
            <h2>📋 Historial de Cambios - ${new Date(e.fecha).toLocaleDateString("es-ES")}</h2>
            <button class="modal-close" id="history-modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="history-info">
              <div class="history-stats">
                <div class="stat-item">
                  <span class="stat-label">Total de ediciones:</span>
                  <span class="stat-value" id="total-edits">${e.editCount||0}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Última edición:</span>
                  <span class="stat-value" id="last-edit">
                    ${e.lastEditedAt?new Date(e.lastEditedAt).toLocaleString("es-ES"):"Nunca"}
                  </span>
                </div>
              </div>
            </div>
            
            <div id="history-timeline" class="history-timeline">
              <!-- Timeline entries will be rendered here -->
            </div>
            
            <div id="history-empty" class="history-empty" style="display: none;">
              <p>No hay historial de cambios para este registro.</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="close-history-btn">Cerrar</button>
          </div>
        </div>
      </div>
    `,i=document.createElement("div");i.innerHTML=a,this.modal=i.firstElementChild,document.body.appendChild(this.modal)}setupEventListeners(){const e=document.getElementById("history-modal-close");e&&e.addEventListener("click",()=>this.close());const t=document.getElementById("close-history-btn");t&&t.addEventListener("click",()=>this.close()),this.modal.addEventListener("click",a=>{a.target===this.modal&&this.close()}),this.escapeHandler=a=>{a.key==="Escape"&&this.close()},document.addEventListener("keydown",this.escapeHandler)}renderHistoryEntries(e){const t=document.getElementById("history-timeline"),a=document.getElementById("history-empty");if(!t)return;if(e.length===0){t.style.display="none",a.style.display="block";return}t.style.display="block",a.style.display="none";const i=e.slice(0,10),o=e.length>10,r=i.map((c,n)=>this.renderHistoryEntry(c,n)).join(""),s=o?`
      <div class="load-more-container">
        <button class="btn-secondary load-more-btn" data-loaded="10">
          Ver más entradas (${e.length-10} restantes)
        </button>
      </div>
    `:"";t.innerHTML=r+s,o&&t.querySelector(".load-more-btn").addEventListener("click",()=>this.loadMoreEntries()),this.setupRestoreButtons()}renderHistoryEntry(e,t){const a=this.historyService.formatHistoryEntry(e),i=t===0;return`
      <div class="history-entry ${i?"latest":""}" data-entry-id="${e.id}">
        <div class="history-timeline-marker">
          <div class="timeline-dot ${i?"latest-dot":""}"></div>
          ${t<9?'<div class="timeline-line"></div>':""}
        </div>
        
        <div class="history-content">
          <div class="history-header">
            <div class="history-date">
              ${a.date}
              ${i?'<span class="latest-badge">Más reciente</span>':""}
            </div>
            <button class="btn-restore" data-entry-id="${e.id}" title="Restaurar a esta versión">
              ↶ Restaurar
            </button>
          </div>
          
          <div class="history-changes">
            <div class="changes-summary">
              <strong>${a.changedFields.length} campo${a.changedFields.length!==1?"s":""} modificado${a.changedFields.length!==1?"s":""}</strong>
              ${a.gananciaDiff!==0?`
                <span class="ganancia-impact ${a.gananciaDiff>0?"positive":"negative"}">
                  ${a.gananciaDiff>0?"+":""}${a.gananciaDiff.toFixed(2)}€
                </span>
              `:""}
            </div>
            
            <div class="changes-details">
              ${a.changes.map(o=>`
                <div class="change-item">
                  <span class="change-field">${o.field}:</span>
                  <span class="change-values">
                    <span class="old-value">${o.previousValue}</span>
                    <span class="arrow">→</span>
                    <span class="new-value">${o.newValue}</span>
                  </span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `}loadMoreEntries(){const e=document.getElementById("history-timeline"),t=e.querySelector(".load-more-btn"),a=parseInt(t.dataset.loaded),i=this.historyEntries.slice(a,a+10),o=i.map((n,d)=>this.renderHistoryEntry(n,a+d)).join(""),r=e.querySelector(".load-more-container");r.insertAdjacentHTML("beforebegin",o);const s=a+i.length;t.dataset.loaded=s;const c=this.historyEntries.length-s;c>0?t.textContent=`Ver más entradas (${c} restantes)`:r.style.display="none",this.setupRestoreButtons()}setupRestoreButtons(){document.querySelectorAll(".btn-restore").forEach(t=>{t.replaceWith(t.cloneNode(!0))}),document.querySelectorAll(".btn-restore").forEach(t=>{t.addEventListener("click",a=>{const i=parseInt(a.target.dataset.entryId);this.showRestoreConfirmation(i)})})}async showRestoreConfirmation(e){const t=this.historyEntries.find(r=>r.id===e);if(!t)return;const a=this.historyService.formatHistoryEntry(t),i=a.changes.map(r=>`• ${r.field}: ${r.newValue} → ${r.previousValue}`).join(`
`),o=`¿Deseas restaurar el registro a esta versión?

Fecha: ${a.date}

Cambios que se aplicarán:
${i}

⚠️ Esta acción creará una nueva entrada en el historial.`;confirm(o)&&await this.restoreVersion(e)}async restoreVersion(e){try{const t=document.querySelector(`[data-entry-id="${e}"]`);t&&(t.disabled=!0,t.textContent="Restaurando..."),await this.historyService.restoreVersion(this.currentRegistroId,e),window.eventBus&&window.eventBus.emit("registro-updated",{registroId:this.currentRegistroId,restored:!0}),window.app&&window.app.showNotification("Registro restaurado correctamente","success"),this.close()}catch(t){console.error("Error restoring version:",t),window.app&&window.app.showNotification("Error al restaurar la versión: "+t.message,"error")}finally{const t=document.querySelector(`[data-entry-id="${e}"]`);t&&(t.disabled=!1,t.textContent="↶ Restaurar")}}show(){this.modal&&(this.modal.style.display="flex",setTimeout(()=>{this.modal.classList.add("show")},10))}close(){this.modal&&(this.modal.classList.remove("show"),setTimeout(()=>{this.modal&&this.modal.parentNode&&document.body.removeChild(this.modal),this.cleanup()},300))}cleanup(){this.escapeHandler&&document.removeEventListener("keydown",this.escapeHandler),this.modal=null,this.currentRegistroId=null,this.historyEntries=[]}}class F{constructor(e){this.container=typeof e=="string"?document.getElementById(e):e,this.originalData=null,this.currentData=null,this.changedFields=[]}update(e,t){this.originalData=e,this.currentData=t,this.changedFields=this.detectChanges(e,t),this.render()}detectChanges(e,t){const a=[],i=(o,r,s="")=>{new Set([...Object.keys(o||{}),...Object.keys(r||{})]).forEach(n=>{if(["id","createdAt","updatedAt","editCount","lastEditedAt","isModified","gananciaBruta","gananciaNeta"].includes(n))return;const d=s?`${s}.${n}`:n,l=o==null?void 0:o[n],u=r==null?void 0:r[n];typeof u=="object"&&u!==null&&!Array.isArray(u)&&!(u instanceof Date)?i(l||{},u,d):l!==u&&a.push({field:d,oldValue:l,newValue:u})})};return i(e,t),a}highlightChanges(e){if(!this.container)return;this.container.querySelectorAll(".comparison-item").forEach(a=>{const i=a.dataset.field;e.includes(i)?a.classList.add("highlighted"):a.classList.remove("highlighted")})}calculateDifferences(){const e={};return this.changedFields.forEach(({field:t,oldValue:a,newValue:i})=>{typeof a=="number"&&typeof i=="number"&&(e[t]={absolute:i-a,percentage:a!==0?(i-a)/a*100:0})}),e}render(){if(!this.container)return;if(this.changedFields.length===0){this.container.innerHTML=`
        <div class="comparison-empty">
          <p>No hay cambios para mostrar</p>
        </div>
      `;return}const e=this.calculateDifferences(),t=`
      <div class="comparison-header">
        <h4>Cambios Realizados (${this.changedFields.length})</h4>
      </div>
      <div class="comparison-list">
        ${this.changedFields.map(a=>this.renderComparisonItem(a,e)).join("")}
      </div>
      ${this.renderGananciaDiff()}
    `;this.container.innerHTML=t,this.addAnimations()}renderComparisonItem(e,t){const{field:a,oldValue:i,newValue:o}=e,r=this.formatFieldName(a),s=this.formatValue(i,a),c=this.formatValue(o,a);let n="";if(t[a]){const{absolute:d,percentage:l}=t[a],u=d>0?"+":"";n=`
        <span class="diff-badge ${d>0?"positive":"negative"}">
          ${u}${this.formatValue(d,a)}
          ${l!==0?`(${u}${l.toFixed(1)}%)`:""}
        </span>
      `}return`
      <div class="comparison-item" data-field="${a}">
        <div class="comparison-field-name">${r}</div>
        <div class="comparison-values">
          <div class="comparison-old">
            <span class="label">Antes:</span>
            <span class="value">${s}</span>
          </div>
          <div class="comparison-arrow">→</div>
          <div class="comparison-new">
            <span class="label">Después:</span>
            <span class="value">${c}</span>
          </div>
          ${n}
        </div>
      </div>
    `}renderGananciaDiff(){if(!this.originalData||!this.currentData)return"";const e=this.originalData.gananciaNeta||0,a=(this.currentData.gananciaNeta||0)-e;if(a===0)return"";const i=a>0?"+":"",o=a>0?"positive":"negative",r=a>0?"📈":"📉";return`
      <div class="comparison-summary ${o}">
        <div class="summary-icon">${r}</div>
        <div class="summary-content">
          <div class="summary-label">Impacto en Ganancia Neta</div>
          <div class="summary-value">
            ${i}${a.toFixed(2)}€
          </div>
        </div>
      </div>
    `}formatFieldName(e){return{fecha:"Fecha",kmRecorridos:"Km Recorridos",numeroCarreras:"Número de Carreras","uber.app":"Uber App","uber.propinas":"Propinas Uber","freeNow.app":"FreeNow App","freeNow.tarjeta":"FreeNow Tarjeta","freeNow.efectivo":"FreeNow Efectivo","freeNow.propinas":"Propinas FreeNow","taxiConvencional.tarjeta":"Taxi Tarjeta","taxiConvencional.efectivo":"Taxi Efectivo","gastos.combustible":"Gastos Combustible"}[e]||e}formatValue(e,t=""){return e==null?"-":t==="fecha"?new Date(e).toLocaleDateString("es-ES"):typeof e=="number"?t.includes("km")||t==="kmRecorridos"?`${e.toFixed(1)} km`:t.includes("carreras")||t==="numeroCarreras"?`${Math.round(e)} carreras`:`${e.toFixed(2)}€`:String(e)}addAnimations(){if(!this.container)return;this.container.querySelectorAll(".comparison-item").forEach((t,a)=>{setTimeout(()=>{t.classList.add("fade-in")},a*50)})}clear(){this.container&&(this.container.innerHTML=""),this.originalData=null,this.currentData=null,this.changedFields=[]}getChangeCount(){return this.changedFields.length}hasChanges(){return this.changedFields.length>0}getChangedFieldNames(){return this.changedFields.map(e=>e.field)}}class I{constructor(e,t,a,i){this.dbService=e,this.calcService=t,this.validationService=a,this.historyService=i,this.modal=null,this.originalData=null,this.currentData=null,this.comparisonView=null,this.hasUnsavedChanges=!1}async open(e){try{const t=await this.loadRegistro(e);if(!t)throw new Error("Registro no encontrado");this.originalData={...t},this.currentData={...t},this.createModalHTML(),this.setupEventListeners(),this.comparisonView=new F("comparison-container"),this.fillForm(t),this.show()}catch(t){console.error("Error opening edit modal:",t),window.app&&window.app.showNotification("Error al abrir el editor: "+t.message,"error")}}async loadRegistro(e){return await this.dbService.getRegistroById(e)}createModalHTML(){const e=`
      <div id="edit-registro-modal" class="modal-overlay">
        <div class="modal-content edit-modal-content">
          <div class="modal-header">
            <h2>Editar Registro - <span id="edit-modal-fecha"></span></h2>
            <button class="modal-close" id="edit-modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <form id="edit-registro-form" class="edit-form">
              <!-- Fecha y datos básicos -->
              <div class="form-section">
                <h3>Información Básica</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-fecha">Fecha</label>
                    <input type="date" id="edit-fecha" name="fecha" required>
                  </div>
                  <div class="form-group">
                    <label for="edit-km">Km Recorridos</label>
                    <input type="number" id="edit-km" name="kmRecorridos" min="0" step="0.1">
                  </div>
                  <div class="form-group">
                    <label for="edit-carreras">Nº Carreras</label>
                    <input type="number" id="edit-carreras" name="numeroCarreras" min="0">
                  </div>
                </div>
              </div>

              <!-- Uber -->
              <div class="form-section">
                <h3>Uber</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-uber-app">App (€)</label>
                    <input type="number" id="edit-uber-app" name="uber.app" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-uber-propinas">Propinas (€)</label>
                    <input type="number" id="edit-uber-propinas" name="uber.propinas" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- FreeNow -->
              <div class="form-section">
                <h3>FreeNow</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-freenow-app">App (€)</label>
                    <input type="number" id="edit-freenow-app" name="freeNow.app" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-freenow-tarjeta">Tarjeta (€)</label>
                    <input type="number" id="edit-freenow-tarjeta" name="freeNow.tarjeta" min="0" step="0.01">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-freenow-efectivo">Efectivo (€)</label>
                    <input type="number" id="edit-freenow-efectivo" name="freeNow.efectivo" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-freenow-propinas">Propinas (€)</label>
                    <input type="number" id="edit-freenow-propinas" name="freeNow.propinas" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- Taxi Convencional -->
              <div class="form-section">
                <h3>Taxi Convencional</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-taxi-tarjeta">Tarjeta (€)</label>
                    <input type="number" id="edit-taxi-tarjeta" name="taxiConvencional.tarjeta" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label for="edit-taxi-efectivo">Efectivo (€)</label>
                    <input type="number" id="edit-taxi-efectivo" name="taxiConvencional.efectivo" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- Gastos -->
              <div class="form-section">
                <h3>Gastos</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-combustible">Combustible (€)</label>
                    <input type="number" id="edit-combustible" name="gastos.combustible" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- Vista de comparación -->
              <div id="comparison-container" class="comparison-section"></div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="edit-cancel-btn">Cancelar</button>
            <button type="button" class="btn-primary" id="edit-save-btn">Guardar Cambios</button>
          </div>
        </div>
      </div>
    `,t=document.createElement("div");t.innerHTML=e,this.modal=t.firstElementChild,document.body.appendChild(this.modal)}fillForm(e){var a,i,o,r,s,c,n,d,l;const t=document.getElementById("edit-modal-fecha");t&&(t.textContent=new Date(e.fecha).toLocaleDateString("es-ES")),document.getElementById("edit-fecha").value=e.fecha,document.getElementById("edit-km").value=e.kmRecorridos||0,document.getElementById("edit-carreras").value=e.numeroCarreras||0,document.getElementById("edit-uber-app").value=((a=e.uber)==null?void 0:a.app)||0,document.getElementById("edit-uber-propinas").value=((i=e.uber)==null?void 0:i.propinas)||0,document.getElementById("edit-freenow-app").value=((o=e.freeNow)==null?void 0:o.app)||0,document.getElementById("edit-freenow-tarjeta").value=((r=e.freeNow)==null?void 0:r.tarjeta)||0,document.getElementById("edit-freenow-efectivo").value=((s=e.freeNow)==null?void 0:s.efectivo)||0,document.getElementById("edit-freenow-propinas").value=((c=e.freeNow)==null?void 0:c.propinas)||0,document.getElementById("edit-taxi-tarjeta").value=((n=e.taxiConvencional)==null?void 0:n.tarjeta)||0,document.getElementById("edit-taxi-efectivo").value=((d=e.taxiConvencional)==null?void 0:d.efectivo)||0,document.getElementById("edit-combustible").value=((l=e.gastos)==null?void 0:l.combustible)||0}setupEventListeners(){const e=document.getElementById("edit-modal-close");e&&e.addEventListener("click",()=>this.handleCancel());const t=document.getElementById("edit-cancel-btn");t&&t.addEventListener("click",()=>this.handleCancel());const a=document.getElementById("edit-save-btn");a&&a.addEventListener("click",()=>this.handleSave()),this.modal.addEventListener("click",r=>{r.target===this.modal&&this.handleCancel()}),document.getElementById("edit-registro-form").querySelectorAll("input").forEach(r=>{r.addEventListener("input",()=>this.handleFieldChange())}),this.escapeHandler=r=>{r.key==="Escape"&&this.handleCancel()},document.addEventListener("keydown",this.escapeHandler)}handleFieldChange(){this.currentData=this.getFormData(),this.hasUnsavedChanges=!0,this.updateComparison()}getFormData(){return{fecha:document.getElementById("edit-fecha").value,kmRecorridos:parseFloat(document.getElementById("edit-km").value||0),numeroCarreras:parseInt(document.getElementById("edit-carreras").value||0),uber:{app:parseFloat(document.getElementById("edit-uber-app").value||0),propinas:parseFloat(document.getElementById("edit-uber-propinas").value||0)},freeNow:{app:parseFloat(document.getElementById("edit-freenow-app").value||0),tarjeta:parseFloat(document.getElementById("edit-freenow-tarjeta").value||0),efectivo:parseFloat(document.getElementById("edit-freenow-efectivo").value||0),propinas:parseFloat(document.getElementById("edit-freenow-propinas").value||0)},taxiConvencional:{tarjeta:parseFloat(document.getElementById("edit-taxi-tarjeta").value||0),efectivo:parseFloat(document.getElementById("edit-taxi-efectivo").value||0)},gastos:{combustible:parseFloat(document.getElementById("edit-combustible").value||0)}}}updateComparison(){if(!this.comparisonView)return;const e=this.calcService.calculateGananciaNeta(this.originalData),t=this.calcService.calculateGananciaNeta(this.currentData),a={...this.originalData,gananciaNeta:e.gananciaNeta},i={...this.currentData,gananciaNeta:t.gananciaNeta};this.comparisonView.update(a,i)}validateForm(){return this.getFormData().fecha?this.comparisonView.hasChanges()?!0:(this.showError("No hay cambios para guardar"),!1):(this.showError("La fecha es requerida"),!1)}async showConfirmation(){const e=this.comparisonView.getChangeCount(),t=`¿Deseas guardar ${e} cambio${e>1?"s":""}?`;return confirm(t)}async handleSave(){try{if(!this.validateForm()||!await this.showConfirmation())return;await this.saveChanges()}catch(e){console.error("Error saving changes:",e),this.showError("Error al guardar los cambios: "+e.message)}}async saveChanges(){try{const e=document.getElementById("edit-save-btn");e&&(e.disabled=!0,e.textContent="Guardando...");const t=this.getFormData(),a=this.calcService.calculateGananciaNeta(t);t.gananciaBruta=a.gananciaBruta,t.gananciaNeta=a.gananciaNeta;const i=this.comparisonView.getChangedFieldNames();await this.historyService.createHistoryEntry(this.originalData.id,this.originalData,t,i),await this.dbService.updateRegistro(this.originalData.id,t),window.eventBus&&window.eventBus.emit("registro-updated",{registroId:this.originalData.id,fecha:t.fecha}),this.showSuccess("Registro actualizado correctamente"),this.close()}catch(e){throw console.error("Error in saveChanges:",e),e}finally{const e=document.getElementById("edit-save-btn");e&&(e.disabled=!1,e.textContent="Guardar Cambios")}}handleCancel(){this.hasUnsavedChanges&&!confirm("¿Estás seguro? Los cambios no guardados se perderán.")||this.close()}show(){this.modal&&(this.modal.style.display="flex",setTimeout(()=>{this.modal.classList.add("show")},10))}close(){this.modal&&(this.modal.classList.remove("show"),setTimeout(()=>{this.modal&&this.modal.parentNode&&document.body.removeChild(this.modal),this.cleanup()},300))}cleanup(){this.escapeHandler&&document.removeEventListener("keydown",this.escapeHandler),this.comparisonView&&this.comparisonView.clear(),this.modal=null,this.originalData=null,this.currentData=null,this.comparisonView=null,this.hasUnsavedChanges=!1}showSuccess(e){window.app&&window.app.showNotification(e,"success")}showError(e){window.app&&window.app.showNotification(e,"error")}}class ${constructor(e,t,a,i){this.dbService=e,this.calcService=t,this.historyService=a,this.validationService=i,this.currentRegistros=[],this.historyViewer=null,this.editModal=null}init(){this.setupEventListeners(),this.setupEventBusListeners(),this.historyService&&(this.historyViewer=new D(this.historyService,this.dbService,this.calcService)),this.historyService&&this.validationService&&(this.editModal=new I(this.dbService,this.calcService,this.validationService,this.historyService))}setupEventListeners(){const e=document.getElementById("aplicar-filtros"),t=document.getElementById("limpiar-filtros");e&&e.addEventListener("click",()=>{this.aplicarFiltros()}),t&&t.addEventListener("click",()=>{this.limpiarFiltros()}),document.querySelectorAll(".quick-filter-btn").forEach(a=>{a.addEventListener("click",i=>{const o=i.target.dataset.filter;this.aplicarFiltroRapido(o),document.querySelectorAll(".quick-filter-btn").forEach(r=>r.classList.remove("active")),i.target.classList.add("active")})})}setupEventBusListeners(){window.eventBus&&(window.eventBus.on("registro-updated",()=>{this.loadData()}),window.eventBus.on("registro-deleted",()=>{this.loadData()}),window.eventBus.on("registro-created",()=>{this.loadData()}))}async loadData(){try{const e=await this.dbService.getAllRegistros();this.currentRegistros=e,this.displayHistorial(e)}catch(e){console.error("Error loading historial data:",e),this.showError("Error al cargar el historial")}}async aplicarFiltros(){var e,t;try{const a=(e=document.getElementById("fecha-desde"))==null?void 0:e.value,i=(t=document.getElementById("fecha-hasta"))==null?void 0:t.value;let o=this.currentRegistros;if((a||i)&&(o=this.currentRegistros.filter(r=>{const s=new Date(r.fecha);return a&&i?s>=new Date(a)&&s<=new Date(i):a?s>=new Date(a):i?s<=new Date(i):!0})),this.displayHistorial(o),a||i){const r=document.getElementById("filter-results"),s=document.getElementById("results-count"),c=a?new Date(a).toLocaleDateString("es-ES"):"inicio",n=i?new Date(i).toLocaleDateString("es-ES"):"hoy";s.textContent=`${o.length} registros encontrados desde ${c} hasta ${n}`,r.style.display="block",o.length===0&&this.showInfo("No se encontraron registros en el rango de fechas seleccionado")}else document.getElementById("filter-results").style.display="none"}catch(a){console.error("Error applying filters:",a),this.showError("Error al aplicar filtros")}}limpiarFiltros(){document.getElementById("fecha-desde").value="",document.getElementById("fecha-hasta").value="",document.querySelectorAll(".quick-filter-btn").forEach(e=>e.classList.remove("active")),document.getElementById("filter-results").style.display="none",this.displayHistorial(this.currentRegistros)}aplicarFiltroRapido(e){const t=new Date;let a,i;switch(e){case"today":a=new Date(t.getFullYear(),t.getMonth(),t.getDate()),i=new Date(t.getFullYear(),t.getMonth(),t.getDate(),23,59,59);break;case"week":const r=new Date(t);r.setDate(t.getDate()-t.getDay()+1),r.setHours(0,0,0,0),a=r,i=new Date(t);break;case"month":a=new Date(t.getFullYear(),t.getMonth(),1),i=new Date(t);break;case"last30":a=new Date(t.getTime()-30*24*60*60*1e3),i=new Date(t);break;case"all":this.displayHistorial(this.currentRegistros),document.getElementById("filter-results").style.display="none";return}const o=this.currentRegistros.filter(r=>{const s=new Date(r.fecha);return s>=a&&s<=i});this.displayHistorial(o),this.showFilterResults(o.length,e)}showFilterResults(e,t){const a=document.getElementById("filter-results"),i=document.getElementById("results-count"),o={today:"hoy",week:"esta semana",month:"este mes",last30:"los últimos 30 días"};i.textContent=`${e} registros encontrados para ${o[t]}`,a.style.display="block"}displayHistorial(e){const t=document.getElementById("historial-content");if(!t)return;if(e.length===0){t.innerHTML=`
        <div class="historial-placeholder">
          <p>No hay registros para mostrar.</p>
          <p>Añade algunos registros diarios para verlos aquí.</p>
        </div>
      `;return}const a=e.length,i=this.calcService.calculateMonthlyTotals(e);t.innerHTML=`
      <div class="historial-summary">
        <h3>Resumen del Período</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Registros:</span>
            <span class="stat-value">${a}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Km Totales:</span>
            <span class="stat-value">${i.kmRecorridos} km</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Carreras:</span>
            <span class="stat-value">${i.numeroCarreras}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ganancia Neta:</span>
            <span class="stat-value">${i.gananciaNeta.toFixed(2)}€</span>
          </div>
        </div>
      </div>
      
      <div class="historial-table-container">
        <table class="historial-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Km</th>
              <th>Carreras</th>
              <th>Uber</th>
              <th>FreeNow</th>
              <th>Taxi</th>
              <th>Combustible</th>
              <th>Ganancia Neta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${e.map(o=>this.createRegistroRow(o)).join("")}
          </tbody>
        </table>
      </div>
    `,this.setupRowActions()}createRegistroRow(e){var n,d,l,u,p,f,g;const t=new Date(e.fecha).toLocaleDateString("es-ES"),a=parseFloat(((n=e.uber)==null?void 0:n.app)||0).toFixed(2),i=(parseFloat(((d=e.freeNow)==null?void 0:d.app)||0)+parseFloat(((l=e.freeNow)==null?void 0:l.tarjeta)||0)+parseFloat(((u=e.freeNow)==null?void 0:u.efectivo)||0)).toFixed(2),o=(parseFloat(((p=e.taxiConvencional)==null?void 0:p.tarjeta)||0)+parseFloat(((f=e.taxiConvencional)==null?void 0:f.efectivo)||0)).toFixed(2),r=parseFloat(((g=e.gastos)==null?void 0:g.combustible)||0).toFixed(2),s=parseFloat(e.gananciaNeta||0).toFixed(2),c=this.renderModifiedIndicator(e);return`
      <tr data-registro-id="${e.id}" class="${e.isModified?"modified-record":""}">
        <td>
          ${t}
          ${c}
        </td>
        <td>${e.kmRecorridos||0}</td>
        <td>${e.numeroCarreras||0}</td>
        <td>${a}€</td>
        <td>${i}€</td>
        <td>${o}€</td>
        <td>${r}€</td>
        <td class="ganancia-cell">${s}€</td>
        <td class="actions-cell">
          <button class="btn-action view-details" data-id="${e.id}" title="Ver detalles">👁️</button>
          <button class="btn-action edit-registro" data-id="${e.id}" title="Editar">✏️</button>
          <button class="btn-action delete-registro" data-id="${e.id}" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `}renderModifiedIndicator(e){if(!e.isModified||!e.editCount||e.editCount===0)return"";const t=e.lastEditedAt?new Date(e.lastEditedAt).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Fecha desconocida";return`
      <span class="modified-indicator" 
            data-id="${e.id}" 
            title="Editado ${e.editCount} ${e.editCount===1?"vez":"veces"}. Última edición: ${t}">
        <i class="icon-history">🕐</i>
        <span class="edit-count">${e.editCount}</span>
      </span>
    `}setupRowActions(){document.querySelectorAll(".view-details").forEach(e=>{e.addEventListener("click",t=>{const a=t.target.dataset.id;this.showRegistroDetails(a)})}),document.querySelectorAll(".modified-indicator").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const a=t.currentTarget.dataset.id;this.showRegistroHistory(a)})}),document.querySelectorAll(".edit-registro").forEach(e=>{e.addEventListener("click",t=>{const a=t.target.dataset.id;this.editRegistroAdvanced(a)})}),document.querySelectorAll(".delete-registro").forEach(e=>{e.addEventListener("click",t=>{const a=t.target.dataset.id;this.confirmDeleteRegistro(a)})})}async showRegistroDetails(e){var r,s,c,n,d,l,u,p,f;const t=this.currentRegistros.find(g=>g.id==e);if(!t)return;const a=this.calcService.calculateGananciaNeta(t),i=new Date(t.fecha).toLocaleDateString("es-ES"),o=document.createElement("div");o.className="modal-overlay",o.innerHTML=`
      <div class="modal-content">
        <div class="modal-header">
          <h3>Detalles del Registro - ${i}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-section">
              <h4>Actividad</h4>
              <p><strong>Km Recorridos:</strong> ${t.kmRecorridos||0}</p>
              <p><strong>Carreras:</strong> ${t.numeroCarreras||0}</p>
            </div>
            
            <div class="detail-section">
              <h4>Uber</h4>
              <p><strong>App:</strong> ${((r=t.uber)==null?void 0:r.app)||0}€</p>
              <p><strong>Propinas:</strong> ${((s=t.uber)==null?void 0:s.propinas)||0}€</p>
            </div>
            
            <div class="detail-section">
              <h4>FreeNow</h4>
              <p><strong>App:</strong> ${((c=t.freeNow)==null?void 0:c.app)||0}€</p>
              <p><strong>Tarjeta:</strong> ${((n=t.freeNow)==null?void 0:n.tarjeta)||0}€</p>
              <p><strong>Efectivo:</strong> ${((d=t.freeNow)==null?void 0:d.efectivo)||0}€</p>
              <p><strong>Propinas:</strong> ${((l=t.freeNow)==null?void 0:l.propinas)||0}€</p>
            </div>
            
            <div class="detail-section">
              <h4>Taxi Convencional</h4>
              <p><strong>Tarjeta:</strong> ${((u=t.taxiConvencional)==null?void 0:u.tarjeta)||0}€</p>
              <p><strong>Efectivo:</strong> ${((p=t.taxiConvencional)==null?void 0:p.efectivo)||0}€</p>
            </div>
            
            <div class="detail-section">
              <h4>Gastos</h4>
              <p><strong>Combustible:</strong> ${((f=t.gastos)==null?void 0:f.combustible)||0}€</p>
            </div>
            
            <div class="detail-section calculation-section">
              <h4>Cálculo de Ganancias</h4>
              <p><strong>Ganancia Bruta:</strong> ${a.gananciaBruta}€</p>
              <p><strong>- Comisión Vehículo (52%):</strong> ${a.comisionVehiculo}€</p>
              <p><strong>- Costo Kilometraje:</strong> ${a.costoKilometraje}€</p>
              <p><strong>- Comisión FreeNow Efectivo (6%):</strong> ${a.comisionFreeNowEfectivo}€</p>
              <p><strong>+ Gastos Combustible:</strong> ${a.gastosCombustible}€</p>
              <p class="ganancia-final"><strong>Ganancia Neta:</strong> ${a.gananciaNeta}€</p>
            </div>
          </div>
        </div>
      </div>
    `,document.body.appendChild(o),o.querySelector(".modal-close").addEventListener("click",()=>{document.body.removeChild(o)}),o.addEventListener("click",g=>{g.target===o&&document.body.removeChild(o)})}async editRegistro(e){var o,r,s,c,n,d,l,u,p;const t=this.currentRegistros.find(f=>f.id==e);if(!t)return;const a=new Date(t.fecha).toLocaleDateString("es-ES"),i=document.createElement("div");i.className="modal-overlay",i.innerHTML=`
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h3>✏️ Editar Registro - ${a}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="edit-form" class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label for="edit-fecha">Fecha</label>
                <input type="date" id="edit-fecha" value="${t.fecha}" required>
              </div>
              <div class="form-group">
                <label for="edit-km">Km Recorridos</label>
                <input type="number" id="edit-km" min="0" step="0.1" value="${t.kmRecorridos||0}">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="edit-carreras">Nº Carreras</label>
                <input type="number" id="edit-carreras" min="0" value="${t.numeroCarreras||0}">
              </div>
              <div class="form-group">
                <label for="edit-combustible">Combustible (€)</label>
                <input type="number" id="edit-combustible" min="0" step="0.01" value="${((o=t.gastos)==null?void 0:o.combustible)||0}">
              </div>
            </div>

            <div class="form-section">
              <h4>Uber</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-uber-app">App (€)</label>
                  <input type="number" id="edit-uber-app" min="0" step="0.01" value="${((r=t.uber)==null?void 0:r.app)||0}">
                </div>
                <div class="form-group">
                  <label for="edit-uber-propinas">Propinas (€)</label>
                  <input type="number" id="edit-uber-propinas" min="0" step="0.01" value="${((s=t.uber)==null?void 0:s.propinas)||0}">
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>FreeNow</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-freenow-app">App (€)</label>
                  <input type="number" id="edit-freenow-app" min="0" step="0.01" value="${((c=t.freeNow)==null?void 0:c.app)||0}">
                </div>
                <div class="form-group">
                  <label for="edit-freenow-tarjeta">Tarjeta (€)</label>
                  <input type="number" id="edit-freenow-tarjeta" min="0" step="0.01" value="${((n=t.freeNow)==null?void 0:n.tarjeta)||0}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-freenow-efectivo">Efectivo (€)</label>
                  <input type="number" id="edit-freenow-efectivo" min="0" step="0.01" value="${((d=t.freeNow)==null?void 0:d.efectivo)||0}">
                </div>
                <div class="form-group">
                  <label for="edit-freenow-propinas">Propinas (€)</label>
                  <input type="number" id="edit-freenow-propinas" min="0" step="0.01" value="${((l=t.freeNow)==null?void 0:l.propinas)||0}">
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Taxi Convencional</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-taxi-tarjeta">Tarjeta (€)</label>
                  <input type="number" id="edit-taxi-tarjeta" min="0" step="0.01" value="${((u=t.taxiConvencional)==null?void 0:u.tarjeta)||0}">
                </div>
                <div class="form-group">
                  <label for="edit-taxi-efectivo">Efectivo (€)</label>
                  <input type="number" id="edit-taxi-efectivo" min="0" step="0.01" value="${((p=t.taxiConvencional)==null?void 0:p.efectivo)||0}">
                </div>
              </div>
            </div>

            <div class="calculation-preview">
              <h4>Vista Previa del Cálculo</h4>
              <div class="calc-line">Ganancia Bruta: <span id="edit-ganancia-bruta">0.00</span>€</div>
              <div class="calc-line">- Comisión Vehículo (52%): <span id="edit-comision-vehiculo">0.00</span>€</div>
              <div class="calc-line">- Costo Kilometraje: <span id="edit-costo-km">0.00</span>€</div>
              <div class="calc-line">- Comisión FreeNow Efectivo (6%): <span id="edit-comision-freenow">0.00</span>€</div>
              <div class="calc-line">+ Gastos Combustible: <span id="edit-gastos-combustible">0.00</span>€</div>
              <div class="calc-total">Ganancia Neta: <span id="edit-ganancia-neta">0.00</span>€</div>
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
              <button type="button" class="btn-secondary modal-cancel">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `,document.body.appendChild(i),this.setupEditForm(i,t),i.querySelector(".modal-close").addEventListener("click",()=>{document.body.removeChild(i)}),i.querySelector(".modal-cancel").addEventListener("click",()=>{document.body.removeChild(i)}),i.addEventListener("click",f=>{f.target===i&&document.body.removeChild(i)})}setupEditForm(e,t){const a=e.querySelector("#edit-form"),i=a.querySelectorAll('input[type="number"]'),o=()=>{const r=this.getEditFormData(e),s=this.calcService.calculateGananciaNeta(r);e.querySelector("#edit-ganancia-bruta").textContent=s.gananciaBruta.toFixed(2),e.querySelector("#edit-comision-vehiculo").textContent=s.comisionVehiculo.toFixed(2),e.querySelector("#edit-costo-km").textContent=s.costoKilometraje.toFixed(2),e.querySelector("#edit-comision-freenow").textContent=s.comisionFreeNowEfectivo.toFixed(2),e.querySelector("#edit-gastos-combustible").textContent=s.gastosCombustible.toFixed(2),e.querySelector("#edit-ganancia-neta").textContent=s.gananciaNeta.toFixed(2)};i.forEach(r=>{r.addEventListener("input",o)}),o(),a.addEventListener("submit",async r=>{r.preventDefault(),await this.saveEditedRegistro(e,t)})}getEditFormData(e){return{fecha:e.querySelector("#edit-fecha").value,kmRecorridos:parseFloat(e.querySelector("#edit-km").value||0),numeroCarreras:parseInt(e.querySelector("#edit-carreras").value||0),uber:{app:parseFloat(e.querySelector("#edit-uber-app").value||0),propinas:parseFloat(e.querySelector("#edit-uber-propinas").value||0)},freeNow:{app:parseFloat(e.querySelector("#edit-freenow-app").value||0),tarjeta:parseFloat(e.querySelector("#edit-freenow-tarjeta").value||0),efectivo:parseFloat(e.querySelector("#edit-freenow-efectivo").value||0),propinas:parseFloat(e.querySelector("#edit-freenow-propinas").value||0)},taxiConvencional:{tarjeta:parseFloat(e.querySelector("#edit-taxi-tarjeta").value||0),efectivo:parseFloat(e.querySelector("#edit-taxi-efectivo").value||0)},gastos:{combustible:parseFloat(e.querySelector("#edit-combustible").value||0)}}}async saveEditedRegistro(e,t){try{const a=this.getEditFormData(e),i=this.calcService.calculateGananciaNeta(a);a.gananciaBruta=i.gananciaBruta,a.gananciaNeta=i.gananciaNeta,await this.dbService.updateRegistro(t.id,a),window.eventBus&&window.eventBus.emit("registro-updated",{registroId:t.id,fecha:a.fecha}),this.showSuccess("Registro actualizado correctamente"),document.body.removeChild(e),await this.loadData()}catch(a){console.error("Error updating registro:",a),this.showError("Error al actualizar el registro")}}async confirmDeleteRegistro(e){const t=this.currentRegistros.find(i=>i.id==e);if(!t)return;const a=new Date(t.fecha).toLocaleDateString("es-ES");if(confirm(`¿Estás seguro de que quieres eliminar el registro del ${a}?`))try{await this.dbService.deleteRegistro(parseInt(e)),window.eventBus&&window.eventBus.emit("registro-deleted",{registroId:parseInt(e),fecha:t.fecha}),this.showSuccess("Registro eliminado correctamente"),await this.loadData()}catch(i){console.error("Error deleting registro:",i),this.showError("Error al eliminar el registro")}}showSuccess(e){window.app&&window.app.showNotification(e,"success")}showError(e){window.app&&window.app.showNotification(e,"error")}showInfo(e){window.app&&window.app.showNotification(e,"info")}async showRegistroHistory(e){if(!this.historyViewer){this.showError("Visor de historial no disponible");return}try{await this.historyViewer.open(parseInt(e))}catch(t){console.error("Error showing registro history:",t),this.showError("Error al mostrar el historial del registro")}}async editRegistroAdvanced(e){if(!this.editModal){this.editRegistro(e);return}try{await this.editModal.open(parseInt(e))}catch(t){console.error("Error opening advanced edit modal:",t),this.showError("Error al abrir el editor avanzado"),this.editRegistro(e)}}}class L{constructor(){this.dbService=new C,this.calcService=new S,this.navigation=new N,this.dashboard=new B(this.dbService,this.calcService),this.historial=new $(this.dbService,this.calcService),this.currentView="dashboard",this.init()}async init(){try{console.log("Inicializando aplicación..."),await this.dbService.initDatabase(),this.setupNavigation(),this.setupRegistroForm(),this.setupAjustesForm(),this.dashboard.init(),this.showNotification("Aplicación cargada correctamente","success")}catch(e){console.error("Error initializing app:",e),this.showNotification("Error al cargar la aplicación","error")}}setupNavigation(){window.addEventListener("navigation",e=>{const{view:t}=e.detail;this.navigateTo(t)}),setTimeout(()=>{document.querySelectorAll(".nav-btn").forEach(t=>{t.addEventListener("click",a=>{const i=a.target.dataset.view;this.navigateTo(i)})})},100)}navigateTo(e){document.querySelectorAll(".nav-btn").forEach(t=>{t.classList.remove("active")}),document.querySelector(`[data-view="${e}"]`).classList.add("active"),document.querySelectorAll(".view").forEach(t=>{t.classList.remove("active")}),document.getElementById(`${e}-view`).classList.add("active"),this.currentView=e,e==="registro"?this.setupRegistroForm():e==="historial"?(this.historial.init(),this.historial.loadData()):e==="ajustes"&&this.loadAjustes()}setupRegistroForm(){const e=document.getElementById("registro-form");if(!e)return;const t=document.getElementById("fecha-registro");t&&(t.value=new Date().toISOString().split("T")[0]),e.addEventListener("submit",async i=>{i.preventDefault(),await this.handleRegistroSubmit()}),["km-recorridos","num-carreras","uber-app","uber-propinas","freenow-app","freenow-tarjeta","freenow-efectivo","freenow-propinas","taxi-tarjeta","taxi-efectivo","combustible"].forEach(i=>{const o=document.getElementById(i);o&&o.addEventListener("input",()=>{this.updateCalculationPreview()})}),this.updateCalculationPreview()}updateCalculationPreview(){const e=this.getFormData(),t=this.calcService.calculateGananciaNeta(e);document.getElementById("ganancia-bruta").textContent=t.gananciaBruta.toFixed(2),document.getElementById("comision-vehiculo").textContent=t.comisionVehiculo.toFixed(2),document.getElementById("costo-km").textContent=t.costoKilometraje.toFixed(2),document.getElementById("comision-freenow").textContent=t.comisionFreeNowEfectivo.toFixed(2),document.getElementById("gastos-combustible").textContent=t.gastosCombustible.toFixed(2),document.getElementById("ganancia-neta").textContent=t.gananciaNeta.toFixed(2)}getFormData(){var e,t,a,i,o,r,s,c,n,d,l,u;return{fecha:((e=document.getElementById("fecha-registro"))==null?void 0:e.value)||new Date().toISOString().split("T")[0],kmRecorridos:parseFloat(((t=document.getElementById("km-recorridos"))==null?void 0:t.value)||0),numeroCarreras:parseInt(((a=document.getElementById("num-carreras"))==null?void 0:a.value)||0),uber:{app:parseFloat(((i=document.getElementById("uber-app"))==null?void 0:i.value)||0),propinas:parseFloat(((o=document.getElementById("uber-propinas"))==null?void 0:o.value)||0)},freeNow:{app:parseFloat(((r=document.getElementById("freenow-app"))==null?void 0:r.value)||0),tarjeta:parseFloat(((s=document.getElementById("freenow-tarjeta"))==null?void 0:s.value)||0),efectivo:parseFloat(((c=document.getElementById("freenow-efectivo"))==null?void 0:c.value)||0),propinas:parseFloat(((n=document.getElementById("freenow-propinas"))==null?void 0:n.value)||0)},taxiConvencional:{tarjeta:parseFloat(((d=document.getElementById("taxi-tarjeta"))==null?void 0:d.value)||0),efectivo:parseFloat(((l=document.getElementById("taxi-efectivo"))==null?void 0:l.value)||0)},gastos:{combustible:parseFloat(((u=document.getElementById("combustible"))==null?void 0:u.value)||0)}}}async handleRegistroSubmit(){try{const e=this.getFormData();if(!e.fecha)throw new Error("La fecha es requerida");const t=this.calcService.calculateGananciaNeta(e);e.gananciaBruta=t.gananciaBruta,e.gananciaNeta=t.gananciaNeta,await this.dbService.saveRegistroDiario(e),this.showNotification("Registro guardado correctamente","success"),document.getElementById("registro-form").reset(),document.getElementById("fecha-registro").value=new Date().toISOString().split("T")[0],this.updateCalculationPreview(),await this.dashboard.refresh()}catch(e){console.error("Error saving registro:",e),this.showNotification(e.message||"Error al guardar el registro","error")}}async refreshDashboard(){this.dashboard&&await this.dashboard.refresh()}setupAjustesForm(){const e=document.getElementById("guardar-perfil");e&&e.addEventListener("click",async()=>{var r,s,c,n;try{const d=(s=(r=document.getElementById("conductor-nombre"))==null?void 0:r.value)==null?void 0:s.trim(),l=(n=(c=document.getElementById("conductor-apellido"))==null?void 0:c.value)==null?void 0:n.trim();if(!d||!l)throw new Error("Nombre y apellido son requeridos");await this.dbService.saveConductor({nombre:d,apellido:l}),this.showNotification("Perfil guardado correctamente","success")}catch(d){this.showNotification(d.message,"error")}});const t=document.getElementById("guardar-dia-libre");t&&t.addEventListener("click",()=>{var s;const r=(s=document.getElementById("dia-libre"))==null?void 0:s.value;r?this.showNotification("Día libre guardado: "+r,"success"):this.showNotification("Selecciona un día de la semana","error")});const a=document.getElementById("limpiar-dia-libre");a&&a.addEventListener("click",()=>{document.getElementById("dia-libre").value="",this.showNotification("Día libre eliminado","success")});const i=document.getElementById("guardar-vacaciones");i&&i.addEventListener("click",()=>{var c,n;const r=(c=document.getElementById("vacaciones-inicio"))==null?void 0:c.value,s=(n=document.getElementById("vacaciones-fin"))==null?void 0:n.value;r&&s?this.showNotification("Vacaciones guardadas correctamente","success"):this.showNotification("Ambas fechas son requeridas","error")});const o=document.getElementById("limpiar-vacaciones");o&&o.addEventListener("click",()=>{document.getElementById("vacaciones-inicio").value="",document.getElementById("vacaciones-fin").value="",this.showNotification("Vacaciones eliminadas","success")})}async loadAjustes(){try{const e=await this.dbService.getConductor();e&&(document.getElementById("conductor-nombre").value=e.nombre||"",document.getElementById("conductor-apellido").value=e.apellido||"")}catch(e){console.error("Error loading ajustes:",e)}}showNotification(e,t="success"){const a=document.getElementById("notification");a.textContent=e,a.className=`notification ${t}`,setTimeout(()=>{a.classList.add("hidden")},3e3)}}let v,m;"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(h=>{console.log("SW registered: ",h)}).catch(h=>{console.log("SW registration failed: ",h)})});window.addEventListener("beforeinstallprompt",h=>{h.preventDefault(),v=h,R()});function R(){m||(m=document.createElement("button"),m.textContent="📱 Instalar App",m.className="btn-primary",m.style.cssText=`
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(79, 209, 199, 0.3);
  `,m.addEventListener("click",async()=>{if(v){v.prompt();const{outcome:h}=await v.userChoice;h==="accepted"&&(console.log("User accepted the install prompt"),window.app&&window.app.showNotification("App instalada correctamente! 🎉","success")),v=null,m.remove(),m=null}}),document.body.appendChild(m),setTimeout(()=>{m&&m.parentNode&&(m.remove(),m=null)},15e3))}window.addEventListener("appinstalled",h=>{console.log("App was installed"),window.app&&window.app.showNotification("¡App instalada correctamente! 🚀","success")});document.addEventListener("DOMContentLoaded",()=>{window.app=new L,window.matchMedia("(display-mode: browser)").matches&&/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)&&setTimeout(()=>{!window.matchMedia("(display-mode: standalone)").matches&&!m&&window.app&&window.app.showNotification("💡 Añade esta app a tu pantalla de inicio para mejor experiencia","info")},5e3)});
