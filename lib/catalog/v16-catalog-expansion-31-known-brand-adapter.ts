import evidence from "@/fixtures/v16-catalog-expansion-31-known-brand.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

/**
 * V16 — 31 PRODUCT KNOWN-BRAND EXPANSION.
 *
 * Derived from the sanitized read-only catalog source.
 * Every row satisfies:
 * - publicationGate=true
 * - available
 * - mapped taxonomy
 * - usable image metadata, no image review
 * - brand literal appears in the product name
 * - the same brand already exists in the active V16 electro catalog
 *
 * No Supabase writes. No cost, supplier, USD, markup or private fields.
 */

const rowSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  category: z.literal("electrodomesticos"),
  subcategory: z.enum([
    "refrigeracion",
    "climatizacion",
    "lavado",
    "limpieza",
    "pequenos-electrodomesticos",
  ]),
  sale: z.number().finite().positive(),
  image: z.string().url().startsWith("https://"),
  availability: z.literal("available"),
  image_status: z.literal("usable_by_storage_metadata"),
  source_category: z.string().trim().min(1),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("literal_known_brand_same_category_expansion"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().min(1),
  selection_rule: z.string().min(1),
  product_count: z.literal(31),
  products: z.array(rowSchema).length(31),
}).strict();

const parsedEvidence = evidenceSchema.parse(evidence);

const combiningMarksPattern = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g",
);

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(combiningMarksPattern, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  parsedEvidence.products.map(
    (row): Product =>
      freezeProduct({
        id: `exp31:${row.id}`,
        slug: `${slugPart(row.name)}-exp31-${slugPart(row.id)}`,
        name: row.name,
        brand: row.brand,
        model: null,
        category: row.category,
        subcategory: row.subcategory,
        image: { src: row.image, alt: `${row.name} — AmarangoElectro` },
        price: { amount: row.sale, currency: "ARS" },
        financing: [],
        availability: "available",
        stock: {
          status: "in_stock",
          quantity: null,
          label: "Disponible",
        },
        features: [],
        specifications: {},
        description: null,
        warranty: null,
        visible: true,
        source: "v16-catalog-expansion-31-known-brand",
      }),
  ),
);

export const v16CatalogExpansion31Evidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productCount: products.length,
});

export class V16CatalogExpansion31KnownBrandAdapter implements CatalogAdapter {
  readonly source = "v16-catalog-expansion-31-known-brand" as const;

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

export const v16CatalogExpansion31Products = products;
