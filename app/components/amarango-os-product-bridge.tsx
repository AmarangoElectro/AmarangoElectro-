"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileCheck2,
  ImageOff,
  LayoutDashboard,
  PackageCheck,
  ReceiptText,
  Search,
  ShieldCheck,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import {
  searchProductBridgeItems,
  type ProductBridgeItem,
} from "@/lib/integration/product-bridge";
import { createSaleItemSnapshot, type SaleItemSnapshot } from "@/lib/integration/sale-snapshot";

interface AmarangoOsProductBridgeProps {
  initialProducts: readonly ProductBridgeItem[];
}

const navItems = [
  { label: "Inicio", icon: LayoutDashboard },
  { label: "Clientes 360", icon: Users },
  { label: "Nueva venta", icon: ReceiptText, active: true },
  { label: "Cobranzas", icon: CalendarClock },
  { label: "Caja", icon: WalletCards },
  { label: "Entregas", icon: Truck },
  { label: "Reportes", icon: BarChart3 },
];

const formatArs = (value: number | null) => value === null
  ? "Dato pendiente"
  : new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value);

function availabilityLabel(product: ProductBridgeItem) {
  if (product.saleEligibility === "unavailable") return "Sin stock";
  if (product.saleEligibility === "review_required") return product.stockLabel || "Requiere revisión";
  return product.stockLabel || "Disponible";
}

