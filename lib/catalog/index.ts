import type { CatalogAdapter, CatalogQuery, Product } from "./types";
import { V411AuditedPilotCatalogAdapter } from "./audited-pilot-adapter";
import { Cohort0FrozenCatalogAdapter } from "./cohort0-frozen-adapter";
import { V16ElectroSnapshotCatalogAdapter } from "./v16-electro-snapshot-adapter";
import { V16Cellphones90PublicCatalogAdapter } from "./v16-cellphones-90-public-adapter";
import { V16CatalogExpansion63Adapter } from "./v16-catalog-expansion-63-adapter";
import { V16CatalogExpansion5V412Adapter } from "./v16-catalog-expansion-5-v412-adapter";
import { V16CatalogExpansion31LiteralBrandAdapter } from "./v16-catalog-expansion-31-literal-brand-adapter";
import { V16CatalogExpansion50GlobalBrandStorageAdapter } from "./v16-catalog-expansion-50-global-brand-storage-adapter";
import { V16CatalogExpansion99CuratedBrandAdapter } from "./v16-catalog-expansion-99-curated-brand-adapter";

const primaryCatalog = new V411AuditedPilotCatalogAdapter();
const cohort0Catalog = new Cohort0FrozenCatalogAdapter();
const electroCatalog = new V16ElectroSnapshotCatalogAdapter();
const cellphoneCatalog = new V16Cellphones90PublicCatalogAdapter();
const catalogExpansion63 = new V16CatalogExpansion63Adapter();
const catalogExpansion5 = new V16CatalogExpansion5V412Adapter();
const catalogExpansion31 = new V16CatalogExpansion31LiteralBrandAdapter();
const catalogExpansion50 = new V16CatalogExpansion50GlobalBrandStorageAdapter();
const catalogExpansion99 = new V16CatalogExpansion99CuratedBrandAdapter();

function productKey(product: Product) {
  return [
    product.category,
    product.subcategory ?? "",
    product.brand,
    product.model ?? "",
    product.name,
    product.price?.amount ?? "",
  ]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mergeUnique(...groups: Product[][]) {
  const seen = new Set<string>();
  const merged: Product[] = [];

  for (const group of groups) {
    for (const product of group) {
      const key = productKey(product);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(product);
    }
  }

  return merged;
}

/**
 * Catálogo compuesto V16 — fuente pública read-only.
 *
 * Fuentes activas:
 * - piloto histórico no-celular;
 * - cohorte 0 congelada;
 * - 224 Electrodomésticos sanitizados;
 * - 90 celulares canónicos con precio/foto sanitizados;
 * - expansiones públicas deduplicadas: 63 + 5 + 31 + 50 + 99.
 *
 * Las fuentes redundantes 31-known-brand, 48-explicit-brand y otros
 * checkpoints intermedios permanecen versionados como evidencia, pero
 * NO forman parte del catálogo activo.
 *
 * Ninguna de estas fuentes escribe sobre Supabase ni producción.
 */
class V16CompositeCatalogAdapter implements CatalogAdapter {
  readonly source = primaryCatalog.source;

  async listProducts(query: CatalogQuery = {}) {
    const [
      primaryResults,
      cohort0Results,
      electroResults,
      cellphoneResults,
      expansion63Results,
      expansion5Results,
      expansion31Results,
      expansion50Results,
      expansion99Results,
    ] = await Promise.all([
      primaryCatalog.listProducts(query),
      cohort0Catalog.listProducts(query),
      electroCatalog.listProducts(query),
      cellphoneCatalog.listProducts(query),
      catalogExpansion63.listProducts(query),
      catalogExpansion5.listProducts(query),
      catalogExpansion31.listProducts(query),
      catalogExpansion50.listProducts(query),
      catalogExpansion99.listProducts(query),
    ]);

    const primaryWithoutLegacyCellphones = primaryResults.filter(
      (product) => product.category !== "celulares",
    );

    return mergeUnique(
      primaryWithoutLegacyCellphones,
      cohort0Results,
      electroResults,
      cellphoneResults,
      expansion63Results,
      expansion5Results,
      expansion31Results,
      expansion50Results,
      expansion99Results,
    );
  }

  async getProductBySlug(slug: string) {
    const primaryMatch = await primaryCatalog.getProductBySlug(slug);
    if (primaryMatch && primaryMatch.category !== "celulares") return primaryMatch;

    const cohort0Match = await cohort0Catalog.getProductBySlug(slug);
    if (cohort0Match) return cohort0Match;

    const electroMatch = await electroCatalog.getProductBySlug(slug);
    if (electroMatch) return electroMatch;

    const cellphoneMatch = await cellphoneCatalog.getProductBySlug(slug);
    if (cellphoneMatch) return cellphoneMatch;

    const expansion63Match = await catalogExpansion63.getProductBySlug(slug);
    if (expansion63Match) return expansion63Match;

    const expansion5Match = await catalogExpansion5.getProductBySlug(slug);
    if (expansion5Match) return expansion5Match;

    const expansion31Match = await catalogExpansion31.getProductBySlug(slug);
    if (expansion31Match) return expansion31Match;

    const expansion50Match = await catalogExpansion50.getProductBySlug(slug);
    if (expansion50Match) return expansion50Match;

    return catalogExpansion99.getProductBySlug(slug);
  }
}

export const catalog: CatalogAdapter = new V16CompositeCatalogAdapter();

export { LegacyCatalogAdapter } from "./legacy/legacy-catalog-adapter";
export type { LegacyCatalogSnapshot } from "./legacy/legacy-catalog-adapter";
export type { Product, CatalogQuery, CatalogAdapter } from "./types";
export { v411CatalogEvidence } from "./audited-pilot-adapter";
export { cohort0CatalogEvidence } from "./cohort0-frozen-adapter";
export { v16ElectroSnapshotEvidence } from "./v16-electro-snapshot-adapter";
export { v16Cellphones90PublicEvidence } from "./v16-cellphones-90-public-adapter";
export { v16CatalogExpansion63Evidence } from "./v16-catalog-expansion-63-adapter";
export { v16CatalogExpansion5Evidence } from "./v16-catalog-expansion-5-v412-adapter";
export { v16CatalogExpansion31Evidence } from "./v16-catalog-expansion-31-literal-brand-adapter";
export { v16CatalogExpansion50Evidence } from "./v16-catalog-expansion-50-global-brand-storage-adapter";
export { v16CatalogExpansion99Evidence } from "./v16-catalog-expansion-99-curated-brand-adapter";
