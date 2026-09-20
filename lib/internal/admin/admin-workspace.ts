import { legacyAdminParity, type LegacyAdminFeature } from "./legacy-admin-parity";

export type AdminWorkspaceArea =
  | "daily"
  | "catalog"
  | "phones"
  | "pricing"
  | "finance"
  | "sales"
  | "clients"
  | "suppliers"
  | "reports"
  | "recovery"
  | "marketing"
  | "team";

export interface AdminWorkspaceAction {
  id: string;
  featureId: string;
  label: string;
  description: string;
  area: AdminWorkspaceArea;
  icon: string;
  keywords: readonly string[];
  shortcut?: string;
  mobilePriority: number;
  daily: boolean;
  dangerous?: boolean;
}

const FEATURE_IDS = new Set(legacyAdminParity.map((feature) => feature.id));

function action(action: AdminWorkspaceAction): AdminWorkspaceAction {
  if (!FEATURE_IDS.has(action.featureId)) {
    throw new Error(`Admin quick action points to unknown Legacy parity feature: ${action.featureId}`);
  }
  return Object.freeze(action);
}

/**
 * Daily-first navigation. This is UI metadata only; it does not grant capabilities
 * and it never performs an administrative mutation.
 */
export const adminQuickActions: readonly AdminWorkspaceAction[] = Object.freeze([
  action({ id:"paste-phones", featureId:"phones.bulk", label:"Pegar celulares", description:"Actualizar la lista en PESOS o USD", area:"phones", icon:"📱", keywords:["celulares","telefonos","pegar","lista","usd","pesos"], shortcut:"G C", mobilePriority:1, daily:true }),
  action({ id:"paste-prices", featureId:"catalog.bulk", label:"Pegar precios", description:"Actualizar catálogo, costo o venta", area:"catalog", icon:"📋", keywords:["precios","catalogo","pegar","costo","venta","mayorista"], shortcut:"G P", mobilePriority:2, daily:true }),
  action({ id:"find-product", featureId:"catalog.product.edit", label:"Buscar producto", description:"Abrir y editar un producto puntual", area:"catalog", icon:"🔎", keywords:["buscar","producto","editar","modelo"], shortcut:"/", mobilePriority:3, daily:true }),
  action({ id:"confirm-prices", featureId:"catalog.price.confirm", label:"Confirmar precios", description:"Resolver semáforo sin cambiar el importe", area:"pricing", icon:"✅", keywords:["confirmar","precio","semaforo","revisar","antiguedad"], shortcut:"G R", mobilePriority:4, daily:true }),
  action({ id:"calculator", featureId:"finance.calculator", label:"Calculadora Amarango", description:"Costo, venta, USD, markup y cuotas", area:"finance", icon:"🧮", keywords:["calculadora","costo","venta","markup","margen","cuotas","usd"], shortcut:"G A", mobilePriority:5, daily:true }),
  action({ id:"plates", featureId:"finance.plates", label:"Sistema Placas", description:"Pegar producto y armar precio + cuotas", area:"finance", icon:"🎨", keywords:["placas","placa","costo","venta","usd","cuotas","compartir"], shortcut:"G B", mobilePriority:6, daily:true }),
  action({ id:"register-sale", featureId:"sales.register", label:"Registrar venta", description:"Cargar una venta sin salir del Admin", area:"sales", icon:"🧾", keywords:["venta","registrar","pedido","cliente"], shortcut:"G V", mobilePriority:7, daily:true }),
  action({ id:"clients", featureId:"clients", label:"Clientes", description:"Buscar historial y datos autorizados", area:"clients", icon:"👥", keywords:["clientes","buscar","historial","crm"], shortcut:"G L", mobilePriority:8, daily:true }),
  action({ id:"fx", featureId:"catalog.fx.product", label:"Dólar", description:"Cotización y productos en USD", area:"pricing", icon:"💵", keywords:["dolar","usd","cotizacion","cambio"], shortcut:"G D", mobilePriority:7, daily:false }),
  action({ id:"suppliers", featureId:"suppliers", label:"Mayoristas", description:"Proveedor y origen de compra", area:"suppliers", icon:"🏬", keywords:["mayorista","proveedor","stagliano","compra"], mobilePriority:8, daily:false }),
  action({ id:"sales-history", featureId:"orders.history", label:"Ventas", description:"Historial, pedidos y seguimiento", area:"sales", icon:"📈", keywords:["ventas","pedidos","historial","ranking"], mobilePriority:9, daily:false }),
  action({ id:"reports", featureId:"stats", label:"Informes", description:"Métricas reales y control operativo", area:"reports", icon:"📊", keywords:["informe","reporte","estadisticas","metricas"], mobilePriority:10, daily:false }),
  action({ id:"trash", featureId:"trash", label:"Papelera", description:"Revisar, restaurar o vaciar", area:"recovery", icon:"🗑️", keywords:["papelera","restaurar","eliminar","borrar"], mobilePriority:20, daily:false, dangerous:true }),
  action({ id:"backups", featureId:"backups.list", label:"Backups", description:"Copias y recuperación de catálogo", area:"recovery", icon:"🛟", keywords:["backup","copia","seguridad","restaurar"], mobilePriority:21, daily:false }),
  action({ id:"coupons", featureId:"coupons", label:"Cupones", description:"Promociones, vigencia y condiciones", area:"marketing", icon:"🎟️", keywords:["cupon","descuento","promo"], mobilePriority:22, daily:false }),
  action({ id:"team", featureId:"sales.team", label:"Equipo", description:"Asesores, roles y estado", area:"team", icon:"🧑‍💼", keywords:["equipo","asesor","usuario","rol"], mobilePriority:23, daily:false }),
]);

