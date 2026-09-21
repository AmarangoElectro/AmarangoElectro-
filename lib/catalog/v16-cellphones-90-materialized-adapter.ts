import evidence from "@/fixtures/v16-90-cellphones-materialized.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

/**
 * V16 — 90 CELLPHONES CANONICAL ID MATERIALIZATION — IMPLEMENTATION GATE.
 *
 * Adaptador aislado, aditivo y NO conectado al composite activo (`catalog`
 * en lib/catalog/index.ts). Construye objetos `Product` únicamente para
 * los 90 celulares aprobados por el dueño, usando exclusivamente:
 * - `V16-90-CELLPHONES-CANONICAL-MAPPING-FINAL.csv` (IDs canónicos reales
 *   reservados: `canonicalProductId` 1..90, `canonicalProductKey`
 *   `v16-cell:<id>`), y
 * - `V4.13-MIGRATION-SIMULATION.json` (evidencia legacy ya congelada, usada
 *   exclusivamente para `category`).
 *
 * Reglas duras respetadas:
 * - `Product.id` = `v16-cell:<canonicalProductId>` — nunca posición legacy,
 *   nunca nombre, nunca índice de array, nunca ID negativo del master,
 *   nunca placeholder.
 * - Posiciones 10 y 91 (revisión manual, excluidas por decisión del dueño)
 *   no aparecen en la evidencia fuente de este adapter.
 * - Las imágenes se materializan desde `public.celulares_lista` en lectura,
 *   sin activar estos productos públicamente. Precio, financiación, stock,
 *   disponibilidad, features, descripción, garantía y proveedor quedan
 *   nullable/unknown/vacío ya soportado
 *   por el contrato `Product` — nada se inventa.
 * - Las fotos existentes se enlazan desde el banco histórico de celulares
 *   read-only; esto NO activa visibilidad pública.
 * - No se escribe Supabase, no se lee ninguna credencial.
 *
 * NO ACTIVACIÓN: este archivo no se importa desde `lib/catalog/index.ts`
 * ni desde ningún componente de Home/Storefront/rutas públicas. Es
 * deliberadamente inalcanzable desde la app en ejecución; solo se
 * instancia desde tests dedicados de este gate.
 *
 * Rollback: eliminar este archivo y
 * `fixtures/v16-90-cellphones-materialized.json`. `lib/catalog/index.ts`
 * y `lib/catalog/types.ts` (salvo el literal agregado a `CatalogSource`,
 * también reversible sin efecto porque nada lo consume) no requieren
 * ningún otro cambio para revertir.
 */

const rowSchema = z.object({
  legacyPosition: z.number().int().nonnegative(),
  legacyCellphoneKey: z.string().trim().min(1),
  canonicalProductId: z.number().int().positive(),
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1).nullable(),
  category: z.string().trim().min(1),
  image: z.string().url().startsWith("https://"),
  photoReviewStatus: z.enum(["source-mapping-verified","needs-human-visual-review"]),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("v16_cellphones_90_materialized_local"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  products: z.array(rowSchema).length(90),
  photo_materialization: z.object({
    status: z.literal("complete"),
    count: z.literal(90),
    source_write: z.literal(false),
    public_activation: z.literal(false),
  }).strict(),
  photo_review: z.object({
    status: z.literal("pending-human-review"),
    source_mapping_verified_count: z.number().int().nonnegative(),
    needs_human_visual_review_count: z.number().int().nonnegative(),
    flagged_canonical_product_ids: z.array(z.number().int().positive()),
    visibility_changed: z.literal(false),
    note: z.string().min(1),
  }).strict(),
}).strict();

const parsedEvidence = evidenceSchema.parse(evidence);

const EXCLUDED_LEGACY_POSITIONS = new Set([10, 91]);

for (const row of parsedEvidence.products) {
  if (EXCLUDED_LEGACY_POSITIONS.has(row.legacyPosition)) {
    throw new Error(`v16-cellphones-90-materialized-adapter: posición excluida ${row.legacyPosition} presente en la evidencia`);
  }
  if (!/^v16-cell:\d+$/.test(row.id)) {
    throw new Error(`v16-cellphones-90-materialized-adapter: id con formato inválido: ${row.id}`);
  }
}

