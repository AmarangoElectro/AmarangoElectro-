import type { CatalogAdapter, CatalogQuery } from "./types";
import { V411AuditedPilotCatalogAdapter } from "./audited-pilot-adapter";
import { Cohort0FrozenCatalogAdapter } from "./cohort0-frozen-adapter";

// V4.11 usa la única evidencia comercial sanitizada incluida en el checkpoint.
// No se afirma que sea un snapshot de producción: el reporte del gate conserva
// el bloqueo hasta recibir URL + publishable/anon key + recurso/RLS auditados.
const primaryCatalog = new V411AuditedPilotCatalogAdapter();

// V16 REAL CATALOG COHORT 0 — SAFE INTEGRATION GATE (2026-09-12).
// Composición mínima y aislada: agrega los 9 productos de Cohort 0 (evidencia
// congelada, ver lib/catalog/cohort0-frozen-adapter.ts) a la salida de la
// fuente primaria, sin reemplazarla ni tocar su lógica. No consulta Supabase,
// no usa credenciales, no escribe nada.
// ROLLBACK: reemplazar el bloque `catalog` de abajo por
// `export const catalog: CatalogAdapter = primaryCatalog;` y opcionalmente
// borrar cohort0-frozen-adapter.ts + fixtures/v16-real-catalog-cohort-0-frozen.json.
const cohort0Catalog = new Cohort0FrozenCatalogAdapter();

class Cohort0CompositeCatalogAdapter implements CatalogAdapter {
  readonly source = primaryCatalog.source;

  async listProducts(query: CatalogQuery = {}) {
    const [primaryResults, cohort0Results] = await Promise.all([
      primaryCatalog.listProducts(query),
      cohort0Catalog.listProducts(query),
    ]);
    return [...primaryResults, ...cohort0Results];
  }

  async getProductBySlug(slug: string) {
    const primaryMatch = await primaryCatalog.getProductBySlug(slug);
    if (primaryMatch) return primaryMatch;
    return cohort0Catalog.getProductBySlug(slug);
  }
}

export const catalog: CatalogAdapter = new Cohort0CompositeCatalogAdapter();

export { LegacyCatalogAdapter } from "./legacy/legacy-catalog-adapter";
export type { LegacyCatalogSnapshot } from "./legacy/legacy-catalog-adapter";
export type { Product, CatalogQuery, CatalogAdapter } from "./types";
export { v411CatalogEvidence } from "./audited-pilot-adapter";
export { cohort0CatalogEvidence } from "./cohort0-frozen-adapter";
