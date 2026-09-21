import type { CatalogAdapter, CatalogQuery, Product } from "./types";
import { V16ElectroSnapshotCatalogAdapter } from "./v16-electro-snapshot-adapter";
import { V16MediaSnapshotCatalogAdapter } from "./v16-media-snapshot-adapter";
import { V16ToolsCareSnapshotCatalogAdapter } from "./v16-tools-care-snapshot-adapter";
import { V16HomeSnapshotCatalogAdapter } from "./v16-home-snapshot-adapter";
import { V16GamingTechOutdoorSnapshotCatalogAdapter } from "./v16-gaming-tech-outdoor-snapshot-adapter";
import { V16SportsToysItSnapshotCatalogAdapter } from "./v16-sports-toys-it-snapshot-adapter";
import { V16RestOthersSnapshotCatalogAdapter } from "./v16-rest-others-snapshot-adapter";
import { V16UncategorizedSnapshotCatalogAdapter } from "./v16-uncategorized-snapshot-adapter";

/**
 * Catálogo público V16 actual.
 *
 * IMPORTANTE:
 * - V4.11 y Cohort 0 se conservan como evidencia histórica, pero ya no
 *   participan del runtime público.
 * - Los 90 celulares materializados siguen aislados en Administración hasta
 *   que su propio gate autorice precio/stock/imagen/publicación.
 * - Esta composición usa únicamente los snapshots sanitizados del corte
 *   público LIVE 2026-09-20 (553 IDs únicos).
 */
const activeCatalogs: readonly CatalogAdapter[] = [
  new V16ElectroSnapshotCatalogAdapter(),
  new V16MediaSnapshotCatalogAdapter(),
  new V16ToolsCareSnapshotCatalogAdapter(),
  new V16HomeSnapshotCatalogAdapter(),
  new V16GamingTechOutdoorSnapshotCatalogAdapter(),
  new V16SportsToysItSnapshotCatalogAdapter(),
  new V16RestOthersSnapshotCatalogAdapter(),
  new V16UncategorizedSnapshotCatalogAdapter(),
];

function normalizeIdentityPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function publicProductKey(product: Product) {
  return [
    normalizeIdentityPart(product.category),
    normalizeIdentityPart(product.subcategory ?? ""),
    normalizeIdentityPart(product.brand),
    normalizeIdentityPart(product.model ?? ""),
    normalizeIdentityPart(product.name),
    product.price?.amount ?? "",
  ].join("|");
}

function dedupeProducts(products: Product[]) {
  const seenIds = new Set<string>();
  const seenPublicKeys = new Set<string>();

  return products.filter((product) => {
    if (seenIds.has(product.id)) return false;

    const publicKey = publicProductKey(product);
    if (seenPublicKeys.has(publicKey)) return false;

    seenIds.add(product.id);
    seenPublicKeys.add(publicKey);
    return true;
  });
}

class V16CurrentSnapshotCompositeCatalogAdapter implements CatalogAdapter {
  readonly source = "v16-electro-sanitized-snapshot" as const;

  async listProducts(query: CatalogQuery = {}) {
    const resultSets = await Promise.all(activeCatalogs.map((adapter) => adapter.listProducts(query)));
    return dedupeProducts(resultSets.flat());
  }

  async getProductBySlug(slug: string) {
    for (const adapter of activeCatalogs) {
      const match = await adapter.getProductBySlug(slug);
      if (match) return match;
    }
    return null;
  }
}

export const catalog: CatalogAdapter = new V16CurrentSnapshotCompositeCatalogAdapter();

export { LegacyCatalogAdapter } from "./legacy/legacy-catalog-adapter";
export type { LegacyCatalogSnapshot } from "./legacy/legacy-catalog-adapter";
export type { Product, CatalogQuery, CatalogAdapter } from "./types";

// Evidencia histórica: exportada para QA/documentación, no conectada al runtime público.
export { v411CatalogEvidence } from "./audited-pilot-adapter";
export { cohort0CatalogEvidence } from "./cohort0-frozen-adapter";

// Evidencia V16 actualmente activa.
export { v16ElectroSnapshotEvidence } from "./v16-electro-snapshot-adapter";
export { v16MediaSnapshotEvidence } from "./v16-media-snapshot-adapter";
export { v16ToolsCareSnapshotEvidence } from "./v16-tools-care-snapshot-adapter";
export { v16HomeSnapshotEvidence } from "./v16-home-snapshot-adapter";
export { v16GamingTechOutdoorSnapshotEvidence } from "./v16-gaming-tech-outdoor-snapshot-adapter";
export { v16SportsToysItSnapshotEvidence } from "./v16-sports-toys-it-snapshot-adapter";
export { v16RestOthersSnapshotEvidence } from "./v16-rest-others-snapshot-adapter";
export { v16UncategorizedSnapshotEvidence } from "./v16-uncategorized-snapshot-adapter";
