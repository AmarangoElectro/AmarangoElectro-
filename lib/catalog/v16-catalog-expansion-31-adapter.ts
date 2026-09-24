import evidence from "@/fixtures/v16-catalog-expansion-31-20260924.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

const rowSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1).nullable(),
  category: z.literal("electrodomesticos"),
  subcategory: z.string().trim().min(1).nullable(),
  sale: z.number().finite().positive(),
  image: z.string().url().startsWith("https://"),
  availability: z.literal("available"),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("known_brand_same_category_catalog_expansion"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
        model: row.model,
        category: row.category,
        subcategory: row.subcategory,
        image: { src: row.image, alt: `${row.name} — AmarangoElectro` },
        price: { amount: row.sale, currency: "ARS" },
        financing: [],
        availability: row.availability,
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
        source: "v16-catalog-expansion-31",
      }),
  ),
);

export const v16CatalogExpansion31Evidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productCount: products.length,
});

export class V16CatalogExpansion31Adapter implements CatalogAdapter {
  readonly source = "v16-catalog-expansion-31" as const;

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
