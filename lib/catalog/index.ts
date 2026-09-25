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
  ]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const derivedToolSectorSlugs = new Set(["taladros", "amoladoras", "sierras"]);
const derivedAudioSectorSlugs = new Set(["parlantes-portatiles", "torres", "barras-de-sonido"]);

function normalizeToolName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function deriveToolSubcategory(product: Product): Product {
  if (product.category !== "herramientas" || product.subcategory) return product;

  const normalizedName = normalizeToolName(product.name);
  const matches = new Set<string>();

  if (/\b(taladro|taladros|atornillador|atornilladores|percutor)\b/.test(normalizedName)) {
    matches.add("taladros");
  }
  if (/\b(amoladora|amoladoras)\b/.test(normalizedName)) {
    matches.add("amoladoras");
  }
  if (/\b(sierra|sierras|caladora|caladoras|circular|circulares)\b/.test(normalizedName)) {
    matches.add("sierras");
  }

  if (matches.size !== 1) return product;
  const [subcategory] = matches;
  return { ...product, subcategory };
}

function deriveAudioSubcategory(product: Product): Product {
  if (product.category !== "audio" || product.subcategory) return product;

  const normalizedName = normalizeToolName(product.name);
  const matches = new Set<string>();

  if (/\bparlante portatil\b/.test(normalizedName)) matches.add("parlantes-portatiles");
  if (/\btorre\b/.test(normalizedName)) matches.add("torres");
  if (/\bbarra de sonido\b/.test(normalizedName)) matches.add("barras-de-sonido");

  if (matches.size !== 1) return product;
  const [subcategory] = matches;
  return { ...product, subcategory };
}

function usesDerivedToolSector(query: CatalogQuery) {
  return query.category === "herramientas"
    && Boolean(query.subcategory && derivedToolSectorSlugs.has(query.subcategory));
}

function usesDerivedAudioSector(query: CatalogQuery) {
  return query.category === "audio"
    && Boolean(query.subcategory && derivedAudioSectorSlugs.has(query.subcategory));
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
    const sourceQuery: CatalogQuery = { ...query };
    if (usesDerivedToolSector(query) || usesDerivedAudioSector(query)) delete sourceQuery.subcategory;

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
      primaryCatalog.listProducts(sourceQuery),
      cohort0Catalog.listProducts(sourceQuery),
      electroCatalog.listProducts(sourceQuery),
      cellphoneCatalog.listProducts(sourceQuery),
      catalogExpansion63.listProducts(sourceQuery),
      catalogExpansion5.listProducts(sourceQuery),
      catalogExpansion31.listProducts(sourceQuery),
      catalogExpansion50.listProducts(sourceQuery),
      catalogExpansion99.listProducts(sourceQuery),
    ]);

    const primaryWithoutLegacyCellphones = primaryResults.filter(
      (product) => product.category !== "celulares",
    );

    const merged = mergeUnique(
      primaryWithoutLegacyCellphones,
      cohort0Results,
      electroResults,
      cellphoneResults,
      expansion63Results,
      expansion5Results,
      expansion31Results,
      expansion50Results,
      expansion99Results,
    ).map(deriveToolSubcategory).map(deriveAudioSubcategory);

    if (usesDerivedToolSector(query) || usesDerivedAudioSector(query)) {
      return merged.filter((product) => product.subcategory === query.subcategory);
    }

    return merged;
  }

  async getProductBySlug(slug: string) {
    const primaryMatch = await primaryCatalog.getProductBySlug(slug);
    if (primaryMatch && primaryMatch.category !== "celulares") return deriveAudioSubcategory(deriveToolSubcategory(primaryMatch));

    const cohort0Match = await cohort0Catalog.getProductBySlug(slug);
    if (cohort0Match) return deriveAudioSubcategory(deriveToolSubcategory(cohort0Match));

    const electroMatch = await electroCatalog.getProductBySlug(slug);
    if (electroMatch) return deriveAudioSubcategory(deriveToolSubcategory(electroMatch));

    const cellphoneMatch = await cellphoneCatalog.getProductBySlug(slug);
    if (cellphoneMatch) return deriveAudioSubcategory(deriveToolSubcategory(cellphoneMatch));

    const expansion63Match = await catalogExpansion63.getProductBySlug(slug);
    if (expansion63Match) return deriveAudioSubcategory(deriveToolSubcategory(expansion63Match));

    const expansion5Match = await catalogExpansion5.getProductBySlug(slug);
    if (expansion5Match) return deriveAudioSubcategory(deriveToolSubcategory(expansion5Match));

    const expansion31Match = await catalogExpansion31.getProductBySlug(slug);
    if (expansion31Match) return deriveAudioSubcategory(deriveToolSubcategory(expansion31Match));

    const expansion50Match = await catalogExpansion50.getProductBySlug(slug);
    if (expansion50Match) return deriveAudioSubcategory(deriveToolSubcategory(expansion50Match));

    const expansion99Match = await catalogExpansion99.getProductBySlug(slug);
    return expansion99Match ? deriveAudioSubcategory(deriveToolSubcategory(expansion99Match)) : null;
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
