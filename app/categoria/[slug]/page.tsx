import Link from "../../components/store-link";
import { notFound } from "next/navigation";
import { catalog } from "@/lib/catalog";
import { categories, getActiveSubcategories, getCategory, getSubcategory } from "@/lib/catalog/categories";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { RecentlyViewedRail } from "@/app/components/recently-viewed-rail";
import { SectorBottomNavigation, SectorShowroom } from "@/app/components/sector-showroom";
import { BrandCampaignBanner, hasCompleteBrandCampaign } from "@/app/components/brand-campaign-banner";
import { AllSectorsSheet } from "@/app/components/all-sectors-sheet";
import { brandsShareFamily } from "@/lib/catalog/brand-family";
import { buildBrandDrawers } from "@/lib/catalog/brand-drawers";
import { BrandProductAccordion } from "@/app/components/brand-product-accordion";

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
  const requestedCampaignBrand = rawRequestedBrand
    ? [...knownBrands].find((brand) => brandsShareFamily(brand, rawRequestedBrand))
      ?? [...availableBrands].find((brand) => brandsShareFamily(brand, rawRequestedBrand))
    : undefined;
  const products = categoryProducts;
  const initialBrand = requestedCampaignBrand;
  const initialSearch = typeof q === "string" ? q.slice(0, 120) : "";
  const initialSort = orden === "brand" || orden === "name" || orden === "price-asc" || orden === "price-desc" || orden === "capacity" ? orden : "recommended";
  const initialFavoritesOnly = favoritos === "1";
  const parsedMaxPrice = typeof precioMax === "string" ? Number(precioMax) : Number.NaN;
  const initialMaxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null;
  const initialAvailableOnly = disponible === "1";
  const activeSubcategories = getActiveSubcategories(category);
  const phoneAccordionMode = slug === "celulares" && !activeSector;
  const drawerBrands = buildBrandDrawers(products, phoneAccordionMode ? activeSubcategories : []);

  return (
    <>
      <div className="category-route-header"><SiteHeader /></div>
      <main className={`category-page category-theme-${category.slug}`}>
        <SectorShowroom
          category={category}
          activeSector={activeSector}
          activeBrand={requestedCampaignBrand}
          compactBrandView={Boolean(requestedCampaignBrand)}
          hideEditorial={slug === "celulares"}
        />
        <div id="catalogo">
          {products.length > 0 ? (
            <BrandProductAccordion categorySlug={slug} sectorSlug={activeSector?.slug} products={products} brands={drawerBrands} categoryTitle={activeSector?.title ?? category.title} quickSubcategories={activeSubcategories.filter(item => !item.brand).map(({slug, title}) => ({slug, title}))} initialFilters={{initialBrand, initialSearch, initialSort, initialFavoritesOnly, initialMaxPrice, initialAvailableOnly}} />
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


        <RecentlyViewedRail products={recentCandidates} />
      </main>
      <SiteFooter />
      <SectorBottomNavigation />
      <AllSectorsSheet />
    </>
  );
}
