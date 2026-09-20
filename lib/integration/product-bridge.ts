import type { CatalogAdapter, Product } from "../catalog/types";
import { normalizeCatalogText } from "../catalog/search";
import { roleHasCapability, type InternalRole } from "../internal/auth/roles";

export interface ProductBridgeContext {
  role: InternalRole;
}

export interface AdministrativeProductFact {
  productId: string;
  costArs: number | null;
  supplier: string | null;
  priceUpdatedAt: string | null;
}

export type ProductSaleEligibility = "eligible" | "review_required" | "unavailable";

export interface ProductBridgeItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string | null;
  memory: string | null;
  category: string;
  subcategory: string | null;
  imageUrl: string | null;
  currentPriceArs: number | null;
  availability: Product["availability"];
  stockStatus: Product["stock"]["status"];
  stockQuantity: number | null;
  stockLabel: string | null;
  priceUpdatedAt: string | null;
  source: Product["source"];
  saleEligibility: ProductSaleEligibility;
  missingFields: readonly string[];
  administrative: Readonly<{
    costArs: number | null;
    supplier: string | null;
  }> | null;
}

export interface ProductBridgeReader {
  readonly mode: "read-only";
  list(context: Readonly<ProductBridgeContext>): Promise<readonly ProductBridgeItem[]>;
  search(query: string, context: Readonly<ProductBridgeContext>): Promise<readonly ProductBridgeItem[]>;
  getById(id: string, context: Readonly<ProductBridgeContext>): Promise<ProductBridgeItem | null>;
}

function extractMemory(product: Readonly<Product>) {
  const candidates = [
    product.model,
    product.name,
    ...product.features,
    ...Object.entries(product.specifications).flatMap(([key, value]) => [key, value]),
  ];
  for (const candidate of candidates) {
    const match = String(candidate ?? "").match(/\b(\d{1,4})\s?(GB|TB)\b/i);
    if (match) return `${match[1]} ${match[2].toUpperCase()}`;
  }
  return null;
}

function safeImageUrl(product: Readonly<Product>) {
  const source = product.image?.src?.trim();
  if (!source) return null;
  if (source.startsWith("/")) return source;
  try {
    return new URL(source).protocol === "https:" ? source : null;
  } catch {
    return null;
  }
}

function eligibility(product: Readonly<Product>, priceArs: number | null): ProductSaleEligibility {
  if (product.availability === "unavailable" || product.stock.status === "out_of_stock") return "unavailable";
  if (priceArs === null || product.availability === "unknown" || product.stock.status === "unknown") return "review_required";
  return "eligible";
}

function freezeBridgeItem(item: ProductBridgeItem) {
  Object.freeze(item.missingFields);
  if (item.administrative) Object.freeze(item.administrative);
  return Object.freeze(item);
}

function toBridgeItem(
  product: Readonly<Product>,
  context: Readonly<ProductBridgeContext>,
  administrativeFacts: ReadonlyMap<string, Readonly<AdministrativeProductFact>>,
) {
  const fact = administrativeFacts.get(product.id);
  const mayViewCost = roleHasCapability(context.role, "cost.view");
  const mayViewSupplier = roleHasCapability(context.role, "supplier.view");
  const priceArs = product.price?.currency === "ARS" && Number.isFinite(product.price.amount)
    ? product.price.amount
    : null;
  const imageUrl = safeImageUrl(product);
  const memory = extractMemory(product);
  const missingFields = [
    !product.model && "modelo",
    !memory && "memoria",
    !imageUrl && "foto",
    priceArs === null && "precio vigente ARS",
    !fact?.priceUpdatedAt && "fecha de precio",
  ].filter((value): value is string => Boolean(value));

  return freezeBridgeItem({
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    model: product.model,
    memory,
    category: product.category,
    subcategory: product.subcategory,
    imageUrl,
    currentPriceArs: priceArs,
    availability: product.availability,
    stockStatus: product.stock.status,
    stockQuantity: product.stock.quantity,
    stockLabel: product.stock.label,
    priceUpdatedAt: fact?.priceUpdatedAt ?? null,
    source: product.source,
    saleEligibility: eligibility(product, priceArs),
    missingFields: Object.freeze(missingFields),
    administrative: mayViewCost || mayViewSupplier
      ? {
          costArs: mayViewCost ? fact?.costArs ?? null : null,
          supplier: mayViewSupplier ? fact?.supplier ?? null : null,
        }
      : null,
  });
}

function tokens(value: unknown) {
  return normalizeCatalogText(value).split(" ").filter(Boolean);
}

function fieldScore(token: string, value: unknown, weight: number) {
  const fieldTokens = tokens(value);
  if (fieldTokens.includes(token)) return weight;
  if (/\d/.test(token)) return 0;
  if (token.length >= 3 && fieldTokens.some((candidate) => candidate.startsWith(token))) return Math.round(weight * 0.6);
  return 0;
}

/** Búsqueda pura para la UI del OS. No registra consultas ni modifica el catálogo. */
export function searchProductBridgeItems(items: readonly ProductBridgeItem[], rawQuery: string) {
  const queryTokens = tokens(rawQuery);
  if (!queryTokens.length) return [...items];

  return items
    .map((item, index) => {
      const fields = [
        { value: item.name, weight: 4_000 },
        { value: item.model, weight: 3_600 },
        { value: item.memory, weight: 3_200 },
        { value: item.brand, weight: 2_800 },
        { value: item.category, weight: 1_200 },
        { value: item.subcategory, weight: 1_000 },
      ];
      let score = 0;
      for (const token of queryTokens) {
        const best = Math.max(...fields.map((field) => fieldScore(token, field.value, field.weight)));
        if (!best) return { item, index, score: 0 };
        score += best;
      }
      return { item, index, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

export class ReadOnlyProductBridge implements ProductBridgeReader {
  readonly mode = "read-only" as const;
  private readonly catalog: CatalogAdapter;
  private readonly administrativeFacts: ReadonlyMap<string, Readonly<AdministrativeProductFact>>;

  constructor(
    catalog: CatalogAdapter,
    facts: readonly Readonly<AdministrativeProductFact>[] = [],
  ) {
    this.catalog = catalog;
    this.administrativeFacts = new Map(facts.map((fact) => [fact.productId, Object.freeze({ ...fact })]));
  }

  async list(context: Readonly<ProductBridgeContext>) {
    const products = await this.catalog.listProducts({ visibleOnly: true });
    return Object.freeze(products
      .filter((product) => product.visible === true && Boolean(product.id?.trim()))
      .map((product) => toBridgeItem(product, context, this.administrativeFacts)));
  }

  async search(query: string, context: Readonly<ProductBridgeContext>) {
    return Object.freeze(searchProductBridgeItems(await this.list(context), query));
  }

  async getById(id: string, context: Readonly<ProductBridgeContext>) {
    return (await this.list(context)).find((item) => item.id === id) ?? null;
  }
}
