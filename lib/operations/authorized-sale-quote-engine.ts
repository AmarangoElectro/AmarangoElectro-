import { AMARANGO_CURRENT_POLICY, AMARANGO_POLICY_VERSION } from "@/lib/internal/finance/amarango-policy";
import { quoteInstallmentPlan } from "@/lib/internal/finance/calculator-engine";
import {
  ADVISOR_COMPENSATION_POLICY_VERSION,
} from "@/lib/internal/finance/advisor-compensation-policy";
import { quoteAdvisorOperationCommission } from "@/lib/internal/finance/advisor-compensation-engine";
import {
  AMARANGO_PRICING_PIPELINE_VERSION,
  quoteCoherentCashPrice,
} from "@/lib/internal/finance/coherent-pricing";
import {
  PLAN_PROTEGIDO_VERSION,
  quotePlanProtegido,
} from "@/lib/internal/finance/plan-protegido";
import type { ActiveFinancingMode } from "@/lib/internal/finance/active-financing-mode-contract";
import type { V16SalePaymentMode } from "@/lib/sales/sale-operational-contract";

export interface V16TrustedProductPricingFacts {
  readonly productId: string;
  readonly productName: string;
  readonly productModel: string | null;
  /** Current server-authoritative sale/cash price. Used as CLASSIC fallback when no certified cost exists. */
  readonly currentSalePriceArs: number;
  /** Server-only. Never serialize this field to a browser response. */
  readonly costArs: number | null;
}

export interface V16AuthorizedQuoteSelection {
  readonly paymentMode: V16SalePaymentMode;
  readonly installments: 1 | 2 | 3 | 4 | 6;
}

