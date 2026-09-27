import {
  ADVISOR_COMPENSATION_POLICY_VERSION,
  FINANCED_COMMISSION_PAYMENT_COUNT,
  FINANCED_COMMISSION_TIERS,
  LOW_VALUE_SALE_EQUIVALENCE,
  LOW_VALUE_SALE_THRESHOLD_ARS,
  MONTHLY_BONUS_AFTER_TWENTY_ARS,
  MONTHLY_BONUS_TIERS,
  STANDARD_SALE_EQUIVALENCE,
} from "./advisor-compensation-policy";

export type AdvisorSaleModality = "cash" | "financed";
export type AdvisorOperationValidation = "accepted" | "pending" | "excluded";
export type AdvisorCommissionPaymentStatus = "collected" | "pending";

export interface AdvisorCommissionQuote {
  readonly policyVersion: string;
  readonly modality: AdvisorSaleModality;
  readonly finalCashPriceArs: number;
  readonly calculation: "cash_percentage" | "financed_fixed_tier";
  readonly cashPercent: number | null;
  readonly totalCommissionArs: number;
  readonly paymentsArs: readonly number[];
}

export interface AdvisorOperationFacts {
  readonly saleId: string;
  readonly advisorId: string;
  readonly productLabel: string;
  readonly finalCashPriceArs: number;
  readonly modality: AdvisorSaleModality;
  readonly cancelled: boolean;
  readonly delivered: boolean;
  readonly paidAccordingToTerms: boolean | null;
  readonly financedCurrentAtClose: boolean | null;
  readonly commissionPaymentsCollected?: number;
}

export interface AdvisorOperationProjection {
  readonly saleId: string;
  readonly advisorId: string;
  readonly productLabel: string;
  readonly finalCashPriceArs: number;
  readonly modality: AdvisorSaleModality;
  readonly validation: AdvisorOperationValidation;
  readonly validationReason: string;
  readonly countsForBonus: boolean;
  readonly equivalentSales: number;
  readonly commission: AdvisorCommissionQuote;
  readonly commissionPayments: readonly {
    readonly part: number;
    readonly amountArs: number;
    readonly status: AdvisorCommissionPaymentStatus;
  }[];
  readonly commissionCollectedArs: number;
  readonly commissionPendingArs: number;
}

export interface AdvisorMonthlyBonusQuote {
  readonly equivalentSales: number;
  readonly bonusArs: number;
  readonly mainGoalReached: boolean;
  readonly additionalEquivalentSales: number;
  readonly additionalBonusArs: number;
  readonly nextGoalEquivalentSales: number | null;
  readonly nextGoalBonusArs: number | null;
  readonly remainingEquivalentSales: number;
  readonly progressPercent: number;
}

export interface AdvisorMonthClose {
  readonly policyVersion: string;
  readonly advisorId: string;
  readonly period: string;
  readonly closedAt: string;
  readonly operations: readonly AdvisorOperationProjection[];
  readonly validSales: number;
  readonly equivalentSales: number;
  readonly acceptedOperations: number;
  readonly pendingOperations: number;
  readonly excludedOperations: number;
  readonly commissionGeneratedArs: number;
  readonly commissionCollectedArs: number;
  readonly commissionPendingArs: number;
  readonly bonus: AdvisorMonthlyBonusQuote;
}

function finiteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be a non-negative finite number`);
  return value;
}

function finitePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a positive finite number`);
  return value;
}

function splitExactPesos(totalArs: number, parts: number): readonly number[] {
  if (!Number.isInteger(totalArs) || totalArs < 0) throw new RangeError("totalArs must be whole non-negative pesos");
  if (!Number.isInteger(parts) || parts < 1) throw new RangeError("parts must be a positive integer");
  const base = Math.floor(totalArs / parts);
  const values = Array.from({ length: parts }, () => base);
  values[values.length - 1] += totalArs - base * parts;
  return Object.freeze(values);
}

export function financedCommissionForCashPrice(finalCashPriceArs: number): number {
  finitePositive(finalCashPriceArs, "finalCashPriceArs");
  const wholePesos = Math.floor(finalCashPriceArs);
  const tier = FINANCED_COMMISSION_TIERS.find((candidate) =>
    wholePesos >= candidate.minCashPriceArs &&
    (candidate.maxCashPriceArs === null || wholePesos <= candidate.maxCashPriceArs),
  );
  if (!tier) throw new Error("No financed commission tier matched the final cash price");
  return tier.commissionArs;
}

