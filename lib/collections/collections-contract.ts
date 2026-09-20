/**
 * V16 SECURE COBRANZAS RPC CONTRACT — FROZEN.
 *
 * Contract version: V16_SECURE_COBRANZAS_RPC_CONTRACT_1
 * Source: AMARANGOELECTRO-V16-COBRANZAS-UI-CONTRACT-INTEGRATION-HANDOFF-PACK-1.zip,
 * V16-SECURE-COBRANZAS-RPC-CONTRACT-FROZEN.md.
 *
 * Types copied exactly from the frozen contract — no parameter or
 * returned field was guessed. `EXECUTE: authenticated` only, server-side
 * `collections.read` capability check, unmapped identity returns 0 rows.
 * No mutation exists in this contract — this module never writes.
 *
 * Not returned by design (never fetched, never displayed): cost, profit,
 * wholesaler, investor allocations, internal payment split fields.
 */

export const V16_COLLECTIONS_CONTRACT_VERSION = "V16_SECURE_COBRANZAS_RPC_CONTRACT_1" as const;

export type V16CollectionStatus = "COMPLETE" | "OVERDUE" | "DUE_TODAY" | "UPCOMING" | "DATA_INCOMPLETE";
export type V16CollectionDueSource = "PROJECTED_FROM_SALE_DATE" | "NONE" | "UNKNOWN";

export interface V16CollectionsListRow {
  sale_id: string;
  client_id: string;
  client_name: string | null;
  product_label: string | null;
  responsible: string | null;
  sale_date: string | null;
  installments_total: number | null;
  installments_paid: number | null;
  installments_pending: number | null;
  installment_amount: number | null;
  next_due_date: string | null;
  due_source: V16CollectionDueSource;
  collection_status: V16CollectionStatus;
  data_quality_flags: string[];
}

export interface V16CollectionsSummaryRow {
  active_sales: number;
  pending_sales: number;
  pending_installments: number;
  known_amount_pending_sales: number;
  missing_amount_pending_sales: number;
  nominal_pending_amount_known: number;
  overdue_sales: number;
  due_today_sales: number;
  upcoming_sales: number;
  data_incomplete_sales: number;
}

export interface V16CollectionsListParams {
  search_text?: string | null;
  status_filter?: V16CollectionStatus | null;
  include_complete?: boolean;
  row_limit?: number;
  row_offset?: number;
}

export const V16_COLLECTIONS_LIST_DEFAULTS = Object.freeze({
  search_text: null,
  status_filter: null,
  include_complete: false,
  row_limit: 100,
  row_offset: 0,
} satisfies Required<V16CollectionsListParams>);