const idSet = new Set(parsedEvidence.products.map((row) => row.id));
if (idSet.size !== parsedEvidence.products.length) {
  throw new Error("v16-cellphones-90-materialized-adapter: canonicalProductId/id duplicado detectado");
}
const canonicalIdSet = new Set(parsedEvidence.products.map((row) => row.canonicalProductId));
if (canonicalIdSet.size !== parsedEvidence.products.length) {
  throw new Error("v16-cellphones-90-materialized-adapter: canonicalProductId duplicado detectado");
}
const keySet = new Set(parsedEvidence.products.map((row) => row.legacyCellphoneKey));
if (keySet.size !== parsedEvidence.products.length) {
  throw new Error("v16-cellphones-90-materialized-adapter: legacyCellphoneKey duplicado detectado");
}
const slugSet = new Set(parsedEvidence.products.map((row) => row.slug));
if (slugSet.size !== parsedEvidence.products.length) {
  throw new Error("v16-cellphones-90-materialized-adapter: slug duplicado detectado");
}

function freezeProduct(product: Product) {
  Object.freeze(product.features);
  Object.freeze(product.specifications);
  Object.freeze(product.stock);
  if (product.image) Object.freeze(product.image);
  if (product.price) Object.freeze(product.price);
  Object.freeze(product.financing);
  return Object.freeze(product);
}

const products = Object.freeze(parsedEvidence.products.map((row): Product => freezeProduct({
  id: row.id,
  slug: row.slug,
  name: row.name,
  brand: row.brand,
  model: row.model,
  category: row.category,
  subcategory: null,
  image: { src: row.image, alt: row.name },
  price: null,
  financing: [],
  availability: "unknown",
  stock: {
    status: "unknown",
    quantity: null,
    label: null,
  },
  features: [],
  specifications: {},
  description: null,
  warranty: null,
  visible: false,
  source: "v16-cellphones-90-materialized",
})));

export const v16Cellphones90MaterializedEvidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productionCatalogVerified: parsedEvidence.production_catalog_verified,
  capturedAt: parsedEvidence.captured_at,
  productCount: products.length,
  canonicalProductIds: Object.freeze(parsedEvidence.products.map((row) => row.canonicalProductId).sort((a, b) => a - b)),
  photoReviewStatus: parsedEvidence.photo_review.status,
  sourceMappingVerifiedCount: parsedEvidence.photo_review.source_mapping_verified_count,
  needsHumanVisualReviewCount: parsedEvidence.photo_review.needs_human_visual_review_count,
  flaggedCanonicalProductIds: Object.freeze([...parsedEvidence.photo_review.flagged_canonical_product_ids]),
});

/**
 * `visible: false` en todos los registros por diseño: este adapter existe
 * únicamente para QA técnico de esta implementación. `listProducts` /
 * `getProductBySlug` exponen los 90 productos igual (son necesarios para
 * poder testear el adapter en aislamiento), pero al no estar conectado al
 * composite activo (`catalog` en index.ts), ningún componente de la app
 * en ejecución puede alcanzarlos.
 */
export class V16Cellphones90MaterializedCatalogAdapter implements CatalogAdapter {
  readonly source = "v16-cellphones-90-materialized" as const;

  async listProducts(query: CatalogQuery = {}) {
    const candidates = products.filter((product) => {
      if (query.category && product.category !== query.category) return false;
      if (query.subcategory && product.subcategory !== query.subcategory) return false;
      if (query.brand && product.brand.localeCompare(query.brand, "es", { sensitivity: "base" }) !== 0) return false;
      if (query.inStockOnly && product.stock.status !== "in_stock") return false;
      if (query.maxPrice !== undefined && Number.isFinite(query.maxPrice)) {
        if (!product.price || product.price.amount > query.maxPrice) return false;
      }
      return true;
    });
    return rankProductsForSearch(candidates, query.search ?? "");
  }

  async getProductBySlug(slug: string) {
    return products.find((product) => product.slug === slug) ?? null;
  }
}

export const v16Cellphones90MaterializedProducts = products;
