import { z } from "zod";
import { getCrmAccessConfig, type CrmAccessConfig } from "@/lib/crm/client-crm-adapter";
import {
  type V16CashMovementRow,
  type V16CashMovementsListParams,
  type V16CashPostMovementParams,
  type V16CashPostResultRow,
  type V16CashReverseMovementParams,
  type V16CashReverseResultRow,
  type V16CashSummaryParams,
  type V16CashSummaryRow,
} from "./cash-contract";

/**
 * V16 Caja — adapter over the frozen RPC contract
 * (AMARANGOELECTRO-V16-CASH-RPC-FROZEN-CONTRACT-20260915.md).
 *
 * Same `POST /rest/v1/rpc/<name>`-only pattern as CRM/Cobranzas/Reports/
 * Providers/Payment History; reuses `getCrmAccessConfig()` (absent in this
 * environment, so every call — read or write — resolves to
 * `{status: "not_connected"}` before any network attempt). No write is ever
 * locally faked as successful: success is only ever the literal parsed
 * response of a real RPC call.
 *
 * Argument-name prefixing is intentionally asymmetric and preserved exactly
 * as frozen: the two read RPCs take unprefixed args, the two write RPCs take
 * `p_`-prefixed args. `direction` is never sent by this adapter on post —
 * it is server-derived from `movement_type`.
 */

export type CashReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "step_up_required" }
  | { status: "error"; code: string | null; message: string };

const movementRowSchema = z.object({
  movement_id: z.number(),
  occurred_at: z.string(),
  movement_type: z.string(),
  direction: z.string(),
  amount: z.number(),
  sale_id: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  source_reference: z.string(),
  reverses_movement_id: z.number(),
  created_at: z.string(),
}).strict();

const summaryRowSchema = z.object({
  total_in: z.number(),
  total_out: z.number(),
  net_balance: z.number(),
  movement_count: z.number(),
  customer_payment_in: z.number(),
  supplier_purchase_out: z.number(),
  investor_payout_out: z.number(),
  reseller_payout_out: z.number(),
  delivery_expense_out: z.number(),
  operating_expense_out: z.number(),
  reversal_in: z.number(),
  reversal_out: z.number(),
}).strict();

const postResultRowSchema = z.object({
  movement_id: z.number(),
  amount: z.number(),
  client_id: z.string(),
  direction: z.string(),
  movement_type: z.string(),
  occurred_at: z.string(),
  sale_id: z.string(),
  source_reference: z.string(),
  created_at: z.string(),
}).strict();

const reverseResultRowSchema = z.object({
  original_movement_id: z.number(),
  reversal_movement_id: z.number(),
  amount: z.number(),
  client_id: z.string(),
  direction: z.string(),
  movement_type: z.string(),
  occurred_at: z.string(),
  sale_id: z.string(),
  source_reference: z.string(),
  created_at: z.string(),
}).strict();

type RpcName = "v16_cash_movements_list" | "v16_cash_summary" | "v16_post_cash_movement" | "v16_reverse_cash_movement";

const CASH_ERROR_COPY: Record<string, string> = {
  authentication_required: "Tu sesión ya no es válida. Volvé a ingresar.",
  step_up_required: "Por seguridad, necesitás verificar nuevamente tu identidad para continuar.",
  not_authorized: "Esta identidad no tiene permiso para esta acción de Caja.",
  invalid_movement_type: "El tipo de movimiento no es válido.",
  invalid_amount: "El monto no es válido.",
  already_reversed: "Este movimiento ya fue revertido.",
  idempotency_conflict: "La operación ya fue procesada con datos diferentes. Actualizá y volvé a intentar.",
};

async function callRpc<T>(
  config: CrmAccessConfig,
  name: RpcName,
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<CashReadResult<T[]>> {
  let response: Response;
  try {
    response = await fetch(new URL(`/rest/v1/rpc/${name}`, config.url), {
      method: "POST",
      headers: {
        apikey: config.accessToken,
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
  } catch {
    return { status: "not_connected" };
  }

  if (response.status === 401 || response.status === 403) return { status: "unauthorized" };

  if (!response.ok) {
    let code: string | null = null;
    let message = `RPC ${name} failed (${response.status})`;
    try {
      const body = (await response.json()) as { code?: string; message?: string };
      code = typeof body.code === "string" ? body.code : null;
      if (code === "step_up_required") return { status: "step_up_required" };
      message = (code && CASH_ERROR_COPY[code]) || body.message || message;
    } catch {
      // response wasn't JSON; keep the generic message
    }
    return { status: "error", code, message };
  }

  let rows: unknown;
  try {
    rows = await response.json();
  } catch {
    return { status: "error", code: null, message: `RPC ${name} returned a non-JSON response` };
  }

  const parsed = z.array(rowSchema).safeParse(rows);
  if (!parsed.success) return { status: "error", code: null, message: `RPC ${name} response did not match the frozen contract` };
  return { status: "ok", data: parsed.data };
}

export class CashAdapter {
  constructor(private readonly config: CrmAccessConfig | null) {}

  /** Read. `v16_cash_movements_list` args are NOT `p_`-prefixed, per the frozen contract. */
  async listMovements(params: V16CashMovementsListParams = {}): Promise<CashReadResult<V16CashMovementRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_cash_movements_list", {
      direction_filter: params.directionFilter ?? null,
      movement_type_filter: params.movementTypeFilter ?? null,
      period_from: params.periodFrom ?? null,
      period_to: params.periodTo ?? null,
      search_text: params.searchText ?? null,
      row_limit: params.rowLimit ?? 100,
      row_offset: params.rowOffset ?? 0,
    }, movementRowSchema);
  }

  /** Read. `v16_cash_summary` args are NOT `p_`-prefixed, per the frozen contract. */
  async getSummary(params: V16CashSummaryParams = {}): Promise<CashReadResult<V16CashSummaryRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_cash_summary", {
      period_from: params.periodFrom ?? null,
      period_to: params.periodTo ?? null,
    }, summaryRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /**
   * Write. `p_`-prefixed args, per the frozen contract. Never sends `direction`
   * — the server derives it from `p_movement_type`. Returns the server's
   * literal parsed response on success; never locally faked.
   */
  async postMovement(params: V16CashPostMovementParams): Promise<CashReadResult<V16CashPostResultRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_post_cash_movement", {
      p_movement_type: params.movementType,
      p_amount: params.amount,
      p_occurred_at: params.occurredAt ?? null,
      p_source_reference: params.sourceReference ?? null,
      p_sale_id: params.saleId ?? null,
      p_client_id: params.clientId ?? null,
      p_note: params.note ?? null,
      p_idempotency_key: params.idempotencyKey,
    }, postResultRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /**
   * Write. `p_`-prefixed args, per the frozen contract. Never deletes the
   * original movement — creates a new, linked reversal movement. Returns the
   * server's literal parsed response on success; never locally faked.
   */
  async reverseMovement(params: V16CashReverseMovementParams): Promise<CashReadResult<V16CashReverseResultRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_reverse_cash_movement", {
      p_movement_id: params.movementId,
      p_reason: params.reason,
      p_reversed_at: params.reversedAt ?? null,
      p_idempotency_key: params.idempotencyKey ?? null,
    }, reverseResultRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }
}

export function createCashAdapter(): CashAdapter {
  return new CashAdapter(getCrmAccessConfig());
}
