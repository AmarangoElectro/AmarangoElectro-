import Link from "../../components/store-link";
import { notFound } from "next/navigation";
import { catalog } from "@/lib/catalog";
import { categories, getActiveSubcategories, getCategory, getPlannedSubcategories, getSubcategory, navigationCategories } from "@/lib/catalog/categories";
import { CatalogClient } from "@/app/components/catalog-client";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { RecentlyViewedRail } from "@/app/components/recently-viewed-rail";
import { SubcategoryBannerCard } from "@/app/components/subcategory-banner-card";
import { DescansoBrandGallery } from "@/app/components/descanso-brand-gallery";
import { ProgressiveCategoryExplorer } from "@/app/components/progressive-category-explorer";
import { SubcategoryContextNavigation } from "@/app/components/subcategory-context-navigation";
import { SectorBottomNavigation, SectorShowroom } from "@/app/components/sector-showroom";
import { BrandCampaignBanner, hasCompleteBrandCampaign } from "@/app/components/brand-campaign-banner";
import { AllSectorsSheet } from "@/app/components/all-sectors-sheet";
import { BrandProductAccordion } from "@/app/components/brand-product-accordion";
import { getBrandLocale, getBrandLocalesForSector } from "@/lib/theme/brand-locale";
import { deriveSubcategoryContext } from "@/lib/navigation/subcategory-context";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

