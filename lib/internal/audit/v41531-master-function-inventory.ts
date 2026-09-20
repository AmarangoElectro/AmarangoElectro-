import { adminFunctionPreservationMatrix } from "../admin/v4153-preservation-audit";

export type InventoryStatus = "PRESERVADA" | "PARCIAL" | "PENDIENTE" | "NO ENCONTRADA" | "ABSORBIDA POR V16" | "CANDIDATA A RETIRO";
export type InventoryPriority = "P0" | "P1" | "P2" | "P3";

export interface MasterFunctionRow {
  id: string;
  area: string;
  functionName: string;
  historicalSource: string;
  exactEvidence: string;
  v16State: string;
  routeUi: string;
  role: string;
  data: string;
  readWrite: string;
  dependencies: string;
  lossRisk: string;
  securityRisk: string;
  status: InventoryStatus;
  action: string;
  priority: InventoryPriority;
  futureGate: string;
  associatedTest: string;
}

const cleanId = (value:string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,".").replace(/^\.|\.$/g,"");
const used = new Set<string>();
const uniqueId = (base:string) => { let id=base;let n=2;while(used.has(id)){id=`${base}.${n}`;n+=1;}used.add(id);return id; };

const baseRows: MasterFunctionRow[] = adminFunctionPreservationMatrix.map((source) => {
  const legacyMatch = source.historicalSource.match(/·\s*([a-z0-9_.]+)$/i);
  const candidate = /ruleta|equipo de eventos/i.test(source.functionName);
  const absorbed = /Product V16 como contrato único|Búsqueda desde catálogo maestro|Datos internos fuera/i.test(source.functionName);
  const status:InventoryStatus = candidate ? "CANDIDATA A RETIRO" : absorbed ? "ABSORBIDA POR V16" : source.status;
  const id = uniqueId(legacyMatch ? `ADMIN.${cleanId(legacyMatch[1])}` : `V16.${cleanId(source.area)}.${cleanId(source.functionName)}`);
  const high = /seguridad|roles|backup|canary|catálogo|ventas|caja|cobranza|financia/i.test(`${source.area} ${source.functionName}`);
  return Object.freeze({
    id, area:source.area, functionName:source.functionName, historicalSource:source.historicalSource,
    exactEvidence:source.evidence, v16State:source.currentImplementation, routeUi:source.route,
    role:source.authorizedRole, data:source.dataUsed, readWrite:source.mode,
    dependencies:"Product V16, Auth/RBAC futuro y fuente auditada según dominio",
    lossRisk:source.risk, securityRisk:/write|escrit|auth|costo|proveedor|USD|restaur|borrar|eliminar/i.test(`${source.mode} ${source.risk} ${source.functionName}`)?"Alto: requiere autorización server-side, auditoría y rollback":"Bajo/medio: mantener límites de rol y pruebas",
    status, action:candidate?"Conservar inventariada; solo el dueño puede aprobar su retiro":source.recommendedAction,
    priority:high?"P0":"P2", futureGate:candidate?"Decisión explícita del dueño":"Gate del dominio; nunca se activa desde este inventario",
    associatedTest:"tests/v16-v41531-full-inventory-closure.test.mjs",
  });
});

type RowInput = Pick<MasterFunctionRow,"id"|"area"|"functionName"|"historicalSource"|"exactEvidence"|"v16State"|"status"|"priority"> & Partial<Omit<MasterFunctionRow,"id"|"area"|"functionName"|"historicalSource"|"exactEvidence"|"v16State"|"status"|"priority">>;
const row = (input:RowInput):MasterFunctionRow => Object.freeze({
  id:uniqueId(input.id), area:input.area, functionName:input.functionName, historicalSource:input.historicalSource,
  exactEvidence:input.exactEvidence, v16State:input.v16State, routeUi:input.routeUi??"Amarango OS / Administración futura",
  role:input.role??"Administración", data:input.data??"Datos del dominio bajo proyección autorizada",
  readWrite:input.readWrite??"Lectura en V4.15.3.1; futura escritura server-side con autorización",
  dependencies:input.dependencies??"Auth/RBAC, auditoría, fuente canónica y comandos idempotentes",
  lossRisk:input.lossRisk??"Pérdida de capacidad operativa si no se conserva el flujo",
  securityRisk:input.securityRisk??"No copiar escrituras directas, secretos ni localStorage como autoridad",
  status:input.status, action:input.action??"Preservar intención y reimplementar de forma segura en su gate",
  priority:input.priority, futureGate:input.futureGate??"Gate funcional posterior a Canary",
  associatedTest:input.associatedTest??"tests/v16-v41531-full-inventory-closure.test.mjs",
});