export function quoteAdvisorOperationCommission(
  finalCashPriceArs: number,
  modality: AdvisorSaleModality,
  cashPercent = 10,
): AdvisorCommissionQuote {
  finitePositive(finalCashPriceArs, "finalCashPriceArs");
  finiteNonNegative(cashPercent, "cashPercent");
  const totalCommissionArs = modality === "financed"
    ? financedCommissionForCashPrice(finalCashPriceArs)
    : Math.round(finalCashPriceArs * cashPercent / 100);
  const paymentCount = modality === "financed" ? FINANCED_COMMISSION_PAYMENT_COUNT : 1;
  return Object.freeze({
    policyVersion: ADVISOR_COMPENSATION_POLICY_VERSION,
    modality,
    finalCashPriceArs,
    calculation: modality === "financed" ? "financed_fixed_tier" : "cash_percentage",
    cashPercent: modality === "cash" ? cashPercent : null,
    totalCommissionArs,
    paymentsArs: splitExactPesos(totalCommissionArs, paymentCount),
  });
}

export function equivalentSalesForCashPrice(finalCashPriceArs: number): number {
  finitePositive(finalCashPriceArs, "finalCashPriceArs");
  return finalCashPriceArs < LOW_VALUE_SALE_THRESHOLD_ARS
    ? LOW_VALUE_SALE_EQUIVALENCE
    : STANDARD_SALE_EQUIVALENCE;
}

export function validateAdvisorOperation(facts: AdvisorOperationFacts): {
  readonly validation: AdvisorOperationValidation;
  readonly reason: string;
} {
  if (facts.cancelled) return Object.freeze({ validation: "excluded", reason: "Operación cancelada" });
  if (!facts.delivered) return Object.freeze({ validation: "pending", reason: "Entrega pendiente" });
  if (facts.paidAccordingToTerms !== true) return Object.freeze({ validation: "pending", reason: "Cobranza pendiente de validación" });
  if (facts.modality === "financed" && facts.financedCurrentAtClose === false) {
    return Object.freeze({ validation: "excluded", reason: "Financiación en mora al cierre" });
  }
  if (facts.modality === "financed" && facts.financedCurrentAtClose !== true) {
    return Object.freeze({ validation: "pending", reason: "Estado de cuotas pendiente al cierre" });
  }
  return Object.freeze({ validation: "accepted", reason: "Venta, entrega y cobranza validadas" });
}

export function projectAdvisorOperation(facts: AdvisorOperationFacts, cashPercent = 10): AdvisorOperationProjection {
  if (!facts.saleId.trim()) throw new Error("saleId is required");
  if (!facts.advisorId.trim()) throw new Error("advisorId is required");
  const commission = quoteAdvisorOperationCommission(facts.finalCashPriceArs, facts.modality, cashPercent);
  const decision = validateAdvisorOperation(facts);
  const collectedCount = Math.min(
    commission.paymentsArs.length,
    Math.max(0, Math.floor(facts.commissionPaymentsCollected ?? 0)),
  );
  const commissionPayments = commission.paymentsArs.map((amountArs, index) => Object.freeze({
    part: index + 1,
    amountArs,
    status: (index < collectedCount ? "collected" : "pending") as AdvisorCommissionPaymentStatus,
  }));
  const commissionCollectedArs = commissionPayments
    .filter((payment) => payment.status === "collected")
    .reduce((total, payment) => total + payment.amountArs, 0);
  const countsForBonus = decision.validation === "accepted";
  return Object.freeze({
    saleId: facts.saleId,
    advisorId: facts.advisorId,
    productLabel: facts.productLabel,
    finalCashPriceArs: facts.finalCashPriceArs,
    modality: facts.modality,
    validation: decision.validation,
    validationReason: decision.reason,
    countsForBonus,
    equivalentSales: countsForBonus ? equivalentSalesForCashPrice(facts.finalCashPriceArs) : 0,
    commission,
    commissionPayments: Object.freeze(commissionPayments),
    commissionCollectedArs,
    commissionPendingArs: commission.totalCommissionArs - commissionCollectedArs,
  });
}

