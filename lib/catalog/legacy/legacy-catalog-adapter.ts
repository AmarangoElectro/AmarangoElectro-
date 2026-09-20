import type { CatalogAdapter, CatalogQuery, Product } from "../types";
import { normalizeCatalogText, rankProductsForSearch } from "../search";
import {
  normalizeLegacyCatalog,
  type LegacyCatalogSnapshot,
  type LegacyNormalizationResult,
} from "./legacy-normalizer";
import { sanitizeLegacySnapshot } from "./legacy-snapshot-sanitizer";

/**
 * Adaptador público inyectable: no conoce credenciales, tablas, fetch ni SDKs.
 * Recibe un snapshot ya obtenido por un canal de lectura auditado y expone
 * únicamente operaciones de consulta del contrato Product de V16.
 */
export class LegacyCatalogAdapter implements CatalogAdapter {
  readonly source = "legacy-pilot" as const;
  private readonly products: readonly Product[];
  private readonly report: LegacyNormalizationResult;

  constructor(snapshot: Readonly<LegacyCatalogSnapshot>) {
    const sanitizedSnapshot = sanitizeLegacySnapshot(snapshot);
    this.report = normalizeLegacyCatalog(sanitizedSnapshot);
    this.products = Object.freeze([...this.report.products]);
  }

  getDiagnostics() {
    return {
      accepted: this.products.length,
      rejected: [...this.report.rejected],
      potentialDuplicates: [...this.report.potentialDuplicates],
    };
  }

  async listProducts(query: CatalogQuery = {}) {
    const candidates = this.products.filter((product) => {
      // El adaptador público nunca entrega ocultos, aunque visibleOnly sea false.
      if (!product.visible) return false;
      if (query.inStockOnly && product.stock.status !== "in_stock") return false;
      if (query.category && product.category !== query.category) return false;
      if (query.subcategory && product.subcategory !== query.subcategory) return false;
      if (query.brand && normalizeCatalogText(product.brand) !== normalizeCatalogText(query.brand)) return false;
      if (query.maxPrice !== undefined && Number.isFinite(query.maxPrice)) {
        if (product.price === null || product.price.amount > query.maxPrice) return false;
      }
      return true;
    });
    return rankProductsForSearch(candidates, query.search ?? "");
  }

  async getProductBySlug(slug: string) {
    return this.products.find((product) => product.visible && product.slug === slug) ?? null;
  }
}

export type { LegacyCatalogSnapshot } from "./legacy-normalizer";
