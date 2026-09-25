import { quoteInstallmentPlan, type CommercePolicy } from "./calculator-engine";
import { AMARANGO_CURRENT_POLICY } from "./amarango-policy";
import {
  fromMoneyCents,
  markupForRealCost,
  quoteCoherentCashPrice,
  toMoneyCents,
  type AmarangoMarkupPercent,
  type CoherentCashPriceQuote,
} from "./coherent-pricing";

export const PLAN_PROTEGIDO_VERSION = "2026-09-25-coherencia";
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
  pricing: CoherentCashPriceQuote;
  costExact: number;
  markupPercent: AmarangoMarkupPercent;
  cashPriceExact: number;
  initialObjectiveExact: number;
  initialCapExact: number;
  initialExact: number;
  initialPesos: number;
  initialReason: "75_percent_cost" | "55_percent_cash_cap";
  cashCommission: ProtectedCommissionSchedule;
  cashAmarangoNetExact: number;
  plan3: ProtectedFinancedPlan;
  plan6: ProtectedFinancedPlan;
}

function positiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a positive finite number`);
  return value;
}

export function protectedMarkupForCost(cost: number): AmarangoMarkupPercent {
  return markupForRealCost(cost);
}

export function roundProtectedPeso(value: number) {
  if (!Number.isFinite(value)) throw new RangeError("value must be finite");
  return Math.round(value);
}

function buildScheduleFromCents(
  totalCents: number,
  initialCents: number,
  laterCount: number,
): ProtectedPaymentSchedule {
  if (!Number.isInteger(totalCents) || totalCents <= 0) throw new RangeError("totalCents must be positive integer cents");
  if (!Number.isInteger(initialCents) || initialCents <= 0) throw new RangeError("initialCents must be positive integer cents");
  if (!Number.isInteger(laterCount) || laterCount < 1) throw new RangeError("laterCount must be an integer >= 1");
  if (initialCents >= totalCents) throw new RangeError("initial must be lower than total");

  const balanceCents = totalCents - initialCents;
  const totalPesos = Math.round(totalCents / 100);
  const initialPesos = Math.round(initialCents / 100);
  const laterPaymentExact = fromMoneyCents(balanceCents) / laterCount;
  const standardLaterPesos = Math.round(laterPaymentExact);
  const laterPesos = Array.from({ length: laterCount }, () => standardLaterPesos);
  laterPesos[laterPesos.length - 1] = totalPesos - initialPesos - standardLaterPesos * (laterCount - 1);

  return Object.freeze({
    totalExact: fromMoneyCents(totalCents),
    initialExact: fromMoneyCents(initialCents),
    balanceExact: fromMoneyCents(balanceCents),
    laterPaymentExact,
    totalPesos,
    initialPesos,
    laterPesos: Object.freeze(laterPesos),
  });
}

export function buildProtectedPaymentSchedule(
  totalExact: number,
  initialExact: number,
  laterCount: number,
): ProtectedPaymentSchedule {
  positiveFinite(totalExact, "totalExact");
  positiveFinite(initialExact, "initialExact");
  return buildScheduleFromCents(toMoneyCents(totalExact), toMoneyCents(initialExact), laterCount);
}

function quoteProtectedCommissionFromCents(
  cashPriceCents: number,
  percent: number,
  paymentCount: number,
): ProtectedCommissionSchedule {
  const totalCents = Math.round(cashPriceCents * percent / 100);
  const paymentExact = fromMoneyCents(totalCents) / paymentCount;
  const totalPesos = Math.round(totalCents / 100);
  const standardPesos = Math.round(paymentExact);
  const paymentPesos = Array.from({ length: paymentCount }, () => standardPesos);
  paymentPesos[paymentPesos.length - 1] = totalPesos - standardPesos * (paymentCount - 1);

  return Object.freeze({
    percent,
    totalExact: fromMoneyCents(totalCents),
    totalPesos,
    paymentCount,
    paymentExact,
    paymentPesos: Object.freeze(paymentPesos),
  });
}

export function quotePlanProtegido(
  cost: number,
  policy: CommercePolicy = AMARANGO_CURRENT_POLICY,
): PlanProtegidoQuote {
  positiveFinite(cost, "cost");

  const pricing = quoteCoherentCashPrice(cost);
  const costCents = toMoneyCents(pricing.cost);
  const cashPriceCents = toMoneyCents(pricing.commercialPrice);

  const initialObjectiveCents = Math.round(costCents * 75 / 100);
  const initialCapCents = Math.round(cashPriceCents * 55 / 100);
  const initialCents = Math.min(initialObjectiveCents, initialCapCents);
  const initialReason = initialCapCents < initialObjectiveCents ? "55_percent_cash_cap" : "75_percent_cost";

  const cashCommission = quoteProtectedCommissionFromCents(cashPriceCents, policy.commission.cashPercent, 1);
  const financedCommission3 = quoteProtectedCommissionFromCents(cashPriceCents, policy.commission.financedPercent, 2);
  const financedCommission6 = quoteProtectedCommissionFromCents(cashPriceCents, policy.commission.financedPercent, 3);

  const total3Cents = Math.round(cashPriceCents * (100 + PLAN_PROTEGIDO_THREE_SURCHARGE_PERCENT) / 100);

  // Reuse Formula 1's active 6-installment financial total exactly, then
  // redistribute only the collection timing into one initial + five later payments.
  const formula1Six = quoteInstallmentPlan(pricing.commercialPrice, 6, policy);
  const total6Cents = toMoneyCents(formula1Six.total);

  const plan3Schedule = buildScheduleFromCents(total3Cents, initialCents, 2);
  const plan6Schedule = buildScheduleFromCents(total6Cents, initialCents, 5);

  const cashNetCents = cashPriceCents - costCents - toMoneyCents(cashCommission.totalExact);
  const plan3NetCents = total3Cents - costCents - toMoneyCents(financedCommission3.totalExact);
  const plan6NetCents = total6Cents - costCents - toMoneyCents(financedCommission6.totalExact);

  return Object.freeze({
    version: PLAN_PROTEGIDO_VERSION,
    pricing,
    costExact: pricing.cost,
    markupPercent: pricing.markupPercent,
    cashPriceExact: pricing.commercialPrice,
    initialObjectiveExact: fromMoneyCents(initialObjectiveCents),
    initialCapExact: fromMoneyCents(initialCapCents),
    initialExact: fromMoneyCents(initialCents),
    initialPesos: Math.round(initialCents / 100),
    initialReason,
    cashCommission,
    cashAmarangoNetExact: fromMoneyCents(cashNetCents),
    plan3: Object.freeze({
      installments: 3,
      surchargePercent: PLAN_PROTEGIDO_THREE_SURCHARGE_PERCENT,
      totalExact: fromMoneyCents(total3Cents),
      schedule: plan3Schedule,
      commission: financedCommission3,
      amarangoNetExact: fromMoneyCents(plan3NetCents),
    }),
    plan6: Object.freeze({
      installments: 6,
      surchargePercent: formula1Six.surchargePercent,
      totalExact: fromMoneyCents(total6Cents),
      schedule: plan6Schedule,
      commission: financedCommission6,
      amarangoNetExact: fromMoneyCents(plan6NetCents),
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
