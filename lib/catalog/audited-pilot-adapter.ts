import evidence from "@/fixtures/v411-catalog-evidence-public.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

const rowSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1).nullable(),
  memory: z.string().trim().min(1).nullable(),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().min(1).nullable(),
  sale: z.number().finite().positive(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stock_label: z.string().trim().min(1).nullable(),
  availability: z.enum(["available", "unavailable", "unknown"]),
  visible: z.literal(true),
  image: z.string().url().startsWith("https://").nullable(),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("laboratory_snapshot_only"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  products: z.array(rowSchema).min(1),
}).strict();

const parsedEvidence = evidenceSchema.parse(evidence);

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

const products = Object.freeze(parsedEvidence.products.map((row): Product => freezeProduct({
  id: `v411-evidence:${row.id}`,
  slug: `${slugPart(row.name)}-${slugPart(row.id)}`,
  name: row.name,
  brand: row.brand,
  model: row.model,
  category: row.category,
  subcategory: row.subcategory,
  image: row.image ? { src: row.image, alt: `${row.name} — AmarangoElectro` } : null,
  price: { amount: row.sale, currency: "ARS" },
  financing: [],
  availability: row.availability,
  stock: {
    status: row.availability === "available" ? "in_stock" : row.availability === "unavailable" ? "out_of_stock" : "unknown",
    quantity: null,
    label: row.stock_label,
  },
  features: row.memory ? [row.memory] : [],
  specifications: row.memory ? { Memoria: row.memory } : {},
  description: null,
  warranty: null,
  visible: true,
  source: "v411-audit-fixture",
})));

export const v411CatalogEvidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productionCatalogVerified: parsedEvidence.production_catalog_verified,
  capturedAt: parsedEvidence.captured_at,
  productCount: products.length,
});

/**
 * Gate offline V4.11. Consume una evidencia sanitizada y validada, sin red,
 * credenciales ni métodos de escritura. No se presenta como snapshot productivo.
 */
export class V411AuditedPilotCatalogAdapter implements CatalogAdapter {
  readonly source = "v411-audit-fixture" as const;

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

export const v411PilotProducts = products;
