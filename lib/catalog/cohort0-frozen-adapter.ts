import evidence from "@/fixtures/v16-real-catalog-cohort-0-frozen.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

/**
 * V16 REAL CATALOG COHORT 0 — SAFE INTEGRATION GATE.
 *
 * Adaptador aislado y eliminable. Consume exclusivamente la evidencia
 * congelada entregada para los 9 IDs de Cohort 0 (reconciliación LIVE
 * read-only del Control Maestro contra Supabase real). Claude Code no
 * ejecuta ninguna consulta contra Supabase: no dispone de credenciales.
 *
 * Reglas duras respetadas:
 * - Ningún dato inventado: nombre, marca, categoría, precio y proveedor
 *   provienen literalmente de la evidencia entregada.
 * - `image` es siempre `null`: no se recibió URL pública real de Storage,
 *   solo la ruta del objeto (documental). Un `null` es un estado válido
 *   del contrato Product V16 — se prefiere null antes que inventar una URL.
 * - `financing`, `features`, `specifications`, `description`, `warranty`:
 *   no hay evidencia -> valores vacíos/null, nunca inventados.
 *
 * Rollback: eliminar este archivo, `fixtures/v16-real-catalog-cohort-0-frozen.json`
 * y revertir `lib/catalog/index.ts` a `new V411AuditedPilotCatalogAdapter()`.
 */

const rowSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().min(1).nullable(),
  sale: z.number().finite().positive(),
  provider: z.string().trim().min(1),
  provider_stock: z.number().int().positive(),
  storage_object: z.string().trim().min(1),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("cohort_0_frozen_handoff"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(false),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  products: z.array(rowSchema).min(1),
}).strict();

const parsedEvidence = evidenceSchema.parse(evidence);

const combiningMarksPattern = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g");

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

const products = Object.freeze(parsedEvidence.products.map((row): Product => freezeProduct({
  id: `cohort0:${row.id}`,
  slug: `${slugPart(row.name)}-cohort0-${slugPart(row.id)}`,
  name: row.name,
  brand: row.brand,
  model: null,
  category: row.category,
  subcategory: row.subcategory,
  image: null,
  price: { amount: row.sale, currency: "ARS" },
  financing: [],
  availability: "available",
  stock: {
    status: "in_stock",
    quantity: row.provider_stock,
    label: `Stock del proveedor: ${row.provider_stock} unidad${row.provider_stock === 1 ? "" : "es"}`,
  },
  features: [],
  specifications: { Proveedor: row.provider },
  description: null,
  warranty: null,
  visible: true,
  source: "cohort-0-frozen-evidence",
})));

export const cohort0CatalogEvidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productionCatalogVerified: parsedEvidence.production_catalog_verified,
  capturedAt: parsedEvidence.captured_at,
  productCount: products.length,
});

export class Cohort0FrozenCatalogAdapter implements CatalogAdapter {
  readonly source = "cohort-0-frozen-evidence" as const;

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

export const cohort0Products = products;