export interface AdminCommand {
  id: string;
  featureId: string;
  label: string;
  area: string;
  terms: string;
  dangerous: boolean;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function buildAdminCommandIndex(
  features: readonly LegacyAdminFeature[] = legacyAdminParity,
): readonly AdminCommand[] {
  const quickByFeature = new Map(adminQuickActions.map((item) => [item.featureId, item]));
  return Object.freeze(features.filter((feature) => feature.requiredInV16).map((feature) => {
    const quick = quickByFeature.get(feature.id);
    const extra = quick?.keywords.join(" ") ?? "";
    return Object.freeze({
      id: quick?.id ?? feature.id,
      featureId: feature.id,
      label: quick?.label ?? feature.legacyLabel,
      area: feature.area,
      terms: normalize(`${feature.legacyLabel} ${feature.area} ${feature.notes} ${extra}`),
      dangerous: Boolean(quick?.dangerous) || /delete|trash|restore|vaciar|borrar|publicar/i.test(`${feature.id} ${feature.legacyLabel}`),
    });
  }));
}

export function searchAdminCommands(query: string, limit = 8): readonly AdminCommand[] {
  const q = normalize(query);
  const index = buildAdminCommandIndex();
  if (!q) {
    const byFeature = new Map(index.map((item) => [item.featureId, item]));
    return adminQuickActions.filter((item) => item.daily).map((item) => byFeature.get(item.featureId)).filter((item): item is AdminCommand => Boolean(item)).slice(0, limit);
  }
  const tokens = q.split(/\s+/).filter(Boolean);
  return index
    .map((item) => {
      let score = 0;
      const label = normalize(item.label);
      for (const token of tokens) {
        if (label === token) score += 30;
        else if (label.startsWith(token)) score += 20;
        else if (label.includes(token)) score += 12;
        if (item.terms.includes(token)) score += 5;
      }
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label, "es"))
    .slice(0, limit)
    .map(({ item }) => item);
}

export interface AdminOperationalSignals {
  stalePriceCount: number;
  warningPriceCount: number;
  missingPhoneCount: number;
  missingPhotoCount: number;
  outOfStockCount: number;
  importReviewCount: number;
  pendingSalesCount: number;
}

export type AdminTaskTone = "critical" | "warning" | "attention" | "info";
export interface AdminTodayTask {
  id: string;
  label: string;
  detail: string;
  featureId: string;
  count: number;
  tone: AdminTaskTone;
  priority: number;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** Work-queue projection only. It never changes product state. */
export function buildAdminTodayQueue(input: AdminOperationalSignals): readonly AdminTodayTask[] {
  const rows: AdminTodayTask[] = [
    { id:"stale-prices", label:"Precios para revisar", detail:"30+ días desde la última revisión", featureId:"catalog.price.confirm", count:nonNegative(input.stalePriceCount), tone:"critical", priority:100 },
    { id:"import-review", label:"Importaciones para revisar", detail:"Líneas ambiguas o coincidencias dudosas", featureId:"catalog.bulk", count:nonNegative(input.importReviewCount), tone:"critical", priority:95 },
    { id:"missing-phones", label:"Celulares faltantes", detail:"Estaban en la lista anterior y no llegaron en la nueva", featureId:"phones.missing", count:nonNegative(input.missingPhoneCount), tone:"warning", priority:90 },
    { id:"warning-prices", label:"Precios por vencer", detail:"20–29 días", featureId:"catalog.price.age", count:nonNegative(input.warningPriceCount), tone:"warning", priority:80 },
    { id:"no-photo", label:"Productos sin foto", detail:"Completar imagen antes de publicar", featureId:"catalog.review.queues", count:nonNegative(input.missingPhotoCount), tone:"attention", priority:70 },
    { id:"out-stock", label:"Sin stock", detail:"Revisar estado del proveedor", featureId:"catalog.stock", count:nonNegative(input.outOfStockCount), tone:"attention", priority:60 },
    { id:"sales", label:"Ventas pendientes", detail:"Seguimiento administrativo", featureId:"orders.history", count:nonNegative(input.pendingSalesCount), tone:"info", priority:50 },
  ];
  return Object.freeze(rows.filter((row) => row.count > 0).sort((a,b) => b.priority - a.priority));
}

export const adminUsabilityContract = Object.freeze({
  sameBrandLanguageAsStorefront: true,
  dailyTasksTargetMaxTaps: 2,
  globalCommandSearchRequired: true,
  keyboardShortcutsOptionalEnhancement: true,
  mobileQuickDockRequired: true,
  bulkActionsRequired: true,
  bulkPreviewBeforeMutationRequired: true,
  contextPreservationRequired: true,
  destructiveActionsNeverPrimary: true,
  operationalInboxRequired: true,
  noArtificialNavigationDepth: true,
  adminVisualEffectsMustYieldToPerformance: true,
});

export interface AdminToolGroup {
  id: string;
  label: string;
  icon: string;
  featureIds: readonly string[];
}

/** Full parity grouped for fast visual navigation. Grouping never removes items from command search. */
export const adminToolGroups: readonly AdminToolGroup[] = Object.freeze([
  { id:"catalog", label:"Catálogo y productos", icon:"📦", featureIds:["catalog.product.edit","catalog.bulk","phones.bulk","phones.features.bulk","catalog.images.edit","catalog.stock","catalog.visibility","catalog.categories","catalog.favorites.admin","catalog.share.multiple"] },
  { id:"sales", label:"Ventas y clientes", icon:"🧾", featureIds:["sales.register","orders.history","clients","sales.team","events.team","collaborator.program"] },
  { id:"insights", label:"Informes y control", icon:"📊", featureIds:["stats","insights.demand","insights.promote","catalog.price.confirm","catalog.price.age","catalog.duplicates","catalog.rare.cleanup","catalog.hidden.diagnostic","cloud.diagnostic"] },
  { id:"finance", label:"Precios y finanzas", icon:"💵", featureIds:["catalog.fx.product","finance.policy","finance.calculator","finance.commissions","finance.investment","finance.plates","installment.presentation"] },
  { id:"marketing", label:"Marketing y compartir", icon:"📣", featureIds:["banner","coupons","wheel","subscribers","catalog.pdf","store.qr","store.share","catalog.product.instagram","catalog.product.image_download"] },
  { id:"recovery", label:"Recuperación y mantenimiento", icon:"🛟", featureIds:["trash","backups.list","backups.download","backups.restore","catalog.hidden.restore","catalog.categories","images.admin_session"] },
  { id:"appearance", label:"Apariencia de la tienda", icon:"🎨", featureIds:["store.appearance.color","store.appearance.sound","store.appearance.theme","client.preview"] },
  { id:"security", label:"Cuenta y seguridad", icon:"🔐", featureIds:["images.admin_session","auth.logout"] },
].map((group) => Object.freeze({ ...group, featureIds:Object.freeze(group.featureIds.filter((id) => FEATURE_IDS.has(id))) })));

export interface AdminProductContextAction {
  featureId: string;
  label: string;
  icon: string;
  placement: "primary" | "secondary" | "more";
  requiresPreview: boolean;
}

/** Actions kept physically close to a selected product to match the Legacy speed with safer behavior. */
export const adminProductContextActions: readonly AdminProductContextAction[] = Object.freeze([
  { featureId:"catalog.product.edit", label:"Editar", icon:"✏️", placement:"primary", requiresPreview:false },
  { featureId:"catalog.product.copy", label:"Copiar", icon:"⧉", placement:"primary", requiresPreview:false },
  { featureId:"store.share", label:"Compartir", icon:"📤", placement:"primary", requiresPreview:false },
  { featureId:"catalog.product.instagram", label:"Instagram", icon:"📸", placement:"secondary", requiresPreview:false },
  { featureId:"catalog.product.image_download", label:"Descargar imagen", icon:"🖼️", placement:"secondary", requiresPreview:false },
  { featureId:"catalog.images.edit", label:"Foto", icon:"📷", placement:"secondary", requiresPreview:true },
  { featureId:"catalog.images.supplier", label:"Usar foto proveedor", icon:"↩️", placement:"secondary", requiresPreview:true },
  { featureId:"catalog.featured", label:"Destacar", icon:"⭐", placement:"more", requiresPreview:true },
  { featureId:"catalog.product_day", label:"Producto del día", icon:"☀️", placement:"more", requiresPreview:true },
  { featureId:"catalog.interest_free", label:"Cuotas sin interés", icon:"💳", placement:"more", requiresPreview:true },
  { featureId:"catalog.offer", label:"Oferta", icon:"🔥", placement:"more", requiresPreview:true },
  { featureId:"catalog.visibility", label:"Visibilidad", icon:"👁️", placement:"more", requiresPreview:true },
  { featureId:"catalog.stock", label:"Stock", icon:"📦", placement:"more", requiresPreview:true },
]);

export const adminProductEditorContract = Object.freeze({
  singleSurfaceRequired: true,
  tabsRequired: false,
  costAndSaleVisibleTogether: true,
  costToSaleOneTap: true,
  saleToCostOneTap: true,
  supplierVisible: true,
  categorySupplierRestoreOneTap: true,
  featuresVisible: true,
  imageAndStockContextVisible: true,
  saveRequiresAuthorizedServerCommand: true,
  mobilePrimaryActionSticky: true,
  preserveReturnContext: true,
});
