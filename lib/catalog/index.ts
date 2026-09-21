import type { CatalogAdapter, CatalogQuery, Product } from "./types";
import { V411AuditedPilotCatalogAdapter } from "./audited-pilot-adapter";
import { Cohort0FrozenCatalogAdapter } from "./cohort0-frozen-adapter";
import { V16ElectroSnapshotCatalogAdapter } from "./v16-electro-snapshot-adapter";
import { V16CellphonesSanitizedSnapshotCatalogAdapter } from "./v16-cellphones-sanitized-snapshot-adapter";
import { V16CatalogExpansion63Adapter } from "./v16-catalog-expansion-63-adapter";

const primaryCatalog = new V411AuditedPilotCatalogAdapter();
const cohort0Catalog = new Cohort0FrozenCatalogAdapter();
const electroCatalog = new V16ElectroSnapshotCatalogAdapter();
const cellphoneSnapshotCatalog = new V16CellphonesSanitizedSnapshotCatalogAdapter();
const catalogExpansion63 = new V16CatalogExpansion63Adapter();

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
 * - electroCatalog: snapshot real sanitizado de electrodomésticos, copiado
 *   en modo read-only desde Supabase y versionado en GitHub.
 *
 * Ninguna de estas fuentes escribe sobre la tienda legacy ni sobre Supabase.
 */
class V16CompositeCatalogAdapter implements CatalogAdapter {
  readonly source = primaryCatalog.source;

  async listProducts(query: CatalogQuery = {}) {
    const [primaryResults, cohort0Results, electroResults, cellphoneSnapshotResults, expansion63Results] = await Promise.all([
      primaryCatalog.listProducts(query),
      cohort0Catalog.listProducts(query),
      electroCatalog.listProducts(query),
      cellphoneSnapshotCatalog.listProducts(query),
      catalogExpansion63.listProducts(query),
    ]);

    return mergeUnique(primaryResults, cohort0Results, electroResults, cellphoneSnapshotResults, expansion63Results);
  }

  async getProductBySlug(slug: string) {
    const primaryMatch = await primaryCatalog.getProductBySlug(slug);
    if (primaryMatch) return primaryMatch;

    const cohort0Match = await cohort0Catalog.getProductBySlug(slug);
    if (cohort0Match) return cohort0Match;

    const electroMatch = await electroCatalog.getProductBySlug(slug);
    if (electroMatch) return electroMatch;

    const cellphoneMatch = await cellphoneSnapshotCatalog.getProductBySlug(slug);
    if (cellphoneMatch) return cellphoneMatch;

    return catalogExpansion63.getProductBySlug(slug);
  }
}

export const catalog: CatalogAdapter = new V16CompositeCatalogAdapter();

export { LegacyCatalogAdapter } from "./legacy/legacy-catalog-adapter";
export type { LegacyCatalogSnapshot } from "./legacy/legacy-catalog-adapter";
export type { Product, CatalogQuery, CatalogAdapter } from "./types";
export { v411CatalogEvidence } from "./audited-pilot-adapter";
export { cohort0CatalogEvidence } from "./cohort0-frozen-adapter";
export { v16ElectroSnapshotEvidence } from "./v16-electro-snapshot-adapter";
export { v16CellphonesSanitizedSnapshotEvidence } from "./v16-cellphones-sanitized-snapshot-adapter";
export { v16CatalogExpansion63Evidence } from "./v16-catalog-expansion-63-adapter";
