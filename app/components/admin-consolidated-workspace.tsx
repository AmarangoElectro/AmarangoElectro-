"use client";
import { AppSelect } from "@/components/ui/app-select";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, ChevronDown, Coins, ImagePlus, LayoutGrid, ListFilter, Network, PackageCheck, Save, ShieldCheck, Smartphone, Sparkles, Tag, Truck, UserCog, Users, Wallet } from "lucide-react";
import { AmarangoCalculatorPanel } from "@/components/internal/admin/amarango-calculator-panel";
import { PlatesPanel } from "@/components/internal/admin/plates-panel";
import { AdminProductGrid } from "@/components/internal/admin/admin-product-grid";
import { V418BStorefrontAdminPreview } from "@/components/internal/admin/v418b-storefront-admin-preview";
import { V16Cellphones90Preview } from "@/components/internal/admin/v16-90-cellphones-preview";
import { CrmClientsPanel } from "@/components/internal/admin/crm-clients-panel";
import { CollectionsPanel } from "@/components/internal/admin/collections-panel";
import { ReportsPanel } from "@/components/internal/admin/reports-panel";
import { ProvidersAreaPanel } from "@/components/internal/admin/providers-area-panel";
import { CashPanel } from "@/components/internal/admin/cash-panel";
import { DeliveriesPanel } from "@/components/internal/admin/deliveries-panel";
import { AdvisorsPanel } from "@/components/internal/admin/advisors-panel";
import { GrowthAcquisitionPanel } from "@/components/internal/admin/growth-acquisition-panel";
import { SectorGuide } from "@/app/components/sector-guide";
import { findSectorGuide } from "@/lib/onboarding/sector-guides";
import { defaultLabOffer, parseLabOffer, saveLabOffer, type LabOfferState, type OfferKind } from "@/lib/os-lab/offers-store";

import type { Product } from "@/lib/catalog/types";
import { Newsletter } from "./newsletter";

const adminGuide = findSectorGuide("admin", "administracion");
const crmGuide = findSectorGuide("admin", "clientes-crm");
const collectionsGuide = findSectorGuide("admin", "cobranzas");
const reportsGuide = findSectorGuide("admin", "reportes");
const providersGuide = findSectorGuide("admin", "proveedores");
const cashGuide = findSectorGuide("admin", "caja");
const deliveriesGuide = findSectorGuide("admin", "entregas");
const advisorsGuide = findSectorGuide("admin", "asesores");

const adminLabStorageKey = "amarango_v49_admin_lab";
const supplierImage = "/assets/admin-lab/electra-proveedor-original.webp";
const economicImage = "/assets/admin-lab/electra-flyer-economico-demo.webp";

type AdminLab = { imageMode: "supplier" | "economic"; visible: boolean; stockState: "in_stock" | "low_stock" | "out_of_stock"; featured: boolean };
const initialAdminLab: AdminLab = { imageMode: "supplier", visible: true, stockState: "in_stock", featured: false };

const adminTabIds = [
  "catalog",
  "storefront",
  "cellphones90",
  "crm",
  "collections",
  "reports",
  "providers",
  "cash",
  "deliveries",
  "advisors",
  "growth",
  "calculator",
  "plates",
  "offers",
] as const;
type AdminTab = (typeof adminTabIds)[number];
const adminModules: { title: string; tabs: { id: AdminTab; label: string; icon: typeof LayoutGrid }[] }[] = [
  { title: "Productos y tienda", tabs: [
    { id: "catalog", label: "Catálogo", icon: LayoutGrid },
    { id: "storefront", label: "Revisión de tienda", icon: ShieldCheck },
    { id: "cellphones90", label: "90 celulares · revisión", icon: Smartphone },
    { id: "calculator", label: "Calculadora", icon: ListFilter },
    { id: "plates", label: "Placas", icon: Sparkles },
    { id: "offers", label: "Ofertas · borrador", icon: Tag },
  ] },
  { title: "Operación", tabs: [
    { id: "crm", label: "Clientes / CRM", icon: Users },
    { id: "collections", label: "Cobranzas", icon: Wallet },
    { id: "reports", label: "Reportes", icon: BarChart3 },
    { id: "providers", label: "Proveedores", icon: Truck },
    { id: "cash", label: "Caja", icon: Coins },
    { id: "deliveries", label: "Entregas", icon: PackageCheck },
    { id: "advisors", label: "Asesores", icon: UserCog },
    { id: "growth", label: "Adquisición / Referidos", icon: Network },
  ] },
];
const adminTabHash: Record<AdminTab, string> = {
  catalog: "catalogo",
  storefront: "tienda",
  cellphones90: "celulares",
  crm: "crm",
  collections: "cobranzas",
  reports: "reportes",
  providers: "proveedores",
  cash: "caja",
  deliveries: "entregas",
  advisors: "asesores",
  growth: "adquisicion",
  calculator: "calculadora",
  plates: "placas",
  offers: "ofertas",
};
const adminHashTab = Object.fromEntries(
  Object.entries(adminTabHash).map(([tabId, hash]) => [hash, tabId]),
) as Record<string, AdminTab>;