const closureRows:MasterFunctionRow[] = [
  row({id:"CRM.CHAT.INTERNAL",area:"chat",functionName:"Chat interno operativo",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:10740–11398; 34 funciones nombradas clasificadas por el detector",v16State:"Capacidad confirmada; no estaba como fila propia en V4.15.3",status:"PENDIENTE",priority:"P1",data:"mensajes, autor, timestamps, lectura, respuesta, reacción y adjuntos",routeUi:"Amarango OS · Chat",role:"Equipo autorizado",action:"Reescribir como servicio con identidad real, permisos, retención y sincronización segura"}),
  row({id:"CRM.CHAT.AUTHOR.IDENTITY",area:"chat",functionName:"Autor e identidad de chat",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: autor en mensaje y preferencia local de nombre; backup mensajes contiene autor",v16State:"No hay identidad productiva conectada",status:"PENDIENTE",priority:"P0",data:"userId canónico, nombre visible, rol",securityRisk:"No confiar en nombre editable de localStorage",action:"Derivar autor de Auth/RBAC futuro"}),
  row({id:"CRM.CHAT.UNREAD.BADGE",area:"chat",functionName:"No leídos, badge y confirmación de lectura",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: actualizarBadgeChat, marcarMensajesLeidos y recibos de lectura",v16State:"Inventariado; sin servicio V16",status:"PENDIENTE",priority:"P1"}),
  row({id:"CRM.CHAT.REACTIONS.ATTACHMENTS",area:"chat",functionName:"Emojis, reacciones, respuestas, audio e imagen",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: bloque chat, emojis, reply, reactions y adjuntos",v16State:"Inventariado; sin UI final",status:"PENDIENTE",priority:"P2",securityRisk:"Validar MIME, tamaño, acceso y retención; no copiar Storage write directo"}),
  row({id:"CRM.CHAT.QUICK.NOTICES",area:"chat",functionName:"Avisos rápidos operativos",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:10766–10772 — Mirá la planilla; Inversión a definir; Atraso de pago; Pendiente de entrega; Pago en efectivo; Pago transferencia; Revisar pendiente",v16State:"Omisión V4.15.3 cerrada como capacidad propia",status:"PENDIENTE",priority:"P1",data:"tipo de aviso, mensaje, referencia operativa",action:"Mantener los siete accesos como plantillas configurables; sin enviar WhatsApp productivo"}),
  row({id:"CRM.CHAT.CLEANUP.CONTROLLED",area:"chat",functionName:"Limpieza controlada del chat",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:10805 limpiarChat(modo), opciones semana/mes/últimos 100/todo",v16State:"Inventariada, no ejecutada",status:"PENDIENTE",priority:"P1",readWrite:"Futura escritura destructiva controlada",securityRisk:"Alto: retención, backup, confirmación, permisos y auditoría obligatorios"}),
  row({id:"CRM.CHAT.SYNC.PRESENCE",area:"chat",functionName:"Sincronización, presencia y escritura",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: polling aproximado de 20 s, presencia/typing y sincronización de mensajes",v16State:"Pendiente de arquitectura realtime/PWA",status:"PENDIENTE",priority:"P2",action:"Diseñar realtime con fallback y deduplicación; no copiar polling global"}),

  row({id:"CRM.NOTIFY.COLLECTIONS.DUE",area:"notificaciones",functionName:"Alertas de cobranzas vencidas, hoy y próximas 48 h",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:11447 revisarYNotificar; 11467 revisarVencimientosParaNotificar",v16State:"Confirmada y separada de cobranzas",status:"PENDIENTE",priority:"P0",data:"cuota, vencimiento, cliente autorizado, estado",action:"Reimplementar desde ledger de cobranzas con reglas de alcance"}),
  row({id:"CRM.NOTIFY.NEW.MESSAGE",area:"notificaciones",functionName:"Notificación de mensaje nuevo",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: notificar y flujo de chat/no leídos",v16State:"Pendiente",status:"PENDIENTE",priority:"P1"}),
  row({id:"CRM.NOTIFY.PERMISSION",area:"notificaciones",functionName:"Permiso explícito de notificaciones",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:11399 pedirPermisoNotif; 11406 activarNotificaciones",v16State:"Pendiente; no se solicita automáticamente",status:"PENDIENTE",priority:"P1",readWrite:"Permiso local del dispositivo, sin catálogo/CRM write"}),
  row({id:"CRM.NOTIFY.BADGE.VISIBILITY",area:"notificaciones",functionName:"Badges y comportamiento visible/oculto",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: Notification API, document.visibilityState y título intermitente",v16State:"Pendiente de estrategia PWA",status:"PENDIENTE",priority:"P2"}),
  row({id:"CRM.NOTIFY.DEDUP",area:"notificaciones",functionName:"Antiduplicados diario",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: clave ae_notif_cobranzas_<fecha>",v16State:"Regla útil inventariada; localStorage no será autoridad",status:"PARCIAL",priority:"P1",action:"Conservar idempotencia usando evento/registro autorizado por usuario y dispositivo"}),
  row({id:"CRM.NOTIFY.PWA.STRATEGY",area:"notificaciones",functionName:"Estrategia PWA/App de notificaciones",historicalSource:"CRM Legacy + V16 PWA",exactEvidence:"index(8).html Notification API; public/sw.js y manifest.webmanifest",v16State:"PWA foundation preservada; push productivo no conectado",status:"PARCIAL",priority:"P2"}),

  row({id:"CRM.TASKS.BADGE",area:"tareas/calendario",functionName:"Tareas pendientes y badge",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:9351 cargarTareas; 9352 guardarTareas; 9532 actualizarTareaBadge",v16State:"Confirmada; V16 no tiene servicio canónico",status:"PENDIENTE",priority:"P1",data:"título, fecha/hora, estado, responsable, relación operativa"}),
  row({id:"CRM.TASKS.CRUD",area:"tareas/calendario",functionName:"Alta, edición, completado y borrado de tareas",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:9567–9662 handlers de tareas",v16State:"Inventariado; localStorage legacy no será autoridad",status:"PENDIENTE",priority:"P1",readWrite:"Futuro write server-side auditado"}),
  row({id:"CRM.TASKS.REMINDERS",area:"tareas/calendario",functionName:"Recordatorios diarios y horarios",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:9540 recordatorio diario; 9556 recordatorio horario",v16State:"Pendiente",status:"PENDIENTE",priority:"P1"}),
  row({id:"CRM.CALENDAR.OPERATIONAL",area:"tareas/calendario",functionName:"Calendario operativo",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:9670+ claves/eventos; 9706 renderCalendario",v16State:"Confirmado; sin calendario V16 final",status:"PENDIENTE",priority:"P1",data:"evento, fecha/hora, estado, relación de dominio"}),
  row({id:"CRM.CALENDAR.TODAY",area:"tareas/calendario",functionName:"Cobros y eventos de hoy",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: badge y resumen de eventos/cobros del día",v16State:"Pendiente de Cliente 360 y Cobranzas",status:"PENDIENTE",priority:"P0"}),
  row({id:"CRM.TASKS.DOMAIN.LINK",area:"tareas/calendario",functionName:"Relación con Cliente 360, Cobranzas y Entregas",historicalSource:"Intención Legacy + contratos Amarango OS",exactEvidence:"AMARANGO-OS-DATA-CONTRACT.md; índice CRM real",v16State:"Contrato conceptual; claves foráneas no definidas",status:"PENDIENTE",priority:"P0"}),

  row({id:"FINANCE.INVESTOR.PAYABLES",area:"inversionistas/revendedores",functionName:"Cuentas a pagar a inversionistas",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:8896 bloquePagosTercerosHTML; 8959 togglePagoInv; backup ventas pagoInv.<actor>",v16State:"Separada de la función genérica Inversión",status:"PENDIENTE",priority:"P0",data:"obligación, beneficiario, porcentaje, cuota origen, importe, estado y comprobante",securityRisk:"Alto: ledger financiero, segregación de funciones y auditoría"}),
  row({id:"FINANCE.RESELLER.PAYABLES",area:"inversionistas/revendedores",functionName:"Cuentas a pagar a revendedores",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:8896 bloquePagosTercerosHTML; 8969 togglePagoRev; backup ventas pagoRev",v16State:"Separada de comisión calculada",status:"PENDIENTE",priority:"P0",data:"comisión devengada, beneficiario, cuota origen, pago y comprobante"}),
  row({id:"FINANCE.THIRD.PARTY.RELATION",area:"inversionistas/revendedores",functionName:"Cuota cobrada → obligación → pago a tercero",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: bloquePagosTercerosHTML y avisarInversoresCobro",v16State:"Regla confirmada; no existe subledger V16",status:"PENDIENTE",priority:"P0",action:"Diseñar subledger con vínculo inmutable al cobro y estado de liquidación"}),
  row({id:"FINANCE.INVESTOR.DISTRIBUTION",area:"inversionistas/revendedores",functionName:"Reparto, porcentajes, capital y ganancia",historicalSource:"CRM Legacy real + backup sanitizado",exactEvidence:"index(8).html funciones de inversión; schema backup: inversionistas/porcentajes/capital",v16State:"Campos documentados; fórmulas requieren auditoría",status:"PENDIENTE",priority:"P0",action:"No recalcular ni asumir reglas hasta gate financiero"}),
  row({id:"FINANCE.INVESTOR.MESSAGE",area:"inversionistas/revendedores",functionName:"Mensaje/solicitud de inversión, copiar y contacto",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:8836–8885 mensaje inversión, copiar/enviar; 9062 avisarInversoresCobro",v16State:"Capacidad inventariada; WhatsApp productivo fuera de alcance",status:"PENDIENTE",priority:"P1",readWrite:"Generación local de payload; envío productivo prohibido"}),
  row({id:"FINANCE.THIRD.PARTY.SUBLEDGER",area:"inversionistas/revendedores",functionName:"Subledger futuro de obligaciones a terceros",historicalSource:"Derivación segura de reglas Legacy",exactEvidence:"Relación comprobada entre cuota, pagoInv y pagoRev en index(8).html",v16State:"Contrato conceptual solamente",status:"PENDIENTE",priority:"P0",futureGate:"Data Contract financiero + revisión humana antes de SQL"}),

  row({id:"RECOVERY.CRM.FULL_BACKUP",area:"backup",functionName:"Backup operativo integral del CRM",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html:10040 snapshotDatos; incluye clientes, ventas, productos, mensajes y mayoristas",v16State:"Distinguido de backup catálogo y rollback canario",status:"PENDIENTE",priority:"P0",data:"datasets operativos, versión, fecha, hash, relaciones; sin PII en este fixture"}),
  row({id:"RECOVERY.CRM.EXPORT",area:"backup",functionName:"Exportación integral versionada",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: exportación JSON del snapshot",v16State:"Pendiente de servicio seguro",status:"PENDIENTE",priority:"P0",securityRisk:"Cifrado, acceso, minimización, registro y transporte seguros"}),
  row({id:"RECOVERY.CRM.AUTO.LOCAL",area:"backup",functionName:"Copias automáticas/locales y retención",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: backups locales, deduplicación diaria y retención de 5",v16State:"Intención preservada; localStorage no será backup autoritativo",status:"PARCIAL",priority:"P1"}),
  row({id:"RECOVERY.CRM.IMPORT.MERGE",area:"backup",functionName:"Importación/merge de backup",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: importación y merge de snapshot",v16State:"Inventariada y bloqueada",status:"PENDIENTE",priority:"P0",readWrite:"Futura mutación de alto riesgo; no ejecutada",securityRisk:"Validar schema/versión/hash, preview diff, backup previo y aprobación"}),
  row({id:"RECOVERY.CRM.RESTORE",area:"backup",functionName:"Restauración integral",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: restaurar copia automática/manual",v16State:"Bloqueada; no se restauró nada",status:"PENDIENTE",priority:"P0",readWrite:"Futura escritura controlada",futureGate:"Recovery drill aislado; nunca desde storefront"}),
  row({id:"RECOVERY.CRM.AUDIT.ROLLBACK",area:"backup",functionName:"Auditoría y rollback operativo",historicalSource:"Legacy + V4.15 rollback canario",exactEvidence:"V4.15-ROLLBACK-PLAN.md y flujo snapshot/hash Legacy",v16State:"Rollback canario preservado; rollback CRM pendiente",status:"PARCIAL",priority:"P0"}),

  row({id:"HELP.OPERATIONAL.ASSISTANT",area:"ayuda",functionName:"Ayuda operativa contextual / Amarango OS Assistant",historicalSource:"CRM Legacy real (Amara)",exactEvidence:"index(8).html:3052 abrirAmara; 3232+ guías operativas",v16State:"Capacidad auditada; no se conecta Margarita ni IA",status:"PENDIENTE",priority:"P2",routeUi:"Centro de ayuda futuro dentro de Amarango OS",readWrite:"Solo lectura/contexto"}),
  row({id:"HELP.OPERATIONAL.WORKFLOWS",area:"ayuda",functionName:"Guías: precio, cliente, venta, cobro, celulares, búsqueda y envío de precios",historicalSource:"CRM Legacy real",exactEvidence:"index(8).html: flujo Amara incluye armar precio, cargar cliente/venta, cobrar, cargar celulares, buscar cliente, enviar precios, calculadora, informes, inversión y backup",v16State:"Inventariado como guías, no automatización",status:"PENDIENTE",priority:"P2",action:"Convertir a ayuda contextual verificable; ninguna acción productiva automática"}),

  row({id:"CRM.CLIENT360.CORE",area:"clientes/Cliente360",functionName:"Cliente 360 y continuidad histórica",historicalSource:"CRM Legacy + Amarango OS V3.4",exactEvidence:"AMARANGO-OS-V3.4-CLIENT-CONTINUITY-SEMAFOROS-SPEC.md; backup schema clientes/ventas",v16State:"Contrato preservado; UI/datos reales pendientes",status:"PENDIENTE",priority:"P0",data:"identidad, contacto, operaciones, cuotas, pagos, entregas, notas y riesgo"}),
  row({id:"CRM.SALES.CORE",area:"ventas",functionName:"Ventas y Sale Snapshot",historicalSource:"CRM Legacy + Product Bridge",exactEvidence:"AMARANGO-OS-DATA-CONTRACT.md; lib/integration/sale-snapshot.ts",v16State:"Snapshot/Product Bridge preservados; confirmación bloqueada",status:"PARCIAL",priority:"P0"}),
  row({id:"CRM.COLLECTIONS.CORE",area:"cobranzas",functionName:"Cuotas, pagos, mora y conciliación",historicalSource:"CRM Legacy real + Amarango OS contract",exactEvidence:"index(8).html funciones de cuotas/pagos; AMARANGO-OS-DATA-CONTRACT.md",v16State:"Reglas inventariadas; ledger productivo pendiente",status:"PENDIENTE",priority:"P0"}),
  row({id:"FINANCE.CASH.LEDGER",area:"caja",functionName:"Movimientos de caja, entradas, salidas y resultado",historicalSource:"CRM Legacy real + Amarango OS contract",exactEvidence:"index(8).html funciones de caja/movimientos; AMARANGO-OS-DATA-CONTRACT.md",v16State:"Contrato documental; sin write ni panel operativo",status:"PENDIENTE",priority:"P0"}),
  row({id:"CRM.DELIVERIES.CORE",area:"entregas",functionName:"Entregas, estado, responsable y seguimiento",historicalSource:"CRM Legacy real + Amarango OS contract",exactEvidence:"AMARANGO-OS-DATA-CONTRACT.md#entregas; índice CRM real",v16State:"Contrato preservado; UI/datos pendientes",status:"PENDIENTE",priority:"P0"}),
  row({id:"CRM.TEAM.ROLES",area:"asesores/equipo",functionName:"Usuarios, asesores, responsables y alcance",historicalSource:"CRM Legacy real + Mi Amarango",exactEvidence:"index(8).html funciones de usuario/responsable; app/components/advisor-workspace.tsx",v16State:"Mi Amarango preservado; Auth/RBAC productivo pendiente",status:"PARCIAL",priority:"P0"}),
  row({id:"CRM.REPORTING.OPERATIONAL",area:"reportes",functionName:"Reportes operativos reales",historicalSource:"CRM Legacy + Revenue Intelligence",exactEvidence:"index(8).html funciones de reportes/estadísticas; V4.15-REVENUE-INTELLIGENCE-DESIGN.md",v16State:"Eventos diseñados; tracking productivo no activado",status:"PARCIAL",priority:"P1"}),

  row({id:"CATALOG.LEGACY.OPERATIONS",area:"catálogo",functionName:"Operaciones de catálogo Legacy",historicalSource:"Tienda Legacy real",exactEvidence:"public/index.html; 166 funciones nombradas clasificadas por detector",v16State:"Capacidades detalladas en V4.15.3; escrituras bloqueadas",status:"PARCIAL",priority:"P0"}),
  row({id:"PRICING.LEGACY.CALCULATOR",area:"precios/financiación",functionName:"Calculadora y reglas Legacy",historicalSource:"calculadora.html + tienda legacy",exactEvidence:"calculadora.html; 25 funciones clasificadas; LEGACY-FINANCING-MAP.md",v16State:"Motor V16 y Calculadora Admin preservados; política productiva pendiente",status:"PARCIAL",priority:"P0"}),
  row({id:"PHOTO.PLATES.FLYERS",area:"fotos/Photo Intelligence",functionName:"Fotos, placas y flyers",historicalSource:"calculadora.html, Step 7L, V4.4 y V4.14",exactEvidence:"24 funciones legacy clasificadas; plates-engine.ts; V4.14-PHOTO-INTELLIGENCE-ARCHITECTURE.md",v16State:"Placas y Photo Intelligence preservadas; writes bloqueados",status:"PARCIAL",priority:"P1"}),
  row({id:"COMMERCIAL.SHARE.HELPERS",area:"Storefront",functionName:"Compartir/copiar/QR/Instagram",historicalSource:"Tienda y CRM Legacy",exactEvidence:"44 funciones nombradas clasificadas; lib/commerce/share.ts",v16State:"Compartir producto V16 absorbe el flujo público; variantes Admin pendientes",status:"ABSORBIDA POR V16",priority:"P1"}),
  row({id:"PLATFORM.SYNC.OFFLINE",area:"PWA/offline/actualización",functionName:"Sincronización, PWA, offline y actualización",historicalSource:"Tienda/CRM Legacy + V16 PWA",exactEvidence:"59 funciones nombradas clasificadas; public/sw.js; manifest.webmanifest",v16State:"PWA foundation preservada; sync riesgosa no copiada",status:"PARCIAL",priority:"P1",action:"Conservar offline/update; reescribir sync como backend idempotente"}),
  row({id:"RUNTIME.SEARCH.FORMAT",area:"configuración",functionName:"Helpers de búsqueda, normalización y formato",historicalSource:"Cuatro HTML Legacy",exactEvidence:"35 funciones nombradas clasificadas por detector",v16State:"Capacidad absorbida por módulos V16 cuando existe; resto inventariado",status:"ABSORBIDA POR V16",priority:"P3"}),
  row({id:"RUNTIME.UI.NAVIGATION",area:"configuración",functionName:"Runtime UI, modales y navegación Legacy",historicalSource:"Cuatro HTML Legacy",exactEvidence:"216 funciones nombradas clasificadas por detector",v16State:"Premium App Experience reemplaza la implementación visual antigua",status:"ABSORBIDA POR V16",priority:"P3",action:"No copiar UI antigua; conservar únicamente intención funcional"}),
  row({id:"RUNTIME.DATA.OPERATIONS",area:"seguridad/roles/auditoría",functionName:"Helpers de carga/guardado Legacy",historicalSource:"Cuatro HTML Legacy",exactEvidence:"148 funciones nombradas clasificadas por detector",v16State:"Inventariadas como superficie de riesgo; ninguna escritura copiada",status:"PENDIENTE",priority:"P0",securityRisk:"Alto: revisar cada comando antes de reimplementarlo server-side"}),
  row({id:"RUNTIME.SUPPORT.HELPERS",area:"configuración",functionName:"Helpers técnicos sin capacidad comercial propia",historicalSource:"Cuatro HTML Legacy",exactEvidence:"474 funciones nombradas sin keyword de dominio, preservadas individualmente en manifest con fuente/línea",v16State:"Mapeadas para evitar pérdida silenciosa; no se copian automáticamente",status:"PENDIENTE",priority:"P3",action:"Reclasificar si una revisión humana identifica intención de negocio adicional"}),

  row({id:"SECURITY.LEGACY.FRONTEND.PINS",area:"seguridad/roles/auditoría",functionName:"PINs/secretos y autoridad de frontend Legacy",historicalSource:"Patrones inseguros detectados en Legacy",exactEvidence:"Auditoría de index(8).html/public/index.html; V4.15.3-ROLE-SECURITY-AUDIT.md",v16State:"Deliberadamente no preservado como implementación",status:"CANDIDATA A RETIRO",priority:"P0",action:"Retirar el patrón inseguro; preservar acceso mediante Auth/RBAC server-side",futureGate:"Decisión del dueño + Auth Gate"}),
  row({id:"ADMIN.CANARY.READINESS.LOCK",area:"Administración",functionName:"Canary exacto de cinco con IDs nulos",historicalSource:"V4.15–V4.15.3",exactEvidence:"V4.15-CANARY-PAYLOAD.json; cinco futureCanonicalProductId=null",v16State:"Preservado byte a byte; no ejecutado",status:"PRESERVADA",priority:"P0",readWrite:"READ ONLY",action:"Esperar autorización humana; no avanzar automáticamente",futureGate:"Canary Migration Gate separado"}),
  row({id:"STOREFRONT.PREMIUM.APP.CONTRACT",area:"Storefront",functionName:"Premium App Experience y límites visuales",historicalSource:"V4.15.1/V4.15.2",exactEvidence:"V4.15.2-PRODUCT-CARD-PREMIUM-POLISH.md y standalone aprobado",v16State:"Intacto; este checkpoint no toca UI cliente",status:"PRESERVADA",priority:"P0",readWrite:"Read-only",action:"Mantener corazón arriba izquierda, contain/cero crop, logo/flyer libre y cero diagnóstico LAB"}),
  row({id:"ADMIN.CALCULATOR.MANDATORY",area:"Administración",functionName:"Calculadora Amarango obligatoria",historicalSource:"calculadora.html + Step 7L",exactEvidence:"components/internal/admin/amarango-calculator-panel.tsx; lib/internal/finance/amarango-calculator.ts",v16State:"Preservada en Admin; sin guardar producto",status:"PARCIAL",priority:"P0"}),
  row({id:"ADMIN.PLATES.MANDATORY",area:"Administración",functionName:"Sistema Placas obligatorio",historicalSource:"calculadora.html + Step 7L",exactEvidence:"components/internal/admin/plates-panel.tsx; lib/internal/finance/plates-engine.ts",v16State:"Preservado en Admin; Storage/write bloqueado",status:"PARCIAL",priority:"P0"}),
];

export const masterFunctionMatrix:readonly MasterFunctionRow[] = Object.freeze([...baseRows,...closureRows]);
export const inventoryStatusCounts = Object.freeze(masterFunctionMatrix.reduce<Record<InventoryStatus,number>>((acc,item)=>{acc[item.status]+=1;return acc;},{PRESERVADA:0,PARCIAL:0,PENDIENTE:0,"NO ENCONTRADA":0,"ABSORBIDA POR V16":0,"CANDIDATA A RETIRO":0}));
export const inventoryDomains = Object.freeze([...new Set(masterFunctionMatrix.map((item)=>item.area))].sort((a,b)=>a.localeCompare(b,"es")));
export const requiredClosureIds = Object.freeze(["CRM.CHAT.INTERNAL","CRM.NOTIFY.COLLECTIONS.DUE","CRM.TASKS.BADGE","FINANCE.INVESTOR.PAYABLES","FINANCE.RESELLER.PAYABLES","RECOVERY.CRM.FULL_BACKUP","HELP.OPERATIONAL.ASSISTANT"]);
