import { legacyAdminParity } from "./legacy-admin-parity";

export type ScreenshotParityTreatment = "same_flow_better_ui" | "same_capability_safer" | "same_capability_faster" | "owner_review";

export interface AdminScreenshotParityItem {
  screenshotLabel: string;
  targetFeatureId: string;
  treatment: ScreenshotParityTreatment;
  improvement: string;
}

const known = new Set(legacyAdminParity.map((feature) => feature.id));
function lock(item: AdminScreenshotParityItem): AdminScreenshotParityItem {
  if (!known.has(item.targetFeatureId)) throw new Error(`Screenshot parity points to unknown feature: ${item.targetFeatureId}`);
  return Object.freeze(item);
}

/**
 * Visual/interaction evidence supplied by the owners from the current production Admin.
 * These labels are locked so a later redesign cannot silently remove the workflow.
 */
export const adminScreenshotParity: readonly AdminScreenshotParityItem[] = Object.freeze([
  lock({ screenshotLabel:"Visible", targetFeatureId:"catalog.visibility", treatment:"same_flow_better_ui", improvement:"State chip + one-tap action with explicit confirmation for bulk changes." }),
  lock({ screenshotLabel:"Mayorista + Stock", targetFeatureId:"suppliers", treatment:"same_capability_faster", improvement:"Keep supplier and stock visible together in Admin product context." }),
  lock({ screenshotLabel:"Precio hace 30d · REVISAR", targetFeatureId:"catalog.price.age", treatment:"same_flow_better_ui", improvement:"Keep price-age status visible and link directly to confirmation queue." }),
  lock({ screenshotLabel:"Destacar", targetFeatureId:"catalog.featured", treatment:"same_flow_better_ui", improvement:"Merchandising toggle remains one tap from product context." }),
  lock({ screenshotLabel:"Producto del día", targetFeatureId:"catalog.product_day", treatment:"same_flow_better_ui", improvement:"Merchandising toggle remains one tap from product context." }),
  lock({ screenshotLabel:"Últimas unidades", targetFeatureId:"catalog.stock", treatment:"same_flow_better_ui", improvement:"Explicit low-stock state, separate from supplier stock and out-of-stock." }),
  lock({ screenshotLabel:"Cuotas sin interés", targetFeatureId:"catalog.interest_free", treatment:"same_capability_safer", improvement:"Keep product-level control but require versioned validity and policy." }),
  lock({ screenshotLabel:"Poner en oferta", targetFeatureId:"catalog.offer", treatment:"same_capability_safer", improvement:"Keep quick action with price-before/validity preview." }),
  lock({ screenshotLabel:"Ocultar de la tienda", targetFeatureId:"catalog.visibility", treatment:"same_capability_safer", improvement:"Explicit command; never render-time mutation." }),
  lock({ screenshotLabel:"Marcar SIN STOCK", targetFeatureId:"catalog.stock", treatment:"same_capability_safer", improvement:"One tap, but manual override and supplier state remain separate." }),
  lock({ screenshotLabel:"Compartir", targetFeatureId:"store.share", treatment:"same_flow_better_ui", improvement:"Native share/clipboard, canonical URL." }),
  lock({ screenshotLabel:"Instagram", targetFeatureId:"catalog.product.instagram", treatment:"same_flow_better_ui", improvement:"Prepare image/share asset without silent posting." }),
  lock({ screenshotLabel:"Editar", targetFeatureId:"catalog.product.edit", treatment:"same_capability_faster", improvement:"Open a single dense editor; no unnecessary tabs." }),
  lock({ screenshotLabel:"Reemplazar foto", targetFeatureId:"catalog.images.edit", treatment:"same_capability_safer", improvement:"Secure Storage upload + audit." }),
  lock({ screenshotLabel:"Usar foto del proveedor", targetFeatureId:"catalog.images.supplier", treatment:"same_flow_better_ui", improvement:"Keep explicit source switch and reversibility." }),
  lock({ screenshotLabel:"Copiar Nombre", targetFeatureId:"catalog.product.copy", treatment:"same_capability_faster", improvement:"One-tap copy with visible payload." }),
  lock({ screenshotLabel:"Copiar Todo", targetFeatureId:"catalog.product.copy", treatment:"same_capability_faster", improvement:"One-tap copy with visible payload." }),
  lock({ screenshotLabel:"Descargar imagen", targetFeatureId:"catalog.product.image_download", treatment:"same_flow_better_ui", improvement:"Authorized local export." }),
  lock({ screenshotLabel:"Costo → Venta", targetFeatureId:"catalog.product.cost_to_sale", treatment:"same_capability_faster", improvement:"One tap in editor using current Admin policy." }),
  lock({ screenshotLabel:"Venta → Costo", targetFeatureId:"catalog.product.sale_to_cost", treatment:"same_capability_faster", improvement:"One tap estimate clearly labeled as estimate." }),
  lock({ screenshotLabel:"Usar categoría del proveedor", targetFeatureId:"catalog.categories", treatment:"same_capability_faster", improvement:"Keep directly below category selector." }),
  lock({ screenshotLabel:"Cargar catálogo · Costo / Venta / USD", targetFeatureId:"catalog.bulk", treatment:"same_flow_better_ui", improvement:"Preserve exact paste modes and fields; add preview before commit." }),
  lock({ screenshotLabel:"Reemplazar todo el catálogo", targetFeatureId:"catalog.bulk.replace_all", treatment:"same_capability_safer", improvement:"Keep checkbox/option but separate as high-risk with full diff + backup." }),
  lock({ screenshotLabel:"Cargar / actualizar celulares", targetFeatureId:"phones.bulk", treatment:"same_flow_better_ui", improvement:"Preserve PESOS/USD legacy behavior, missing-item decision and photo bank." }),
  lock({ screenshotLabel:"Cargar características de celulares (masivo)", targetFeatureId:"phones.features.bulk", treatment:"same_flow_better_ui", improvement:"Preserve dedicated bulk specs workflow." }),
  lock({ screenshotLabel:"Subir todo a la nube", targetFeatureId:"catalog.publish", treatment:"same_capability_safer", improvement:"Replace frontend publish with authenticated server commit + diff." }),
  lock({ screenshotLabel:"Editar mensajes del banner", targetFeatureId:"banner", treatment:"same_flow_better_ui", improvement:"Versioned preview and publish." }),
  lock({ screenshotLabel:"Cupones de descuento", targetFeatureId:"coupons", treatment:"same_capability_safer", improvement:"Validity, limits and audit." }),
  lock({ screenshotLabel:"Estadísticas de la tienda", targetFeatureId:"stats", treatment:"same_flow_better_ui", improvement:"Only real metrics; richer reports." }),
  lock({ screenshotLabel:"Clientes registrados", targetFeatureId:"clients", treatment:"same_capability_safer", improvement:"Searchable CRM with role/privacy controls." }),
  lock({ screenshotLabel:"Papelera", targetFeatureId:"trash", treatment:"same_capability_safer", improvement:"Soft-delete, restore, retention and audit." }),
  lock({ screenshotLabel:"Copias de seguridad del catálogo", targetFeatureId:"backups.list", treatment:"same_capability_safer", improvement:"Version snapshots with restore preview." }),
  lock({ screenshotLabel:"Editar premios de la ruleta", targetFeatureId:"wheel", treatment:"owner_review", improvement:"Keep entry point until owners decide whether it survives." }),
  lock({ screenshotLabel:"Formato de cuotas: Cajita", targetFeatureId:"installment.presentation", treatment:"same_flow_better_ui", improvement:"Keep visual format separate from financing policy." }),
  lock({ screenshotLabel:"Ver correos suscritos", targetFeatureId:"subscribers", treatment:"same_capability_safer", improvement:"Consent/privacy controls and export rules." }),
  lock({ screenshotLabel:"Descargar catálogo PDF", targetFeatureId:"catalog.pdf", treatment:"same_flow_better_ui", improvement:"Generate from authorized current catalog." }),
  lock({ screenshotLabel:"Descargar backup", targetFeatureId:"backups.download", treatment:"same_flow_better_ui", improvement:"One-click authorized export." }),
  lock({ screenshotLabel:"Restaurar backup", targetFeatureId:"backups.restore", treatment:"same_capability_safer", improvement:"Mandatory diff + confirmation." }),
  lock({ screenshotLabel:"Diagnóstico de la nube", targetFeatureId:"cloud.diagnostic", treatment:"same_flow_better_ui", improvement:"Readable health report without secrets." }),
  lock({ screenshotLabel:"Diagnóstico de ocultos y pendientes", targetFeatureId:"catalog.hidden.diagnostic", treatment:"same_flow_better_ui", improvement:"Read-only queue with reasons." }),
  lock({ screenshotLabel:"Mostrar productos ocultados a mano", targetFeatureId:"catalog.hidden.restore", treatment:"same_capability_safer", improvement:"Review list before restore." }),
  lock({ screenshotLabel:"Fotos: administrador conectado", targetFeatureId:"images.admin_session", treatment:"same_capability_safer", improvement:"Real Auth/Storage session status." }),
  lock({ screenshotLabel:"Cerrar sesión segura de fotos", targetFeatureId:"images.admin_session", treatment:"same_capability_safer", improvement:"Terminate real authorized photo session." }),
  lock({ screenshotLabel:"Limpiar productos duplicados", targetFeatureId:"catalog.duplicates", treatment:"same_capability_safer", improvement:"Show candidates; never heuristic auto-delete." }),
  lock({ screenshotLabel:"Reordenar productos de Otros", targetFeatureId:"catalog.categories", treatment:"same_flow_better_ui", improvement:"Preview category moves before commit." }),
  lock({ screenshotLabel:"Pedidos y ventas", targetFeatureId:"orders.history", treatment:"same_flow_better_ui", improvement:"Direct access with real ranking/filters." }),
  lock({ screenshotLabel:"Qué busca tu gente", targetFeatureId:"insights.demand", treatment:"same_flow_better_ui", improvement:"Real demand/search insight only." }),
  lock({ screenshotLabel:"Qué promocionar", targetFeatureId:"insights.promote", treatment:"same_flow_better_ui", improvement:"Prioritized merchandising suggestions with transparent reasons." }),
  lock({ screenshotLabel:"Posibles duplicados", targetFeatureId:"catalog.duplicates", treatment:"same_flow_better_ui", improvement:"Non-destructive diagnostic queue." }),
  lock({ screenshotLabel:"Limpiar productos raros", targetFeatureId:"catalog.rare.cleanup", treatment:"same_capability_safer", improvement:"Review candidates and why they were flagged." }),
  lock({ screenshotLabel:"Placas", targetFeatureId:"finance.plates", treatment:"same_flow_better_ui", improvement:"Keep fast sales-asset generator; unify commercial policy." }),
  lock({ screenshotLabel:"Programa Colaborador", targetFeatureId:"collaborator.program", treatment:"owner_review", improvement:"Preserve Admin entry point while final business flow is confirmed." }),
  lock({ screenshotLabel:"Filtro Mayorista", targetFeatureId:"suppliers", treatment:"same_capability_faster", improvement:"Persistent Admin filter/chip, one tap to clear." }),
  lock({ screenshotLabel:"Ordenar por", targetFeatureId:"catalog.product.edit", treatment:"same_capability_faster", improvement:"Keep list sorting in product workspace." }),
  lock({ screenshotLabel:"Precio hasta", targetFeatureId:"catalog.product.edit", treatment:"same_capability_faster", improvement:"Keep max-price filter in product workspace." }),
  lock({ screenshotLabel:"Ver favoritos", targetFeatureId:"catalog.favorites.admin", treatment:"same_capability_faster", improvement:"One-tap Admin filter." }),
  lock({ screenshotLabel:"Compartir varios", targetFeatureId:"catalog.share.multiple", treatment:"same_flow_better_ui", improvement:"Sticky selection tray with explicit contents." }),
  lock({ screenshotLabel:"Código QR", targetFeatureId:"store.qr", treatment:"same_flow_better_ui", improvement:"One-tap canonical store QR." }),
  lock({ screenshotLabel:"Compartir tienda", targetFeatureId:"store.share", treatment:"same_flow_better_ui", improvement:"Native share/clipboard." }),
  lock({ screenshotLabel:"Cargar pedido", targetFeatureId:"sales.register", treatment:"same_capability_faster", improvement:"Keep one-tap sales/order entry." }),
  lock({ screenshotLabel:"Color de la tienda", targetFeatureId:"store.appearance.color", treatment:"same_flow_better_ui", improvement:"Live preview + reset to brand default." }),
  lock({ screenshotLabel:"Sonido", targetFeatureId:"store.appearance.sound", treatment:"same_flow_better_ui", improvement:"Keep selector + master mute; no autoplay." }),
  lock({ screenshotLabel:"Modo claro / oscuro", targetFeatureId:"store.appearance.theme", treatment:"same_flow_better_ui", improvement:"Light/dark/system." }),
  lock({ screenshotLabel:"Mostrar marcados", targetFeatureId:"catalog.bulk.mark", treatment:"same_capability_faster", improvement:"Contextual bulk tray." }),
  lock({ screenshotLabel:"Ocultar marcados", targetFeatureId:"catalog.bulk.mark", treatment:"same_capability_safer", improvement:"Preview selected products before hide." }),
  lock({ screenshotLabel:"Calculadora Capital Compartido", targetFeatureId:"finance.investment", treatment:"same_flow_better_ui", improvement:"Keep Admin-only calculator in Finance." }),
  lock({ screenshotLabel:"Ver como cliente", targetFeatureId:"client.preview", treatment:"same_capability_faster", improvement:"Persistent preview entry without changing state." }),
  lock({ screenshotLabel:"Cerrar sesión", targetFeatureId:"auth.logout", treatment:"same_capability_safer", improvement:"Real session invalidation." }),
  lock({ screenshotLabel:"Equipo de eventos", targetFeatureId:"events.team", treatment:"owner_review", improvement:"Preserve current entry point until the owners define scope." }),
]);

export const lockedScreenshotLabels = Object.freeze(adminScreenshotParity.map((item) => item.screenshotLabel));
