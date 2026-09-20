import type { Product } from "@/lib/catalog";

export type PurchaseIntent = "buy" | "installments" | "availability" | "delivery";

export interface PurchaseIntentProduct {
  productId: string;
  slug: string;
  product: string;
  brand: string;
  model: string | null;
  category: string;
  url: string;
  priceLabel: string | null;
  availabilityLabel: string | null;
  financingLabel: string | null;
  source: "amarango-v16";
}

export interface PurchaseIntentDraft {
  product: PurchaseIntentProduct;
  intent: PurchaseIntent;
  note: string;
}

export const PURCHASE_INTENT_EVENT = "amarango:purchase-intent";

const intentLabels: Record<PurchaseIntent, string> = {
  buy: "Quiero este producto",
  installments: "Quiero consultar cuotas",
  availability: "Quiero confirmar disponibilidad",
  delivery: "Quiero consultar la entrega",
};

function formatPrice(product: Product) {
  if (!product.price) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: product.price.currency,
    maximumFractionDigits: 0,
  }).format(product.price.amount);
}

export function buildPurchaseIntentProduct(product: Product, url: string): PurchaseIntentProduct {
  return {
    productId: product.id,
    slug: product.slug,
    product: product.name,
    brand: product.brand,
    model: product.model,
    category: product.category,
    url,
    priceLabel: formatPrice(product),
    availabilityLabel: product.stock.label,
    financingLabel: product.financing[0]?.label ?? null,
    source: "amarango-v16",
  };
}

export function announcePurchaseIntent(product: PurchaseIntentProduct) {
  window.dispatchEvent(
    new CustomEvent<PurchaseIntentProduct>(PURCHASE_INTENT_EVENT, {
      detail: product,
    }),
  );
}

export function intentLabel(intent: PurchaseIntent) {
  return intentLabels[intent];
}

export function buildPurchaseIntentSummary(draft: PurchaseIntentDraft) {
  const note = draft.note.trim();
  const lines = [
    `Hola, quiero consultar por ${draft.product.product}.`,
    `Interés: ${intentLabel(draft.intent)}.`,
    `Modelo: ${draft.product.model ?? "A confirmar"}.`,
    `Precio publicado: ${draft.product.priceLabel ?? "A confirmar"}.`,
    `Disponibilidad: ${draft.product.availabilityLabel ?? "A confirmar"}.`,
  ];

  if (draft.intent === "installments") {
    lines.push(`Financiación publicada: ${draft.product.financingLabel ?? "A confirmar"}.`);
  }
  if (note) lines.push(`Comentario: ${note}`);
  lines.push(`Producto: ${draft.product.url}`);
  return lines.join("\n");
}
