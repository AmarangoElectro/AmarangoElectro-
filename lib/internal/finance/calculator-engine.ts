export interface PricingTier {
  maxCost: number | null;
  markupPercent: number;
}

export interface InstallmentPlanPolicy {
  installments: number;
  surchargePercent: number;
  active: boolean;
}

export interface CommercePolicy {
  currency: "ARS";
  pricingTiers: readonly PricingTier[];
  installmentPlans: readonly InstallmentPlanPolicy[];
  commission: {
    cashPercent: number;
    financedPercent: number;
  };
  rounding: {
    sale: number;
    installment: number;
    commission: number;
  };
}

export interface SaleQuote {
  cost: number;
  salePrice: number;
  markupPercent: number;
}

export interface InstallmentQuote {
  installments: number;
  surchargePercent: number;
  basePrice: number;
  total: number;
  installmentAmount: number;
}

export interface CommissionQuote {
  basePrice: number;
  financed: boolean;
  percent: number;
  commission: number;
}

function positiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
  return value;
}

function nonNegativeFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number`);
  }
  return value;
}

export function roundTo(value: number, increment: number): number {
  if (!Number.isFinite(value)) throw new RangeError("value must be finite");
  positiveFinite(increment, "increment");
  return Math.round(value / increment) * increment;
}

export function validateCommercePolicy(policy: CommercePolicy): void {
  if (policy.currency !== "ARS") throw new Error("Only ARS is supported by V16 internal calculator foundation");
  if (!policy.pricingTiers.length) throw new Error("At least one pricing tier is required");
  if (!policy.installmentPlans.length) throw new Error("At least one installment plan is required");

  let previousMax = 0;
  let sawOpenEndedTier = false;
  for (const tier of policy.pricingTiers) {
    nonNegativeFinite(tier.markupPercent, "markupPercent");
    if (sawOpenEndedTier) throw new Error("No pricing tier may follow the open-ended tier");
    if (tier.maxCost === null) {
      sawOpenEndedTier = true;
      continue;
    }
    positiveFinite(tier.maxCost, "maxCost");
    if (tier.maxCost <= previousMax) throw new Error("pricing tiers must have strictly increasing maxCost values");
    previousMax = tier.maxCost;
  }
  if (!sawOpenEndedTier) throw new Error("Pricing policy requires a final open-ended tier");

  const seenPlans = new Set<number>();
  for (const plan of policy.installmentPlans) {
    if (!Number.isInteger(plan.installments) || plan.installments < 2) {
      throw new Error("Installment plans must use integer installment counts >= 2");
    }
    if (seenPlans.has(plan.installments)) throw new Error("Duplicate installment plan");
    seenPlans.add(plan.installments);
    nonNegativeFinite(plan.surchargePercent, "surchargePercent");
  }

  nonNegativeFinite(policy.commission.cashPercent, "cashPercent");
  nonNegativeFinite(policy.commission.financedPercent, "financedPercent");
  positiveFinite(policy.rounding.sale, "sale rounding");
  positiveFinite(policy.rounding.installment, "installment rounding");
  positiveFinite(policy.rounding.commission, "commission rounding");
}

export function markupForCost(cost: number, policy: CommercePolicy): number {
  positiveFinite(cost, "cost");
  validateCommercePolicy(policy);
  const tier = policy.pricingTiers.find((candidate) => candidate.maxCost === null || cost <= candidate.maxCost);
  if (!tier) throw new Error("No pricing tier matched the cost");
  return tier.markupPercent;
}

export function quoteSaleFromCost(
  cost: number,
  policy: CommercePolicy,
  manualMarkupPercent?: number,
): SaleQuote {
  positiveFinite(cost, "cost");
  validateCommercePolicy(policy);
  const markupPercent = manualMarkupPercent === undefined
    ? markupForCost(cost, policy)
    : nonNegativeFinite(manualMarkupPercent, "manualMarkupPercent");
  const salePrice = roundTo(cost * (1 + markupPercent / 100), policy.rounding.sale);
  return { cost, salePrice, markupPercent };
}

export function quoteInstallmentPlan(
  basePrice: number,
  installments: number,
  policy: CommercePolicy,
): InstallmentQuote {
  positiveFinite(basePrice, "basePrice");
  validateCommercePolicy(policy);
  const plan = policy.installmentPlans.find((candidate) => candidate.installments === installments && candidate.active);
  if (!plan) throw new Error(`Installment plan ${installments} is not active or does not exist`);
  const total = basePrice * (1 + plan.surchargePercent / 100);
  return {
    installments,
    surchargePercent: plan.surchargePercent,
    basePrice,
    total,
    installmentAmount: roundTo(total / installments, policy.rounding.installment),
  };
}

export function quoteAdvisorCommission(
  basePrice: number,
  financed: boolean,
  policy: CommercePolicy,
): CommissionQuote {
  positiveFinite(basePrice, "basePrice");
  validateCommercePolicy(policy);
  const percent = financed ? policy.commission.financedPercent : policy.commission.cashPercent;
  return {
    basePrice,
    financed,
    percent,
    commission: roundTo(basePrice * percent / 100, policy.rounding.commission),
  };
}

export interface InvestmentQuoteInput {
  cost: number;
  salePrice: number;
  firstCustomerPayment: number;
  deliveryCost?: number;
  firstCommissionPayment?: number;
}

export function quoteCapitalRequired(input: InvestmentQuoteInput): number {
  positiveFinite(input.cost, "cost");
  positiveFinite(input.salePrice, "salePrice");
  nonNegativeFinite(input.firstCustomerPayment, "firstCustomerPayment");
  const deliveryCost = nonNegativeFinite(input.deliveryCost ?? 0, "deliveryCost");
  const firstCommissionPayment = nonNegativeFinite(input.firstCommissionPayment ?? 0, "firstCommissionPayment");
  return Math.max(0, input.cost + deliveryCost + firstCommissionPayment - input.firstCustomerPayment);
}
