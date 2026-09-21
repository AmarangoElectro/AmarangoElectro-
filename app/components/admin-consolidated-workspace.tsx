"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Coins, ImagePlus, LayoutGrid, ListFilter, MoreHorizontal, PackageCheck, Save, ShieldCheck, Smartphone, Sparkles, Tag, Truck, UserCog, Users, Wallet } from "lucide-react";
import { AmarangoCalculatorPanel } from "@/components/internal/admin/amarango-calculator-panel";
import { PlatesPanel } from "@/components/internal/admin/plates-panel";
import { AdminProductGrid } from "@/components/internal/admin/admin-product-grid";
import { PhotoReviewPanel } from "@/components/internal/admin/photo-review-panel";
import { V418BStorefrontAdminPreview } from "@/components/internal/admin/v418b-storefront-admin-preview";
import { V16Cellphones90Preview } from "@/components/internal/admin/v16-90-cellphones-preview";
import { CrmClientsPanel } from "@/components/internal/admin/crm-clients-panel";
import { CollectionsPanel } from "@/components/internal/admin/collections-panel";
import { ReportsPanel } from "@/components/internal/admin/reports-panel";
import { ProvidersAreaPanel } from "@/components/internal/admin/providers-area-panel";
import { CashPanel } from "@/components/internal/admin/cash-panel";
import { DeliveriesPanel } from "@/components/internal/admin/deliveries-panel";
import { AdvisorsPanel } from "@/components/internal/admin/advisors-panel";
import { SectorGuide } from "@/app/components/sector-guide";
import { findSectorGuide } from "@/lib/onboarding/sector-guides";
import { defaultLabOffer, parseLabOffer, saveLabOffer, type LabOfferState, type OfferKind } from "@/lib/os-lab/offers-store";
import { v411PilotAdminProducts } from "@/components/internal/admin/v411-pilot-products";

const adminGuide = findSectorGuide("admin", "administracion");
const crmGuide = findSectorGuide("admin", "clientes-crm");
const collectionsGuide = findSectorGuide("admin", "cobranzas");
const reportsGuide = findSectorGuide("admin", "reportes");
const providersGuide = findSectorGuide("admin", "proveedores");
const cashGuide = findSectorGuide("admin", "caja");
const deliveriesGuide = findSectorGuide("admin", "entregas");
const advisorsGuide = findSectorGuide("admin", "asesores");

// Ofertas & Outlet V4.7 se conserva dentro del área administrativa protegida.

const adminLabStorageKey = "amarango_v49_admin_lab";
const supplierImage = "/assets/admin-lab/electra-proveedor-original.webp";
const economicImage = "/assets/admin-lab/electra-flyer-economico-demo.webp";

type AdminLab = { imageMode: "supplier" | "economic"; visible: boolean; stockState: "in_stock" | "low_stock" | "out_of_stock"; featured: boolean };
const initialAdminLab: AdminLab = { imageMode: "supplier", visible: true, stockState: "in_stock", featured: false };

