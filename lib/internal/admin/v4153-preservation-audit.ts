import { legacyAdminParity, type LegacyAdminFeature } from "./legacy-admin-parity";

export type AdminAuditStatus = "PRESERVADA" | "PARCIAL" | "PENDIENTE" | "NO ENCONTRADA";

export interface AdminFunctionAuditRow {
  area: string;
  functionName: string;
  historicalSource: string;
  currentImplementation: string;
  route: string;
  authorizedRole: string;
  dataUsed: string;
  mode: string;
  status: AdminAuditStatus;
  evidence: string;
  risk: string;
  recommendedAction: string;
}

type EvidenceState = Pick<AdminFunctionAuditRow, "currentImplementation" | "route" | "mode" | "status" | "evidence">;

const implemented: Readonly<Record<string, EvidenceState>> = Object.freeze({
  "catalog.bulk": { currentImplementation:"Parser ARS/USD + preview fail-closed; no aplicación autorizada", route:"Módulo interno; acceso rápido preservado", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"lib/internal/admin/bulk-price-parser.ts; import-preview.ts; tests/v16-step7j-admin-center-foundation.test.mjs" },
  "phones.bulk": { currentImplementation:"Parser Legacy PESOS/USD, preview y decisión de faltantes", route:"Módulo interno; acceso rápido preservado", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"lib/internal/admin/phone-bulk-import.ts; tests/v16-step7j1-admin-legacy-parity.test.mjs" },
  "phones.fx.reprice": { currentImplementation:"Reprecio simulado por cotización con writeAllowed=false", route:"Módulo interno", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"lib/internal/admin/phone-bulk-import.ts#previewPhoneFxUpdate" },
  "catalog.product.edit": { currentImplementation:"Contrato de editor y acciones contextuales; editor productivo no conectado", route:"/administracion · tarjeta/contrato", mode:"UI parcial / futura escritura", status:"PARCIAL", evidence:"lib/internal/admin/admin-workspace.ts#adminProductEditorContract; components/internal/admin/admin-product-card.tsx" },
  "catalog.price.confirm": { currentImplementation:"Preview puro de confirmación y cola de revisión", route:"Módulo interno", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"lib/internal/admin/import-preview.ts#buildPriceConfirmationPreview; admin-workspace.ts#buildAdminTodayQueue" },
  "catalog.price.age": { currentImplementation:"Semáforo puro de antigüedad visible en tarjeta Admin", route:"/administracion · Catálogo", mode:"Read-only", status:"PRESERVADA", evidence:"lib/internal/finance/price-age.ts; components/internal/admin/admin-product-card.tsx; tests/v16-step7l-admin-cards-calculator-plates.test.mjs" },
  "catalog.fx.product": { currentImplementation:"Validación y conversión USD→ARS aislada", route:"Módulo interno", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"lib/internal/admin/fx-rate.ts" },
  "finance.policy": { currentImplementation:"Política versionada en código; autoridad productiva pendiente", route:"Calculadora Admin", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"lib/internal/finance/amarango-policy.ts; LEGACY-FINANCING-MAP.md" },
  "finance.calculator": { currentImplementation:"Motor puro + panel Admin para costo/venta/USD y 2/4/6; sin guardar producto", route:"/administracion · Calculadora", mode:"LAB local; sin guardar producto", status:"PARCIAL", evidence:"components/internal/admin/amarango-calculator-panel.tsx; lib/internal/finance/amarango-calculator.ts; tests/v16-step7l-admin-cards-calculator-plates.test.mjs" },
  "finance.plates": { currentImplementation:"Parser Costo/Venta/USD, cuotas y texto compartible; sin placa gráfica persistente", route:"/administracion · Placas", mode:"LAB local; sin Storage", status:"PARCIAL", evidence:"components/internal/admin/plates-panel.tsx; lib/internal/finance/plates-engine.ts; tests/v16-step7l-admin-cards-calculator-plates.test.mjs" },
  "catalog.images.supplier": { currentImplementation:"Alternancia proveedor/flyer económico con persistencia local", route:"/administracion · Catálogo", mode:"LAB local / futura escritura", status:"PARCIAL", evidence:"app/components/admin-consolidated-workspace.tsx; public/assets/admin-lab/" },
  "catalog.stock": { currentImplementation:"Estado visible en tarjeta y cambio solo local en fixture", route:"/administracion · Catálogo", mode:"LAB local / futura escritura", status:"PARCIAL", evidence:"app/components/admin-consolidated-workspace.tsx; components/internal/admin/admin-product-card.tsx" },
  "catalog.visibility": { currentImplementation:"Estado visible y control local; mutación productiva bloqueada", route:"/administracion · Catálogo", mode:"LAB local / futura escritura", status:"PARCIAL", evidence:"app/components/admin-consolidated-workspace.tsx; lib/internal/admin/admin-center-contract.ts" },
  "catalog.featured": { currentImplementation:"Control local y acción contextual preservada", route:"/administracion · Catálogo", mode:"LAB local / futura escritura", status:"PARCIAL", evidence:"app/components/admin-consolidated-workspace.tsx; lib/internal/admin/admin-workspace.ts" },
  "catalog.offer": { currentImplementation:"Editor local Ofertas & Outlet con precio anterior/promoción", route:"/administracion · Ofertas", mode:"LAB local / futura escritura", status:"PARCIAL", evidence:"app/components/admin-consolidated-workspace.tsx; lib/os-lab/offers-store.ts" },
  "catalog.interest_free": { currentImplementation:"Tipos 2/3 cuotas disponibles solo en lab de ofertas; sin política productiva", route:"/administracion · Ofertas", mode:"LAB local / futura escritura", status:"PARCIAL", evidence:"lib/os-lab/offers-store.ts; app/components/admin-consolidated-workspace.tsx" },
  "catalog.bulk.mark": { currentImplementation:"Selección y bandeja masiva visual; comandos no conectados", route:"/administracion · Catálogo", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"components/internal/admin/admin-product-grid.tsx" },
  "catalog.hidden.diagnostic": { currentImplementation:"Contrato y cola read-only por motivos", route:"Módulo interno", mode:"Read-only", status:"PARCIAL", evidence:"lib/internal/admin/admin-workspace.ts#buildAdminTodayQueue; admin-screenshot-parity.ts" },
  "catalog.review.queues": { currentImplementation:"Cola de hoy determinista para precios/importación/fotos/stock", route:"Módulo interno", mode:"Read-only", status:"PARCIAL", evidence:"lib/internal/admin/admin-workspace.ts#buildAdminTodayQueue; tests/v16-step7k-admin-visual-system.test.mjs" },
  "suppliers": { currentImplementation:"Proveedor visible en tarjeta/contrato y buscable; fuente autorizada pendiente", route:"/administracion · Catálogo", mode:"Read-only / futura escritura", status:"PARCIAL", evidence:"components/internal/admin/admin-product-card.tsx; lib/internal/admin/catalog-scale.ts" },
  "sales.register": { currentImplementation:"Product Bridge + borrador de operación y snapshot; confirmar bloqueado", route:"/amarango-os", mode:"LAB read-only / futura escritura", status:"PARCIAL", evidence:"app/components/amarango-os-product-bridge.tsx; lib/integration/sale-snapshot.ts" },
  "clients": { currentImplementation:"Contrato documental y entrada de navegación; Cliente 360 real no conectado", route:"/amarango-os · entrada inactiva", mode:"Contrato / futura escritura", status:"PENDIENTE", evidence:"AMARANGO-OS-DATA-CONTRACT.md; app/components/amarango-os-product-bridge.tsx" },
  "orders.history": { currentImplementation:"Contrato Legacy preservado; sin historial operativo conectado", route:"Acceso rápido/contrato", mode:"Pendiente de reconexión", status:"PENDIENTE", evidence:"lib/internal/admin/legacy-admin-parity.ts; admin-workspace.ts" },
  "stats": { currentImplementation:"Contrato Legacy preservado; sin fuente real ni dashboard conectado", route:"Acceso rápido/contrato", mode:"Pendiente de reconexión", status:"PENDIENTE", evidence:"lib/internal/admin/legacy-admin-parity.ts; V4.15-REVENUE-INTELLIGENCE-DESIGN.md" },
  "sales.team": { currentImplementation:"Contrato de equipo/roles; gestión real no conectada", route:"Acceso rápido/contrato", mode:"Pendiente de reconexión", status:"PENDIENTE", evidence:"lib/internal/admin/legacy-admin-parity.ts; admin-workspace.ts" },
  "catalog.share.multiple": { currentImplementation:"Contrato y selección múltiple preservados; exportación múltiple no conectada", route:"/administracion · Catálogo", mode:"UI parcial", status:"PARCIAL", evidence:"lib/internal/admin/admin-workspace.ts; components/internal/admin/admin-product-grid.tsx" },
  "catalog.product.copy": { currentImplementation:"Acción contextual preservada; payload final no conectado", route:"/administracion · tarjeta", mode:"UI parcial", status:"PARCIAL", evidence:"lib/internal/admin/admin-workspace.ts#adminProductContextActions" },
  "catalog.product.cost_to_sale": { currentImplementation:"Motor de cálculo existe; botón de editor productivo pendiente", route:"Calculadora / contrato editor", mode:"LAB local", status:"PARCIAL", evidence:"lib/internal/finance/amarango-calculator.ts; lib/internal/admin/admin-workspace.ts" },
  "catalog.product.sale_to_cost": { currentImplementation:"Estimación inversa pura; botón de editor productivo pendiente", route:"Calculadora / contrato editor", mode:"LAB local", status:"PARCIAL", evidence:"lib/internal/finance/amarango-calculator.ts#estimateCostFromSale" },
  "client.preview": { currentImplementation:"Contrato read-only preservado; acceso final Admin pendiente", route:"Contrato", mode:"Pendiente de reconexión", status:"PARCIAL", evidence:"lib/internal/admin/legacy-admin-parity.ts; admin-screenshot-parity.ts" },
});

