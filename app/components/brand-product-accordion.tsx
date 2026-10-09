"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { revealIfNeeded } from "@/lib/ux/interaction-motion";
import type { Product } from "@/lib/catalog";
import type { BrandDrawerDefinition } from "@/lib/catalog/brand-drawers";
import { getBrandCampaignArtwork } from "./brand-campaign-banner";
import { CatalogClient } from "./catalog-client";
import Link from "./store-link";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { normalizeBrandFamily } from "@/lib/catalog/brand-family";
import { getBrandLocale } from "@/lib/theme/brand-locale";
import { getBrandDrawerBackdrop, hasDistinctBrandDrawerArtwork } from "@/lib/visual/brand-drawer-art";

type BrandProductAccordionProps = {
  categorySlug: string;
  sectorSlug?: string;
  products: Product[];
  brands: BrandDrawerDefinition[];
};

export function BrandProductAccordion({ categorySlug, sectorSlug, products, brands }: BrandProductAccordionProps) {
  const [openBrands, setOpenBrands] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!openBrands.size) return;
    const frame = requestAnimationFrame(() => {
      const panel = rootRef.current?.querySelector<HTMLElement>(".brand-product-drawer-panel");
      if (panel) revealIfNeeded(panel);
    });
    return () => cancelAnimationFrame(frame);
  }, [openBrands]);
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
    <section ref={rootRef} className="brand-product-accordion" aria-labelledby="brand-accordion-title">
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
          const family = normalizeBrandFamily(brand.brand);
          const isPhoneArtwork = ["apple", "iphone", "samsung", "motorola", "xiaomi", "infinix", "poco"].includes(family);
          const artwork = hasDistinctBrandDrawerArtwork(categorySlug, brand.brand) || (categorySlug !== "celulares" && isPhoneArtwork) ? null : getBrandCampaignArtwork(brand.brand);
          const backdrop = artwork ? null : getBrandDrawerBackdrop(categorySlug, sectorSlug, brand.brand);
          const locale = getBrandLocale(brand.brand, categorySlug);
          const brandProducts = productsByBrand.get(normalizeBrandFamily(brand.brand)) ?? [];
          const isOpen = openBrands.has(brand.slug);
          const panelId = `brand-products-${brand.slug}`;

          return (
            <article className={`brand-product-drawer${isOpen ? " is-open" : ""}${backdrop ? " has-contextual-art" : ""}`} key={brand.slug}>
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
                ) : backdrop ? (
                  <>
                    <Image className="brand-product-drawer-art brand-product-drawer-context-art" src={backdrop.image} alt="" fill sizes="(max-width: 760px) 100vw, 1400px" unoptimized />
                    <span className="brand-product-drawer-context-shade" aria-hidden="true" />
                    <span className="brand-product-drawer-context-copy">
                      <small>{backdrop.title}</small>
                      <strong className={brand.title.length > 13 ? "is-long-name" : undefined} style={locale ? { fontFamily: locale.fontFamily } : undefined}>{brand.title}</strong>
                      <span>{backdrop.description}</span>
                      <em>Explorar <b aria-hidden="true">→</b></em>
                    </span>
                  </>
                ) : null}
                <span className="brand-product-drawer-label">
                  <small>{brandProducts.length ? `${brandProducts.length} ${brandProducts.length === 1 ? "PRODUCTO" : "PRODUCTOS"}` : "LOCAL PREPARADO"}</small>
                  <strong style={locale ? { fontFamily: locale.fontFamily } : undefined}>{brand.title}</strong>
                </span>
                <span className="brand-product-drawer-toggle" aria-hidden="true"><ChevronDown size={22} /></span>
              </button>

              {isOpen ? (
                <div className="brand-product-drawer-panel" id={panelId} data-amarango-enter>
                  <header>
                    <div><small>CATÁLOGO</small><strong>{brandProducts.length ? `Productos de ${brand.title}` : `${brand.title} está preparado`}</strong></div>
                    <Link href={`/categoria/${categorySlug}?marca=${encodeURIComponent(brand.brand)}${sectorSlug ? `&sector=${encodeURIComponent(sectorSlug)}` : ""}#catalogo`}>Ver tienda completa <span aria-hidden="true">→</span></Link>
                  </header>
                  {brandProducts.length ? (
                    <CatalogClient products={brandProducts} comparisonProducts={products} categorySlug={categorySlug} sectorSlug={sectorSlug} initialBrand={brand.brand} categoryTitle={brand.title} compactBrandMode embeddedBrandMode />
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
