import type { CatalogAdapter, CatalogQuery, Product } from "./types";
import { rankProductsForSearch } from "./search";

// Datos de demostración heredados de V14. Los campos que no existen en la
// fuente permanecen explícitamente en null/unknown: V15 no inventa precios,
// stock, modelos, imágenes, financiación ni garantías.
const demoProducts: Product[] = [
  {
    id: "demo-iphone",
    slug: "iphone",
    name: "iPhone",
    brand: "Apple",
    model: null,
    category: "celulares",
    subcategory: "apple-iphone",
    image: null,
    price: null,
    financing: [],
    availability: "unknown",
    stock: { status: "unknown", quantity: null, label: null },
    features: ["iOS", "Cámara", "Ecosistema Apple"],
    specifications: {},
    description: "La experiencia Apple presentada de forma limpia y ordenada.",
    warranty: null,
    visible: true,
    source: "mock",
  },
  {
    id: "demo-samsung-galaxy-a",
    slug: "samsung-galaxy-a",
    name: "Samsung Galaxy A",
    brand: "Samsung",
    model: null,
    category: "celulares",
    subcategory: "samsung",
    image: null,
    price: null,
    financing: [],
    availability: "unknown",
    stock: { status: "unknown", quantity: null, label: null },
    features: ["Android", "Galaxy", "Autonomía"],
    specifications: {},
    description: "Una familia versátil para distintos usos y necesidades.",
    warranty: null,
    visible: true,
    source: "mock",
  },
  {
    id: "demo-motorola-moto-g",
    slug: "motorola-moto-g",
    name: "Motorola Moto G",
    brand: "Motorola",
    model: null,
    category: "celulares",
    subcategory: "motorola",
    image: null,
    price: null,
    financing: [],
    availability: "unknown",
    stock: { status: "unknown", quantity: null, label: null },
    features: ["Android", "Moto G", "Uso diario"],
    specifications: {},
    description: "Equipos pensados para acompañar el uso de todos los días.",
    warranty: null,
    visible: true,
    source: "mock",
  },
  {
    id: "demo-xiaomi-redmi",
    slug: "xiaomi-redmi",
    name: "Xiaomi Redmi",
    brand: "Xiaomi",
    model: null,
    category: "celulares",
    subcategory: "xiaomi",
    image: null,
    price: null,
    financing: [],
    availability: "unknown",
    stock: { status: "unknown", quantity: null, label: null },
    features: ["Android", "Redmi", "Pantalla"],
    specifications: {},
    description: "Una línea con alternativas para distintas necesidades.",
    warranty: null,
    visible: true,
    source: "mock",
  },
  {
    id: "demo-infinix",
    slug: "infinix",
    name: "Infinix",
    brand: "Infinix",
    model: null,
    category: "celulares",
    subcategory: "infinix",
    image: null,
    price: null,
    financing: [],
    availability: "unknown",
    stock: { status: "unknown", quantity: null, label: null },
    features: ["Android", "Diseño", "Batería"],
    specifications: {},
    description: "Alternativas presentadas con información clara.",
    warranty: null,
    visible: true,
    source: "mock",
  },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export class MockCatalogAdapter implements CatalogAdapter {
  readonly source = "mock" as const;

  async listProducts(query: CatalogQuery = {}) {
    const products = demoProducts.filter((product) => {
      if (!product.visible) return false;
      if (query.inStockOnly && product.stock.status !== "in_stock") return false;
      if (query.category && product.category !== query.category) return false;
      if (query.subcategory && product.subcategory !== query.subcategory) return false;
      if (query.brand && normalize(product.brand) !== normalize(query.brand)) return false;
      if (query.maxPrice !== undefined && Number.isFinite(query.maxPrice)) {
        if (product.price === null || product.price.amount > query.maxPrice) return false;
      }
      return true;
    });
    return rankProductsForSearch(products, query.search ?? "");
  }

  async getProductBySlug(slug: string) {
    return demoProducts.find((product) => product.slug === slug && product.visible) ?? null;
  }
}
