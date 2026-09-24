import type { CatalogAdapter, CatalogQuery, Product } from "./types";
import { V411AuditedPilotCatalogAdapter } from "./audited-pilot-adapter";
import { Cohort0FrozenCatalogAdapter } from "./cohort0-frozen-adapter";
import { V16ElectroSnapshotCatalogAdapter } from "./v16-electro-snapshot-adapter";
import { V16Cellphones90PublicCatalogAdapter } from "./v16-cellphones-90-public-adapter";
import { V16CatalogExpansion63Adapter } from "./v16-catalog-expansion-63-adapter";
import { V16CatalogExpansion5V412Adapter } from "./v16-catalog-expansion-5-v412-adapter";
import { V16CatalogExpansion31Adapter } from "./v16-catalog-expansion-31-adapter";
import { V16CatalogExpansion31LiteralBrandAdapter } from "./v16-catalog-expansion-31-literal-brand-adapter";
import { V16CatalogExpansion50GlobalBrandStorageAdapter } from "./v16-catalog-expansion-50-global-brand-storage-adapter";
import { V16CatalogExpansion31KnownBrandAdapter } from "./v16-catalog-expansion-31-known-brand-adapter";
import { V16CatalogExpansion48ExplicitBrandAdapter } from "./v16-catalog-expansion-48-explicit-brand-adapter";
import { V16CatalogExpansion99CuratedBrandAdapter } from "./v16-catalog-expansion-99-curated-brand-adapter";

const primaryCatalog = new V411AuditedPilotCatalogAdapter();
const cohort0Catalog = new Cohort0FrozenCatalogAdapter();
const electroCatalog = new V16ElectroSnapshotCatalogAdapter();
const cellphoneSnapshotCatalog = new V16Cellphones90PublicCatalogAdapter();
const catalogExpansion63 = new V16CatalogExpansion63Adapter();
const catalogExpansion5 = new V16CatalogExpansion5V412Adapter();
const catalogExpansion31 = new V16CatalogExpansion31Adapter();
const catalogExpansion31 = new V16CatalogExpansion31LiteralBrandAdapter();
const catalogExpansion50 = new V16CatalogExpansion50GlobalBrandStorageAdapter();
const catalogExpansion31 = new V16CatalogExpansion31KnownBrandAdapter();
const catalogExpansion48 = new V16CatalogExpansion48ExplicitBrandAdapter();
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
 * Catálogo compuesto V16.
 *
 * - primaryCatalog: evidencia histórica mínima ya integrada.
 * - cohort0Catalog: cohorte real congelada previa.
 * - electroCatalog: snapshot real sanitizado de electrodomésticos.
 * - cellphoneSnapshotCatalog: 90 celulares canónicos con precio/foto sanitizados.
 * - catalogExpansion63 / 5 / 31 / 50: ampliaciones públicas versionadas y deduplicadas.
 *
 * Ninguna de estas fuentes escribe sobre la tienda legacy ni sobre Supabase.
 */
class V16CompositeCatalogAdapter implements CatalogAdapter {
  readonly source = primaryCatalog.source;

  async listProducts(query: CatalogQuery = {}) {
    const [primaryResults, cohort0Results, electroResults, cellphoneSnapshotResults, expansion63Results, expansion5Results, expansion31Results, expansion48Results, expansion99Results] = await Promise.all([
      primaryCatalog.listProducts(query),
      cohort0Catalog.listProducts(query),
      electroCatalog.listProducts(query),
      cellphoneSnapshotCatalog.listProducts(query),
      catalogExpansion63.listProducts(query),
      catalogExpansion5.listProducts(query),
      catalogExpansion31.listProducts(query),
      catalogExpansion48.listProducts(query),
      catalogExpansion99.listProducts(query),
    ]);

    const primaryWithoutLegacyCellphones = primaryResults.filter((product) => product.category !== "celulares");

    return mergeUnique(primaryWithoutLegacyCellphones, cohort0Results, electroResults, cellphoneSnapshotResults, expansion63Results, expansion5Results, expansion31Results, expansion48Results, expansion99Results);
  }

  async getProductBySlug(slug: string) {
    const primaryMatch = await primaryCatalog.getProductBySlug(slug);
    if (primaryMatch && primaryMatch.category !== "celulares") return primaryMatch;

    const cohort0Match = await cohort0Catalog.getProductBySlug(slug);
    if (cohort0Match) return cohort0Match;

    const electroMatch = await electroCatalog.getProductBySlug(slug);
    if (electroMatch) return electroMatch;

    const cellphoneMatch = await cellphoneSnapshotCatalog.getProductBySlug(slug);
    if (cellphoneMatch) return cellphoneMatch;

    const expansion63Match = await catalogExpansion63.getProductBySlug(slug);
    if (expansion63Match) return expansion63Match;

    const expansion5Match = await catalogExpansion5.getProductBySlug(slug);
    if (expansion5Match) return expansion5Match;

    const expansion31Match = await catalogExpansion31.getProductBySlug(slug);
    if (expansion31Match) return expansion31Match;

    const expansion48Match = await catalogExpansion48.getProductBySlug(slug);
    if (expansion48Match) return expansion48Match;

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
export { v16CatalogExpansion31Evidence } from "./v16-catalog-expansion-31-adapter";
export { v16CatalogExpansion31Evidence } from "./v16-catalog-expansion-31-literal-brand-adapter";
export { v16CatalogExpansion50Evidence } from "./v16-catalog-expansion-50-global-brand-storage-adapter";
export { v16CatalogExpansion31Evidence } from "./v16-catalog-expansion-31-known-brand-adapter";
export { v16CatalogExpansion48Evidence } from "./v16-catalog-expansion-48-explicit-brand-adapter";
export { v16CatalogExpansion99Evidence } from "./v16-catalog-expansion-99-curated-brand-adapter";
