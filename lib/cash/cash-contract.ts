/**
 * V16 CAJA / CASH — RPC CONTRACT.
 *
 * Source: AMARANGOELECTRO-V16-CASH-RPC-FROZEN-CONTRACT-20260915.md, generated
 * from the live Supabase project's TypeScript types (Supabase → Generate
 * TypeScript Types) — not inferred, not guessed. This resolved the previous
 * `BLOCKED_V16_CASH_UI_CONTRACT_INTEGRATION` closure, which had RPC names and
 * IN/OUT semantics but no field-level shape for any of the four RPCs.
 *
 * Argument naming is intentionally inconsistent across these four RPCs, and
 * that inconsistency is preserved exactly rather than "cleaned up": the two
 * read RPCs (`v16_cash_movements_list`, `v16_cash_summary`) take unprefixed
 * args (`period_from`, not `p_period_from`); the two write RPCs
 * (`v16_post_cash_movement`, `v16_reverse_cash_movement`) take `p_`-prefixed
 * args. Sending the wrong prefix for either RPC is a real bug, not a style
 * choice — same class of mismatch already found and fixed once for Payment
 * History.
 *
 * Caja is a canonical operational ledger. It is explicitly NOT: bank
 * balance, guaranteed cash-on-hand, profit, margin, a full accounting
 * balance, bank reconciliation, provider debt, or a complete financial
 * statement. `net_balance` must render as "Neto registrado", never "Saldo
 * actual" / "Saldo disponible" / "Dinero en banco".
 *
 * Fields the physical `v16_cash_movements` table has that the read RPCs do
 * NOT return, and which must therefore never be requested/rendered/inferred
 * here: created_by, idempotency_key, metadata, note. `v16_cash_movements_list`
 * also does not return `total_count` — no fetch-all, no invented pagination
 * total.
 *
 * Direction is server-authoritative: the frontend never sends `direction` on
 * post, and never derives write authorization from a client-side
 * type→direction mapping.
 *
 * Current certified fact: 0 cash movements. This UI must never backfill or
 * reconstruct history from `ventas`/`ventas.pagadas`, and must never create a
 * real movement to "test" the UI — first real movement must come from an
 * authorized real operation, not from test code.
 */

export const V16_CASH_CONTRACT_VERSION = "V16_CASH_RPC_FROZEN_CONTRACT_1" as const;

export type V16CashMovementType =
  | "CUSTOMER_PAYMENT"
  | "OWNER_CAPITAL_IN"
  | "INVESTOR_CAPITAL_IN"
  | "OTHER_IN"
  | "SUPPLIER_PURCHASE"
  | "INVESTOR_PAYOUT"
  | "RESELLER_PAYOUT"
  | "DELIVERY_EXPENSE"
  | "OPERATING_EXPENSE"
  | "OTHER_OUT"
  | "REVERSAL";

/** Movement types offered for MANUAL post — CUSTOMER_PAYMENT is reserved for the canonical Payment flow, REVERSAL is only ever created via the reverse RPC, never via post. */
export const V16_CASH_MANUAL_POST_TYPES: readonly V16CashMovementType[] = Object.freeze([
  "OWNER_CAPITAL_IN",
  "INVESTOR_CAPITAL_IN",
  "OTHER_IN",
  "SUPPLIER_PURCHASE",
  "INVESTOR_PAYOUT",
  "RESELLER_PAYOUT",
  "DELIVERY_EXPENSE",
  "OPERATING_EXPENSE",
  "OTHER_OUT",
]);

export const V16_CASH_MOVEMENT_TYPE_LABEL: Record<V16CashMovementType, string> = {
  CUSTOMER_PAYMENT: "Pago de cliente",
  OWNER_CAPITAL_IN: "Ingreso de capital del dueño",
  INVESTOR_CAPITAL_IN: "Ingreso de capital de inversor",
  OTHER_IN: "Otro ingreso",
  SUPPLIER_PURCHASE: "Compra a proveedor",
  INVESTOR_PAYOUT: "Pago a inversor",
  RESELLER_PAYOUT: "Pago a revendedor",
  DELIVERY_EXPENSE: "Gasto de entrega",
  OPERATING_EXPENSE: "Gasto operativo",
  OTHER_OUT: "Otro egreso",
  REVERSAL: "Reversa",
};

/** `v16_cash_movements_list` return row — field-for-field from the frozen contract. */
export interface V16CashMovementRow {
  movement_id: number;
  occurred_at: string;
  movement_type: string;
  direction: string;
  amount: number;
  sale_id: string;
  client_id: string;
  client_name: string;
  source_reference: string;
  reverses_movement_id: number;
  created_at: string;
}

/** `v16_cash_summary` return row — field-for-field from the frozen contract. */
export interface V16CashSummaryRow {
  total_in: number;
  total_out: number;
  net_balance: number;
  movement_count: number;
  customer_payment_in: number;
  supplier_purchase_out: number;
  investor_payout_out: number;
  reseller_payout_out: number;
  delivery_expense_out: number;
  operating_expense_out: number;
  reversal_in: number;
  reversal_out: number;
}

/** `v16_post_cash_movement` return row. */
export interface V16CashPostResultRow {
  movement_id: number;
  amount: number;
  client_id: string;
  direction: string;
  movement_type: string;
  occurred_at: string;
  sale_id: string;
  source_reference: string;
  created_at: string;
}

/** `v16_reverse_cash_movement` return row. */
export interface V16CashReverseResultRow {
  original_movement_id: number;
  reversal_movement_id: number;
  amount: number;
  client_id: string;
  direction: string;
  movement_type: string;
  occurred_at: string;
  sale_id: string;
  source_reference: string;
  created_at: string;
}

/** `v16_cash_movements_list` args — NOT `p_`-prefixed, per the frozen contract. */
export interface V16CashMovementsListParams {
  directionFilter?: string | null;
  movementTypeFilter?: string | null;
  periodFrom?: string | null;
  periodTo?: string | null;
  searchText?: string | null;
  rowLimit?: number;
  rowOffset?: number;
}

/** `v16_cash_summary` args — NOT `p_`-prefixed, per the frozen contract. */
export interface V16CashSummaryParams {
  periodFrom?: string | null;
  periodTo?: string | null;
}

/** `v16_post_cash_movement` args — `p_`-prefixed, per the frozen contract. Never send `direction`: server derives it from `p_movement_type`. */
export interface V16CashPostMovementParams {
  movementType: V16CashMovementType;
  amount: number;
  occurredAt?: string | null;
  sourceReference?: string | null;
  saleId?: string | null;
  clientId?: string | null;
  note?: string | null;
  idempotencyKey: string;
}

/** `v16_reverse_cash_movement` args — `p_`-prefixed, per the frozen contract. */
export interface V16CashReverseMovementParams {
  movementId: number;
  reason: string;
  reversedAt?: string | null;
  idempotencyKey?: string | null;
}

export const V16_CASH_LIST_DEFAULTS = Object.freeze({
  directionFilter: null,
  movementTypeFilter: null,
  periodFrom: null,
  periodTo: null,
  searchText: null,
  rowLimit: 100,
  rowOffset: 0,
} satisfies Required<V16CashMovementsListParams>);

/** Fields the physical table has that the read RPCs never return — never request/render/infer these. */
export const V16_CASH_NEVER_EXPOSED = Object.freeze(["created_by", "idempotency_key", "metadata", "note"] as const);