export function AdminConsolidatedWorkspace() {
  const [adminLab, setAdminLab] = useState<AdminLab>(initialAdminLab);
  const [offer, setOffer] = useState<LabOfferState>(defaultLabOffer);
  const [tab, setTab] = useState<"catalog" | "photos" | "storefront" | "cellphones90" | "crm" | "collections" | "reports" | "providers" | "cash" | "deliveries" | "advisors" | "calculator" | "plates" | "offers">("catalog");
  const [crmInitialClientId, setCrmInitialClientId] = useState<string | null>(null);
  const [crmInstanceKey, setCrmInstanceKey] = useState(0);

  function openClient360FromCollections(clientId: string) {
    setCrmInitialClientId(clientId);
    setCrmInstanceKey((key) => key + 1);
    setTab("crm");
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(adminLabStorageKey);
      if (saved) try { setAdminLab({ ...initialAdminLab, ...JSON.parse(saved) }); } catch { /* fixture local inválido: conservar estado seguro */ }
      setOffer(parseLabOffer(window.localStorage.getItem("amarango_v49_offer_lab")));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function saveAdmin(next: AdminLab) {
    setAdminLab(next);
    window.localStorage.setItem(adminLabStorageKey, JSON.stringify(next));
  }

  function updateOffer<K extends keyof LabOfferState>(key: K, value: LabOfferState[K]) {
    setOffer((current) => ({ ...current, [key]: value }));
  }

  const demoProducts = useMemo(() => [...v411PilotAdminProducts, { id: "lab-electra", name: "Producto Electra · fixture proveedor", imageUrl: adminLab.imageMode === "economic" ? economicImage : supplierImage, supplierImageUrl: supplierImage, supplier: "Mayorista pendiente", category: "Pequeños electrodomésticos", costArs: null, salePrice: null, visible: adminLab.visible, stockState: adminLab.stockState, priceUpdatedAt: null, featured: adminLab.featured, features: ["Fixture local"] }], [adminLab]);

  return (
    <main className="internal-workspace admin-workspace">
      <section className="admin-command-hero">
        <Image className="admin-command-hero-art" src="/assets/v16-generated/admin-operations-office-v1.webp" alt="Área de trabajo de administración" fill priority sizes="(max-width: 760px) 100vw, 1460px" unoptimized />
        <span className="admin-command-hero-shade" aria-hidden="true" />
        <div className="admin-command-hero-copy"><p className="eyebrow orange">CENTRO DE ADMINISTRACIÓN</p><h1>Administración central.<br /><span>Operativa, ordenada y segura.</span></h1>{adminGuide && <SectorGuide guide={adminGuide} />}</div>
        <div className="admin-command-hero-status"><ShieldCheck /><strong>MODO SEGURO</strong><span>Los cambios productivos requieren autorización</span></div>
      </section>
      <nav className="admin-workspace-tabs" aria-label="Módulos administrativos" data-guide-target="admin-workspace-tabs">
        <button aria-pressed={tab === "catalog"} onClick={() => setTab("catalog")}><LayoutGrid /><span><small>PRODUCTOS</small><strong>Catálogo</strong></span></button>
        <button aria-pressed={tab === "photos"} onClick={() => setTab("photos")}><ImagePlus /><span><small>ORIGEN Y ENCUADRE</small><strong>Fotos · revisión</strong></span></button>
        <button aria-pressed={tab === "storefront"} onClick={() => setTab("storefront")}><ShieldCheck /><span><small>CONTROL VISUAL</small><strong>Revisión de tienda</strong></span></button>
        <button aria-pressed={tab === "cellphones90"} onClick={() => setTab("cellphones90")}><Smartphone /><span><small>COHORTE ACTUAL</small><strong>90 Celulares · revisión</strong></span></button>
        <button aria-pressed={tab === "calculator"} onClick={() => setTab("calculator")}><ListFilter /><span><small>PRECIOS</small><strong>Calculadora</strong></span></button>
        <button aria-pressed={tab === "plates"} onClick={() => setTab("plates")}><Sparkles /><span><small>CONTENIDO</small><strong>Placas</strong></span></button>
        <details className="admin-workspace-more">
          <summary><MoreHorizontal /><span><small>OPERACIÓN</small><strong>Más áreas</strong></span></summary>
          <div>
            <button aria-pressed={tab === "crm"} onClick={() => { setCrmInitialClientId(null); setCrmInstanceKey((key) => key + 1); setTab("crm"); }}><Users /> Clientes / CRM</button>
            <button aria-pressed={tab === "collections"} onClick={() => setTab("collections")}><Wallet /> Cobranzas</button>
            <button aria-pressed={tab === "reports"} onClick={() => setTab("reports")}><BarChart3 /> Reportes</button>
            <button aria-pressed={tab === "providers"} onClick={() => setTab("providers")}><Truck /> Proveedores</button>
            <button aria-pressed={tab === "cash"} onClick={() => setTab("cash")}><Coins /> Caja</button>
            <button aria-pressed={tab === "deliveries"} onClick={() => setTab("deliveries")}><PackageCheck /> Entregas</button>
            <button aria-pressed={tab === "advisors"} onClick={() => setTab("advisors")}><UserCog /> Asesores</button>
            <button aria-pressed={tab === "offers"} onClick={() => setTab("offers")}><Tag /> Ofertas · borrador</button>
          </div>
        </details>
      </nav>

      {tab === "catalog" && <>
        <section className="flyer-lab" aria-labelledby="flyer-lab-title">
          <div className="flyer-lab-copy"><p className="eyebrow orange">FLYER ECONÓMICO</p><h2 id="flyer-lab-title">Foto proveedor → Adaptar → Preview → Aprobar</h2><p>La aprobación persiste únicamente en este navegador. No reemplaza fotografías ni productos reales.</p><div className="flyer-lab-steps"><span className={adminLab.imageMode === "supplier" ? "active" : "done"}>1 · Proveedor</span><span className={adminLab.imageMode === "economic" ? "active" : ""}>2 · Amarango</span><span>3 · Premium preparado</span></div><div className="flyer-lab-actions"><button type="button" onClick={() => saveAdmin({ ...adminLab, imageMode: "supplier" })}><ImagePlus /> Usar foto proveedor</button><button type="button" className="primary" onClick={() => saveAdmin({ ...adminLab, imageMode: "economic" })}><Save /> Aprobar flyer económico</button></div></div>
          <div className="flyer-lab-preview"><Image src={adminLab.imageMode === "economic" ? economicImage : supplierImage} alt={adminLab.imageMode === "economic" ? "Preview de flyer económico Amarango" : "Fotografía de proveedor"} fill sizes="(max-width: 760px) 100vw, 38vw" unoptimized /><span>{adminLab.imageMode === "economic" ? "FLYER ECONÓMICO APROBADO LOCALMENTE" : "FOTO PROVEEDOR"}</span></div>
        </section>
        <section className="admin-local-controls"><label><input type="checkbox" checked={adminLab.visible} onChange={(event) => saveAdmin({ ...adminLab, visible: event.target.checked })} /> Visible en preview</label><label><input type="checkbox" checked={adminLab.featured} onChange={(event) => saveAdmin({ ...adminLab, featured: event.target.checked })} /> Destacado</label><label>Stock<select value={adminLab.stockState} onChange={(event) => saveAdmin({ ...adminLab, stockState: event.target.value as AdminLab["stockState"] })}><option value="in_stock">Disponible</option><option value="low_stock">Últimas unidades</option><option value="out_of_stock">Sin stock</option></select></label></section>
        <div data-guide-target="admin-catalog-grid"><AdminProductGrid products={demoProducts} /></div>
        <section className="admin-parity-strip"><strong>Operativa preservada</strong><span>Tarjetas + planilla</span><span>Costos y contado</span><span>Cuotas</span><span>Proveedor</span><span>Fotos</span><span>Visibilidad</span><span>Stock</span><span>Destacados</span><span>Acciones masivas</span><span>Revisión de precios</span></section>
      </>}
      {tab === "storefront" && <section aria-label="Revisión de tienda"><V418BStorefrontAdminPreview /></section>}
      {tab === "photos" && <PhotoReviewPanel products={demoProducts} />}
      {tab === "cellphones90" && <section aria-label="Cohorte de celulares en revisión"><V16Cellphones90Preview /></section>}
      {tab === "crm" && <>{crmGuide && <SectorGuide guide={crmGuide} />}<CrmClientsPanel key={crmInstanceKey} initialClientId={crmInitialClientId} /></>}
      {tab === "collections" && <>{collectionsGuide && <SectorGuide guide={collectionsGuide} />}<CollectionsPanel onOpenClient360={openClient360FromCollections} /></>}
      {tab === "reports" && <>{reportsGuide && <SectorGuide guide={reportsGuide} />}<ReportsPanel /></>}
      {tab === "providers" && <>{providersGuide && <SectorGuide guide={providersGuide} />}<ProvidersAreaPanel /></>}
      {tab === "cash" && <>{cashGuide && <SectorGuide guide={cashGuide} />}<CashPanel /></>}
      {tab === "deliveries" && <>{deliveriesGuide && <SectorGuide guide={deliveriesGuide} />}<DeliveriesPanel /></>}
      {tab === "advisors" && <>{advisorsGuide && <SectorGuide guide={advisorsGuide} />}<AdvisorsPanel /></>}
      {tab === "calculator" && <AmarangoCalculatorPanel />}
      {tab === "plates" && <PlatesPanel />}
      {tab === "offers" && <section className="offer-admin-editor"><div><p className="eyebrow orange">OFERTAS & OUTLET</p><h2>Control local del sector comercial</h2><p>No usa la calculadora habitual ni altera el catálogo maestro.</p></div><div className="offer-admin-form"><label className="toggle-row"><span>Sector activo</span><input type="checkbox" checked={offer.enabled} onChange={(event) => updateOffer("enabled", event.target.checked)} /></label><label>Tipo<select value={offer.kind} onChange={(event) => updateOffer("kind", event.target.value as OfferKind)}>{["Oferta del día","Contado especial","2 cuotas sin interés","3 cuotas sin interés","Outlet"].map((kind) => <option key={kind}>{kind}</option>)}</select></label><label>Producto<input value={offer.productName} onChange={(event) => updateOffer("productName", event.target.value)} /></label><label>Imagen del producto<input value={offer.imageSrc} onChange={(event) => updateOffer("imageSrc", event.target.value)} placeholder="/assets/productos/imagen.webp" /></label><label>Precio anterior ARS<input type="number" value={offer.previousPriceArs} onChange={(event) => updateOffer("previousPriceArs", Number(event.target.value))} /></label><label>Precio promocional ARS<input type="number" value={offer.promotionalPriceArs} onChange={(event) => updateOffer("promotionalPriceArs", Number(event.target.value))} /></label><label>Stock de referencia<input type="number" min="0" value={offer.stock} onChange={(event) => updateOffer("stock", Number(event.target.value))} /></label><button type="button" onClick={() => saveLabOffer(offer)}><Save /> Guardar solo en este dispositivo</button></div></section>}
      <p className="internal-privacy-note">Admin Mode V4.18B y Quick Actions V4.18A viven sólo en memoria y se descartan al cerrar. Los laboratorios históricos conservan su almacenamiento local previo. No hay cliente de Supabase, servicio administrativo, RPC ni petición de escritura.</p>
    </main>
  );
}
