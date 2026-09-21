import type { CatalogAdapter, CatalogQuery } from "./types";
import { V411AuditedPilotCatalogAdapter } from "./audited-pilot-adapter";
import { Cohort0FrozenCatalogAdapter } from "./cohort0-frozen-adapter";
import { V16ElectroSnapshotCatalogAdapter } from "./v16-electro-snapshot-adapter";
import { V16MediaSnapshotCatalogAdapter } from "./v16-media-snapshot-adapter";
import { V16ToolsCareSnapshotCatalogAdapter } from "./v16-tools-care-snapshot-adapter";
import { V16HomeSnapshotCatalogAdapter } from "./v16-home-snapshot-adapter";
import { V16GamingTechOutdoorSnapshotCatalogAdapter } from "./v16-gaming-tech-outdoor-snapshot-adapter";
import { V16SportsToysItSnapshotCatalogAdapter } from "./v16-sports-toys-it-snapshot-adapter";
import { V16RestOthersSnapshotCatalogAdapter } from "./v16-rest-others-snapshot-adapter";
import { V16UncategorizedSnapshotCatalogAdapter } from "./v16-uncategorized-snapshot-adapter";

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
const electroCatalog = new V16ElectroSnapshotCatalogAdapter();
const mediaCatalog = new V16MediaSnapshotCatalogAdapter();
const toolsCareCatalog = new V16ToolsCareSnapshotCatalogAdapter();
const homeCatalog = new V16HomeSnapshotCatalogAdapter();
const gamingTechOutdoorCatalog = new V16GamingTechOutdoorSnapshotCatalogAdapter();
const sportsToysItCatalog = new V16SportsToysItSnapshotCatalogAdapter();
const restOthersCatalog = new V16RestOthersSnapshotCatalogAdapter();
const uncategorizedCatalog = new V16UncategorizedSnapshotCatalogAdapter();

class Cohort0CompositeCatalogAdapter implements CatalogAdapter {
  readonly source = primaryCatalog.source;

  async listProducts(query: CatalogQuery = {}) {
    const [primaryResults, cohort0Results, electroResults, mediaResults, toolsCareResults, homeResults, gamingTechOutdoorResults, sportsToysItResults, restOthersResults, uncategorizedResults] = await Promise.all([
      primaryCatalog.listProducts(query),
      cohort0Catalog.listProducts(query),
      electroCatalog.listProducts(query),
      mediaCatalog.listProducts(query),
      toolsCareCatalog.listProducts(query),
      homeCatalog.listProducts(query),
      gamingTechOutdoorCatalog.listProducts(query),
      sportsToysItCatalog.listProducts(query),
      restOthersCatalog.listProducts(query),
      uncategorizedCatalog.listProducts(query),
    ]);
    const seen = new Set<string>();
    return [...primaryResults, ...cohort0Results, ...electroResults, ...mediaResults, ...toolsCareResults, ...homeResults, ...gamingTechOutdoorResults, ...sportsToysItResults, ...restOthersResults, ...uncategorizedResults].filter((product) => {
      const key = [
        product.category,
        product.subcategory ?? "",
        product.brand,
        product.model ?? "",
        product.name,
        product.price?.amount ?? "",
      ].join("|").toLocaleLowerCase("es-AR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getProductBySlug(slug: string) {
    const primaryMatch = await primaryCatalog.getProductBySlug(slug);
    if (primaryMatch) return primaryMatch;
    const cohort0Match = await cohort0Catalog.getProductBySlug(slug);
    if (cohort0Match) return cohort0Match;
    const electroMatch = await electroCatalog.getProductBySlug(slug);
    if (electroMatch) return electroMatch;
    const mediaMatch = await mediaCatalog.getProductBySlug(slug);
    if (mediaMatch) return mediaMatch;
    const toolsCareMatch = await toolsCareCatalog.getProductBySlug(slug);
    if (toolsCareMatch) return toolsCareMatch;
    const homeMatch = await homeCatalog.getProductBySlug(slug);
    if (homeMatch) return homeMatch;
    const gamingTechOutdoorMatch = await gamingTechOutdoorCatalog.getProductBySlug(slug);
    if (gamingTechOutdoorMatch) return gamingTechOutdoorMatch;
    const sportsToysItMatch = await sportsToysItCatalog.getProductBySlug(slug);
    if (sportsToysItMatch) return sportsToysItMatch;
    const restOthersMatch = await restOthersCatalog.getProductBySlug(slug);
    if (restOthersMatch) return restOthersMatch;
    return uncategorizedCatalog.getProductBySlug(slug);
  }
}

export const catalog: CatalogAdapter = new Cohort0CompositeCatalogAdapter();

export { LegacyCatalogAdapter } from "./legacy/legacy-catalog-adapter";
export type { LegacyCatalogSnapshot } from "./legacy/legacy-catalog-adapter";
export type { Product, CatalogQuery, CatalogAdapter } from "./types";
export { v411CatalogEvidence } from "./audited-pilot-adapter";
export { cohort0CatalogEvidence } from "./cohort0-frozen-adapter";

export { v16ElectroSnapshotEvidence } from "./v16-electro-snapshot-adapter";

export { v16MediaSnapshotEvidence } from "./v16-media-snapshot-adapter";

export { v16ToolsCareSnapshotEvidence } from "./v16-tools-care-snapshot-adapter";

export { v16HomeSnapshotEvidence } from "./v16-home-snapshot-adapter";

export { v16GamingTechOutdoorSnapshotEvidence } from "./v16-gaming-tech-outdoor-snapshot-adapter";

export { v16SportsToysItSnapshotEvidence } from "./v16-sports-toys-it-snapshot-adapter";

export { v16RestOthersSnapshotEvidence } from "./v16-rest-others-snapshot-adapter";

export { v16UncategorizedSnapshotEvidence } from "./v16-uncategorized-snapshot-adapter";
