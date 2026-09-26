export const ADVISOR_COMPENSATION_VERSION = "2026-09-26-fixed-financed-plus-monthly-bonus" as const;

export interface FinancedCommissionTier {
  minCashPriceArs: number;
  maxCashPriceArs: number | null;
  commissionArs: number;
}

export const ADVISOR_FINANCED_COMMISSION_TIERS: readonly FinancedCommissionTier[] = Object.freeze([
  Object.freeze({ minCashPriceArs: 0, maxCashPriceArs: 49_999, commissionArs: 7_500 }),
  Object.freeze({ minCashPriceArs: 50_000, maxCashPriceArs: 99_999, commissionArs: 12_000 }),
  Object.freeze({ minCashPriceArs: 100_000, maxCashPriceArs: 149_999, commissionArs: 16_000 }),
  Object.freeze({ minCashPriceArs: 150_000, maxCashPriceArs: 199_999, commissionArs: 20_000 }),
  Object.freeze({ minCashPriceArs: 200_000, maxCashPriceArs: 249_999, commissionArs: 24_000 }),
  Object.freeze({ minCashPriceArs: 250_000, maxCashPriceArs: 299_999, commissionArs: 28_000 }),
  Object.freeze({ minCashPriceArs: 300_000, maxCashPriceArs: 399_999, commissionArs: 37_500 }),
  Object.freeze({ minCashPriceArs: 400_000, maxCashPriceArs: 499_999, commissionArs: 45_000 }),
  Object.freeze({ minCashPriceArs: 500_000, maxCashPriceArs: 599_999, commissionArs: 52_500 }),
  Object.freeze({ minCashPriceArs: 600_000, maxCashPriceArs: 699_999, commissionArs: 60_000 }),
  Object.freeze({ minCashPriceArs: 700_000, maxCashPriceArs: 799_999, commissionArs: 70_000 }),
  Object.freeze({ minCashPriceArs: 800_000, maxCashPriceArs: 899_999, commissionArs: 80_000 }),
  Object.freeze({ minCashPriceArs: 900_000, maxCashPriceArs: 999_999, commissionArs: 90_000 }),
  Object.freeze({ minCashPriceArs: 1_000_000, maxCashPriceArs: null, commissionArs: 100_000 }),
]);

export const ADVISOR_MONTHLY_BONUS_MILESTONES = Object.freeze([
  Object.freeze({ equivalentSales: 5, bonusArs: 10_000 }),
  Object.freeze({ equivalentSales: 10, bonusArs: 35_000 }),
  Object.freeze({ equivalentSales: 15, bonusArs: 65_000 }),
  Object.freeze({ equivalentSales: 20, bonusArs: 100_000 }),
]);

export const ADVISOR_MONTHLY_BONUS_AFTER_20_AR = 7_500;
export const ADVISOR_SMALL_PRODUCT_THRESHOLD_AR = 50_000;

function finiteNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and non-negative`);
  return value;
}

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be positive`);
  return value;
}

export interface AdvisorCommissionQuote {
  kind: "cash_percent" | "financed_fixed_tier";
  cashPriceArs: number;
  commissionArs: number;
  paymentCount: 1 | 2;
  paymentArs: readonly number[];
  percent: number | null;
  tier: FinancedCommissionTier | null;
}

function splitWholePesos(totalArs: number, paymentCount: number) {
  if (!Number.isInteger(totalArs) || totalArs < 0) throw new RangeError("totalArs must be non-negative whole pesos");
  const base = Math.floor(totalArs / paymentCount);
  const payments = Array.from({ length: paymentCount }, () => base);
  payments[payments.length - 1] += totalArs - base * paymentCount;
  return Object.freeze(payments);
}

export function financedCommissionTierForCashPrice(cashPriceArs: number): FinancedCommissionTier {
  positive(cashPriceArs, "cashPriceArs");
  const cashPriceWhole = Math.round(cashPriceArs);
  const tier = ADVISOR_FINANCED_COMMISSION_TIERS.find((candidate) =>
    cashPriceWhole >= candidate.minCashPriceArs
    && (candidate.maxCashPriceArs === null || cashPriceWhole <= candidate.maxCashPriceArs)
  );
  if (!tier) throw new Error("No financed advisor commission tier matched the definitive cash price");
  return tier;
}

