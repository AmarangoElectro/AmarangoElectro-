import {
  markupForCost,
  quoteInstallmentPlan,
  quoteSaleFromCost,
  roundTo,
  type CommercePolicy,
  type InstallmentQuote,
  type SaleQuote,
} from "./calculator-engine";
import { AMARANGO_CURRENT_POLICY } from "./amarango-policy";

export interface AmarangoCalculatorInput {
  mode: "cost_ars" | "sale_ars" | "cost_usd";
  amount: number;
  fxRate?: number;
  manualMarkupPercent?: number;
  discountPercent?: 0 | 10 | 15;
  installmentPlans?: readonly number[];
}

export interface AmarangoCalculatorQuote {
  policyVersion: string;
  inputMode: AmarangoCalculatorInput["mode"];
  originalAmount: number;
  costArs: number;
  costUsd: number | null;
  fxRate: number | null;
  saleBeforeDiscount: number;
  salePrice: number;
  markupPercent: number;
  discountPercent: number;
  grossMarginArs: number;
  installments: readonly InstallmentQuote[];
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be positive`);
  return value;
}

export function estimateCostFromSale(
  salePrice: number,
  policy: CommercePolicy = AMARANGO_CURRENT_POLICY,
): SaleQuote {
  positive(salePrice, "salePrice");
  for (const tier of policy.pricingTiers) {
    const candidate = salePrice / (1 + tier.markupPercent / 100);
    if (tier.maxCost === null || candidate <= tier.maxCost) {
      return {
        cost: Math.round(candidate),
        salePrice: roundTo(salePrice, policy.rounding.sale),
        markupPercent: tier.markupPercent,
      };
    }
  }
  const fallbackMarkup = markupForCost(salePrice / 1.3, policy);
  return {
    cost: Math.round(salePrice / (1 + fallbackMarkup / 100)),
    salePrice: roundTo(salePrice, policy.rounding.sale),
    markupPercent: fallbackMarkup,
  };
}

export function quoteAmarangoCalculator(
  input: AmarangoCalculatorInput,
  policy: CommercePolicy = AMARANGO_CURRENT_POLICY,
  policyVersion = "2026-07-19",
): AmarangoCalculatorQuote {
  positive(input.amount, "amount");
  let costArs: number;
  let costUsd: number | null = null;
  let fxRate: number | null = null;
  let baseQuote: SaleQuote;

  if (input.mode === "cost_usd") {
    fxRate = positive(input.fxRate ?? 0, "fxRate");
    costUsd = input.amount;
    costArs = Math.round(costUsd * fxRate);
    baseQuote = quoteSaleFromCost(costArs, policy, input.manualMarkupPercent);
  } else if (input.mode === "sale_ars") {
    baseQuote = estimateCostFromSale(input.amount, policy);
    costArs = baseQuote.cost;
  } else {
    costArs = input.amount;
    baseQuote = quoteSaleFromCost(costArs, policy, input.manualMarkupPercent);
  }

  const saleBeforeDiscount = baseQuote.salePrice;
  const discountPercent = input.discountPercent ?? 0;
  const salePrice = discountPercent > 0
    ? roundTo(saleBeforeDiscount * (1 - discountPercent / 100), policy.rounding.sale)
    : saleBeforeDiscount;
  const selectedPlans = input.installmentPlans ?? policy.installmentPlans.filter((plan) => plan.active).map((plan) => plan.installments);
  const installments = selectedPlans.map((count) => quoteInstallmentPlan(salePrice, count, policy));

  return Object.freeze({
    policyVersion,
    inputMode: input.mode,
    originalAmount: input.amount,
    costArs,
    costUsd,
    fxRate,
    saleBeforeDiscount,
    salePrice,
    markupPercent: baseQuote.markupPercent,
    discountPercent,
    grossMarginArs: salePrice - costArs,
    installments: Object.freeze(installments),
  });
}
