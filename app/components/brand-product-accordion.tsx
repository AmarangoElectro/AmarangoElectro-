"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import type { SubcategoryDefinition } from "@/lib/catalog/categories";
import { getBrandCampaignArtwork } from "./brand-campaign-banner";
import { ProductCard } from "./product-card";
import Link from "./store-link";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { normalizeBrandFamily } from "@/lib/catalog/brand-family";
import { matchesFacets, type FacetSelection } from "@/lib/catalog/smart-facets";
import { SmartFacetDrawer } from "./smart-facet-drawer";
import { ProductCategoryAccordion } from "./product-category-accordion";

function BrandFilteredPanel({ products, brandSlug }: { products: Product[]; brandSlug: string }) {
  const storageKey = `amarango-facets:celulares:${brandSlug}`;
  const [selected, setSelected] = useState<FacetSelection>({});
  const [availableOnly, setAvailableOnly] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      if (typeof saved.storage === "string" && products.some((product) => matchesFacets(product, "celulares", { storage: saved.storage }))) setSelected({ storage: saved.storage });
      setAvailableOnly(saved.availableOnly === true);
    } catch { /* Ignore stale local preferences. */ }
    setReady(true);
  }, [products, storageKey]);
  useEffect(() => { if (ready) sessionStorage.setItem(storageKey, JSON.stringify({ ...selected, availableOnly })); }, [availableOnly, ready, selected, storageKey]);
  const filtered = useMemo(() => products.filter((product) => matchesFacets(product, "celulares", selected) && (!availableOnly || product.stock.status === "in_stock")), [availableOnly, products, selected]);
  return <>
    <ProductCategoryAccordion products={filtered} scope="celulares" filters={<SmartFacetDrawer products={products} scope="celulares" selected={selected} onSelect={(key, value) => setSelected((current) => ({ ...current, [key]: value }))} onClear={() => { setSelected({}); setAvailableOnly(false); }} availableOnly={availableOnly} onAvailabilityChange={setAvailableOnly} resultCount={filtered.length} />} renderProduct={(product) => <ProductCard key={product.id} product={product} visualContext="brand" eagerImage />} />
    {!filtered.length && <div className="brand-product-drawer-empty">No hay productos con esta combinación. Limpiá los filtros para ver todos.</div>}
  </>;
}

type BrandProductAccordionProps = {
  categorySlug: string;
  products: Product[];
  brands: SubcategoryDefinition[];
};

export function BrandProductAccordion({ categorySlug, products, brands }: BrandProductAccordionProps) {
  const [openBrands, setOpenBrands] = useState<Set<string>>(() => new Set());
  const productsByBrand = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    for (const product of products) {
      const key = normalizeBrandFamily(product.brand);
      grouped.set(key, [...(grouped.get(key) ?? []), product]);
    }
    return grouped;
  }, [products]);

  function toggleBrand(slug: string) {
    setOpenBrands((current) => current.has(slug) ? new Set() : new Set([slug]));
    playSonicCue("navigate");
  }

  return (
    <section className="brand-product-accordion" aria-labelledby="brand-accordion-title">
      <div className="brand-product-accordion-intro">
        <div>
          <p className="eyebrow orange">LOCALES DE MARCA</p>
          <h2 id="brand-accordion-title">Elegí una marca y abrí su catálogo.</h2>
        </div>
        <p>Todo queda en esta misma pantalla. Tocá nuevamente el banner para cerrar el cajón.</p>
      </div>

      <div className="brand-product-accordion-list">
        {brands.map((brand) => {
          if (!brand.brand) return null;
          const artwork = getBrandCampaignArtwork(brand.brand);
          const brandProducts = productsByBrand.get(normalizeBrandFamily(brand.brand)) ?? [];
          const isOpen = openBrands.has(brand.slug);
          const panelId = `brand-products-${brand.slug}`;

          return (
            <article className={`brand-product-drawer${isOpen ? " is-open" : ""}`} key={brand.slug}>
              <button
                type="button"
                className="brand-product-drawer-trigger"
                aria-label={`${isOpen ? "Cerrar" : "Abrir"} catálogo de ${brand.title}`}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleBrand(brand.slug)}
              >
                {artwork ? (
                  <>
                    <Image className="brand-product-drawer-art brand-product-drawer-art-light" src={artwork.light} alt="" fill sizes="(max-width: 760px) 100vw, 1400px" unoptimized />
                    <Image className="brand-product-drawer-art brand-product-drawer-art-dark" src={artwork.dark} alt="" fill sizes="(max-width: 760px) 100vw, 1400px" unoptimized />
                  </>
                ) : (
                  <span className="brand-product-drawer-fallback" aria-hidden="true">{brand.icon}</span>
                )}
                <span className="brand-product-drawer-label">
                  <small>{brandProducts.length ? `${brandProducts.length} PRODUCTOS` : "LOCAL PREPARADO"}</small>
                  <strong>{brand.title}</strong>
                </span>
                <span className="brand-product-drawer-toggle" aria-hidden="true"><ChevronDown size={22} /></span>
              </button>

              {isOpen ? (
                <div className="brand-product-drawer-panel" id={panelId}>
                  <header>
                    <div><small>CATÁLOGO</small><strong>{brandProducts.length ? `Productos de ${brand.title}` : `${brand.title} está preparado`}</strong></div>
                    <Link href={`/categoria/${categorySlug}?marca=${encodeURIComponent(brand.brand)}#catalogo`}>Ver tienda completa <span aria-hidden="true">→</span></Link>
                  </header>
                  {brandProducts.length ? (
                    <BrandFilteredPanel products={brandProducts} brandSlug={brand.slug} />
                  ) : (
                    <div className="brand-product-drawer-empty">
                      <strong>El espacio visual ya está listo.</strong>
                      <span>Las tarjetas aparecerán acá cuando ingresen productos validados de {brand.title}.</span>
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