export function quoteFinancedAdvisorCommission(cashPriceArs: number): AdvisorCommissionQuote {
  const tier = financedCommissionTierForCashPrice(cashPriceArs);
  return Object.freeze({
    kind: "financed_fixed_tier",
    cashPriceArs,
    commissionArs: tier.commissionArs,
    paymentCount: 2,
    paymentArs: splitWholePesos(tier.commissionArs, 2),
    percent: null,
    tier,
  });
}

export function quoteCashAdvisorCommission(cashPriceArs: number, percent = 10): AdvisorCommissionQuote {
  positive(cashPriceArs, "cashPriceArs");
  finiteNonNegative(percent, "percent");
  const commissionArs = Math.round(cashPriceArs * percent / 100);
  return Object.freeze({
    kind: "cash_percent",
    cashPriceArs,
    commissionArs,
    paymentCount: 1,
    paymentArs: Object.freeze([commissionArs]),
    percent,
    tier: null,
  });
}

export function equivalentSaleUnitsForCashPrice(cashPriceArs: number) {
  positive(cashPriceArs, "cashPriceArs");
  return cashPriceArs < ADVISOR_SMALL_PRODUCT_THRESHOLD_AR ? 0.5 : 1;
}

export interface AdvisorSaleBonusEligibilityInput {
  saleId: string;
  cashPriceArs: number;
  financed: boolean;
  validPayment: boolean;
  delivered: boolean;
  cancelled: boolean;
  installmentsCurrent?: boolean | null;
}

export interface AdvisorSaleBonusEvaluation extends AdvisorSaleBonusEligibilityInput {
  equivalentSales: number;
  eligible: boolean;
  status: "VALID" | "PENDING_VALID_PAYMENT" | "PENDING_DELIVERY" | "FINANCED_ARREARS" | "CANCELLED";
  reason: string;
}

export function evaluateAdvisorSaleForMonthlyBonus(input: AdvisorSaleBonusEligibilityInput): AdvisorSaleBonusEvaluation {
  positive(input.cashPriceArs, "cashPriceArs");
  const equivalentSales = equivalentSaleUnitsForCashPrice(input.cashPriceArs);

  if (input.cancelled) return Object.freeze({ ...input, equivalentSales: 0, eligible: false, status: "CANCELLED", reason: "Operación cancelada" });
  if (!input.validPayment) return Object.freeze({ ...input, equivalentSales: 0, eligible: false, status: "PENDING_VALID_PAYMENT", reason: "Pendiente de pago válido" });
  if (!input.delivered) return Object.freeze({ ...input, equivalentSales: 0, eligible: false, status: "PENDING_DELIVERY", reason: "Pendiente de entrega" });
  if (input.financed && input.installmentsCurrent !== true) {
    return Object.freeze({ ...input, equivalentSales: 0, eligible: false, status: "FINANCED_ARREARS", reason: "Financiado con cuotas no verificadas al día" });
  }
  return Object.freeze({ ...input, equivalentSales, eligible: true, status: "VALID", reason: "Cuenta para el premio mensual" });
}

export function monthlyBonusForEquivalentSales(equivalentSales: number) {
  finiteNonNegative(equivalentSales, "equivalentSales");
  if (equivalentSales < 5) return 0;
  if (equivalentSales < 10) return 10_000;
  if (equivalentSales < 15) return 35_000;
  if (equivalentSales < 20) return 65_000;
  const completedExtraSales = Math.floor(equivalentSales - 20);
  return 100_000 + completedExtraSales * ADVISOR_MONTHLY_BONUS_AFTER_20_AR;
}

export interface AdvisorMonthlyProgress {
  equivalentSales: number;
  bonusArs: number;
  achievedMilestone: number;
  nextTarget: number | null;
  nextBonusArs: number | null;
  remainingEquivalentSales: number;
  progressPercent: number;
  extraSalesAfter20: number;
  extraBonusAfter20Ars: number;
}

