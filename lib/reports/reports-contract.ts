/**
 * V16 SECURE REPORTS RPC CONTRACT — FROZEN.
 *
 * Contract version: V16_SECURE_REPORTS_RPC_CONTRACT_1
 * Source: AMARANGOELECTRO-V16-REPORTS-UI-CONTRACT-INTEGRATION-HANDOFF-PACK.zip,
 * V16-SECURE-REPORTS-RPC-CONTRACT-FROZEN.md.
 *
 * Types copied exactly from the frozen contract — no parameter or
 * returned field was guessed. `authenticated` only, `reports.read`
 * capability, owner/admin only in the current server rule, unmapped
 * identity returns 0 rows. No mutation exists in this contract.
 *
 * `responsible` is a legacy free-text reporting label, NOT an
 * authorization identity — never treat it as one.
 *
 * No profit/margin/cash/provider-balance field exists in this contract.
 * This module must never compute or display: ganancia, margen, comisión,
 * cobrado, saldo de caja, saldo de proveedor, ROI, rentabilidad.
 */

export const V16_REPORTS_CONTRACT_VERSION = "V16_SECURE_REPORTS_RPC_CONTRACT_1" as const;

export interface V16ReportsPeriodParams {
  period_from?: string | null;
  period_to?: string | null;
  include_archived?: boolean;
}

export const V16_REPORTS_PARAMS_DEFAULTS = Object.freeze({
  period_from: null,
  period_to: null,
  include_archived: false,
} satisfies Required<V16ReportsPeriodParams>);

export interface V16ReportsSalesSummaryRow {
  sales_count: number;
  product_sales: number;
  loan_sales: number;
  other_sales: number;
  precio_venta_sum: number;
  shipping_amount_sum: number;
  distinct_clients: number;
  distinct_responsibles: number;
  first_sale_date: string | null;
  last_sale_date: string | null;
}

export interface V16ReportsSalesByMonthRow {
  period_month: string;
  sales_count: number;
  product_sales: number;
  loan_sales: number;
  other_sales: number;
  precio_venta_sum: number;
  shipping_amount_sum: number;
}

export interface V16ReportsSalesByResponsibleRow {
  responsible: string | null;
  sales_count: number;
  product_sales: number;
  loan_sales: number;
  other_sales: number;
  precio_venta_sum: number;
  shipping_amount_sum: number;
}
