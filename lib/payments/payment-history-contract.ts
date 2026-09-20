/**
 * V16 SECURE PAYMENT HISTORY — RPC CONTRACT.
 *
 * Source: V16-PAYMENT-HISTORY-UI-CONTRACT-FROZEN-CORRECTIVE.md (received
 * with the V16_PAYMENT_HISTORY_UI_CONTRACT_CORRECTION gate — the first
 * Payment History gate only shipped a read-path RPC report without this
 * full frozen UI contract). This corrected version fixes a real mismatch
 * found in that first pass: the frozen contract uses `p_`-prefixed RPC
 * argument names (`p_client_id`, `p_sale_id`, `p_payment_kind`, `p_from`,
 * `p_to`, `p_search_text`, `p_row_limit`, `p_row_offset`), not the
 * unprefixed names used before, and it defines a `p_sale_id` scoping
 * parameter that didn't exist in the previous implementation at all.
 * Returned row fields are unchanged from the first pass.
 *
 * Authorization: Owner/Admin via `collections.read`; Cliente is scoped
 * own-only by `client_id`; Asesor is scoped to their active canonical
 * portfolio via `v16_advisor_can_access_client(...)`; anon has no
 * EXECUTE. The UI must not infer access from `ventas.responsable` or
 * `clientes.responsable`.
 *
 * Fields that MUST NEVER be requested or rendered: idempotency_key,
 * cash_movement_id, note, metadata, created_by, payment_reference,
 * amount_source. Also never invent: cashier/user identity, payment
 * profitability, provider/investor attribution, cash balance, remaining
 * debt.
 *
 * Current certified facts: 0 canonical payment events, 0 cash
 * movements. This UI must never backfill or infer historical payments
 * from `ventas.pagadas`, `ventas.montoCuota`, `auditoria`, `pagoInv`,
 * `pagoRev` or any legacy free-text note as canonical events — an empty
 * result is a valid state, not an error, and is never synthesized
 * locally.
 *
 * Event semantics (section 25 of the frozen contract): Cobranzas answers
 * "qué debería cobrarse" (projection); Payment History answers "qué
 * pago/reversa quedó realmente registrado" (canonical ledger). These are
 * never merged into one inferred history.
 */

export const V16_PAYMENT_HISTORY_CONTRACT_VERSION = "V16_PAYMENT_HISTORY_UI_CONTRACT_FROZEN_CORRECTIVE_1" as const;

export interface V16PaymentHistoryRow {
  payment_id: string;
  sale_id: string;
  client_id: string;
  client_name: string | null;
  product_label: string | null;
  installment_number: number | null;
  payment_kind: string;
  contractual_amount: number | null;
  adjustment_amount: number | null;
  adjustment_reason: string | null;
  amount_received: number | null;
  paid_at: string | null;
  payment_method: string | null;
  reverses_payment_id: string | null;
  created_at: string | null;
}

export interface V16PaymentHistorySummaryRow {
  payment_count: number;
  reversal_count: number;
  payment_amount: number;
  reversed_amount: number;
  net_amount: number;
  first_event_at: string | null;
  last_event_at: string | null;
}

/** Argument object as accepted by this adapter's own methods (JS-side names). */
export interface V16PaymentHistoryListParams {
  clientId?: string | null;
  saleId?: string | null;
  paymentKind?: string | null;
  from?: string | null;
  to?: string | null;
  searchText?: string | null;
  rowLimit?: number;
  rowOffset?: number;
}

export interface V16PaymentHistorySummaryParams {
  clientId?: string | null;
  saleId?: string | null;
  from?: string | null;
  to?: string | null;
}

export const V16_PAYMENT_HISTORY_LIST_DEFAULTS = Object.freeze({
  clientId: null,
  saleId: null,
  paymentKind: null,
  from: null,
  to: null,
  searchText: null,
  rowLimit: 100,
  rowOffset: 0,
} satisfies Required<V16PaymentHistoryListParams>);

/** Fields the frozen contract explicitly says are never exposed — never request or render these. */
export const V16_PAYMENT_HISTORY_NEVER_EXPOSED = Object.freeze([
  "idempotency_key", "cash_movement_id", "note", "metadata", "created_by", "payment_reference", "amount_source",
] as const);
