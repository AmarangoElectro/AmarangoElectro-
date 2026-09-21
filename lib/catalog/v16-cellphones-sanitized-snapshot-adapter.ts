import evidence from "@/fixtures/v413-legacy-cellphones-sanitized.json";
import { z } from "zod";
import { rankProductsForSearch } from "./search";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

/**
 * V16 — CELULARES SANITIZED SNAPSHOT — SAFE SMALL EXPANSION.
 *
 * Suma una cohorte chica y explícita de celulares con foto y precio
 * provenientes del snapshot sanitizado ya versionado en GitHub.
 *
 * No consulta ni escribe Supabase. No toca stock, costos, proveedor,
 * financiación ni datos privados.
 */

const phoneSchema = z.object({
  legacyPosition: z.number().int().nonnegative(),
  name: z.string().trim().min(1),
  image: z.string().url().startsWith("https://"),
  colors: z.array(z.string()),
  features: z.string().optional(),
  cashPriceARS: z.number().finite().positive(),
}).passthrough();

const evidenceSchema = z.object({
  schemaVersion: z.string().min(1),
  source: z.string().min(1),
  capturedReadOnlyAt: z.string().min(1),
  recordCount: z.number().int().positive(),
  phones: z.array(phoneSchema).min(1),
}).passthrough();

const parsedEvidence = evidenceSchema.parse(evidence);

const APPROVED_POSITIONS = new Set([0, 4, 16, 17, 44, 45]);

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function deriveBrand(name: string) {
  const normalized = name.toLocaleLowerCase("es-AR");
  if (normalized.includes("iphone")) return "Apple";
  if (normalized.includes("samsung")) return "Samsung";
  if (normalized.includes("moto")) return "Motorola";
  return "AmarangoElectro";
}

function deriveSubcategory(brand: string) {
  if (brand === "Apple") return "apple-iphone";
  if (brand === "Samsung") return "samsung";
  if (brand === "Motorola") return "motorola";
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
  parsedEvidence.phones
    .filter((row) => APPROVED_POSITIONS.has(row.legacyPosition))
    .map((row): Product => {
      const brand = deriveBrand(row.name);
      return freezeProduct({
        id: `cell-snapshot:${row.legacyPosition}`,
        slug: `${slugPart(row.name)}-cell-${row.legacyPosition}`,
        name: row.name,
        brand,
        model: null,
        category: "celulares",
        subcategory: deriveSubcategory(brand),
        image: { src: row.image, alt: `${row.name} — AmarangoElectro` },
        price: { amount: row.cashPriceARS, currency: "ARS" },
        financing: [],
        availability: "unknown",
        stock: {
          status: "unknown",
          quantity: null,
          label: "A confirmar",
        },
        features: row.features?.trim() ? [row.features.trim()] : [],
        specifications: row.colors.length ? { Colores: row.colors.join(", ") } : {},
        description: null,
        warranty: null,
        visible: true,
        source: "v16-cellphones-sanitized-snapshot",
      });
    }),
);

if (products.length !== APPROVED_POSITIONS.size) {
  throw new Error(
    `v16-cellphones-sanitized-snapshot-adapter: expected ${APPROVED_POSITIONS.size} products, got ${products.length}`,
  );
}

export const v16CellphonesSanitizedSnapshotEvidence = Object.freeze({
  sourceReference: parsedEvidence.source,
  capturedAt: parsedEvidence.capturedReadOnlyAt,
  productCount: products.length,
  positions: Object.freeze([...APPROVED_POSITIONS]),
});

export class V16CellphonesSanitizedSnapshotCatalogAdapter implements CatalogAdapter {
  readonly source = "v16-cellphones-sanitized-snapshot" as const;

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

export const v16CellphonesSanitizedSnapshotProducts = products;
