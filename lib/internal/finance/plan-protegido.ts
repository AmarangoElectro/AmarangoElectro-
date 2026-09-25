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
  initialBaseExact: number;
  minInitial3Exact: number;
  minInitial6Exact: number;
  initialExact: number;
  initialPesos: number;
  initialAdjustmentPesos: number;
  initialReason: "75_percent_cost" | "55_percent_cash_cap" | "plan3_balance_floor" | "plan6_balance_floor" | "strict_relief_adjustment";
  cashCommission: ProtectedCommissionSchedule;
  cashAmarangoNetExact: number;
  plan3: ProtectedFinancedPlan;
  plan6: ProtectedFinancedPlan;
}

function positiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a positive finite number`);
  return value;
}

export class ProtectedInitialConfigurationError extends Error {
  readonly code = "PROTECTED_INITIAL_EXCEEDS_55_PERCENT_CASH_CAP";
  readonly requiredInitialExact: number;
  readonly initialCapExact: number;

  constructor(requiredInitialCents: number, initialCapCents: number) {
    super("Plan Protegido inconsistente: la inicial mínima necesaria supera el tope de 55% del contado");
    this.name = "ProtectedInitialConfigurationError";
    this.requiredInitialExact = fromMoneyCents(requiredInitialCents);
    this.initialCapExact = fromMoneyCents(initialCapCents);
  }
}

function resolveProtectedInitial(
  initialObjectiveCents: number,
  initialCapCents: number,
  total3Cents: number,
  total6Cents: number,
) {
  const initialBaseCents = Math.min(initialObjectiveCents, initialCapCents);
  const minInitial3Cents = Math.ceil(total3Cents / 3);
  const minInitial6Cents = Math.ceil(total6Cents / 6);
  const requiredInitialCents = Math.max(initialBaseCents, minInitial3Cents, minInitial6Cents);

  if (requiredInitialCents > initialCapCents) {
    throw new ProtectedInitialConfigurationError(requiredInitialCents, initialCapCents);
  }

  // Customer-facing collection works in whole pesos. Round the required
  // mathematical minimum upward, while the commercial cap rounds downward,
  // so the 55% ceiling can never be exceeded by display rounding.
  const capPesos = Math.floor(initialCapCents / 100);
  let initialPesos = Math.ceil(requiredInitialCents / 100);
  if (initialPesos > capPesos) {
    throw new ProtectedInitialConfigurationError(initialPesos * 100, initialCapCents);
  }

  const baseReason =
    requiredInitialCents === minInitial3Cents && minInitial3Cents >= minInitial6Cents && minInitial3Cents >= initialBaseCents
      ? "plan3_balance_floor"
      : requiredInitialCents === minInitial6Cents && minInitial6Cents >= initialBaseCents
        ? "plan6_balance_floor"
        : initialCapCents < initialObjectiveCents
          ? "55_percent_cash_cap"
          : "75_percent_cost";

  let reason: PlanProtegidoQuote["initialReason"] = baseReason;
  const beforeStrictReliefPesos = initialPesos;

  // Preserve the commercial promise literally: after the initial payment,
  // every displayed payment must be lower. If whole-peso allocation creates
  // an equality, move the minimum number of pesos into the initial payment
  // without changing either financed total.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const initialCents = initialPesos * 100;
    const plan3 = buildScheduleFromCents(total3Cents, initialCents, 2);
    const plan6 = buildScheduleFromCents(total6Cents, initialCents, 5);
    const highestLater = Math.max(...plan3.laterPesos, ...plan6.laterPesos);

    if (initialPesos > highestLater) {
      if (initialPesos > beforeStrictReliefPesos) reason = "strict_relief_adjustment";
      return Object.freeze({
        initialBaseCents,
        minInitial3Cents,
        minInitial6Cents,
        initialCents,
        initialPesos,
        initialAdjustmentPesos: initialPesos - Math.round(initialBaseCents / 100),
        reason,
        plan3,
        plan6,
      });
    }

    initialPesos += 1;
    if (initialPesos > capPesos) {
      throw new ProtectedInitialConfigurationError(initialPesos * 100, initialCapCents);
    }
  }

  throw new Error("Plan Protegido inconsistente: no fue posible garantizar alivio posterior");
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

  const cashCommission = quoteProtectedCommissionFromCents(cashPriceCents, policy.commission.cashPercent, 1);
  const financedCommission3 = quoteProtectedCommissionFromCents(cashPriceCents, policy.commission.financedPercent, 2);
  const financedCommission6 = quoteProtectedCommissionFromCents(cashPriceCents, policy.commission.financedPercent, 3);

  const total3Cents = Math.round(cashPriceCents * (100 + PLAN_PROTEGIDO_THREE_SURCHARGE_PERCENT) / 100);

  // Reuse Formula 1's active 6-installment financial total exactly, then
  // redistribute only the collection timing into one initial + five later payments.
  const formula1Six = quoteInstallmentPlan(pricing.commercialPrice, 6, policy);
  const total6Cents = toMoneyCents(formula1Six.total);

  const protectedInitial = resolveProtectedInitial(
    initialObjectiveCents,
    initialCapCents,
    total3Cents,
    total6Cents,
  );
  const initialCents = protectedInitial.initialCents;
  const plan3Schedule = protectedInitial.plan3;
  const plan6Schedule = protectedInitial.plan6;

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
    initialBaseExact: fromMoneyCents(protectedInitial.initialBaseCents),
    minInitial3Exact: fromMoneyCents(protectedInitial.minInitial3Cents),
    minInitial6Exact: fromMoneyCents(protectedInitial.minInitial6Cents),
    initialExact: fromMoneyCents(initialCents),
    initialPesos: protectedInitial.initialPesos,
    initialAdjustmentPesos: protectedInitial.initialAdjustmentPesos,
    initialReason: protectedInitial.reason,
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
