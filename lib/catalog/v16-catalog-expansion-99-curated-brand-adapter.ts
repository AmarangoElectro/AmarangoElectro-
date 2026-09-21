import evidence from "@/fixtures/v16-catalog-expansion-99-curated-brand.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

const rowSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().min(1).nullable(),
  sale: z.number().finite().positive(),
  image: z.string().url().startsWith("https://"),
  availability: z.literal("available"),
  image_status: z.literal("usable_by_storage_metadata"),
  source_category: z.string().trim().min(1),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("manually_curated_literal_brand_catalog_expansion"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().min(1),
  selection_rule: z.string().min(1),
  manual_taxonomy_corrections: z.array(z.record(z.string(), z.unknown())),
  product_count: z.literal(99),
  products: z.array(rowSchema).length(99),
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
        id: `exp99:${row.id}`,
        slug: `${slugPart(row.name)}-exp99-${slugPart(row.id)}`,
        name: row.name,
        brand: row.brand,
        model: null,
        category: row.category,
        subcategory: row.subcategory,
        image: { src: row.image, alt: `${row.name} — AmarangoElectro` },
        price: { amount: row.sale, currency: "ARS" },
        financing: [],
        availability: "available",
        stock: { status: "in_stock", quantity: null, label: "Disponible" },
        features: [],
        specifications: {},
        description: null,
        warranty: null,
        visible: true,
        source: "v16-catalog-expansion-99-curated-brand",
      }),
  ),
);

export const v16CatalogExpansion99Evidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productCount: products.length,
});

export class V16CatalogExpansion99CuratedBrandAdapter implements CatalogAdapter {
  readonly source = "v16-catalog-expansion-99-curated-brand" as const;

  async listProducts(query: CatalogQuery = {}) {
    const candidates = products.filter((product) => {
      if (product.visible !== true) return false;
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
    return products.find((product) => product.visible === true && product.slug === slug) ?? null;
  }
}

export const v16CatalogExpansion99Products = products;