export function quoteAdvisorMonthlyBonus(equivalentSales: number): AdvisorMonthlyBonusQuote {
  finiteNonNegative(equivalentSales, "equivalentSales");
  const normalized = Math.floor(equivalentSales * 2) / 2;
  const mainGoal = MONTHLY_BONUS_TIERS[MONTHLY_BONUS_TIERS.length - 1];
  const achieved = [...MONTHLY_BONUS_TIERS].reverse().find((tier) => normalized >= tier.equivalentSales);
  const mainGoalReached = normalized >= mainGoal.equivalentSales;
  const additionalEquivalentSales = mainGoalReached
    ? Math.floor(normalized - mainGoal.equivalentSales)
    : 0;
  const additionalBonusArs = additionalEquivalentSales * MONTHLY_BONUS_AFTER_TWENTY_ARS;
  const bonusArs = mainGoalReached
    ? mainGoal.bonusArs + additionalBonusArs
    : achieved?.bonusArs ?? 0;
  const nextGoal = mainGoalReached
    ? null
    : MONTHLY_BONUS_TIERS.find((tier) => normalized < tier.equivalentSales) ?? null;
  const previousGoal = mainGoalReached ? mainGoal.equivalentSales : achieved?.equivalentSales ?? 0;
  const progressRange = mainGoalReached ? 1 : (nextGoal?.equivalentSales ?? previousGoal) - previousGoal;
  const progressWithinRange = mainGoalReached ? 1 : normalized - previousGoal;
  return Object.freeze({
    equivalentSales: normalized,
    bonusArs,
    mainGoalReached,
    additionalEquivalentSales,
    additionalBonusArs,
    nextGoalEquivalentSales: nextGoal?.equivalentSales ?? null,
    nextGoalBonusArs: nextGoal?.bonusArs ?? null,
    remainingEquivalentSales: nextGoal ? Math.max(0, nextGoal.equivalentSales - normalized) : 0,
    progressPercent: mainGoalReached ? 100 : Math.max(0, Math.min(100, Math.round(progressWithinRange / progressRange * 100))),
  });
}

function deepFreezeMonthClose(close: AdvisorMonthClose): AdvisorMonthClose {
  for (const operation of close.operations) {
    Object.freeze(operation.commission.paymentsArs);
    Object.freeze(operation.commission);
    Object.freeze(operation.commissionPayments);
    Object.freeze(operation);
  }
  Object.freeze(close.operations);
  Object.freeze(close.bonus);
  return Object.freeze(close);
}

export function closeAdvisorMonth(input: {
  readonly advisorId: string;
  readonly period: string;
  readonly closedAt: string;
  readonly operations: readonly AdvisorOperationFacts[];
  readonly cashPercent?: number;
}): AdvisorMonthClose {
  if (!input.advisorId.trim()) throw new Error("advisorId is required");
  if (!/^\d{4}-\d{2}$/.test(input.period)) throw new Error("period must use YYYY-MM");
  if (!Number.isFinite(Date.parse(input.closedAt))) throw new Error("closedAt must be an ISO timestamp");
  const operations = input.operations.map((operation) => projectAdvisorOperation(
    { ...operation, productLabel: operation.productLabel || "Producto sin nombre" },
    input.cashPercent ?? 10,
  ));
  const accepted = operations.filter((operation) => operation.validation === "accepted");
  const equivalentSales = accepted.reduce((total, operation) => total + operation.equivalentSales, 0);
  const commissionGeneratedArs = operations.reduce((total, operation) => total + operation.commission.totalCommissionArs, 0);
  const commissionCollectedArs = operations.reduce((total, operation) => total + operation.commissionCollectedArs, 0);
  return deepFreezeMonthClose({
    policyVersion: ADVISOR_COMPENSATION_POLICY_VERSION,
    advisorId: input.advisorId,
    period: input.period,
    closedAt: input.closedAt,
    operations,
    validSales: accepted.length,
    equivalentSales,
    acceptedOperations: accepted.length,
    pendingOperations: operations.filter((operation) => operation.validation === "pending").length,
    excludedOperations: operations.filter((operation) => operation.validation === "excluded").length,
    commissionGeneratedArs,
    commissionCollectedArs,
    commissionPendingArs: commissionGeneratedArs - commissionCollectedArs,
    bonus: quoteAdvisorMonthlyBonus(equivalentSales),
  });
}
