import evidence from "@/fixtures/v16-catalog-expansion-63-20260921.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

/**
 * V16 — 63 PRODUCT SANITIZED CATALOG EXPANSION.
 *
 * Fuente versionada y read-only derivada de la proyección estricta de 127
 * productos. Este lote contiene únicamente filas que no estaban ya
 * representadas por las fuentes activas del catálogo V16 al 2026-09-21.
 *
 * No consulta ni escribe Supabase. No contiene costo, proveedor, markup,
 * claves privadas ni stock interno. Las imágenes se conservan sólo cuando
 * el snapshot registró HTTP 200; de lo contrario se expone image=null.
 */

const rowSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().min(1).nullable(),
  sale: z.number().finite().positive(),
  image: z.string().url().startsWith("https://").nullable(),
  availability: z.enum(["available", "unknown"]),
  image_evidence_http_status: z.number().int().nullable(),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("strict_projection_catalog_expansion"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selection_rule: z.string().min(1),
  product_count: z.literal(63),
  products: z.array(rowSchema).length(63),
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
        id: `exp63:${row.id}`,
        slug: `${slugPart(row.name)}-exp63-${slugPart(row.id)}`,
        name: row.name,
        brand: row.brand,
        model: null,
        category: row.category,
        subcategory: row.subcategory,
        image: row.image ? { src: row.image, alt: `${row.name} — AmarangoElectro` } : null,
        price: { amount: row.sale, currency: "ARS" },
        financing: [],
        availability: row.availability,
        stock: {
          status: row.availability === "available" ? "in_stock" : "unknown",
          quantity: null,
          label: row.availability === "available" ? "Disponible" : "A confirmar",
        },
        features: [],
        specifications: {},
        description: null,
        warranty: null,
        visible: true,
        source: "v16-catalog-expansion-63",
      }),
  ),
);

export const v16CatalogExpansion63Evidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productionCatalogVerified: parsedEvidence.production_catalog_verified,
  capturedAt: parsedEvidence.captured_at,
  productCount: products.length,
});

export class V16CatalogExpansion63Adapter implements CatalogAdapter {
  readonly source = "v16-catalog-expansion-63" as const;

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

export const v16CatalogExpansion63Products = products;