export interface V16AuthorizedQuoteDraft {
  readonly canonicalProductId: string;
  readonly productName: string;
  readonly productModel: string | null;
  readonly paymentMode: V16SalePaymentMode;
  readonly financingMode: ActiveFinancingMode;
  readonly cashPrice: number;
  readonly initialPayment: number;
  readonly installments: number;
  readonly installmentAmount: number;
  readonly financedTotal: number;
  readonly paymentAmounts: readonly number[];
  readonly commission: number;
  readonly commissionPolicyVersion: string;
  readonly pricingPolicyVersion: string;
}

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be positive`);
  return value;
}

function freezeQuote(quote: V16AuthorizedQuoteDraft) {
  return Object.freeze({ ...quote, paymentAmounts: Object.freeze([...quote.paymentAmounts]) });
}

function classicPaymentAmounts(total: number, installments: number, standardAmount: number) {
  const totalCents = Math.round(total * 100);
  const standardCents = Math.round(standardAmount * 100);
  const first = Array.from({ length: Math.max(0, installments - 1) }, () => standardCents);
  const final = totalCents - first.reduce((sum, value) => sum + value, 0);
  if (final <= 0) throw new Error("CLASSIC payment rounding produced a non-positive final payment");
  return Object.freeze([...first, final].map((value) => value / 100));
}

function pricingVersion(mode: ActiveFinancingMode) {
  return mode === "PROTECTED"
    ? `${PLAN_PROTEGIDO_VERSION}|${AMARANGO_PRICING_PIPELINE_VERSION}`
    : `${AMARANGO_POLICY_VERSION}|${AMARANGO_PRICING_PIPELINE_VERSION}`;
}

/**
 * Pure trusted-server quote builder.
 *
 * The caller must obtain product facts from a server-authoritative source.
 * Browser-supplied prices/costs are intentionally not part of this contract.
 */
export function buildV16AuthorizedQuoteDraft(
  facts: Readonly<V16TrustedProductPricingFacts>,
  activeMode: ActiveFinancingMode,
  selection: Readonly<V16AuthorizedQuoteSelection>,
): V16AuthorizedQuoteDraft {
  if (!facts.productId.trim() || !facts.productName.trim()) throw new Error("trusted product identity required");
  positive(facts.currentSalePriceArs, "currentSalePriceArs");
  if (facts.costArs !== null) positive(facts.costArs, "costArs");

  const paymentMode = selection.paymentMode;
  const requestedInstallments = selection.installments;

  if (paymentMode === "CASH" && requestedInstallments !== 1) throw new Error("CASH requires exactly one payment");
  if (paymentMode === "FINANCED" && requestedInstallments === 1) throw new Error("FINANCED requires an installment plan");

  if (activeMode === "CLASSIC") {
    const cashPrice = facts.costArs === null
      ? facts.currentSalePriceArs
      : quoteCoherentCashPrice(facts.costArs).commercialPrice;

    if (paymentMode === "CASH") {
      const commission = quoteAdvisorOperationCommission(cashPrice, "cash");
      return freezeQuote({
        canonicalProductId: facts.productId,
        productName: facts.productName,
        productModel: facts.productModel,
        paymentMode,
        financingMode: activeMode,
        cashPrice,
        initialPayment: cashPrice,
        installments: 1,
        installmentAmount: cashPrice,
        financedTotal: cashPrice,
        paymentAmounts: [cashPrice],
        commission: commission.totalCommissionArs,
        commissionPolicyVersion: ADVISOR_COMPENSATION_POLICY_VERSION,
        pricingPolicyVersion: pricingVersion(activeMode),
      });
    }

    if (![2, 4, 6].includes(requestedInstallments)) throw new Error("CLASSIC only allows 2, 4 or 6 installments");
    const plan = quoteInstallmentPlan(cashPrice, requestedInstallments, AMARANGO_CURRENT_POLICY);
    const paymentAmounts = classicPaymentAmounts(plan.total, requestedInstallments, plan.installmentAmount);
    const commission = quoteAdvisorOperationCommission(cashPrice, "financed");
    return freezeQuote({
      canonicalProductId: facts.productId,
      productName: facts.productName,
      productModel: facts.productModel,
      paymentMode,
      financingMode: activeMode,
      cashPrice,
      initialPayment: paymentAmounts[0],
      installments: requestedInstallments,
      installmentAmount: plan.installmentAmount,
      financedTotal: paymentAmounts.reduce((sum, value) => sum + value, 0),
      paymentAmounts,
      commission: commission.totalCommissionArs,
      commissionPolicyVersion: ADVISOR_COMPENSATION_POLICY_VERSION,
      pricingPolicyVersion: pricingVersion(activeMode),
    });
  }

  if (facts.costArs === null) throw new Error("PROTECTED_REQUIRES_SERVER_CERTIFIED_COST");
  const protectedQuote = quotePlanProtegido(facts.costArs);
  const cashPrice = protectedQuote.cashPriceExact;

  if (paymentMode === "CASH") {
    const commission = quoteAdvisorOperationCommission(cashPrice, "cash");
    return freezeQuote({
      canonicalProductId: facts.productId,
      productName: facts.productName,
      productModel: facts.productModel,
      paymentMode,
      financingMode: activeMode,
      cashPrice,
      initialPayment: cashPrice,
      installments: 1,
      installmentAmount: cashPrice,
      financedTotal: cashPrice,
      paymentAmounts: [cashPrice],
      commission: commission.totalCommissionArs,
      commissionPolicyVersion: ADVISOR_COMPENSATION_POLICY_VERSION,
      pricingPolicyVersion: pricingVersion(activeMode),
    });
  }

  if (requestedInstallments !== 3 && requestedInstallments !== 6) {
    throw new Error("PROTECTED only allows 3 or 6 payments");
  }
  const plan = requestedInstallments === 3 ? protectedQuote.plan3 : protectedQuote.plan6;
  const paymentAmounts = Object.freeze([protectedQuote.initialPesos, ...plan.schedule.laterPesos]);
  const commission = quoteAdvisorOperationCommission(cashPrice, "financed");

  return freezeQuote({
    canonicalProductId: facts.productId,
    productName: facts.productName,
    productModel: facts.productModel,
    paymentMode,
    financingMode: activeMode,
    cashPrice,
    initialPayment: protectedQuote.initialPesos,
    installments: requestedInstallments,
    installmentAmount: plan.schedule.laterPesos[0],
    financedTotal: paymentAmounts.reduce((sum, value) => sum + value, 0),
    paymentAmounts,
    commission: commission.totalCommissionArs,
    commissionPolicyVersion: ADVISOR_COMPENSATION_POLICY_VERSION,
    pricingPolicyVersion: pricingVersion(activeMode),
  });
}
