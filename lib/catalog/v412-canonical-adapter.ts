import { z } from "zod";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";
import { v412StableSlug } from "./v412-source-contract";

const v412SnapshotProductSchema = z.object({
  stableId: z.string().regex(/^-?\d+$/),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  brandEvidence: z.string().trim().min(1),
  model: z.string().trim().min(1).nullable(),
  memory: z.string().trim().min(1).nullable(),
  sourceCategory: z.string().trim().min(1),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().min(1).nullable(),
  image: z.string().url().startsWith("https://"),
  cashPriceARS: z.number().finite().positive(),
  financing: z.array(z.never()).max(0),
  availability: z.enum(["available", "unavailable", "unknown"]),
  visibility: z.literal("visible"),
  updatedAt: z.string().datetime({ offset: true }),
}).strict();

const v412SnapshotSchema = z.object({
  evidence_status: z.literal("production_readonly_sanitized_snapshot"),
  canonical_master: z.literal("tienda_catalogo/catalogo"),
  incremental_read_model: z.literal("tienda_productos_incremental"),
  production_write_enabled: z.literal(false),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selection_policy: z.string().trim().min(1),
  excluded_sources: z.tuple([
    z.literal("celulares_lista/lista"),
    z.literal("productos"),
  ]),
  products: z.array(v412SnapshotProductSchema).length(25),
}).strict();

export interface V412CanonicalProduct extends Product {
  readonly stableId: string;
  readonly sourceCategory: string;
  readonly brandEvidence: string;
  readonly updatedAt: string;
}

export interface V412SanitizedSnapshot {
  evidence_status: "production_readonly_sanitized_snapshot";
  canonical_master: "tienda_catalogo/catalogo";
  incremental_read_model: "tienda_productos_incremental";
  production_write_enabled: false;
  captured_at: string;
  selection_policy: string;
  excluded_sources: ["celulares_lista/lista", "productos"];
  products: unknown[];
}

function freezeProduct(product: V412CanonicalProduct) {
  Object.freeze(product.features);
  Object.freeze(product.specifications);
  Object.freeze(product.stock);
  if (product.image) Object.freeze(product.image);
  if (product.price) Object.freeze(product.price);
  Object.freeze(product.financing);
  return Object.freeze(product);
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

export function parseV412SanitizedSnapshot(input: unknown) {
  const snapshot = v412SnapshotSchema.parse(input);
  const products = snapshot.products.map((row): V412CanonicalProduct => freezeProduct({
    id: row.stableId,
    stableId: row.stableId,
    slug: v412StableSlug(row.stableId),
    name: row.name,
    brand: row.brand,
    brandEvidence: row.brandEvidence,
    model: row.model,
    category: row.category,
    subcategory: row.subcategory,
    sourceCategory: row.sourceCategory,
    image: { src: row.image, alt: `${row.name} — AmarangoElectro` },
    price: { amount: row.cashPriceARS, currency: "ARS" },
    financing: [],
    availability: row.availability,
    stock: {
      status: row.availability === "available" ? "in_stock" : row.availability === "unavailable" ? "out_of_stock" : "unknown",
      quantity: null,
      label: row.availability === "available" ? "Disponible" : row.availability === "unavailable" ? "Sin stock" : "Disponibilidad a confirmar",
    },
    features: row.memory ? [row.memory] : [],
    specifications: row.memory ? { Memoria: row.memory } : {},
    description: null,
    warranty: null,
    visible: true,
    source: "v412-canonical-audit",
    updatedAt: row.updatedAt,
  }));

  return Object.freeze({
    metadata: Object.freeze({
      evidenceStatus: snapshot.evidence_status,
      canonicalMaster: snapshot.canonical_master,
      incrementalReadModel: snapshot.incremental_read_model,
      productionWriteEnabled: snapshot.production_write_enabled,
      capturedAt: snapshot.captured_at,
      selectionPolicy: snapshot.selection_policy,
      excludedSources: Object.freeze([...snapshot.excluded_sources]),
      productCount: products.length,
    }),
    products: Object.freeze(products),
  });
}

/** Adaptador V4.12 de auditoría. No está activado en lib/catalog/index.ts. */
export class V412CanonicalCatalogAdapter implements CatalogAdapter {
  readonly source = "v412-canonical-audit" as const;

  constructor(private readonly products: readonly V412CanonicalProduct[]) {}

  async listProducts(query: CatalogQuery = {}) {
    const needle = normalizeSearch(query.search ?? "");
    return this.products.filter((product) => {
      if (product.visible !== true) return false;
      if (query.category && product.category !== query.category) return false;
      if (query.subcategory && product.subcategory !== query.subcategory) return false;
      if (query.brand && product.brand.localeCompare(query.brand, "es", { sensitivity: "base" }) !== 0) return false;
      if (query.inStockOnly && product.stock.status !== "in_stock") return false;
      if (query.maxPrice !== undefined && (!product.price || product.price.amount > query.maxPrice)) return false;
      if (needle) {
        const haystack = normalizeSearch([product.name, product.brand, product.model, product.category, product.subcategory].filter(Boolean).join(" "));
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }

  async getProductBySlug(slug: string) {
    return this.products.find((product) => product.visible === true && product.slug === slug) ?? null;
  }
}
