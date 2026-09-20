import fixture from "@/fixtures/amarango-os-product-bridge-v21-lab.json";
import { rankProductsForSearch } from "@/lib/catalog/search";
import type { CatalogAdapter, CatalogQuery, Product } from "@/lib/catalog/types";
import { ReadOnlyProductBridge, type AdministrativeProductFact } from "./product-bridge";

type LabRow = (typeof fixture)[number];

function toProduct(row: LabRow): Product {
  return Object.freeze({
    id: `os-lab:${row.id}`,
    slug: `os-lab-${row.id}`,
    name: row.name,
    brand: row.brand,
    model: row.model,
    category: row.category,
    subcategory: row.subcategory,
    image: row.image ? { src: row.image, alt: `${row.name} — fixture V2.1` } : null,
    price: { amount: row.sale, currency: "ARS" },
    financing: Object.freeze([]),
    availability: row.availability,
    stock: Object.freeze({
      status: row.availability === "available" ? "in_stock" : "unknown",
      quantity: null,
      label: row.stock,
    }),
    features: Object.freeze(row.memory ? [row.memory] : []),
    specifications: Object.freeze(row.memory ? { Memoria: row.memory } : {}),
    description: null,
    warranty: null,
    visible: row.visible === true,
    source: "mock",
  });
}

const labProducts = Object.freeze(fixture.map(toProduct));

class AmarangoOsLabCatalogAdapter implements CatalogAdapter {
  readonly source = "mock" as const;

  async listProducts(query: CatalogQuery = {}) {
    const filtered = labProducts.filter((product) => {
      if (product.visible !== true) return false;
      if (query.category && product.category !== query.category) return false;
      if (query.subcategory && product.subcategory !== query.subcategory) return false;
      if (query.brand && product.brand.toLowerCase() !== query.brand.toLowerCase()) return false;
      if (query.inStockOnly && product.stock.status !== "in_stock") return false;
      if (query.maxPrice !== undefined && product.price && product.price.amount > query.maxPrice) return false;
      return true;
    });
    return rankProductsForSearch(filtered, query.search ?? "");
  }

  async getProductBySlug(slug: string) {
    return labProducts.find((product) => product.slug === slug && product.visible === true) ?? null;
  }
}

const administrativeFacts: readonly AdministrativeProductFact[] = Object.freeze(fixture.map((row) => Object.freeze({
  productId: `os-lab:${row.id}`,
  costArs: row.cost,
  supplier: row.supplier,
  priceUpdatedAt: row.updated,
})));

/**
 * Fixture de integración recuperado de V2.1. No es catálogo productivo y no
 * contiene clientes ni credenciales. Cambiar el adaptador inyectado permitirá
 * usar el snapshot real sin modificar Amarango OS.
 */
export const amarangoOsLabProductBridge = new ReadOnlyProductBridge(
  new AmarangoOsLabCatalogAdapter(),
  administrativeFacts,
);
