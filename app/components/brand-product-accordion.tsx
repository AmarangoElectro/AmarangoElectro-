"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import type { Product } from "@/lib/catalog";
import { isPremiumCatalogBrand, type BrandDrawerDefinition } from "@/lib/catalog/brand-drawers";
import { getBrandCampaignArtwork } from "./brand-campaign-banner";
import { CatalogClient } from "./catalog-client";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { normalizeBrandFamily } from "@/lib/catalog/brand-family";
import { getBrandLocale } from "@/lib/theme/brand-locale";
import { getBrandDrawerBackdrop, hasDistinctBrandDrawerArtwork } from "@/lib/visual/brand-drawer-art";

type BrandProductAccordionProps = {
  categorySlug: string;
  sectorSlug?: string;
  products: Product[];
  brands: BrandDrawerDefinition[];
  categoryTitle: string;
  quickSubcategories?: {slug: string; title: string}[];
  initialFilters?: Pick<ComponentProps<typeof CatalogClient>, "initialBrand" | "initialSearch" | "initialSort" | "initialFavoritesOnly" | "initialMaxPrice" | "initialAvailableOnly">;
};

export function BrandProductAccordion({ categorySlug, sectorSlug, products, brands, categoryTitle, quickSubcategories, initialFilters }: BrandProductAccordionProps) {
  const hasInitialFilters = Boolean(initialFilters?.initialSearch || initialFilters?.initialFavoritesOnly || initialFilters?.initialMaxPrice || initialFilters?.initialAvailableOnly || initialFilters?.initialSort && initialFilters.initialSort !== "recommended");
  const [allOpen, setAllOpen] = useState(hasInitialFilters);
  const [allMounted, setAllMounted] = useState(hasInitialFilters);
  const [openBrands, setOpenBrands] = useState<Set<string>>(() => new Set(hasInitialFilters ? [] : brands.filter(brand => initialFilters?.initialBrand && normalizeBrandFamily(brand.brand) === normalizeBrandFamily(initialFilters.initialBrand)).map(brand => brand.slug)));
  const [mountedBrands, setMountedBrands] = useState(openBrands);
  useEffect(() => {
    // A saved facet link must show its results, even without a text search.
    if (["storage", "measure", "capacity", "liters", "kind", "burners", "size"].some(key => new URLSearchParams(window.location.search).has(`f_${key}`))) {
      setAllMounted(true);
      setAllOpen(true);
    }
  }, []);
  const productsByBrand = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    for (const product of products) {
      const key = normalizeBrandFamily(product.brand);
      grouped.set(key, [...(grouped.get(key) ?? []), product]);
    }
    return grouped;
  }, [products]);

  const orderedBrands = useMemo(() => [...brands].sort((a, b) => Number(isPremiumCatalogBrand(categorySlug, b.brand)) - Number(isPremiumCatalogBrand(categorySlug, a.brand))), [brands, categorySlug]);

  function toggleBrand(slug: string) {
    setOpenBrands((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
    setMountedBrands(current => new Set(current).add(slug));
    playSonicCue("navigate");
  }

  return (
    <section className="brand-product-accordion" aria-label={`Explorar ${categoryTitle}`}>
      <div className="brand-product-accordion-list">
        <article className={`brand-product-drawer is-compact-drawer catalog-all-drawer${allOpen ? " is-open" : ""}`}>
          <button type="button" className="brand-product-drawer-trigger" aria-expanded={allOpen} aria-controls="catalog-all-products" onClick={() => { setAllMounted(true); setAllOpen(current => !current); playSonicCue("navigate"); }}>
            <span className="brand-product-drawer-label"><strong>Ver todos</strong><small>{products.length} {products.length === 1 ? "producto" : "productos"}</small></span>
            <span className="brand-product-drawer-toggle" aria-hidden="true"><ChevronDown size={22} /></span>
          </button>
          <div id="catalog-all-products" className="brand-product-drawer-panel" hidden={!allOpen}>
            {allMounted && <CatalogClient products={products} categorySlug={categorySlug} sectorSlug={sectorSlug} categoryTitle={categoryTitle} suppressInitialScroll compactBrandMode quickSubcategories={quickSubcategories} {...initialFilters} initialBrand={hasInitialFilters ? initialFilters?.initialBrand : undefined} />}
          </div>
        </article>
        {orderedBrands.map((brand) => {
          if (!brand.brand) return null;
          const family = normalizeBrandFamily(brand.brand);
          const isPhoneArtwork = ["apple", "iphone", "samsung", "motorola", "xiaomi", "infinix", "poco"].includes(family);
          const premium = isPremiumCatalogBrand(categorySlug, brand.brand);
          const campaignAllowed = categorySlug === "celulares" || categorySlug === "smart-tv" || categorySlug === "gaming" || categorySlug === "audio" && ["jbl", "sony", "aiwa"].includes(family) || categorySlug === "electrodomesticos" && family === "lg";
          const artwork = !premium || !campaignAllowed || hasDistinctBrandDrawerArtwork(categorySlug, brand.brand) || (categorySlug !== "celulares" && isPhoneArtwork) ? null : getBrandCampaignArtwork(brand.brand);
          const backdrop = premium && !artwork && hasDistinctBrandDrawerArtwork(categorySlug, brand.brand) ? getBrandDrawerBackdrop(categorySlug, sectorSlug, brand.brand) : null;
          const locale = getBrandLocale(brand.brand, categorySlug);
          const brandProducts = productsByBrand.get(normalizeBrandFamily(brand.brand)) ?? [];
          if (!brandProducts.length) return null;
          const compact = !artwork && !backdrop;
          const isOpen = openBrands.has(brand.slug);
          const panelId = `brand-products-${brand.slug}`;

          return (
            <article className={`brand-product-drawer${isOpen ? " is-open" : ""}${backdrop ? " has-contextual-art" : ""}${compact ? " is-compact-drawer" : ""}${!premium ? " is-secondary-brand" : ""}`} key={brand.slug}>
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
                  <small>{brandProducts.length ? `${brandProducts.length} ${brandProducts.length === 1 ? "producto" : "productos"}` : "LOCAL PREPARADO"}</small>
                  <strong style={premium && locale ? { fontFamily: locale.fontFamily } : undefined}>{brand.title}</strong>
                </span>
                <span className="brand-product-drawer-toggle" aria-hidden="true"><ChevronDown size={22} /></span>
              </button>

              <div className="brand-product-drawer-panel" id={panelId} hidden={!isOpen}>
                {mountedBrands.has(brand.slug) && <>
                  <header><div><small>CATÁLOGO</small><strong>Productos de {brand.title}</strong></div></header>
                  <CatalogClient products={brandProducts} comparisonProducts={products} categorySlug={categorySlug} sectorSlug={sectorSlug} initialBrand={brand.brand} quickSubcategories={quickSubcategories} categoryTitle={brand.title} compactBrandMode embeddedBrandMode />
                </>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
