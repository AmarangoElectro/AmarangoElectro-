import type { ActiveFinancingMode } from "@/lib/internal/finance/active-financing-mode-contract";
import type { CommercialPaymentScheduleEntry } from "@/lib/integration/sale-snapshot";

export type V16SalePaymentMode = "CASH" | "FINANCED";

/** Browser request: no advisor id and no freely supplied totals. */
export interface V16ConfirmSaleParams {
  clientId: string;
  authorizedQuoteId: string;
  source: "advisor" | "administration" | "customer";
  idempotencyKey: string;
}

export interface V16ConfirmedSaleRow {
  sale_id: string;
  client_id: string;
  canonical_product_id: string;
  product_name: string;
  product_model: string | null;
  payment_mode: V16SalePaymentMode;
  financing_mode: ActiveFinancingMode;
  cash_price: number;
  initial_payment: number;
  installments: number;
  installment_amount: number;
  financed_total: number;
  payment_schedule: readonly CommercialPaymentScheduleEntry[];
  commission: number;
  commission_policy_version: string;
  pricing_policy_version: string;
  sold_at: string;
}

export const V16_SALE_WRITE_SECURITY_CONTRACT = Object.freeze({
  browserSuppliedAdvisorIdAllowed: false,
  browserSuppliedTotalsAuthoritative: false,
  serverAuthorizedQuoteRequired: true,
  immutableCommercialSnapshotRequired: true,
  idempotencyRequired: true,
});