export function projectAdvisorMonthlyProgress(equivalentSales: number): AdvisorMonthlyProgress {
  finiteNonNegative(equivalentSales, "equivalentSales");
  const bonusArs = monthlyBonusForEquivalentSales(equivalentSales);
  const achieved = [...ADVISOR_MONTHLY_BONUS_MILESTONES].reverse().find((milestone) => equivalentSales >= milestone.equivalentSales);
  const next = ADVISOR_MONTHLY_BONUS_MILESTONES.find((milestone) => equivalentSales < milestone.equivalentSales);
  const extraSalesAfter20 = Math.max(0, Math.floor(equivalentSales - 20));
  const extraBonusAfter20Ars = extraSalesAfter20 * ADVISOR_MONTHLY_BONUS_AFTER_20_AR;

  if (!next) {
    const nextWholeEquivalent = Math.floor(equivalentSales) + 1;
    return Object.freeze({
      equivalentSales,
      bonusArs,
      achievedMilestone: achieved?.equivalentSales ?? 20,
      nextTarget: nextWholeEquivalent,
      nextBonusArs: 100_000 + Math.max(0, nextWholeEquivalent - 20) * ADVISOR_MONTHLY_BONUS_AFTER_20_AR,
      remainingEquivalentSales: Math.max(0, nextWholeEquivalent - equivalentSales),
      progressPercent: 100,
      extraSalesAfter20,
      extraBonusAfter20Ars,
    });
  }

  return Object.freeze({
    equivalentSales,
    bonusArs,
    achievedMilestone: achieved?.equivalentSales ?? 0,
    nextTarget: next.equivalentSales,
    nextBonusArs: next.bonusArs,
    remainingEquivalentSales: Math.max(0, next.equivalentSales - equivalentSales),
    progressPercent: Math.max(0, Math.min(100, Math.round(equivalentSales / next.equivalentSales * 100))),
    extraSalesAfter20,
    extraBonusAfter20Ars,
  });
}

export interface AdvisorMonthlySaleSnapshot extends AdvisorSaleBonusEligibilityInput {
  commissionPaidArs?: number;
}

export interface AdvisorMonthlyCompensationSummary {
  saleCount: number;
  validSaleCount: number;
  pendingSaleCount: number;
  equivalentSales: number;
  commissionGeneratedArs: number;
  commissionPaidArs: number;
  commissionPendingArs: number;
  bonus: AdvisorMonthlyProgress;
  evaluations: readonly AdvisorSaleBonusEvaluation[];
}

export function summarizeAdvisorMonth(sales: readonly AdvisorMonthlySaleSnapshot[], cashCommissionPercent = 10): AdvisorMonthlyCompensationSummary {
  const seen = new Set<string>();
  let equivalentSales = 0;
  let commissionGeneratedArs = 0;
  let commissionPaidArs = 0;
  const evaluations: AdvisorSaleBonusEvaluation[] = [];

  for (const sale of sales) {
    if (!sale.saleId.trim()) throw new Error("saleId is required");
    if (seen.has(sale.saleId)) throw new Error(`Duplicate advisor sale snapshot: ${sale.saleId}`);
    seen.add(sale.saleId);

    const evaluation = evaluateAdvisorSaleForMonthlyBonus(sale);
    evaluations.push(evaluation);
    if (evaluation.eligible) equivalentSales += evaluation.equivalentSales;

    const commission = sale.financed
      ? quoteFinancedAdvisorCommission(sale.cashPriceArs)
      : quoteCashAdvisorCommission(sale.cashPriceArs, cashCommissionPercent);
    commissionGeneratedArs += commission.commissionArs;
    commissionPaidArs += Math.max(0, Math.min(commission.commissionArs, Math.round(sale.commissionPaidArs ?? 0)));
  }

  const roundedEquivalent = Math.round(equivalentSales * 2) / 2;
  return Object.freeze({
    saleCount: sales.length,
    validSaleCount: evaluations.filter((row) => row.eligible).length,
    pendingSaleCount: evaluations.filter((row) => !row.eligible && row.status !== "CANCELLED").length,
    equivalentSales: roundedEquivalent,
    commissionGeneratedArs,
    commissionPaidArs,
    commissionPendingArs: commissionGeneratedArs - commissionPaidArs,
    bonus: projectAdvisorMonthlyProgress(roundedEquivalent),
    evaluations: Object.freeze(evaluations),
  });
}
