export type LegacyParityDecision = "replicate" | "replicate_and_improve" | "secure_rewrite" | "pending_owner_review";

export interface LegacyAdminFeature {
  id: string;
  area: string;
  legacyLabel: string;
  decision: LegacyParityDecision;
  requiredInV16: boolean;
  notes: string;
}

/**
 * Contractual parity list from the production Legacy ZIP.
 * This is an inventory only: it never activates a route or a write path.
 * Removing a required item must be an explicit owner decision, not a refactor side effect.
 */
export const legacyAdminParity: readonly LegacyAdminFeature[] = Object.freeze([
  { id:"catalog.bulk", area:"catalog", legacyLabel:"Cargar / actualizar catálogo", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve paste workflow: Costo / Venta / USD, category, features, supplier and optional photo; add mandatory preview." },
  { id:"phones.bulk", area:"phones", legacyLabel:"Cargar / actualizar celulares", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve PESOS/USD modes, name+price line formats, update existing, add new, missing-item decision, brand ordering and metadata preservation." },
  { id:"phones.fx.reprice", area:"phones", legacyLabel:"Actualizar dólar sin pegar nada", decision:"replicate_and_improve", requiredInV16:true, notes:"Reprice phones carrying original USD without repasting; preview before commit." },
  { id:"phones.features.bulk", area:"phones", legacyLabel:"Cargar características de celulares (masivo)", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve block paste + name matching; ambiguous matches require review." },
  { id:"phones.photos.bank", area:"phones", legacyLabel:"Banco permanente de fotos de celulares", decision:"replicate_and_improve", requiredInV16:true, notes:"Photos follow canonical model across list refreshes; secure Storage later." },
  { id:"phones.delete.all", area:"phones", legacyLabel:"Borrar toda la lista de celulares", decision:"secure_rewrite", requiredInV16:true, notes:"Soft-delete / trash with explicit confirmation and audit." },
  { id:"phones.delete.brand", area:"phones", legacyLabel:"Borrar celulares por marca", decision:"secure_rewrite", requiredInV16:true, notes:"Preserve by-brand operation; trash + audit." },
  { id:"phones.missing", area:"phones", legacyLabel:"Resolver celulares que ya no vienen en la lista", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve choices: dejar / sin stock / papelera; never choose automatically." },
  { id:"phones.coherence.memory", area:"phones", legacyLabel:"Aviso de coherencia de memoria/precio", decision:"replicate_and_improve", requiredInV16:true, notes:"Warn if higher-memory variant is priced equal/lower; never auto-edit." },
  { id:"catalog.publish", area:"catalog", legacyLabel:"Subir todo a la nube", decision:"secure_rewrite", requiredInV16:true, notes:"Replace frontend publish with explicit server-side authorized commit." },
  { id:"catalog.product.edit", area:"catalog", legacyLabel:"Editar producto", decision:"secure_rewrite", requiredInV16:true, notes:"Name/category/features/supplier/cost/sale and controlled fields." },
  { id:"catalog.price.confirm", area:"pricing", legacyLabel:"Precio confirmado", decision:"replicate_and_improve", requiredInV16:true, notes:"Confirmation resets review age even when numeric price did not change." },
  { id:"catalog.price.age", area:"pricing", legacyLabel:"Semáforo de precios", decision:"replicate_and_improve", requiredInV16:true, notes:"Unified V16 age policy with source/actor timestamp." },
  { id:"catalog.fx.product", area:"pricing", legacyLabel:"Cambiar cotización de producto USD", decision:"replicate_and_improve", requiredInV16:true, notes:"Keep original supplier USD and manual FX override; preview new cost/sale." },
  { id:"finance.policy", area:"pricing", legacyLabel:"Ver / Editar planes", decision:"secure_rewrite", requiredInV16:true, notes:"Admin-only versioned commercial policy; never localStorage authority." },
  { id:"finance.calculator", area:"finance", legacyLabel:"Calculadora Contado / Costo / USD / Cuotas", decision:"secure_rewrite", requiredInV16:true, notes:"Admin-only; pure engine already started." },
  { id:"finance.commissions", area:"finance", legacyLabel:"Comisiones", decision:"secure_rewrite", requiredInV16:true, notes:"Admin-only." },
  { id:"finance.investment", area:"finance", legacyLabel:"Inversión / Capital compartido", decision:"secure_rewrite", requiredInV16:true, notes:"Admin-only." },
  { id:"finance.plates", area:"finance", legacyLabel:"Placas", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve Costo/Venta/USD parsing, selected installment plans and OFF tools; generated output can be modernized." },
  { id:"catalog.images.edit", area:"images", legacyLabel:"Editar / subir foto", decision:"secure_rewrite", requiredInV16:true, notes:"Secure Storage + auth + audit." },
  { id:"catalog.images.supplier", area:"images", legacyLabel:"Usar foto del proveedor", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve supplier-original vs Amarango manual image distinction." },
  { id:"catalog.images.remove", area:"images", legacyLabel:"Quitar foto / restaurar proveedor", decision:"replicate_and_improve", requiredInV16:true, notes:"Explicit reversible action." },
  { id:"catalog.stock", area:"inventory", legacyLabel:"Stock / Sin stock / Poco stock", decision:"secure_rewrite", requiredInV16:true, notes:"Separate supplier state from manual override." },
  { id:"catalog.visibility", area:"inventory", legacyLabel:"Visible / oculto", decision:"secure_rewrite", requiredInV16:true, notes:"Explicit command; never mutate during render." },
  { id:"catalog.featured", area:"merchandising", legacyLabel:"Destacado", decision:"replicate_and_improve", requiredInV16:true, notes:"Admin merchandising control." },
  { id:"catalog.product_day", area:"merchandising", legacyLabel:"Producto del día", decision:"replicate_and_improve", requiredInV16:true, notes:"Admin merchandising control." },
  { id:"catalog.offer", area:"merchandising", legacyLabel:"Oferta / precio anterior", decision:"secure_rewrite", requiredInV16:true, notes:"Requires validity/versioned policy." },
  { id:"catalog.interest_free", area:"merchandising", legacyLabel:"Cuotas sin interés por producto", decision:"secure_rewrite", requiredInV16:true, notes:"Requires validity/versioned policy." },
  { id:"catalog.categories", area:"catalog", legacyLabel:"Categorías / categoría proveedor / reclasificar Otros", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve manual category override and supplier restore." },
  { id:"catalog.bulk.mark", area:"catalog", legacyLabel:"Marcar varios / mostrar / ocultar", decision:"replicate_and_improve", requiredInV16:true, notes:"Bulk operations with preview + audit." },
  { id:"catalog.category.hide", area:"catalog", legacyLabel:"Ocultar / mostrar categoría", decision:"replicate_and_improve", requiredInV16:true, notes:"Bulk category visibility command." },
  { id:"catalog.duplicates", area:"quality", legacyLabel:"Limpiar productos duplicados", decision:"secure_rewrite", requiredInV16:true, notes:"Preserve diagnostic intent but never auto-delete based only on heuristic." },
  { id:"catalog.hidden.diagnostic", area:"quality", legacyLabel:"Diagnóstico de ocultos y pendientes", decision:"replicate_and_improve", requiredInV16:true, notes:"Read-only diagnostics first." },
  { id:"catalog.hidden.restore", area:"quality", legacyLabel:"Mostrar productos ocultados a mano", decision:"secure_rewrite", requiredInV16:true, notes:"Review list then explicit restore." },
  { id:"catalog.review.queues", area:"quality", legacyLabel:"Bandejas nuevos / imágenes / revisar manuales", decision:"replicate_and_improve", requiredInV16:true, notes:"Keep work-queue concept without render-time mutations." },
  { id:"trash", area:"recovery", legacyLabel:"Papelera / restaurar / vaciar", decision:"secure_rewrite", requiredInV16:true, notes:"Soft-delete, restore, retention and audit." },
  { id:"backups.list", area:"recovery", legacyLabel:"Copias de seguridad del catálogo", decision:"secure_rewrite", requiredInV16:true, notes:"Backend version snapshots." },
  { id:"backups.download", area:"recovery", legacyLabel:"Descargar backup", decision:"replicate_and_improve", requiredInV16:true, notes:"Admin export." },
  { id:"backups.restore", area:"recovery", legacyLabel:"Restaurar backup", decision:"secure_rewrite", requiredInV16:true, notes:"Preview diff + explicit restore." },
  { id:"cloud.diagnostic", area:"operations", legacyLabel:"Diagnóstico de la nube", decision:"replicate_and_improve", requiredInV16:true, notes:"Operational health diagnostics, no secrets." },
  { id:"suppliers", area:"suppliers", legacyLabel:"Mayoristas / proveedores", decision:"replicate_and_improve", requiredInV16:true, notes:"Admin-only supplier association, filtering and purchase source." },
  { id:"supplier.sync", area:"suppliers", legacyLabel:"Sincronización de proveedores", decision:"secure_rewrite", requiredInV16:true, notes:"Backend-only job with idempotency, logs and rollback." },
  { id:"orders.history", area:"sales", legacyLabel:"Historial de pedidos", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve history/ranking intent with real metrics and roles." },
  { id:"sales.register", area:"sales", legacyLabel:"Registrar venta", decision:"secure_rewrite", requiredInV16:true, notes:"Advisor may create own sale; Admin sees all." },
  { id:"clients", area:"crm", legacyLabel:"Clientes registrados", decision:"secure_rewrite", requiredInV16:true, notes:"Search/list/edit under privacy and retention policy." },
  { id:"stats", area:"reports", legacyLabel:"Estadísticas de la tienda", decision:"replicate_and_improve", requiredInV16:true, notes:"Only real metrics; richer V16 reporting." },
  { id:"sales.team", area:"team", legacyLabel:"Equipo de ventas", decision:"secure_rewrite", requiredInV16:true, notes:"Users, advisor identity, activation/deactivation and roles." },
  { id:"banner", area:"marketing", legacyLabel:"Editar mensajes del banner", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve admin-controlled content with versioning." },
  { id:"coupons", area:"marketing", legacyLabel:"Cupones de descuento", decision:"secure_rewrite", requiredInV16:true, notes:"Policy/validity/audit." },
  { id:"wheel", area:"marketing", legacyLabel:"Editar premios de la ruleta", decision:"pending_owner_review", requiredInV16:true, notes:"Inventory for parity; retain unless owner later removes it." },
  { id:"installment.presentation", area:"marketing", legacyLabel:"Formato de cuotas", decision:"replicate_and_improve", requiredInV16:true, notes:"Presentation setting separated from commercial policy." },
  { id:"subscribers", area:"marketing", legacyLabel:"Ver correos suscritos", decision:"secure_rewrite", requiredInV16:true, notes:"Consent/privacy required." },
  { id:"catalog.pdf", area:"exports", legacyLabel:"Descargar catálogo PDF", decision:"replicate_and_improve", requiredInV16:true, notes:"Generate from current authorized public catalog." },
  { id:"client.preview", area:"quality", legacyLabel:"Ver como cliente", decision:"replicate_and_improve", requiredInV16:true, notes:"Admin preview must not change data." },
  { id:"insights.demand", area:"reports", legacyLabel:"Qué busca tu gente", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve demand/search insight; V16 must use real events only, never simulated traffic." },
  { id:"insights.promote", area:"reports", legacyLabel:"Qué promocionar", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve promotion-priority workflow using real stock, price age, demand and merchandising signals." },
  { id:"catalog.rare.cleanup", area:"quality", legacyLabel:"Limpiar productos raros", decision:"secure_rewrite", requiredInV16:true, notes:"Keep diagnostic intent; V16 shows candidates and reasons before any explicit owner-approved action." },
  { id:"collaborator.program", area:"team", legacyLabel:"Programa Colaborador", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve the internal program entry point and reporting; final public exposure remains an owner decision." },
  { id:"catalog.share.multiple", area:"exports", legacyLabel:"Compartir varios", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve multi-select share flow; selected products remain visible before export/share." },
  { id:"store.qr", area:"exports", legacyLabel:"Código QR", decision:"replicate_and_improve", requiredInV16:true, notes:"Generate a QR for the canonical store URL; no tracking token required." },
  { id:"store.share", area:"exports", legacyLabel:"Compartir tienda", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve native share/clipboard behavior with canonical URL." },
  { id:"store.appearance.color", area:"appearance", legacyLabel:"Color de la tienda", decision:"replicate_and_improve", requiredInV16:true, notes:"Admin visual preference/presentation setting; must not alter security or commercial policy." },
  { id:"store.appearance.sound", area:"appearance", legacyLabel:"Sonido de la tienda", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve selectable sound preference while respecting browser gesture/autoplay rules and global mute." },
  { id:"store.appearance.theme", area:"appearance", legacyLabel:"Modo claro / oscuro", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve theme control with system option and accessibility contrast." },
  { id:"auth.logout", area:"security", legacyLabel:"Cerrar sesión", decision:"secure_rewrite", requiredInV16:true, notes:"Real server-backed session termination; no local flag-only logout." },
  { id:"events.team", area:"team", legacyLabel:"Equipo de eventos", decision:"pending_owner_review", requiredInV16:true, notes:"Locked from current Admin screenshots; preserve entry point until owners define its final model." },
  { id:"catalog.favorites.admin", area:"catalog", legacyLabel:"Ver favoritos", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve Admin shortcut/filter for favorited products." },
  { id:"catalog.product.copy", area:"exports", legacyLabel:"Copiar nombre / copiar todo", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve fast copy actions from product detail; V16 makes payload explicit before copying." },
  { id:"catalog.product.instagram", area:"exports", legacyLabel:"Compartir en Instagram", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve image/share preparation; no silent external posting." },
  { id:"catalog.product.image_download", area:"exports", legacyLabel:"Descargar imagen", decision:"replicate_and_improve", requiredInV16:true, notes:"Preserve authorized product-image export/download." },
  { id:"catalog.product.cost_to_sale", area:"pricing", legacyLabel:"Costo → Venta", decision:"replicate_and_improve", requiredInV16:true, notes:"One-tap Admin calculator using the versioned commercial policy; preview before changing the product." },
  { id:"catalog.product.sale_to_cost", area:"pricing", legacyLabel:"Venta → Costo", decision:"replicate_and_improve", requiredInV16:true, notes:"Reverse estimate kept as an Admin helper; never treated as supplier-authoritative cost." },
  { id:"catalog.bulk.replace_all", area:"catalog", legacyLabel:"Reemplazar todo el catálogo", decision:"secure_rewrite", requiredInV16:true, notes:"Preserve Legacy option but classify as high-risk; full diff, backup and explicit confirmation required." },
  { id:"images.admin_session", area:"security", legacyLabel:"Fotos: administrador conectado / cerrar sesión segura de fotos", decision:"secure_rewrite", requiredInV16:true, notes:"Replace Legacy photo-session flags with real Auth, Storage authorization and visible session status." },
]);

export const legacyRequiredAdminFeatureIds = Object.freeze(
  legacyAdminParity.filter((feature) => feature.requiredInV16).map((feature) => feature.id),
);
