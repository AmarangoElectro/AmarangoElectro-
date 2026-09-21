import evidence from "@/fixtures/v16-rest-others-sanitized-20260920.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

const rowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().nullable(),
  sale: z.number().positive(),
  category: z.enum(["descanso","hogar","electrodomesticos","deportes-movilidad","auto-motos-energia","smart-tv","otros"]),
  subcategory: z.enum(["colchones-y-sommiers","hogar-y-deco","blanqueria","bazar-y-mesa","pequenos-electrodomesticos","energia"]).nullable(),
  source_category: z.string().min(1),
  image: z.string().url().startsWith("https://").nullable(),
  availability: z.enum(["available","unavailable"]),
  visible: z.literal(true),
  features: z.string(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("sanitized_readonly_snapshot"),
  source_reference: z.string().min(1),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  safety: z.object({
    supabase_written: z.literal(false),
    provider_costs_included: z.literal(false),
    provider_identity_included: z.literal(false),
    public_fields_only: z.literal(true),
    storefront_taxonomy_modified: z.literal(false),
  }).strict(),
  products: z.array(rowSchema).min(1),
}).strict();

const parsed = evidenceSchema.parse(evidence);

function slugPart(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function featureList(value: string) {
  const clean = value.trim();
  if (!clean) return [];
  return clean.split(/\n|•|\|/g).map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

const products = Object.freeze(parsed.products.map((row): Product => Object.freeze({
  id: `v16-rest-others:${row.id}`,
  slug: `${slugPart(row.name)}-rest-others-${slugPart(row.id)}`,
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
    status: row.availability === "available" ? "in_stock" : "out_of_stock",
    quantity: null,
    label: row.availability === "available" ? "Disponible" : "Sin stock",
  },
  features: featureList(row.features),
  specifications: {},
  description: null,
  warranty: null,
  visible: true,
  source: "v16-rest-others-snapshot",
})));

export const v16RestOthersSnapshotEvidence = Object.freeze({
  status: parsed.evidence_status,
  sourceReference: parsed.source_reference,
  capturedAt: parsed.captured_at,
  productCount: products.length,
});

export class V16RestOthersSnapshotCatalogAdapter implements CatalogAdapter {
  readonly source = "v16-rest-others-snapshot" as const;

  async listProducts(query: CatalogQuery = {}) {
    const candidates = products.filter((product) => {
      if (query.visibleOnly && !product.visible) return false;
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
    return products.find((product) => product.visible && product.slug === slug) ?? null;
  }
}

export const v16RestOthersSnapshotProducts = products;
