/**
 * V16 ENTREGAS / DELIVERIES — RPC CONTRACT.
 *
 * Source: AMARANGOELECTRO-V16-DELIVERIES-RPC-FROZEN-CONTRACT-V2-20260915.md,
 * regenerated from the live Supabase project's current TypeScript types
 * (PostgREST types version 14.5) — not inferred, not guessed. This V2
 * document explicitly replaces an earlier incomplete pass and resolved the
 * previous `BLOCKED_V16_DELIVERIES_UI_CONTRACT_INTEGRATION` closure, which
 * had RPC names and lifecycle semantics but no field-level shape.
 *
 * Argument-name prefixing is asymmetric and preserved exactly as frozen:
 * `v16_deliveries_list` takes unprefixed args (`row_limit`, not
 * `p_row_limit`); `v16_delivery_detail`, `v16_create_delivery` and
 * `v16_transition_delivery` all take `p_`-prefixed args. Sending the wrong
 * prefix is a real bug, not a style choice — same class of mismatch already
 * found and fixed once for Payment History, and confirmed for Caja.
 *
 * Entregas is a canonical delivery lifecycle registry attached to a sale.
 * It never mutates `ventas.estado`, never reconstructs delivery history from
 * legacy fields/notes/heuristics, and never backfills. `address_snapshot` is
 * a snapshot for that delivery event, not necessarily the client's current
 * CRM address — it must never be used to edit the CRM record.
 *
 * Certified backend facts (from the authorization's own prevalidation,
 * summarized — not independently re-verified here, no DB access exists in
 * this environment): 0 real deliveries; anon read/write denied; direct-table
 * read/write denied for anon and authenticated; create requires only AAL1
 * (no step-up); PENDIENTE→COORDINADA accepted; PENDIENTE→ENTREGADA and a
 * stale `p_expected_current_status` both rejected server-side.
 */

export const V16_DELIVERIES_CONTRACT_VERSION = "V16_DELIVERIES_RPC_FROZEN_CONTRACT_V2" as const;

export type V16DeliveryStatus = "PENDIENTE" | "COORDINADA" | "EN_CAMINO" | "ENTREGADA" | "CANCELADA";

export const V16_DELIVERY_STATUS_LABEL: Record<V16DeliveryStatus, string> = {
  PENDIENTE: "Pendiente",
  COORDINADA: "Coordinada",
  EN_CAMINO: "En camino",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

/** Legal next statuses per current status — server-authoritative; the UI only uses this to decide which buttons to show, never to bypass the backend's own rejection. */
export const V16_DELIVERY_LEGAL_TRANSITIONS: Record<V16DeliveryStatus, readonly V16DeliveryStatus[]> = Object.freeze({
  PENDIENTE: Object.freeze<V16DeliveryStatus[]>(["COORDINADA", "CANCELADA"]),
  COORDINADA: Object.freeze<V16DeliveryStatus[]>(["EN_CAMINO", "CANCELADA"]),
  EN_CAMINO: Object.freeze<V16DeliveryStatus[]>(["ENTREGADA", "CANCELADA"]),
  ENTREGADA: Object.freeze<V16DeliveryStatus[]>([]),
  CANCELADA: Object.freeze<V16DeliveryStatus[]>([]),
});

export const V16_DELIVERY_TERMINAL_STATUSES: readonly V16DeliveryStatus[] = Object.freeze(["ENTREGADA", "CANCELADA"]);

/** `v16_deliveries_list` / `v16_delivery_detail` return row — field-for-field from the frozen contract (identical shape for both). */
export interface V16DeliveryRow {
  delivery_id: number;
  sale_id: string;
  client_id: string;
  client_name: string;
  product_label: string;
  status: string;
  scheduled_at: string;
  delivered_at: string;
  address_snapshot: string;
  updated_at: string;
}

/** `v16_create_delivery` return row. */
export interface V16DeliveryCreateResultRow {
  delivery_id: number;
  sale_id: string;
  client_id: string;
  status: string;
  scheduled_at: string;
  address_snapshot: string;
  created_at: string;
}

/** `v16_transition_delivery` return row. */
export interface V16DeliveryTransitionResultRow {
  delivery_id: number;
  sale_id: string;
  client_id: string;
  status: string;
  previous_status: string;
  scheduled_at: string;
  delivered_at: string;
  address_snapshot: string;
  updated_at: string;
}

/** `v16_deliveries_list` args — NOT `p_`-prefixed, per the frozen contract. */
export interface V16DeliveriesListParams {
  statusFilter?: string | null;
  searchText?: string | null;
  rowLimit?: number;
  rowOffset?: number;
}

/** `v16_delivery_detail` args — `p_`-prefixed, per the frozen contract. */
export interface V16DeliveryDetailParams {
  deliveryId: number;
}

/** `v16_create_delivery` args — `p_`-prefixed, per the frozen contract. Create does NOT require AAL2 on this backend. */
export interface V16DeliveryCreateParams {
  saleId: string;
  scheduledAt?: string | null;
  addressSnapshot?: string | null;
  notes?: string | null;
}

/** `v16_transition_delivery` args — `p_`-prefixed, per the frozen contract. Always send `expectedCurrentStatus` when the current status is known, so the backend can reject a stale transition instead of silently overwriting. */
export interface V16DeliveryTransitionParams {
  deliveryId: number;
  targetStatus: V16DeliveryStatus;
  expectedCurrentStatus?: V16DeliveryStatus | null;
  scheduledAt?: string | null;
  addressSnapshot?: string | null;
  note?: string | null;
  transitionedAt?: string | null;
}

export const V16_DELIVERIES_LIST_DEFAULTS = Object.freeze({
  statusFilter: null,
  searchText: null,
  rowLimit: 100,
  rowOffset: 0,
} satisfies Required<V16DeliveriesListParams>);
