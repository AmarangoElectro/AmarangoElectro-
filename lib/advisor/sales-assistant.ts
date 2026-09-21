import type { Product } from "@/lib/catalog/types";
import { getAdvisorFreshness } from "@/lib/catalog/advisor-freshness";

function money(amount: number | null | undefined) {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "A confirmar";
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
}

function installmentAmount(product: Product, count: number) {
  return product.financing.find((plan) => plan.installments === count)?.installmentAmount?.amount ?? null;
}

export type AdvisorProductBrief = {
  id: string;
  name: string;
  brand: string;
  model: string | null;
  cashPrice: string;
  installments: ReadonlyArray<{ count: number; amount: string }>;
  availability: string;
  priceFreshness: string;
  stockFreshness: string;
};

export function buildAdvisorProductBrief(product: Product, now = new Date()): AdvisorProductBrief {
  const freshness = getAdvisorFreshness(product, now);
  const availability = product.stock.status === "out_of_stock"
    ? "Sin stock"
    : freshness.verificationMode === "automatic"
      ? "Disponibilidad de fuente automática — validar al cerrar la venta"
      : "Disponibilidad a confirmar con Administración";

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    cashPrice: money(product.price?.amount),
    installments: [2, 4, 6].map((count) => ({
      count,
      amount: money(installmentAmount(product, count)),
    })),
    availability,
    priceFreshness: freshness.priceLabel,
    stockFreshness: freshness.stockLabel,
  };
}

export function buildAdvisorWhatsAppProposal(product: Product, now = new Date()) {
  const brief = buildAdvisorProductBrief(product, now);
  const model = brief.model ? ` · ${brief.model}` : "";
  const lines = [
    `*${brief.name}*`,
    brief.brand && brief.brand !== "Varios" ? `${brief.brand}${model}` : model.replace(/^ · /, ""),
    "",
    `Contado: *${brief.cashPrice}*`,
    ...brief.installments.map((plan) => `${plan.count} cuotas fijas de *${plan.amount}*`),
    "",
    brief.availability,
    brief.priceFreshness,
    "",
    "Consultame y te confirmo disponibilidad antes de cerrar el pedido.",
  ].filter(Boolean);

  return lines.join("\n");
}

export type AdvisorComparisonRow = {
  id: string;
  name: string;
  brand: string;
  model: string | null;
  cashPrice: string;
  twoPayments: string;
  fourPayments: string;
  sixPayments: string;
  availability: string;
  freshness: string;
};

export function compareAdvisorProducts(products: readonly Product[], now = new Date()): AdvisorComparisonRow[] {
  return products.slice(0, 3).map((product) => {
    const brief = buildAdvisorProductBrief(product, now);
    const byCount = new Map(brief.installments.map((plan) => [plan.count, plan.amount]));
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      model: product.model,
      cashPrice: brief.cashPrice,
      twoPayments: byCount.get(2) ?? "A confirmar",
      fourPayments: byCount.get(4) ?? "A confirmar",
      sixPayments: byCount.get(6) ?? "A confirmar",
      availability: brief.availability,
      freshness: brief.priceFreshness,
    };
  });
}

function alternativeScore(candidate: Product, selected: Product, now: Date) {
  let score = 0;
  if (candidate.category === selected.category) score += 50;
  if (candidate.subcategory && candidate.subcategory === selected.subcategory) score += 60;
  if (candidate.brand === selected.brand && selected.brand !== "Varios") score += 15;
  if (candidate.stock.status === "in_stock") score += 25;
  if (candidate.stock.status === "out_of_stock") score -= 100;

  const freshness = getAdvisorFreshness(candidate, now);
  if (freshness.priceDays !== null) {
    if (freshness.priceDays <= 3) score += 20;
    else if (freshness.priceDays <= 7) score += 12;
    else if (freshness.priceDays <= 14) score += 4;
    else score -= 5;
  }

  const selectedPrice = selected.price?.amount ?? null;
  const candidatePrice = candidate.price?.amount ?? null;
  if (selectedPrice && candidatePrice) {
    const distance = Math.abs(candidatePrice - selectedPrice) / selectedPrice;
    score += Math.max(0, 20 - Math.round(distance * 40));
  }

  return score;
}

export function rankAdvisorAlternatives(
  allProducts: readonly Product[],
  selected: Product,
  now = new Date(),
  max = 3,
) {
  return allProducts
    .filter((candidate) => candidate.id !== selected.id && candidate.visible)
    .filter((candidate) => candidate.category === selected.category)
    .map((candidate) => ({ product: candidate, score: alternativeScore(candidate, selected, now) }))
    .sort((a, b) => b.score - a.score || (a.product.price?.amount ?? Infinity) - (b.product.price?.amount ?? Infinity))
    .slice(0, Math.max(0, max));
}

/**
 * Advisor-safe by design: this module never reads cost, provider, supplier code
 * or internal margin fields. It operates only on the public Product contract
 * plus the sanitized freshness projection.
 */
export const advisorSalesAssistantContract = Object.freeze({
  maxComparisonProducts: 3,
  exposesProvider: false,
  exposesCost: false,
  exposesMargin: false,
  humanStockConfirmationStillRequired: true,
});
