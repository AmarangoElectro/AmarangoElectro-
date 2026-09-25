import {
  markupForCost,
  quoteInstallmentPlan,
  roundTo,
  type CommercePolicy,
  type InstallmentQuote,
  type SaleQuote,
} from "./calculator-engine";
import { AMARANGO_CURRENT_POLICY } from "./amarango-policy";
import { quoteCoherentCashPrice } from "./coherent-pricing";

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
  markupPrice: number | null;
  coherenceFloor: number | null;
  coherenceApplied: boolean;
  coherentPrice: number | null;
  commercialTermination: number | null;
  commercialAdjustmentArs: number | null;
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be positive`);
  return value;
}

/**
 * Legacy helper kept only for compatibility with historical Plate "Venta" mode.
 * Authoritative V16 calculators no longer use reverse sale->cost inference.
 */
export function estimateCostFromSale(
  salePrice: number,
  policy: CommercePolicy = AMARANGO_CURRENT_POLICY,
): SaleQuote {
  positive(salePrice, "salePrice");
  for (const tier of policy.pricingTiers) {
    const candidate = salePrice / (1 + tier.markupPercent / 100);
    if (tier.maxCost === null || candidate < tier.maxCost) {
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
  let coherent = null as ReturnType<typeof quoteCoherentCashPrice> | null;

  if (input.mode === "cost_usd") {
    fxRate = positive(input.fxRate ?? 0, "fxRate");
    costUsd = input.amount;
    costArs = Math.round(costUsd * fxRate);
    coherent = quoteCoherentCashPrice(costArs);
    baseQuote = { cost: costArs, salePrice: coherent.commercialPrice, markupPercent: coherent.markupPercent };
  } else if (input.mode === "sale_ars") {
    baseQuote = estimateCostFromSale(input.amount, policy);
    costArs = baseQuote.cost;
  } else {
    costArs = input.amount;
    coherent = quoteCoherentCashPrice(costArs);
    baseQuote = { cost: costArs, salePrice: coherent.commercialPrice, markupPercent: coherent.markupPercent };
  }

  if (input.manualMarkupPercent !== undefined && coherent) {
    throw new Error("Authoritative cost calculators use the fixed Amarango markup ladder");
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
    markupPrice: coherent?.markupPrice ?? null,
    coherenceFloor: coherent?.coherenceFloor ?? null,
    coherenceApplied: coherent?.coherenceApplied ?? false,
    coherentPrice: coherent?.coherentPrice ?? null,
    commercialTermination: coherent?.commercialTermination ?? null,
    commercialAdjustmentArs: coherent?.commercialAdjustment ?? null,
  });
}
