import materialized from "@/fixtures/v16-90-cellphones-materialized.json";
import legacy from "@/fixtures/v413-legacy-cellphones-sanitized.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

/**
 * V16 — 90 CANONICAL CELLPHONES — PUBLIC SANITIZED ADAPTER.
 *
 * Une dos evidencias ya versionadas:
 * - identidad canónica: v16-90-cellphones-materialized.json
 * - precio/foto/colores públicos: v413-legacy-cellphones-sanitized.json
 *
 * Las posiciones 10 y 91 no existen en la cohorte canónica aprobada.
 * No consulta ni escribe Supabase. No expone costo, USD, proveedor,
 * markup ni campos privados.
 */

const materializedRowSchema = z.object({
  legacyPosition: z.number().int().nonnegative(),
  legacyCellphoneKey: z.string().trim().min(1),
  canonicalProductId: z.number().int().positive(),
  id: z.string().regex(/^v16-cell:\d+$/),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1).nullable(),
  category: z.literal("celulares"),
}).strict();

const materializedSchema = z.object({
  evidence_status: z.literal("v16_cellphones_90_materialized_local"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  products: z.array(materializedRowSchema).length(90),
}).strict();

const legacyPhoneSchema = z.object({
  legacyPosition: z.number().int().nonnegative(),
  name: z.string().trim().min(1),
  image: z.string().url().startsWith("https://"),
  colors: z.array(z.string()),
  features: z.string().optional(),
  cashPriceARS: z.number().finite().positive(),
}).passthrough();

const legacySchema = z.object({
  schemaVersion: z.string().min(1),
  source: z.string().min(1),
  capturedReadOnlyAt: z.string().min(1),
  recordCount: z.number().int().positive(),
  phones: z.array(legacyPhoneSchema).min(90),
}).passthrough();

const canonicalEvidence = materializedSchema.parse(materialized);
const publicEvidence = legacySchema.parse(legacy);
const legacyByPosition = new Map(publicEvidence.phones.map((row) => [row.legacyPosition, row]));

const EXCLUDED_LEGACY_POSITIONS = new Set([10, 91]);

function deriveSubcategory(brand: string) {
  const normalized = brand.toLocaleLowerCase("es-AR");
  if (normalized === "apple") return "apple-iphone";
  if (normalized === "samsung") return "samsung";
  if (normalized === "motorola") return "motorola";
  if (normalized === "xiaomi" || normalized === "redmi") return "xiaomi";
  if (normalized === "infinix") return "infinix";
  if (normalized === "poco") return "poco";
  return null;
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

const products = Object.freeze(
  canonicalEvidence.products.map((row): Product => {
    if (EXCLUDED_LEGACY_POSITIONS.has(row.legacyPosition)) {
      throw new Error(`v16-cellphones-90-public: excluded position ${row.legacyPosition} found`);
    }
    const publicRow = legacyByPosition.get(row.legacyPosition);
    if (!publicRow) {
      throw new Error(`v16-cellphones-90-public: missing public row for position ${row.legacyPosition}`);
    }

    return freezeProduct({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      model: row.model,
      category: row.category,
      subcategory: deriveSubcategory(row.brand),
      image: { src: publicRow.image, alt: `${row.name} — AmarangoElectro` },
      price: { amount: publicRow.cashPriceARS, currency: "ARS" },
      financing: [],
      availability: "unknown",
      stock: {
        status: "unknown",
        quantity: null,
        label: "A confirmar",
      },
      features: publicRow.features?.trim() ? [publicRow.features.trim()] : [],
      specifications: publicRow.colors.length ? { Colores: publicRow.colors.join(", ") } : {},
      description: null,
      warranty: null,
      visible: true,
      source: "v16-cellphones-90-public",
    });
  }),
);

if (products.length !== 90) {
  throw new Error(`v16-cellphones-90-public: expected 90 products, got ${products.length}`);
}
if (new Set(products.map((product) => product.id)).size !== products.length) {
  throw new Error("v16-cellphones-90-public: duplicate canonical ids");
}
if (new Set(products.map((product) => product.slug)).size !== products.length) {
  throw new Error("v16-cellphones-90-public: duplicate slugs");
}

export const v16Cellphones90PublicEvidence = Object.freeze({
  canonicalSource: canonicalEvidence.source_reference,
  publicSource: publicEvidence.source,
  capturedAt: publicEvidence.capturedReadOnlyAt,
  productCount: products.length,
  excludedLegacyPositions: Object.freeze([...EXCLUDED_LEGACY_POSITIONS]),
});

export class V16Cellphones90PublicCatalogAdapter implements CatalogAdapter {
  readonly source = "v16-cellphones-90-public" as const;

  async listProducts(query: CatalogQuery = {}) {
    const candidates = products.filter((product) => {
      if (product.visible !== true) return false;
      if (query.category && product.category !== query.category) return false;
      if (query.subcategory && product.subcategory !== query.subcategory) return false;
      if (
        query.brand &&
        product.brand.localeCompare(query.brand, "es", { sensitivity: "base" }) !== 0
      ) {
        return false;
      }
      if (query.inStockOnly && product.stock.status !== "in_stock") return false;
      if (query.maxPrice !== undefined && Number.isFinite(query.maxPrice)) {
        if (!product.price || product.price.amount > query.maxPrice) return false;
      }
      return true;
    });

    return rankProductsForSearch(candidates, query.search ?? "");
  }

  async getProductBySlug(slug: string) {
    return products.find((product) => product.visible === true && product.slug === slug) ?? null;
  }
}

export const v16Cellphones90PublicProducts = products;
