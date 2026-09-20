import { CatalogClient } from "@/app/components/catalog-client";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { catalog, v411CatalogEvidence } from "@/lib/catalog";

type SearchParams = {
  q?: string | string[];
  marca?: string | string[];
  categoria?: string | string[];
  orden?: string | string[];
  favoritos?: string | string[];
  precioMax?: string | string[];
  disponible?: string | string[];
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const values = await searchParams;
  const products = await catalog.listProducts({ visibleOnly: true });
  const query = typeof values.q === "string" ? values.q.slice(0, 120) : "";
  const brand = typeof values.marca === "string" ? values.marca : undefined;
  const category = typeof values.categoria === "string" ? values.categoria : "Todas";
  const sort = values.orden === "brand" || values.orden === "name" || values.orden === "price-asc" || values.orden === "price-desc" ? values.orden : "recommended";
  const parsedMaxPrice = typeof values.precioMax === "string" ? Number(values.precioMax) : Number.NaN;

  return <>
    <SiteHeader />
    <main className="search-page">
      <section className="search-hero">
        <p className="eyebrow orange">BUSCADOR</p>
        <h1>Un catálogo.<br /><span>Todas las coincidencias disponibles.</span></h1>
        <p>Nombre, modelo, marca y categoría, todo sobre el mismo catálogo.</p>
        <div className="catalog-evidence-notice"><strong>Catálogo en incorporación</strong><span>{v411CatalogEvidence.productCount} productos disponibles por ahora — seguimos sumando el resto del catálogo.</span></div>
      </section>
      <CatalogClient
        products={products}
        initialSearch={query}
        initialBrand={brand}
        initialCategory={category}
        initialSort={sort}
        initialFavoritesOnly={values.favoritos === "1"}
        initialMaxPrice={Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null}
        initialAvailableOnly={values.disponible === "1"}
        categoryTitle="la muestra disponible"
        showCategoryFilter
      />
    </main>
    <SiteFooter />
  </>;
}