const areaData: Readonly<Record<string, string>> = Object.freeze({
  catalog:"Product V16, nombre, categoría, precios, foto, proveedor",
  phones:"lista legacy de celulares y Product V16 propuesto",
  pricing:"costo, venta, USD, cotización y fecha de precio",
  finance:"costo, contado, markup, cuotas y política versionada",
  images:"foto oficial, foto proveedor y origen",
  inventory:"stock, override y visibilidad",
  merchandising:"destacados, oferta y vigencia",
  quality:"diagnósticos, revisión y trazabilidad",
  recovery:"snapshots, papelera e historial",
  operations:"estado técnico sin secretos",
  suppliers:"proveedor, mayorista, costo y fecha",
  sales:"venta, producto, responsables y estados",
  crm:"cliente y relaciones operativas",
  reports:"eventos y métricas reales",
  team:"usuarios, asesores, permisos y estado",
  marketing:"contenido, vigencia y política comercial",
  exports:"catálogo autorizado y payload visible",
  appearance:"preferencias visuales locales",
  security:"sesión, rol y autorización",
});

function legacyRow(feature: LegacyAdminFeature): AdminFunctionAuditRow {
  const state = implemented[feature.id] ?? {
    currentImplementation:"Contrato de paridad preservado; capacidad operativa todavía no integrada",
    route:"Contrato interno; sin pantalla final conectada",
    mode:"Pendiente de reconexión",
    status:"PENDIENTE" as const,
    evidence:`lib/internal/admin/legacy-admin-parity.ts#${feature.id}`,
  };
  return Object.freeze({
    area: feature.area,
    functionName: feature.legacyLabel,
    historicalSource: `Tienda Legacy / paridad bloqueada · ${feature.id}`,
    currentImplementation: state.currentImplementation,
    route: state.route,
    authorizedRole: "Administración",
    dataUsed: areaData[feature.area] ?? "datos administrativos autorizados",
    mode: state.mode,
    status: state.status,
    evidence: state.evidence,
    risk: state.status === "PRESERVADA" ? "Bajo mientras se mantenga el contrato" : `Pérdida operativa o reconexión insegura: ${feature.notes}`,
    recommendedAction: state.status === "PRESERVADA" ? "Mantener tests de regresión" : feature.notes,
  });
}

