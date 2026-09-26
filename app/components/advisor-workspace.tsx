"use client";

import { useMemo, useState } from "react";
import Link from "./store-link";
import { ClipboardList, Search, Share2, UsersRound, WalletCards } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { normalizeCatalogText } from "@/lib/catalog/search";
import { OffersShowcase } from "./offers-showcase";
import { AdvisorSaleDraftPanel } from "./advisor-sale-draft-panel";
import { SectorGuide } from "./sector-guide";
import { findSectorGuide } from "@/lib/onboarding/sector-guides";
import { toast } from "sonner";
import Image from "next/image";
import { AdvisorGrowthSummary } from "./advisor-growth-summary";

const advisorGuide = findSectorGuide("asesor", "mi-amarango");
const liveStockSuppliers = new Set(["mega electro", "electro impacto"]);

function money(value: number | null | undefined) {
  return value ? `$${Math.round(value).toLocaleString("es-AR")}` : "A confirmar";
}

export function AdvisorWorkspace({ products }: { products: readonly Product[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = normalizeCatalogText(query);
    if (!term) return products;
    return products.filter((product) => normalizeCatalogText([product.name, product.model, product.brand, product.category].filter(Boolean).join(" ")).includes(term));
  }, [products, query]);

  async function share(product: Product) {
    const url = `${window.location.origin}/producto/${product.slug}`;
    const price = product.price ? `Contado ${money(product.price.amount)}` : "Precio a confirmar";
    const text = `${product.name}\n${price}\nAmarangoElectro\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text, url });
        toast.success(product.image ? "Publicación preparada con vista previa" : "Publicación preparada");
        return;
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      toast.success("WhatsApp listo para publicar");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast.error("No pudimos preparar el producto.");
    }
  }

  return (
    <main className="internal-workspace advisor-workspace">
      <section className="internal-hero">
        <div><p className="eyebrow orange">MI AMARANGO · ASESORES</p><h1>Todo lo comercial.<br /><span>Sin exponer datos privados.</span></h1></div>
        <p>Productos oficiales, seguimiento y herramientas de atención. Los precios los define Administración.</p>
        {advisorGuide && <SectorGuide guide={advisorGuide} />}
      </section>
      <nav className="advisor-section-nav" aria-label="Navegación de Mi Amarango">
        <a href="#advisor-tools">Resumen</a>
        <a href="#advisor-sale-draft">Nueva venta</a>
        <a href="#advisor-offers">Ofertas</a>
        <a href="#advisor-catalog">Catálogo</a>
      </nav>
      <section id="advisor-tools" className="advisor-quick-grid" aria-label="Accesos rápidos" data-guide-target="advisor-quick-grid">
        <article><UsersRound /><span><small>CLIENTES</small><strong>Conexión segura pendiente</strong></span></article>
        <article><WalletCards /><span><small>CUOTAS</small><strong>Conexión segura pendiente</strong></span></article>
        <a className="advisor-quick-card advisor-quick-card--sale" href="#advisor-sale-draft"><ClipboardList /><span><small>NUEVA VENTA</small><strong>Preparar operación</strong></span></a>
      </section>
      <AdvisorGrowthSummary />
      <AdvisorSaleDraftPanel products={products} />
      <div id="advisor-offers" className="advisor-offers-anchor"><OffersShowcase advisor /></div>
      <section id="advisor-catalog" className="advisor-catalog" aria-labelledby="advisor-catalog-title">
        <div className="advisor-catalog-heading" data-guide-target="advisor-catalog-search"><div><p className="eyebrow orange">CATÁLOGO MAESTRO</p><h2 id="advisor-catalog-title">Productos oficiales</h2></div><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, modelo, marca…" /></label></div>
        <div className="advisor-product-grid">
          {filtered.map((product) => {
            const sixPlan = product.financing.find((plan) => plan.installments === 6 && plan.installmentAmount);
            const supplier = product.specifications.Proveedor?.trim().toLocaleLowerCase("es-AR") ?? "";
            const hasLiveStock = liveStockSuppliers.has(supplier);
            const stockText = hasLiveStock
              ? product.stock.status === "out_of_stock"
                ? "Sin stock"
                : product.stock.quantity !== null
                  ? `Stock disponible: ${product.stock.quantity}`
                  : "Stock disponible"
              : "Consultar a Administración por stock";
            return <article key={product.id} className="advisor-product-card">
              <div className="advisor-product-card__tools"><span>VENTA</span><button type="button" onClick={() => share(product)} aria-label={`Publicar ${product.name}`}><Share2 size={16} /></button></div>
              {product.image ? <div className="advisor-product-placeholder advisor-product-image"><Image src={product.image.src} alt={product.image.alt} fill sizes="(max-width: 760px) 100vw, 33vw" loading="lazy" unoptimized /></div> : <div className="advisor-product-placeholder">{product.brand.slice(0, 1)}</div>}
              <div className="advisor-product-card__copy">
                <small>{product.brand} · {product.category}</small><h3>{product.name}</h3>
                <strong className="advisor-product-price">{money(product.price?.amount)}</strong>
                <p>{sixPlan?.installmentAmount ? `6 cuotas de ${money(sixPlan.installmentAmount.amount)}` : product.price ? "Consultá opciones de pago" : "Consultá precio y opciones de pago"}</p>
                <span className={`advisor-availability ${hasLiveStock ? "is-live" : "needs-check"}`}>{stockText}</span>
              </div>
              <div className="advisor-product-card__actions"><Link href={`/producto/${product.slug}`}>Ver producto</Link><button type="button" onClick={() => share(product)}><Share2 size={16} /> Publicar</button></div>
            </article>;
          })}
          {filtered.length === 0 && <div className="internal-empty">No encontramos coincidencias. Probá con otra marca o modelo.</div>}
        </div>
        <p className="internal-privacy-note">Esta vista no muestra costos, markup, caja, proveedores internos ni información financiera privada.</p>
      </section>
    </main>
  );
}