export function AdminConsolidatedWorkspace({ catalogProducts = [], administrativeFacts = {} }: { catalogProducts?: Product[]; administrativeFacts?: Record<string,{supplier:string|null;costArs:number|null;priceUpdatedAt:number|null}> }) {
  const [adminLab, setAdminLab] = useState<AdminLab>(initialAdminLab);
  const [offer, setOffer] = useState<LabOfferState>(defaultLabOffer);
  const [tab, setTab] = useState<AdminTab>("catalog");
  const [modulesOpen, setModulesOpen] = useState(false);
  const moduleContent = useRef<HTMLDivElement>(null);
  const [crmInitialClientId, setCrmInitialClientId] = useState<string | null>(null);
  const [crmInstanceKey, setCrmInstanceKey] = useState(0);

  function openAdminTab(next: AdminTab) {
    setTab(next);
    setModulesOpen(false);
    if (typeof window === "undefined") return;
    const nextUrl = `${window.location.pathname}${window.location.search}#${adminTabHash[next]}`;
    window.history.replaceState(window.history.state, "", nextUrl);
    window.requestAnimationFrame(() => moduleContent.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openClient360FromCollections(clientId: string) {
    setCrmInitialClientId(clientId);
    setCrmInstanceKey((key) => key + 1);
    openAdminTab("crm");
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(adminLabStorageKey);
      if (saved) try { setAdminLab({ ...initialAdminLab, ...JSON.parse(saved) }); } catch { /* fixture local inválido: conservar estado seguro */ }
      setOffer(parseLabOffer(window.localStorage.getItem("amarango_v49_offer_lab")));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const candidate = adminHashTab[window.location.hash.slice(1)];
      if (candidate) setTab(candidate);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function saveAdmin(next: AdminLab) {
    setAdminLab(next);
    window.localStorage.setItem(adminLabStorageKey, JSON.stringify(next));
  }

  function updateOffer<K extends keyof LabOfferState>(key: K, value: LabOfferState[K]) {
    setOffer((current) => ({ ...current, [key]: value }));
  }

  const editableProducts = useMemo(() => catalogProducts.map(product => {
    const known = administrativeFacts[product.id];
    return { id: product.id, name: product.name, slug:product.slug, financing:product.financing, imageUrl: product.image?.src ?? null,
      supplierImageUrl: product.supplierImage?.src ?? product.image?.src ?? null,
      supplier: known?.supplier ?? null, category: product.category, costArs: known?.costArs ?? null,
      salePrice: product.price?.amount ?? null, visible: product.visible,
      stockState: product.stock.status === "out_of_stock" ? "out_of_stock" as const : "in_stock" as const,
      priceUpdatedAt: known?.priceUpdatedAt ?? null, features: product.features, specifications: product.specifications };
  }), [catalogProducts,administrativeFacts]);

  return (
    <main className="internal-workspace admin-workspace">
      <section className="admin-command-hero">
        <Image className="admin-command-hero-art" src="/assets/v16-generated/admin-operations-office-v1.webp" alt="Área de trabajo de administración" fill priority sizes="(max-width: 760px) 100vw, 1460px" unoptimized />
        <span className="admin-command-hero-shade" aria-hidden="true" />
        <div className="admin-command-hero-copy"><p className="eyebrow orange">CENTRO DE ADMINISTRACIÓN</p><h1>Administración central.<br /><span>Operativa, ordenada y segura.</span></h1>{adminGuide && <SectorGuide guide={adminGuide} />}</div>
        <div className="admin-command-hero-status"><ShieldCheck /><strong>MODO SEGURO</strong><span>Los cambios productivos requieren autorización</span></div>
      </section>
      <nav className="admin-module-picker" aria-label="Módulos administrativos" data-guide-target="admin-workspace-tabs">
        <button type="button" className="admin-module-picker-trigger" aria-expanded={modulesOpen} aria-controls="admin-module-options" onClick={() => setModulesOpen((open) => !open)}>
          <LayoutGrid size={20} aria-hidden="true" /><span><small>ADMINISTRACIÓN</small><strong>{adminModules.flatMap((group) => group.tabs).find((module) => module.id === tab)?.label}</strong></span><span className="admin-module-picker-hint">Cambiar área</span><ChevronDown className={modulesOpen ? "is-open" : ""} size={19} aria-hidden="true" />
        </button>
        {modulesOpen && <div id="admin-module-options" className="admin-module-picker-options">
          {adminModules.map((group) => <section key={group.title} aria-label={group.title}>
            <h2>{group.title}</h2><div>{group.tabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { if (id === "crm") { setCrmInitialClientId(null); setCrmInstanceKey((key) => key + 1); } openAdminTab(id); }}><Icon size={18} aria-hidden="true" />{label}</button>)}</div>
          </section>)}
        </div>}
      </nav>

      <div id="admin-module-content" ref={moduleContent} className="admin-module-content">

      {tab === "catalog" && <>
        <section className="media-workflow-intro"><h2>Fotos y características, por producto</h2><p>En cada tarjeta: Cambiar foto. Para un lote: seleccioná las tarjetas y elegí Estilo Amarango. Revisá el texto leído del flyer antes de guardar.</p></section>
        <div data-guide-target="admin-catalog-grid"><AdminProductGrid products={editableProducts} /></div>
        <section className="admin-parity-strip"><strong>Operativa preservada</strong><span>Tarjetas + planilla</span><span>Costos y contado</span><span>Cuotas</span><span>Proveedor</span><span>Fotos</span><span>Visibilidad</span><span>Stock</span><span>Destacados</span><span>Acciones masivas</span><span>Revisión de precios</span></section>
      </>}
      {tab === "storefront" && <section aria-label="Revisión de tienda"><V418BStorefrontAdminPreview /></section>}
      {tab === "cellphones90" && <section aria-label="Cohorte de celulares en revisión"><V16Cellphones90Preview /></section>}
      {tab === "crm" && <>{crmGuide && <SectorGuide guide={crmGuide} />}<CrmClientsPanel key={crmInstanceKey} initialClientId={crmInitialClientId} /></>}
      {tab === "collections" && <>{collectionsGuide && <SectorGuide guide={collectionsGuide} />}<CollectionsPanel onOpenClient360={openClient360FromCollections} /></>}
      {tab === "reports" && <>{reportsGuide && <SectorGuide guide={reportsGuide} />}<ReportsPanel /></>}
      {tab === "providers" && <>{providersGuide && <SectorGuide guide={providersGuide} />}<ProvidersAreaPanel /></>}
      {tab === "cash" && <>{cashGuide && <SectorGuide guide={cashGuide} />}<CashPanel /></>}
      {tab === "deliveries" && <>{deliveriesGuide && <SectorGuide guide={deliveriesGuide} />}<DeliveriesPanel /></>}
      {tab === "advisors" && <>{advisorsGuide && <SectorGuide guide={advisorsGuide} />}<AdvisorsPanel /></>}
      {tab === "growth" && <GrowthAcquisitionPanel />}
      {tab === "calculator" && <AmarangoCalculatorPanel />}
      {tab === "plates" && <PlatesPanel />}
      {tab === "offers" && <section className="offer-admin-editor"><div><p className="eyebrow orange">OFERTAS & OUTLET</p><h2>Control local del sector comercial</h2><p>No usa la calculadora habitual ni altera el catálogo maestro.</p></div><div className="offer-admin-form"><label className="toggle-row"><span>Sector activo</span><input type="checkbox" checked={offer.enabled} onChange={(event) => updateOffer("enabled", event.target.checked)} /></label><label>Tipo<AppSelect value={offer.kind} onChange={(event) => updateOffer("kind", event.target.value as OfferKind)}>{["Oferta del día","Contado especial","2 cuotas sin interés","3 cuotas sin interés","Outlet"].map((kind) => <option key={kind}>{kind}</option>)}</AppSelect></label><label>Producto<input value={offer.productName} onChange={(event) => updateOffer("productName", event.target.value)} /></label><label>Imagen del producto<input value={offer.imageSrc} onChange={(event) => updateOffer("imageSrc", event.target.value)} placeholder="/assets/productos/imagen.webp" /></label><label>Precio anterior ARS<input type="number" value={offer.previousPriceArs} onChange={(event) => updateOffer("previousPriceArs", Number(event.target.value))} /></label><label>Precio promocional ARS<input type="number" value={offer.promotionalPriceArs} onChange={(event) => updateOffer("promotionalPriceArs", Number(event.target.value))} /></label><label>Stock de referencia<input type="number" min="0" value={offer.stock} onChange={(event) => updateOffer("stock", Number(event.target.value))} /></label><button type="button" onClick={() => saveLabOffer(offer)}><Save /> Guardar solo en este dispositivo</button></div></section>}
      </div>
      <Newsletter admin />
      <p className="internal-privacy-note">Las fotos y sus características revisadas se guardan en la conexión segura de V16. Los laboratorios históricos siguen separados.</p>
    </main>
  );
}