function detailedRow(row: AdminFunctionAuditRow): AdminFunctionAuditRow {
  return Object.freeze(row);
}

const detailedDomainRows: readonly AdminFunctionAuditRow[] = Object.freeze([
  detailedRow({area:"catálogo",functionName:"Listado incremental para 1.200+ productos",historicalSource:"Admin Legacy / Step 7L",currentImplementation:"Ventana incremental de 36 y filtros puros",route:"/administracion · Catálogo",authorizedRole:"Administración",dataUsed:"Product V16 administrativo",mode:"Read-only",status:"PRESERVADA",evidence:"lib/internal/admin/catalog-scale.ts; components/internal/admin/admin-product-grid.tsx; tests/v16-step7l-admin-cards-calculator-plates.test.mjs",risk:"Regresión de rendimiento con catálogo completo",recommendedAction:"Mantener carga progresiva y pruebas de escala"}),
  detailedRow({area:"catálogo",functionName:"Búsqueda por nombre, modelo, código y término A16",historicalSource:"Legacy + Product Bridge",currentImplementation:"Búsqueda tokenizada en Product Bridge; Admin busca nombre/proveedor/categoría",route:"/amarango-os y /administracion",authorizedRole:"Administración",dataUsed:"nombre, modelo, memoria, marca, categoría, proveedor",mode:"Read-only",status:"PARCIAL",evidence:"lib/integration/product-bridge.ts; lib/internal/admin/catalog-scale.ts",risk:"Admin no tiene aún el mismo índice completo por modelo/código",recommendedAction:"Unificar búsqueda Admin con Product Bridge sin duplicar catálogo"}),
  detailedRow({area:"catálogo",functionName:"Product V16 como contrato único",historicalSource:"V4.11–V4.15",currentImplementation:"Cliente/Asesor/Product Bridge consumen contrato común; Admin pilot proyecta campos internos",route:"Storefront, /mi-amarango, /amarango-os, /administracion",authorizedRole:"Todos según proyección",dataUsed:"Product V16 + proyección administrativa",mode:"Read-only",status:"PRESERVADA",evidence:"lib/catalog/types.ts; lib/integration/product-bridge.ts; components/internal/admin/v411-pilot-products.ts; tests/v16-v411-real-catalog.test.mjs",risk:"Crear catálogos paralelos rompe paridad",recommendedAction:"Mantener adaptadores por rol sobre el mismo ID"}),
  detailedRow({area:"catálogo",functionName:"Datos internos fuera de Cliente/Asesor",historicalSource:"Regla V16 por roles",currentImplementation:"Proyecciones separadas y notas explícitas de privacidad",route:"Storefront / Mi Amarango / Admin",authorizedRole:"Administración",dataUsed:"costo, proveedor, USD, inversión",mode:"Read-only",status:"PRESERVADA",evidence:"lib/integration/product-bridge.ts; app/components/advisor-workspace.tsx; tests/v16-amarango-os-v3-product-bridge.test.mjs",risk:"Fuga de información comercial",recommendedAction:"Mantener pruebas negativas de roles"}),
  detailedRow({area:"Admin Accelerator",functionName:"Centro de actualización",historicalSource:"V4.4 Admin Accelerator",currentImplementation:"Workspace consolidado y accesos rápidos; bandeja operativa completa aislada",route:"/administracion",authorizedRole:"Administración",dataUsed:"señales de catálogo y revisión",mode:"LAB read-only",status:"PARCIAL",evidence:"app/components/admin-consolidated-workspace.tsx; lib/internal/admin/admin-workspace.ts",risk:"Más pasos o funciones escondidas",recommendedAction:"Reconectar cola de hoy a fuentes autorizadas"}),
  detailedRow({area:"Admin Accelerator",functionName:"Provider inbox",historicalSource:"V4.4 Admin Accelerator",currentImplementation:"No hay bandeja proveedor conectada; existe proveedor en contratos",route:"Sin pantalla final",authorizedRole:"Administración",dataUsed:"proveedor, novedades, costo, stock",mode:"Pendiente",status:"NO ENCONTRADA",evidence:"Referencia V4.4 en prompt; lib/internal/admin/legacy-admin-parity.ts#suppliers",risk:"Actualizaciones de mayorista quedan dispersas",recommendedAction:"Recuperar módulo V4.4 o reimplementar inbox sobre fuente auditada"}),
  detailedRow({area:"Admin Accelerator",functionName:"Flyer económico proveedor → Amarango",historicalSource:"V4.4",currentImplementation:"Preview y aprobación local persistente",route:"/administracion · Catálogo",authorizedRole:"Administración",dataUsed:"foto proveedor y fixture Amarango",mode:"LAB local",status:"PRESERVADA",evidence:"app/components/admin-consolidated-workspace.tsx; public/assets/admin-lab/",risk:"Confundir aprobación local con foto productiva",recommendedAction:"Mantener rótulo LAB hasta Storage/Auth autorizado"}),
  detailedRow({area:"Ofertas & Outlet",functionName:"Oferta del día / Contado / 2x / 3x / Outlet",historicalSource:"V4.7",currentImplementation:"Cinco tipos disponibles en editor local",route:"/administracion · Ofertas",authorizedRole:"Administración",dataUsed:"producto, precios, stock, vigencia",mode:"LAB local",status:"PRESERVADA",evidence:"lib/os-lab/offers-store.ts; app/components/admin-consolidated-workspace.tsx",risk:"Activar condición comercial sin política válida",recommendedAction:"Agregar servidor autorizado, vigencia y auditoría antes de publicar"}),
  detailedRow({area:"clientes",functionName:"Búsqueda de cliente",historicalSource:"CRM Legacy",currentImplementation:"Contrato y campo deshabilitado en Nueva Venta; sin fuente real",route:"/amarango-os · Nueva venta",authorizedRole:"Administración / Asesor autorizado",dataUsed:"identidad y contacto mínimo",mode:"Pendiente",status:"PENDIENTE",evidence:"AMARANGO-OS-DATA-CONTRACT.md; app/components/amarango-os-product-bridge.tsx",risk:"Duplicados y venta sin vinculación",recommendedAction:"Auditar CRM Legacy e implementar búsqueda con permisos"}),
  detailedRow({area:"clientes",functionName:"Ficha Cliente 360",historicalSource:"CRM Legacy",currentImplementation:"Entrada de navegación sin pantalla funcional",route:"/amarango-os · entrada inactiva",authorizedRole:"Administración / Asesor con alcance",dataUsed:"estado, compras, cuotas, pagos, entregas, documentos, notas",mode:"Pendiente",status:"NO ENCONTRADA",evidence:"app/components/amarango-os-product-bridge.tsx#navItems; AMARANGO-OS-DATA-CONTRACT.md",risk:"Operación fragmentada y sin historia",recommendedAction:"Reimplementar luego de auditoría del CRM real"}),
  detailedRow({area:"clientes",functionName:"Tarjetas / Planilla / Seguimiento",historicalSource:"CRM Legacy",currentImplementation:"Sin evidencia de las tres vistas funcionales",route:"Sin pantalla final",authorizedRole:"Administración / Asesor según alcance",dataUsed:"clientes, estado y próximos vencimientos",mode:"Pendiente",status:"NO ENCONTRADA",evidence:"V16-FUTURE-CRM-INTEGRATION-NOTES.md",risk:"Pérdida de velocidad operativa",recommendedAction:"Recuperar flujos exactos del CRM antes de diseñar"}),
  detailedRow({area:"ventas",functionName:"Búsqueda desde catálogo maestro",historicalSource:"Product Bridge V3",currentImplementation:"Búsqueda por nombre/modelo/memoria/categoría/marca",route:"/amarango-os · Nueva venta",authorizedRole:"Administración / Asesor autorizado",dataUsed:"Product V16",mode:"Read-only",status:"PRESERVADA",evidence:"lib/integration/product-bridge.ts; app/components/amarango-os-product-bridge.tsx; tests/v16-amarango-os-v3-product-bridge.test.mjs",risk:"Duplicar catálogo dentro del CRM",recommendedAction:"Mantener Product Bridge como única entrada"}),
  detailedRow({area:"ventas",functionName:"Snapshot inmutable del producto",historicalSource:"Amarango OS V3",currentImplementation:"Constructor de snapshot independiente del catálogo",route:"/amarango-os · preview",authorizedRole:"Administración / Asesor autorizado",dataUsed:"ID, nombre, precio/costo usado, proveedor y fechas",mode:"LAB read-only",status:"PRESERVADA",evidence:"lib/integration/sale-snapshot.ts; tests/v16-amarango-os-v3-product-bridge.test.mjs",risk:"Ventas históricas cambian con el catálogo",recommendedAction:"Persistir solo al gate autorizado"}),
  detailedRow({area:"ventas",functionName:"Pegar producto/precio o mensaje completo de WhatsApp",historicalSource:"CRM Legacy",currentImplementation:"No existe parser de venta completo comprobado",route:"Sin pantalla final",authorizedRole:"Administración / Asesor autorizado",dataUsed:"texto de operación",mode:"Pendiente",status:"NO ENCONTRADA",evidence:"AMARANGO-OS-V3-FIELD-INVENTORY.md",risk:"Carga manual lenta y con errores",recommendedAction:"Auditar parser Legacy; no reutilizar endpoints de WhatsApp"}),
  detailedRow({area:"ventas",functionName:"Confirmación humana y registro de venta",historicalSource:"CRM Legacy / Amarango OS",currentImplementation:"Preview disponible; botón confirmar deshabilitado",route:"/amarango-os",authorizedRole:"Administración / Asesor autorizado",dataUsed:"venta, producto, cliente y responsables",mode:"LAB read-only / futura escritura",status:"PARCIAL",evidence:"app/components/amarango-os-product-bridge.tsx",risk:"Registro incompleto o accidental",recommendedAction:"Gate servidor con confirmación, idempotencia y auditoría"}),
  detailedRow({area:"ventas",functionName:"Responsables múltiples, revendedor, descuento, envío e inversión",historicalSource:"CRM Legacy",currentImplementation:"Campos y chips LAB; reglas no auditadas",route:"/amarango-os · Nueva venta",authorizedRole:"Administración",dataUsed:"responsables, revendedor, importes y porcentajes",mode:"LAB local",status:"PARCIAL",evidence:"app/components/amarango-os-product-bridge.tsx; AMARANGO-OS-V3-FIELD-INVENTORY.md",risk:"Cálculos o atribuciones incorrectas",recommendedAction:"Validar reglas exactas del CRM antes de habilitar"}),
  detailedRow({area:"financiación/cobranzas",functionName:"Planes y cuotas",historicalSource:"Legacy financiación + CRM",currentImplementation:"Calculadora versionada aislada; ventas/cobranzas no conectadas",route:"Calculadora Admin / contrato Amarango OS",authorizedRole:"Administración",dataUsed:"política, cuotas, frecuencia",mode:"LAB / pendiente",status:"PARCIAL",evidence:"lib/internal/finance/amarango-policy.ts; AMARANGO-OS-DATA-CONTRACT.md; LEGACY-FINANCING-MAP.md",risk:"Aplicar política histórica incorrecta",recommendedAction:"Aprobar una política autoritativa y versionada"}),
  detailedRow({area:"financiación/cobranzas",functionName:"Vencimientos, pagos, pagos parciales y saldo",historicalSource:"CRM Legacy",currentImplementation:"Contrato documental; sin motor ni pantalla conectada",route:"/amarango-os · entrada inactiva",authorizedRole:"Administración / Asesor con alcance",dataUsed:"cuotas, pagos y saldo",mode:"Pendiente",status:"PENDIENTE",evidence:"AMARANGO-OS-DATA-CONTRACT.md#cuotas; V16-FUTURE-CRM-INTEGRATION-NOTES.md",risk:"Saldos o mora inconsistentes",recommendedAction:"Auditar CRM y diseñar ledger inmutable"}),
  detailedRow({area:"financiación/cobranzas",functionName:"Mora, seguimiento y conciliación pago→cuota→caja",historicalSource:"CRM Legacy",currentImplementation:"Sin implementación comprobada",route:"Sin pantalla final",authorizedRole:"Administración",dataUsed:"pago, cuota, estado y movimiento de caja",mode:"Pendiente",status:"NO ENCONTRADA",evidence:"AMARANGO-OS-DATA-CONTRACT.md",risk:"Descuadre financiero y reclamos",recommendedAction:"Crear modelo transaccional después de auditar reglas reales"}),
  detailedRow({area:"caja",functionName:"Caja actual, ingresos, egresos, resultado y trazabilidad",historicalSource:"CRM Legacy",currentImplementation:"Contrato documental; sin datos ni panel funcional",route:"/amarango-os · entrada inactiva",authorizedRole:"Administración",dataUsed:"movimientos de caja",mode:"Pendiente",status:"PENDIENTE",evidence:"AMARANGO-OS-DATA-CONTRACT.md#movimientos_caja",risk:"Sin control financiero unificado",recommendedAction:"Reimplementar ledger y permisos desde CRM auditado"}),
  detailedRow({area:"caja",functionName:"Períodos Hoy / 7 días / Mes / Trimestre / Año / Histórico",historicalSource:"CRM Legacy",currentImplementation:"No se encontró selector/período funcional",route:"Sin pantalla final",authorizedRole:"Administración",dataUsed:"movimientos agregados por fecha",mode:"Pendiente",status:"NO ENCONTRADA",evidence:"Requisito V4.15.3; sin código equivalente encontrado",risk:"Reportes operativos incompletos",recommendedAction:"Diseñar consultas sobre ledger canónico luego del CRM audit"}),
  detailedRow({area:"entregas",functionName:"Pendientes, estado, cliente, producto, responsable y seguimiento",historicalSource:"CRM Legacy",currentImplementation:"Contrato de entrega; sin pantalla conectada",route:"/amarango-os · entrada inactiva",authorizedRole:"Administración / Asesor con alcance",dataUsed:"venta, snapshot de dirección, estado e historial",mode:"Pendiente",status:"PENDIENTE",evidence:"AMARANGO-OS-DATA-CONTRACT.md#entregas",risk:"Entregas sin trazabilidad",recommendedAction:"Reconectar después de auditar estados y responsables Legacy"}),
  detailedRow({area:"asesores",functionName:"Catálogo, búsqueda, precio oficial y compartir",historicalSource:"Mi Amarango V4.9",currentImplementation:"Workspace comercial con Product V16 y límites de privacidad",route:"/mi-amarango",authorizedRole:"Asesor",dataUsed:"Product V16 público/comercial",mode:"Read-only",status:"PRESERVADA",evidence:"app/components/advisor-workspace.tsx; tests/v16-v49-consolidation.test.mjs",risk:"Exposición de datos privados o precio paralelo",recommendedAction:"Mantener catálogo único y tests de rol"}),
  detailedRow({area:"asesores",functionName:"Clientes, cuotas, seguimiento, ventas y comisiones",historicalSource:"CRM Legacy",currentImplementation:"Accesos preparados; operación real no conectada",route:"/mi-amarango y /amarango-os",authorizedRole:"Asesor según alcance",dataUsed:"propios clientes/ventas y comisión autorizada",mode:"Pendiente",status:"PENDIENTE",evidence:"app/components/advisor-workspace.tsx; AMARANGO-OS-DATA-CONTRACT.md",risk:"Asesor sin operativa o con exceso de permisos",recommendedAction:"Definir scopes por asesor en servidor"}),
  detailedRow({area:"roles",functionName:"Cliente sin costo/margen/USD/inversión",historicalSource:"Regla V16",currentImplementation:"Storefront solo usa proyección pública",route:"Storefront",authorizedRole:"Cliente",dataUsed:"Product V16 público",mode:"Read-only",status:"PRESERVADA",evidence:"lib/catalog/types.ts; tests/v16-v4152-product-card-premium-polish.test.mjs",risk:"Fuga comercial",recommendedAction:"Mantener allowlist pública"}),
  detailedRow({area:"roles",functionName:"Asesor sin costo/margen/USD/inversión/construcción de precio",historicalSource:"Regla V16",currentImplementation:"Workspace explícitamente limitado",route:"/mi-amarango",authorizedRole:"Asesor",dataUsed:"Product V16 comercial",mode:"Read-only",status:"PRESERVADA",evidence:"app/components/advisor-workspace.tsx; tests/v16-v49-consolidation.test.mjs",risk:"Fuga comercial",recommendedAction:"Mantener pruebas negativas"}),
  detailedRow({area:"roles",functionName:"Autenticación y permisos productivos",historicalSource:"Legacy / identidad Maxi-Angie",currentImplementation:"Contratos fail-closed; autenticación productiva no activada",route:"Zona reservada",authorizedRole:"Según RBAC futuro",dataUsed:"sesión, app_metadata y permisos",mode:"Pendiente",status:"PENDIENTE",evidence:"lib/internal/admin/admin-center-contract.ts; V4.12.1-CLOSURE-REPORT.md",risk:"Acceso administrativo no autorizado",recommendedAction:"Implementar Auth/RBAC/MFA/RLS en gate separado"}),
  detailedRow({area:"reportes",functionName:"Ventas, cobranzas, caja, clientes, productos, asesores, comisiones e inversión",historicalSource:"Legacy / CRM",currentImplementation:"Inventario contractual; no hay reportes con fuente real",route:"Acceso Admin preservado; sin pantalla final",authorizedRole:"Administración",dataUsed:"eventos y dominios operativos",mode:"Pendiente",status:"PENDIENTE",evidence:"lib/internal/admin/legacy-admin-parity.ts#stats; V4.15-REVENUE-INTELLIGENCE-DESIGN.md",risk:"Decisiones con métricas simuladas",recommendedAction:"Conectar solo eventos y ledgers reales auditados"}),
  detailedRow({area:"reportes",functionName:"Filtros, períodos y exportación",historicalSource:"Legacy / CRM",currentImplementation:"Sin implementación funcional comprobada",route:"Sin pantalla final",authorizedRole:"Administración",dataUsed:"reportes autorizados",mode:"Pendiente",status:"NO ENCONTRADA",evidence:"Requisito V4.15.3; sin componente equivalente encontrado",risk:"Reportes no operables",recommendedAction:"Definir exportación y períodos sobre fuentes canónicas"}),
  detailedRow({area:"backup/recuperación",functionName:"Backup, descarga, restauración y rollback",historicalSource:"Admin Legacy",currentImplementation:"Contratos y plan de rollback canario; sin servicio operativo",route:"Acceso rápido/contrato",authorizedRole:"Administración",dataUsed:"snapshots y hashes",mode:"Pendiente de reconexión",status:"PENDIENTE",evidence:"lib/internal/admin/legacy-admin-parity.ts; V4.15-ROLLBACK-PLAN.md",risk:"Cambios irreversibles",recommendedAction:"Servicio de snapshots + diff + confirmación + auditoría"}),
  detailedRow({area:"backup/recuperación",functionName:"Protección destructiva y confirmaciones",historicalSource:"Legacy parity secure rewrite",currentImplementation:"Contratos exigen preview; no comandos de escritura presentes",route:"Módulos internos",authorizedRole:"Administración",dataUsed:"selección y diff",mode:"Read-only",status:"PARCIAL",evidence:"lib/internal/admin/admin-center-contract.ts; admin-workspace.ts; tests/v16-step7j-admin-center-foundation.test.mjs",risk:"Acción masiva accidental",recommendedAction:"Agregar doble confirmación e idempotencia al gate de escritura"}),
  detailedRow({area:"UI Admin",functionName:"Navegación app-like, cards compactas y búsqueda rápida",historicalSource:"Step 7K–7L / V4.15.x",currentImplementation:"Componentes y standalone V4.15.3; experiencia actual conserva estructura premium",route:"/administracion y preview V4.15.3",authorizedRole:"Administración",dataUsed:"matriz y fixtures LAB",mode:"Read-only",status:"PRESERVADA",evidence:"app/components/admin-consolidated-workspace.tsx; components/internal/admin/admin-product-card.tsx; standalone V4.15.3",risk:"Admin lenta o visualmente degradada",recommendedAction:"Mantener densidad distinta del storefront"}),
  detailedRow({area:"UI Admin",functionName:"Cero select nativo visible",historicalSource:"Premium App Experience",currentImplementation:"Standalone V4.15.3 usa chips/sheets; ruta Admin actual todavía contiene select nativo",route:"Preview PASS; /administracion pendiente",authorizedRole:"Administración",dataUsed:"filtros y estados",mode:"UI",status:"PARCIAL",evidence:"AmarangoElectro-V16-V4.15.3-Admin-Function-Preservation-Audit-Standalone.html; app/components/admin-consolidated-workspace.tsx",risk:"Experiencia Android inconsistente",recommendedAction:"Reemplazar selects de la ruta real por componentes custom sin cambiar lógica"}),
  detailedRow({area:"canary",functionName:"Readiness del canario exacto de cinco celulares",historicalSource:"V4.15–V4.15.2",currentImplementation:"Payload y mapping permanecen intactos; cinco IDs null",route:"Sin activación productiva",authorizedRole:"Revisión humana",dataUsed:"V4.15-CANARY-PAYLOAD.json",mode:"Read-only",status:"PRESERVADA",evidence:"V4.15-CANARY-PAYLOAD.json; V4.15-ROLLBACK-PLAN.md; tests/v16-v4152-product-card-premium-polish.test.mjs",risk:"Migración accidental",recommendedAction:"Esperar autorización explícita; no ejecutar en V4.15.3"}),
]);

export const adminFunctionPreservationMatrix: readonly AdminFunctionAuditRow[] = Object.freeze([
  ...legacyAdminParity.map(legacyRow),
  ...detailedDomainRows,
]);

export const adminAuditStatusCounts = Object.freeze(adminFunctionPreservationMatrix.reduce<Record<AdminAuditStatus, number>>((acc, row) => {
  acc[row.status] += 1;
  return acc;
}, { PRESERVADA:0, PARCIAL:0, PENDIENTE:0, "NO ENCONTRADA":0 }));

export const adminAuditClosingStatus = Object.freeze({
  adminFunctionPreservation:"PARTIAL",
  calculatorAdmin:"PARTIAL",
  platesSystem:"PARTIAL",
  roleIsolation:"PASS",
  premiumAppUx:"PRESERVED",
  canaryReadiness:"PRESERVED",
  productionWrites:0,
});
