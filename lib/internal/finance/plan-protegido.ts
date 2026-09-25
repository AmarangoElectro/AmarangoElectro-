import { quoteInstallmentPlan, type CommercePolicy } from "./calculator-engine";
import { AMARANGO_CURRENT_POLICY } from "./amarango-policy";

export const PLAN_PROTEGIDO_VERSION = "2026-09-25";
export const PLAN_PROTEGIDO_THREE_SURCHARGE_PERCENT = 35;

export interface ProtectedPaymentSchedule {
  totalExact: number;
  initialExact: number;
  balanceExact: number;
  laterPaymentExact: number;
  totalPesos: number;
  initialPesos: number;
  laterPesos: readonly number[];
}

export interface ProtectedCommissionSchedule {
  percent: number;
  totalExact: number;
  totalPesos: number;
  paymentCount: number;
  paymentExact: number;
  paymentPesos: readonly number[];
}

export interface ProtectedFinancedPlan {
  installments: 3 | 6;
  surchargePercent: number;
  totalExact: number;
  schedule: ProtectedPaymentSchedule;
  commission: ProtectedCommissionSchedule;
  amarangoNetExact: number;
}

export interface PlanProtegidoQuote {
  version: string;
  costExact: number;
  markupPercent: 80 | 60 | 50 | 40 | 30;
  cashPriceExact: number;
  initialPercentOfCost: 90 | 80 | 75 | 70 | 65;
  initialExact: number;
  initialPesos: number;
  roundingAdjustmentPesos: number;
  cashCommission: ProtectedCommissionSchedule;
  cashAmarangoNetExact: number;
  plan3: ProtectedFinancedPlan;
  plan6: ProtectedFinancedPlan;
}

function positiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a positive finite number`);
  return value;
}

export function protectedMarkupForCost(cost: number): 80 | 60 | 50 | 40 | 30 {
  positiveFinite(cost, "cost");
  if (cost < 50_000) return 80;
  if (cost < 100_000) return 60;
  if (cost < 250_000) return 50;
  if (cost < 350_000) return 40;
  return 30;
}

export function roundProtectedPeso(value: number) {
  if (!Number.isFinite(value)) throw new RangeError("value must be finite");
  return Math.round(value);
}

export function protectedInitialPercentForMarkup(
  markupPercent: 80 | 60 | 50 | 40 | 30,
): 90 | 80 | 75 | 70 | 65 {
  if (markupPercent === 80) return 90;
  if (markupPercent === 60) return 80;
  if (markupPercent === 50) return 75;
  if (markupPercent === 40) return 70;
  return 65;
}

/**
 * Balanced protected initial:
 * - mathematically equals 50% of the protected cash price;
 * - therefore maps to 90/80/75/70/65% of cost across markup tiers;
 * - keeps Plan 3 relief consistent across every tier;
 * - may move only by whole pesos if display rounding ever threatens
 *   the strict "initial > every later payment" invariant.
 */
function protectedInitialForBalance(
  initialExact: number,
  total3Exact: number,
  total6Exact: number,
) {
  let initialPesos = roundProtectedPeso(initialExact);
  const policyInitialPesos = initialPesos;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const plan3 = buildProtectedPaymentSchedule(total3Exact, initialPesos, 2);
    const plan6 = buildProtectedPaymentSchedule(total6Exact, initialPesos, 5);
    const highestLater = Math.max(...plan3.laterPesos, ...plan6.laterPesos);
    if (initialPesos > highestLater) {
      return Object.freeze({
        initialPesos,
        roundingAdjustmentPesos: initialPesos - policyInitialPesos,
      });
    }
    initialPesos += 1;
  }

  throw new Error("Unable to guarantee balanced protected initial above later payments");
}

function allocateRoundedAmounts(totalExact: number, equalPaymentExact: number, count: number) {
  const totalPesos = roundProtectedPeso(totalExact);
  const standard = roundProtectedPeso(equalPaymentExact);
  const payments = Array.from({ length: count }, () => standard);
  if (payments.length) {
    payments[payments.length - 1] = totalPesos - standard * (payments.length - 1);
  }
  return { totalPesos, payments: Object.freeze(payments) };
}

export function buildProtectedPaymentSchedule(
  totalExact: number,
  initialExact: number,
  laterCount: number,
): ProtectedPaymentSchedule {
  positiveFinite(totalExact, "totalExact");
  positiveFinite(initialExact, "initialExact");
  if (!Number.isInteger(laterCount) || laterCount < 1) throw new RangeError("laterCount must be an integer >= 1");
  if (initialExact >= totalExact) throw new RangeError("initialExact must be lower than totalExact");

  const balanceExact = totalExact - initialExact;
  const laterPaymentExact = balanceExact / laterCount;
  const totalPesos = roundProtectedPeso(totalExact);
  const initialPesos = roundProtectedPeso(initialExact);
  const balancePesos = totalPesos - initialPesos;
  const standardLaterPeso = roundProtectedPeso(laterPaymentExact);
  const laterPesos = Array.from({ length: laterCount }, () => standardLaterPeso);
  laterPesos[laterPesos.length - 1] = balancePesos - standardLaterPeso * (laterPesos.length - 1);

  return Object.freeze({
    totalExact,
    initialExact,
    balanceExact,
    laterPaymentExact,
    totalPesos,
    initialPesos,
    laterPesos: Object.freeze(laterPesos),
  });
}

function quoteProtectedCommission(
  cashPriceExact: number,
  percent: number,
  paymentCount: number,
): ProtectedCommissionSchedule {
  const totalExact = cashPriceExact * percent / 100;
  const paymentExact = totalExact / paymentCount;
  const allocation = allocateRoundedAmounts(totalExact, paymentExact, paymentCount);
  return Object.freeze({
    percent,
    totalExact,
    totalPesos: allocation.totalPesos,
    paymentCount,
    paymentExact,
    paymentPesos: allocation.payments,
  });
}

export function quotePlanProtegido(
  cost: number,
  policy: CommercePolicy = AMARANGO_CURRENT_POLICY,
): PlanProtegidoQuote {
  positiveFinite(cost, "cost");

  const markupPercent = protectedMarkupForCost(cost);
  const cashPriceExact = cost * (100 + markupPercent) / 100;
  const initialPercentOfCost = protectedInitialPercentForMarkup(markupPercent);
  const initialExact = cost * initialPercentOfCost / 100;

  const cashCommission = quoteProtectedCommission(cashPriceExact, policy.commission.cashPercent, 1);
  const financedCommission3 = quoteProtectedCommission(cashPriceExact, policy.commission.financedPercent, 2);
  const financedCommission6 = quoteProtectedCommission(cashPriceExact, policy.commission.financedPercent, 3);

  const total3Exact = cashPriceExact * (100 + PLAN_PROTEGIDO_THREE_SURCHARGE_PERCENT) / 100;

  // Reuse Formula 1's active 6-installment financial rule. We intentionally
  // consume its exact total and redistribute it; its legacy rounded
  // installmentAmount is not used by Plan Protegido.
  const formula1Six = quoteInstallmentPlan(cashPriceExact, 6, policy);
  const total6Exact = formula1Six.total;

  const protectedInitial = protectedInitialForBalance(initialExact, total3Exact, total6Exact);
  const collectedInitialPesos = protectedInitial.initialPesos;
  const plan3Schedule = buildProtectedPaymentSchedule(total3Exact, collectedInitialPesos, 2);
  const plan6Schedule = buildProtectedPaymentSchedule(total6Exact, collectedInitialPesos, 5);

  return Object.freeze({
    version: PLAN_PROTEGIDO_VERSION,
    costExact: cost,
    markupPercent,
    cashPriceExact,
    initialPercentOfCost,
    initialExact,
    initialPesos: protectedInitial.initialPesos,
    roundingAdjustmentPesos: protectedInitial.roundingAdjustmentPesos,
    cashCommission,
    cashAmarangoNetExact: cashPriceExact - cost - cashCommission.totalExact,
    plan3: Object.freeze({
      installments: 3,
      surchargePercent: PLAN_PROTEGIDO_THREE_SURCHARGE_PERCENT,
      totalExact: total3Exact,
      schedule: plan3Schedule,
      commission: financedCommission3,
      amarangoNetExact: total3Exact - cost - financedCommission3.totalExact,
    }),
    plan6: Object.freeze({
      installments: 6,
      surchargePercent: formula1Six.surchargePercent,
      totalExact: total6Exact,
      schedule: plan6Schedule,
      commission: financedCommission6,
      amarangoNetExact: total6Exact - cost - financedCommission6.totalExact,
    }),
  });
}

export function formatProtectedArs(value: number) {
  return `$${roundProtectedPeso(value).toLocaleString("es-AR")}`;
}

function laterPaymentsCommercialLine(schedule: ProtectedPaymentSchedule) {
  const payments = [...schedule.laterPesos];
  const first = payments[0];
  if (payments.every((value) => value === first)) {
    return `+ ${payments.length} cuotas de ${formatProtectedArs(first)}`;
  }
  const regularCount = payments.length - 1;
  const lines = regularCount > 0 ? [`+ ${regularCount} cuota${regularCount === 1 ? "" : "s"} de ${formatProtectedArs(first)}`] : [];
  lines.push(`+ última cuota de ${formatProtectedArs(payments[payments.length - 1])}`);
  return lines.join("\n");
}

export function buildPlanProtegidoCommercialMessage(productName: string, quote: PlanProtegidoQuote) {
  const safeName = productName.trim() || "PRODUCTO";
  return [
    `🔥 ${safeName}`,
    "",
    `🐝 ¡Llevátelo hoy por solo ${formatProtectedArs(quote.initialPesos)}!`,
    "",
    "Después elegí cómo seguir 👇",
    "",
    "🚀 PLAN 3 CUOTAS",
    laterPaymentsCommercialLine(quote.plan3.schedule),
    "",
    "⚡ PLAN 6 CUOTAS",
    laterPaymentsCommercialLine(quote.plan6.schedule),
    "",
    `💸 Contado: ${formatProtectedArs(quote.cashPriceExact)}`,
    "",
    "✅ Cuotas fijas",
    "✅ Una sola inicial para llevártelo",
    "✅ Después seguís con cuotas más bajas",
    "",
    "📲 @AmarangoElectro 🐝",
  ].join("\n");
}
