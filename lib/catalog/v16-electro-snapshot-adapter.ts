import evidence from "@/fixtures/v16-electrodomesticos-sanitized-20260920.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

/**
 * V16 ELECTRODOMÉSTICOS — SANITIZED READ-ONLY SNAPSHOT.
 *
 * Copia pública y sanitizada del catálogo real autorizada por el owner.
 * Fuente: public.tienda_productos_incremental, leída sin escrituras.
 *
 * Exclusiones deliberadas:
 * - costo
 * - mayorista/proveedor
 * - stock de proveedor
 * - claves/códigos internos
 * - cualquier otro campo operativo privado
 *
 * La tienda legacy no se modifica. Este adaptador solo consume el fixture
 * versionado en esta rama y puede revertirse sin tocar Supabase.
 */

const subcategorySchema = z.enum([
  "refrigeracion",
  "climatizacion",
  "coccion",
  "lavado",
  "pequenos-electrodomesticos",
  "limpieza",
]);

const rowSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1).nullable(),
  category: z.literal("electrodomesticos"),
  subcategory: subcategorySchema,
  subcategory_title: z.string().trim().min(1),
  sale: z.number().finite().positive(),
  image: z.string().url().startsWith("https://").nullable(),
  availability: z.enum(["available", "unavailable"]),
  stock_label: z.string().trim().min(1),
  characteristics: z.string().trim().min(1).nullable(),
  source_category: z.string().trim().min(1),
  source_updated_at: z.string().trim().min(1),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("sanitized_readonly_snapshot"),
  source_reference: z.string().min(1),
  production_catalog_verified: z.literal(true),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_row_count: z.number().int().positive(),
  products: z.array(rowSchema).min(1),
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
        id: `electro:${row.id}`,
        slug: `${slugPart(row.name)}-electro-${slugPart(row.id)}`,
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
          label: row.stock_label,
        },
        features: [],
        specifications: {},
        description: row.characteristics,
        warranty: null,
        visible: true,
        source: "v16-electro-sanitized-snapshot",
      }),
  ),
);

export const v16ElectroSnapshotEvidence = Object.freeze({
  status: parsedEvidence.evidence_status,
  sourceReference: parsedEvidence.source_reference,
  productionCatalogVerified: parsedEvidence.production_catalog_verified,
  capturedAt: parsedEvidence.captured_at,
  productCount: products.length,
});

export class V16ElectroSnapshotCatalogAdapter implements CatalogAdapter {
  readonly source = "v16-electro-sanitized-snapshot" as const;

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

export const v16ElectroSnapshotProducts = products;
