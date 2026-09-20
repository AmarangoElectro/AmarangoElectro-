import { z } from "zod";
import { getCrmAccessConfig, type CrmAccessConfig } from "@/lib/crm/client-crm-adapter";
import {
  type V16DeliveriesListParams,
  type V16DeliveryCreateParams,
  type V16DeliveryCreateResultRow,
  type V16DeliveryDetailParams,
  type V16DeliveryRow,
  type V16DeliveryTransitionParams,
  type V16DeliveryTransitionResultRow,
} from "./deliveries-contract";

/**
 * V16 Entregas — adapter over the frozen RPC contract
 * (AMARANGOELECTRO-V16-DELIVERIES-RPC-FROZEN-CONTRACT-V2-20260915.md).
 *
 * Same `POST /rest/v1/rpc/<name>`-only pattern as CRM/Cobranzas/Reports/
 * Providers/Payment History/Caja; reuses `getCrmAccessConfig()` (absent in
 * this environment, so every call — read or write — resolves to
 * `{status: "not_connected"}` before any network attempt). No write is ever
 * locally faked as successful: success is only ever the literal parsed
 * response of a real RPC call.
 *
 * Argument-name prefixing is intentionally asymmetric and preserved exactly
 * as frozen: `v16_deliveries_list` takes unprefixed args; the other three
 * RPCs take `p_`-prefixed args. `create` never sends AAL2/step-up framing —
 * the frozen contract confirms create only needs AAL1.
 */

export type DeliveriesReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "step_up_required" }
  | { status: "error"; code: string | null; message: string };

const deliveryRowSchema = z.object({
  delivery_id: z.number(),
  sale_id: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  product_label: z.string(),
  status: z.string(),
  scheduled_at: z.string(),
  delivered_at: z.string(),
  address_snapshot: z.string(),
  updated_at: z.string(),
}).strict();

const createResultRowSchema = z.object({
  delivery_id: z.number(),
  sale_id: z.string(),
  client_id: z.string(),
  status: z.string(),
  scheduled_at: z.string(),
  address_snapshot: z.string(),
  created_at: z.string(),
}).strict();

const transitionResultRowSchema = z.object({
  delivery_id: z.number(),
  sale_id: z.string(),
  client_id: z.string(),
  status: z.string(),
  previous_status: z.string(),
  scheduled_at: z.string(),
  delivered_at: z.string(),
  address_snapshot: z.string(),
  updated_at: z.string(),
}).strict();

type RpcName = "v16_deliveries_list" | "v16_delivery_detail" | "v16_create_delivery" | "v16_transition_delivery";

const DELIVERIES_ERROR_COPY: Record<string, string> = {
  authentication_required: "Tu sesión ya no es válida. Volvé a ingresar.",
  step_up_required: "Por seguridad, necesitás verificar nuevamente tu identidad para continuar.",
  not_authorized: "Esta identidad no tiene permiso para esta acción de Entregas.",
  invalid_status: "El estado indicado no es válido.",
  illegal_transition: "Esta transición no está permitida desde el estado actual.",
  stale_expected_status: "El estado cambió en otra sesión. Actualizá antes de continuar.",
};

async function callRpc<T>(
  config: CrmAccessConfig,
  name: RpcName,
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<DeliveriesReadResult<T[]>> {
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
      message = (code && DELIVERIES_ERROR_COPY[code]) || body.message || message;
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

export class DeliveriesAdapter {
  constructor(private readonly config: CrmAccessConfig | null) {}

  /** Read. `v16_deliveries_list` args are NOT `p_`-prefixed, per the frozen contract. */
  async listDeliveries(params: V16DeliveriesListParams = {}): Promise<DeliveriesReadResult<V16DeliveryRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_deliveries_list", {
      status_filter: params.statusFilter ?? null,
      search_text: params.searchText ?? null,
      row_limit: params.rowLimit ?? 100,
      row_offset: params.rowOffset ?? 0,
    }, deliveryRowSchema);
  }

  /** Read. `v16_delivery_detail` args ARE `p_`-prefixed, per the frozen contract. */
  async getDetail(params: V16DeliveryDetailParams): Promise<DeliveriesReadResult<V16DeliveryRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_delivery_detail", {
      p_delivery_id: params.deliveryId,
    }, deliveryRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /**
   * Write. `p_`-prefixed args, per the frozen contract. Create only needs
   * AAL1 on this backend — never gates this call behind a step-up prompt.
   * Returns the server's literal parsed response on success; never faked.
   */
  async createDelivery(params: V16DeliveryCreateParams): Promise<DeliveriesReadResult<V16DeliveryCreateResultRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_create_delivery", {
      p_sale_id: params.saleId,
      p_scheduled_at: params.scheduledAt ?? null,
      p_address_snapshot: params.addressSnapshot ?? null,
      p_notes: params.notes ?? null,
    }, createResultRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /**
   * Write. `p_`-prefixed args, per the frozen contract. Always pass
   * `expectedCurrentStatus` when known so the backend can reject a stale
   * transition instead of silently overwriting a concurrent change. Never
   * retries automatically on rejection. Returns the server's literal parsed
   * response on success; never faked.
   */
  async transitionDelivery(params: V16DeliveryTransitionParams): Promise<DeliveriesReadResult<V16DeliveryTransitionResultRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_transition_delivery", {
      p_delivery_id: params.deliveryId,
      p_target_status: params.targetStatus,
      p_expected_current_status: params.expectedCurrentStatus ?? null,
      p_scheduled_at: params.scheduledAt ?? null,
      p_address_snapshot: params.addressSnapshot ?? null,
      p_note: params.note ?? null,
      p_transitioned_at: params.transitionedAt ?? null,
    }, transitionResultRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }
}

export function createDeliveriesAdapter(): DeliveriesAdapter {
  return new DeliveriesAdapter(getCrmAccessConfig());
}