type CategorySearchParams = {
  marca?: string | string[];
  q?: string | string[];
  orden?: string | string[];
  favoritos?: string | string[];
  sector?: string | string[];
  precioMax?: string | string[];
  disponible?: string | string[];
};

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<CategorySearchParams> }) {
  const { slug } = await params;
  const { marca, q, orden, favoritos, sector, precioMax, disponible } = await searchParams;
  const category = getCategory(slug);
  if (!category) notFound();
  const requestedSector = typeof sector === "string" ? sector : "";
  const rawRequestedBrand = typeof marca === "string" ? marca : undefined;
  const activeSector = requestedSector ? getSubcategory(slug, requestedSector) : undefined;
  const [categoryProducts, recentCandidates] = await Promise.all([
    catalog.listProducts({
      category: slug,
      ...(activeSector && !activeSector.brand ? { subcategory: activeSector.slug } : {}),
      visibleOnly: true,
    }),
    catalog.listProducts({ visibleOnly: true }),
  ]);
  const availableBrands = new Set(categoryProducts.map((product) => product.brand));
  const knownBrands = new Set([...category.brands, ...category.subcategories.flatMap((item) => item.brand ? [item.brand] : [])]);
  const requestedBrand = rawRequestedBrand && availableBrands.has(rawRequestedBrand) ? rawRequestedBrand : undefined;
  const requestedCampaignBrand = requestedBrand ?? (rawRequestedBrand
    ? [...knownBrands].find((brand) => brand.toLocaleLowerCase("es-AR") === rawRequestedBrand.toLocaleLowerCase("es-AR"))
    : undefined);
  const products = requestedCampaignBrand
    ? categoryProducts.filter((product) => product.brand.toLocaleLowerCase("es-AR") === requestedCampaignBrand.toLocaleLowerCase("es-AR"))
    : categoryProducts;
  const initialBrand = requestedBrand;
  const brandLocale = getBrandLocale(requestedBrand, slug);
  const publishableBrandLocales = getBrandLocalesForSector(slug, availableBrands);
  const initialSearch = typeof q === "string" ? q.slice(0, 120) : "";
  const initialSort = orden === "brand" || orden === "name" || orden === "price-asc" || orden === "price-desc" ? orden : "recommended";
  const initialFavoritesOnly = favoritos === "1";
  const parsedMaxPrice = typeof precioMax === "string" ? Number(precioMax) : Number.NaN;
  const initialMaxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null;
  const initialAvailableOnly = disponible === "1";
  const activeSubcategories = getActiveSubcategories(category);
  const plannedSubcategories = getPlannedSubcategories(category);
  const subcategoryContext = deriveSubcategoryContext(category, {
    sector: requestedSector,
    brand: requestedCampaignBrand,
  });
  const phoneAccordionMode = slug === "celulares"
    && !requestedCampaignBrand
    && !activeSector
    && !initialSearch
    && initialSort === "recommended"
    && !initialFavoritesOnly
    && initialMaxPrice === null
    && !initialAvailableOnly;

  return (
    <>
      <div className="category-route-header"><SiteHeader /></div>
      <main className={`category-page category-theme-${category.slug}`}>
        <SectorShowroom
          category={category}
          activeSector={activeSector}
          activeBrand={requestedCampaignBrand}
          availableBrands={[...availableBrands]}
          compactBrandView={Boolean(requestedCampaignBrand)}
        />
        <div className="category-context-navigation"><SubcategoryContextNavigation categoryTitle={category.title} items={subcategoryContext} /></div>

        <div id="catalogo">
          {activeSector && <section className="catalog-sector-context"><div><small>SECTOR ACTIVO</small><strong>{activeSector.title}</strong><span>{activeSector.description}</span></div><Link href={`/categoria/${slug}#catalogo`}>Ver todo {category.title} ×</Link></section>}
          {phoneAccordionMode ? (
            <BrandProductAccordion categorySlug={category.slug} products={categoryProducts} brands={activeSubcategories.filter((subcategory) => Boolean(subcategory.brand))} />
          ) : products.length > 0 ? (
            <CatalogClient
              products={products}
              initialBrand={initialBrand}
              initialSearch={initialSearch}
              initialSort={initialSort}
              initialFavoritesOnly={initialFavoritesOnly}
              initialMaxPrice={initialMaxPrice}
              initialAvailableOnly={initialAvailableOnly}
              categoryTitle={activeSector?.title ?? brandLocale?.title ?? requestedCampaignBrand ?? category.title}
              compactBrandMode={Boolean(requestedCampaignBrand)}
            />
          ) : (
            <section className={`catalog-coming${requestedCampaignBrand ? " is-brand-empty" : ""}`}>
              {requestedCampaignBrand && hasCompleteBrandCampaign(requestedCampaignBrand) ? <BrandCampaignBanner brand={requestedCampaignBrand} /> : null}
              <p className="eyebrow orange">CATÁLOGO</p>
              <h2>{requestedCampaignBrand ? `El espacio ${requestedCampaignBrand} ya está preparado.` : "Todavía no hay productos disponibles en este sector."}</h2>
              <p>{requestedCampaignBrand ? "El banner ya está activo. Los productos aparecerán acá cuando entren al catálogo validado." : "No inventamos productos: este sector se activa a medida que se suma catálogo real."}</p>
              <Link className="pill-button dark" href={`/categoria/${slug}`}>Ver todo {category.title}</Link>
            </section>
          )}
        </div>

        {!phoneAccordionMode ? <section className={`category-subcategories ${slug === "celulares" ? "phone-generic-subcategories" : ""}`} aria-labelledby="subcategories-title" data-category={category.title}>
          <div className="section-intro split">
            <div><p className="eyebrow orange">EXPLORÁ POR CATEGORÍA</p><h2 id="subcategories-title">Encontrá lo que buscás.</h2></div>
            <p>La navegación está separada del catálogo para que cada sector pueda crecer sin mezclar interfaz, datos y lógica comercial.</p>
          </div>
          {activeSubcategories.length ? (
            <div className="subcategory-banner-grid">
              {activeSubcategories.map((subcategory, index) => (
                <SubcategoryBannerCard key={subcategory.slug} categorySlug={category.slug} categoryTitle={category.title} subcategory={subcategory} index={index} />
              ))}
            </div>
          ) : category.isFallback ? (
            <ProgressiveCategoryExplorer
              categories={navigationCategories
                .filter((item) => !item.isFallback)
                .map((item) => ({
                  slug: item.slug,
                  title: item.title,
                  eyebrow: item.eyebrow,
                  description: item.description,
                  icon: item.icon,
                  subcategories: getActiveSubcategories(item).map((subcategory) => ({ title: subcategory.title })),
                }))}
            />
          ) : (
            <p className="safe-empty">Este universo ya tiene su banner principal. Las subdivisiones adicionales se incorporarán solo cuando aporten una navegación realmente más rápida.</p>
          )}
          {plannedSubcategories.length > 0 && <div className="category-planned-sectors"><div><small>PREPARADO PARA CRECER</small><strong>Próximos sectores</strong></div><div>{plannedSubcategories.map((subcategory) => <span key={subcategory.slug}>{subcategory.title}</span>)}</div></div>}
          {publishableBrandLocales.length > 0 && <div className="category-brands"><div><small>LOCALES DE MARCA</small><strong>Entrá al local.</strong></div><div>{publishableBrandLocales.map((locale) => <a key={locale.key} href={`?marca=${encodeURIComponent(locale.brand)}#catalogo`}>{locale.tabLabel}<span aria-hidden="true">→</span></a>)}</div></div>}
        </section> : null}

        {slug === "descanso" ? <DescansoBrandGallery /> : null}

        <RecentlyViewedRail products={recentCandidates} />
      </main>
      <SiteFooter />
      <SectorBottomNavigation />
      <AllSectorsSheet />
    </>
  );
}
