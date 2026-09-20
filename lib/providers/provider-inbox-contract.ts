/**
 * V16 PROVIDERS + PROVIDER INBOX — RPC CONTRACT.
 *
 * Source: AMARANGOELECTRO-V16-PROVIDER-INBOX-UI-INTEGRATION-CLAUDE-HANDOFF-
 * AFTER-REPORTS-1.zip, V16-PROVIDERS-PROVIDER-INBOX-UI-CONTRACT-FROZEN-
 * AFTER-REPORTS.md.
 *
 * Field NAMES, enum VALUES and RPC signatures below are copied exactly
 * from that frozen document — nothing was guessed there. Unlike the CRM/
 * Cobranzas/Reports contracts (which shipped an explicit JSON with a SQL
 * type per field), this pack only lists field names in prose, with no
 * type annotations. The JS/TS types here are therefore a conservative,
 * explicitly-documented inference from field semantics (ids/text → string,
 * counts → number, booleans → boolean, timestamps → nullable ISO string),
 * following the same convention already used by every other real ID in
 * this repo (`Product.id`, `client_id`, `sale_id` are all opaque strings).
 * Zod validation at the adapter boundary means any real mismatch surfaces
 * as an explicit error, never as silently wrong data.
 *
 * Authorization (per this document's own explicit correction): reads use
 * `providers.read`, writes use `providers.write`, terminal transitions
 * additionally require Supabase Auth `aal2`. `catalog.read`/`catalog.write`
 * must NOT be used for Provider authorization — an earlier evidence
 * document in this same pack predates that correction; this file follows
 * the newest, most specific instruction.
 *
 * What this UI must NEVER invent (frozen contract, section 16):
 * saldo del proveedor, cuenta corriente proveedor, deuda con proveedor,
 * pagado/pendiente proveedor, orden de compra V16, fecha de pago
 * proveedor, mercadería recibida, estado de envío proveedor, WhatsApp/
 * email delivery-read states, ganancia/margen por proveedor.
 */

export type V16ProviderInboxStatus = "OPEN" | "WAITING_PROVIDER" | "WAITING_US" | "RESOLVED" | "CANCELLED";
export type V16ProviderInboxPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type V16ProviderInboxMessageKind = "OUTBOUND_NOTE" | "INBOUND_NOTE" | "INTERNAL_NOTE";

export interface V16ProviderListRow {
  provider_id: string;
  provider_key: string;
  canonical_name: string;
  active: boolean;
  alias_count: number;
  product_count: number;
  sales_attribution_count: number;
  data_quality_flags: string[];
}

/**
 * `v16_provider_unmapped_legacy_labels(source_filter)` — the frozen
 * contract never specifies its returned row shape (only its purpose and
 * the two certified counts: 0 unmapped productos labels, 0 unmapped
 * ventas labels). Rather than guess field names, this adapter treats each
 * row as opaque and only uses the row COUNT — exactly what the required
 * compact UI ("Mapeo de proveedores: completo" / "Labels sin mapear")
 * needs, per contract section 4.
 */
export type V16ProviderUnmappedLegacyLabelRow = Record<string, unknown>;

export interface V16ProviderInboxThreadListRow {
  thread_id: string;
  provider_id: string;
  provider_name: string;
  subject: string;
  status: V16ProviderInboxStatus;
  priority: V16ProviderInboxPriority;
  opened_at: string | null;
  resolved_at: string | null;
  reference_text: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  message_count: number;
}

export interface V16ProviderInboxThreadDetailRow {
  thread_id: string;
  provider_id: string;
  provider_name: string;
  subject: string;
  status: V16ProviderInboxStatus;
  priority: V16ProviderInboxPriority;
  opened_at: string | null;
  resolved_at: string | null;
  reference_text: string | null;
  created_at: string | null;
  updated_at: string | null;
  message_count: number;
  last_message_at: string | null;
}

export interface V16ProviderInboxMessageRow {
  message_id: string;
  thread_id: string;
  message_kind: V16ProviderInboxMessageKind;
  body: string;
  occurred_at: string | null;
  external_reference: string | null;
  created_at: string | null;
  created_by: string | null;
}

export interface V16ProvidersListParams {
  search_text?: string | null;
  include_inactive?: boolean;
  row_limit?: number;
  row_offset?: number;
}

export interface V16ProviderInboxThreadsListParams {
  provider_id?: string | null;
  status?: V16ProviderInboxStatus | null;
  priority?: V16ProviderInboxPriority | null;
  search_text?: string | null;
  row_limit?: number;
  row_offset?: number;
}

export interface V16ProviderInboxCreateThreadParams {
  provider_id: string;
  subject: string;
  priority: V16ProviderInboxPriority;
  reference_text?: string | null;
  idempotency_key: string;
}

export interface V16ProviderInboxAppendMessageParams {
  thread_id: string;
  message_kind: V16ProviderInboxMessageKind;
  body: string;
  external_reference?: string | null;
  idempotency_key?: string | null;
}

export interface V16ProviderInboxTransitionThreadParams {
  thread_id: string;
  status: V16ProviderInboxStatus;
  reason?: string | null;
  expected_current_status?: V16ProviderInboxStatus | null;
}

/** Frozen error-code → user-facing Spanish copy mapping (section 11). */
export const V16_PROVIDER_INBOX_ERROR_COPY: Record<string, string> = {
  provider_not_found_or_inactive: "El proveedor no está disponible.",
  provider_inbox_subject_invalid: "Revisá el asunto.",
  provider_inbox_priority_invalid: "La prioridad seleccionada no es válida.",
  provider_inbox_thread_not_found: "No encontramos este seguimiento.",
  provider_inbox_thread_terminal: "Este seguimiento ya está cerrado.",
  provider_inbox_message_kind_invalid: "El tipo de nota no es válido.",
  provider_inbox_message_body_invalid: "La nota está vacía o supera el límite permitido.",
  provider_inbox_status_invalid: "El estado seleccionado no es válido.",
  provider_inbox_status_concurrent_change: "El estado cambió en otra sesión. Actualizá antes de continuar.",
  provider_inbox_terminal_reopen_not_allowed: "Este seguimiento no puede reabrirse.",
  provider_inbox_reopen_not_allowed: "No se puede volver a Abierto desde este estado.",
  step_up_required: "Necesitás confirmar tu identidad (verificación adicional) para esta acción.",
  cancellation_reason_required: "Indicá el motivo de cancelación.",
  idempotency_key_conflict: "La operación ya fue procesada con datos diferentes. Actualizá y volvé a intentar.",
};

export const V16_PROVIDER_INBOX_STATUS_LABEL: Record<V16ProviderInboxStatus, string> = {
  OPEN: "Abierto",
  WAITING_PROVIDER: "Esperando proveedor",
  WAITING_US: "Esperando respuesta nuestra",
  RESOLVED: "Resuelto",
  CANCELLED: "Cancelado",
};

export const V16_PROVIDER_INBOX_PRIORITY_LABEL: Record<V16ProviderInboxPriority, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const V16_PROVIDER_INBOX_MESSAGE_KIND_LABEL: Record<V16ProviderInboxMessageKind, string> = {
  OUTBOUND_NOTE: "Nota enviada",
  INBOUND_NOTE: "Respuesta recibida",
  INTERNAL_NOTE: "Nota interna",
};

export const V16_PROVIDER_INBOX_TERMINAL_STATUSES: readonly V16ProviderInboxStatus[] = Object.freeze(["RESOLVED", "CANCELLED"]);