export function AmarangoOsProductBridge({ initialProducts }: AmarangoOsProductBridgeProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? "");
  const [frequency, setFrequency] = useState<"Mensual" | "Quincenal">("Mensual");
  const [hasReseller, setHasReseller] = useState(true);
  const [responsibles, setResponsibles] = useState(() => new Set(["Maxi", "Angie"]));
  const [snapshot, setSnapshot] = useState<SaleItemSnapshot | null>(null);

  const results = useMemo(
    () => searchProductBridgeItems(initialProducts, query),
    [initialProducts, query],
  );
  const selected = initialProducts.find((product) => product.id === selectedId) ?? results[0] ?? null;

  const toggleResponsible = (name: string) => {
    setResponsibles((current) => {
      if (current.has(name)) return new Set([...current].filter((value) => value !== name));
      return new Set([...current, name]);
    });
  };

  const previewSnapshot = () => {
    if (!selected || selected.currentPriceArs === null) return;
    setSnapshot(createSaleItemSnapshot({
      product: selected,
      priceUsedArs: selected.currentPriceArs,
      soldAt: "VISTA PREVIA — sin confirmar",
    }));
  };

  return (
    <main className="os-page">
      <aside className="os-sidebar" aria-label="Navegación Amarango OS">
        <div className="os-brand">
          <Image src="/logo-320.webp" alt="AmarangoElectro" width={52} height={52} unoptimized />
          <span><strong>AMARANGO OS</strong><small>CONTROL CENTER · V3 LAB</small></span>
        </div>
        <nav className="os-nav">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button key={label} type="button" className={active ? "active" : ""} aria-disabled={!active}>
              <Icon aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <div className="os-safety-card">
          <ShieldCheck aria-hidden="true" />
          <span><small>MODO LABORATORIO</small><strong>Lectura únicamente</strong><b>Sin datos reales ni guardado</b></span>
        </div>
      </aside>

      <section className="os-workspace">
        <header className="os-topbar">
          <div><small>AMARANGO OS / OPERACIONES</small><h1>Nueva venta inteligente</h1></div>
          <span className="os-readonly-badge"><Database aria-hidden="true" /> Integración de catálogo · READ ONLY</span>
        </header>

        <div className="os-content">
          <div className="os-lab-notice">
            <ShieldCheck aria-hidden="true" />
            <p><strong>Piloto técnico aislado.</strong> Los cuatro productos pertenecen al fixture recuperado de CRM Lab V2.1. No representan una lectura actual de producción y ninguna acción guarda información.</p>
          </div>

          <section className="os-heading">
            <div><span>PRODUCT BRIDGE V3</span><h2>Elegí el producto desde la fuente V16.</h2></div>
            <p>Amarango OS recibe un contrato normalizado. El CRM no mantiene una segunda lista de productos y los campos privados solo aparecen para Administración.</p>
          </section>

          <div className="os-sale-grid">
            <div className="os-column">
              <article className="os-panel os-product-panel">
                <div className="os-panel-heading">
                  <span className="os-step">1</span>
                  <div><small>CATÁLOGO OFICIAL</small><h3>Buscar producto</h3></div>
                  <span className="os-source-pill">Fixture V2.1</span>
                </div>

                <label className="os-search-field">
                  <Search aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre, modelo, memoria, categoría o marca…"
                    autoComplete="off"
                    aria-label="Buscar producto en el catálogo V16"
                  />
                  {query && <button type="button" onClick={() => setQuery("")}>Limpiar</button>}
                </label>
                <div className="os-search-examples" aria-label="Búsquedas sugeridas">
                  {["A16", "256 GB", "Samsung", "Motorola", "electrodomésticos"].map((value) => (
                    <button key={value} type="button" onClick={() => setQuery(value)}>{value}</button>
                  ))}
                </div>

                <div className="os-product-results" aria-live="polite">
                  <div className="os-results-count"><strong>{results.length}</strong> coincidencia{results.length === 1 ? "" : "s"}</div>
                  {results.length ? results.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      className={`os-result ${selected?.id === product.id ? "selected" : ""}`}
                      onClick={() => { setSelectedId(product.id); setSnapshot(null); }}
                    >
                      <span className="os-result-media">
                        {product.imageUrl
                          ? <Image src={product.imageUrl} alt={product.name} fill sizes="58px" unoptimized />
                          : <ImageOff aria-label="Producto sin foto" />}
                      </span>
                      <span className="os-result-copy">
                        <small>{product.brand} · {product.category}</small>
                        <strong>{product.name}</strong>
                        <span>{[product.model, product.memory].filter(Boolean).join(" · ") || "Modelo sin confirmar"}</span>
                      </span>
                      <span className="os-result-commerce">
                        <strong>{formatArs(product.currentPriceArs)}</strong>
                        <small className={`state-${product.saleEligibility}`}>{availabilityLabel(product)}</small>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  )) : (
                    <div className="os-empty-state">
                      <Boxes aria-hidden="true" />
                      <strong>Sin coincidencias verificadas</strong>
                      <span>Probá por marca, categoría, modelo o memoria. No completamos resultados inventados.</span>
                    </div>
                  )}
                </div>
              </article>

              <article className="os-panel">
                <div className="os-panel-heading">
                  <span className="os-step">2</span>
                  <div><small>COMPATIBILIDAD LEGACY</small><h3>Condiciones de la operación</h3></div>
                </div>
                <div className="os-form-grid">
                  <label className="os-field"><span>Cliente</span><input placeholder="Buscar o crear más adelante" disabled /></label>
                  <div className="os-field"><span>Frecuencia</span><div className="os-segmented">
                    {(["Mensual", "Quincenal"] as const).map((value) => <button key={value} type="button" className={frequency === value ? "active" : ""} onClick={() => setFrequency(value)}>{value}</button>)}
                  </div></div>
                  <div className="os-field"><span>Revendedor</span><div className="os-segmented">
                    <button type="button" className={hasReseller ? "active" : ""} onClick={() => setHasReseller(true)}>Con revendedor</button>
                    <button type="button" className={!hasReseller ? "active" : ""} onClick={() => setHasReseller(false)}>Sin revendedor</button>
                  </div></div>
                  <label className="os-field"><span>Nombre del revendedor</span><input placeholder="Pendiente" disabled={!hasReseller} /></label>
                  <label className="os-field"><span>Comisión</span><input placeholder="Regla pendiente de auditoría" disabled /></label>
                  <label className="os-field"><span>Descuento</span><input placeholder="$0" inputMode="numeric" /></label>
                  <label className="os-field"><span>Envío</span><input placeholder="$0" inputMode="numeric" /></label>
                  <label className="os-field"><span>Observaciones</span><input placeholder="Notas internas de la operación" /></label>
                </div>

                <div className="os-field os-responsibles"><span>Responsables múltiples</span><div className="os-chip-row">
                  {["Maxi", "Angie"].map((name) => <button key={name} type="button" className={responsibles.has(name) ? "active" : ""} onClick={() => toggleResponsible(name)}>{responsibles.has(name) && <Check aria-hidden="true" />}{name}</button>)}
                  <button type="button" disabled>＋ Otro responsable</button>
                </div></div>

                <div className="os-investment-box">
                  <div><small>INVERSIÓN Y REPARTO</small><h4>Contrato preparado, reglas pendientes</h4><p>Porcentajes, capital a invertir, reparto de ganancias y solicitud de inversión se conservan como dominio propio. V3 no calcula ni confirma sin auditar el CRM Legacy.</p></div>
                  <div className="os-investor-grid">
                    <label><span>Inversor 1</span><input placeholder="Nombre" /></label>
                    <label><span>Participación</span><input placeholder="0%" inputMode="decimal" /></label>
                    <label><span>Inversor 2</span><input placeholder="Nombre" /></label>
                    <label><span>Participación</span><input placeholder="0%" inputMode="decimal" /></label>
                  </div>
                </div>
              </article>
            </div>

            <aside className="os-summary-column">
              <article className="os-panel os-selection-card">
                <div className="os-panel-heading compact"><div><small>PRODUCTO SELECCIONADO</small><h3>Snapshot de venta</h3></div><FileCheck2 aria-hidden="true" /></div>
                {selected ? <>
                  <div className="os-selected-product">
                    <span>{selected.imageUrl ? <Image src={selected.imageUrl} alt="" fill sizes="72px" unoptimized /> : <PackageCheck aria-hidden="true" />}</span>
                    <div><small>{selected.id}</small><strong>{selected.name}</strong><p>{selected.model || "Modelo pendiente"}{selected.memory ? ` · ${selected.memory}` : ""}</p></div>
                  </div>
                  <dl className="os-data-list">
                    <div><dt>Precio vigente</dt><dd>{formatArs(selected.currentPriceArs)}</dd></div>
                    <div><dt>Costo administrativo</dt><dd>{formatArs(selected.administrative?.costArs ?? null)}</dd></div>
                    <div><dt>Mayorista / proveedor</dt><dd>{selected.administrative?.supplier || "Dato pendiente"}</dd></div>
                    <div><dt>Precio actualizado</dt><dd>{selected.priceUpdatedAt || "Dato pendiente"}</dd></div>
                    <div><dt>Disponibilidad</dt><dd>{availabilityLabel(selected)}</dd></div>
                    <div><dt>Frecuencia elegida</dt><dd>{frequency}</dd></div>
                  </dl>
                  {selected.missingFields.length > 0 && <div className="os-missing"><strong>Campos pendientes:</strong> {selected.missingFields.join(", ")}.</div>}
                  <button type="button" className="os-preview-button" onClick={previewSnapshot} disabled={selected.currentPriceArs === null}>
                    <ClipboardCheck aria-hidden="true" /> Preparar snapshot — sin guardar
                  </button>
                </> : <div className="os-empty-state compact"><Boxes /><strong>Elegí un producto</strong></div>}
              </article>

              {snapshot && <article className="os-panel os-snapshot-card">
                <small>VISTA PREVIA INMUTABLE</small>
                <strong>{snapshot.productName}</strong>
                <code>{snapshot.snapshotVersion}</code>
                <dl>
                  <div><dt>product_id</dt><dd>{snapshot.productId}</dd></div>
                  <div><dt>precio usado</dt><dd>{formatArs(snapshot.priceUsedArs)}</dd></div>
                  <div><dt>costo usado</dt><dd>{formatArs(snapshot.costUsedArs)}</dd></div>
                  <div><dt>proveedor</dt><dd>{snapshot.supplier || "null"}</dd></div>
                  <div><dt>fecha precio</dt><dd>{snapshot.priceUpdatedAt || "null"}</dd></div>
                </dl>
              </article>}

              <article className="os-panel os-safety-list">
                <small>V3 BLOQUEA ESCRITURAS</small>
                {["Catálogo consultado por adaptador", "Costos protegidos por rol", "Venta histórica desacoplada", "Sin clientes ni datos reales", "Sin Supabase productivo"].map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}
                <button type="button" disabled><CircleDollarSign aria-hidden="true" /> Confirmar venta — bloqueado</button>
              </article>
            </aside>
          </div>

          <section className="os-contract-strip" aria-label="Dominios preparados">
            {["Clientes", "Ventas", "Cuotas", "Pagos", "Comisiones", "Caja", "Entregas", "Comprobantes", "Auditoría"].map((item) => <span key={item}><BadgeDollarSign aria-hidden="true" />{item}</span>)}
          </section>
        </div>
      </section>

      <nav className="os-mobile-nav" aria-label="Navegación móvil Amarango OS">
        {navItems.slice(0, 5).map(({ label, icon: Icon, active }) => <button key={label} type="button" className={active ? "active" : ""} aria-disabled={!active}><Icon /><span>{label.replace(" 360", "")}</span></button>)}
      </nav>
    </main>
  );
}
