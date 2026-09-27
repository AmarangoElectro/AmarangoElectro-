import { z } from "zod";
import { SAME_ORIGIN_SECURE_RPC_BRIDGE, type V16RpcBridgeResult } from "@/lib/internal/auth/secure-rpc-session-bridge-contract";
import type { V16CreateClientParams, V16CreateClientResult } from "@/lib/crm/client-operational-contract";
import type { V16ActiveFinancingModeRow, V16SetActiveFinancingModeParams } from "@/lib/internal/finance/active-financing-mode-contract";
import type { V16ConfirmSaleParams, V16ConfirmedSaleRow } from "@/lib/sales/sale-operational-contract";

const clientRow = z.object({ client_id: z.string(), created: z.boolean(), duplicate_reason: z.enum(["dni", "phone"]).nullable(), created_at: z.string() }).strict();
const financingRow = z.object({ active_financing_mode: z.enum(["CLASSIC", "PROTECTED"]), policy_version: z.string(), effective_from: z.string(), updated_at: z.string() }).strict();
const saleRow = z.object({
  sale_id: z.string(), client_id: z.string(), canonical_product_id: z.string(), product_name: z.string(), product_model: z.string().nullable(),
  payment_mode: z.enum(["CASH", "FINANCED"]), financing_mode: z.enum(["CLASSIC", "PROTECTED"]), cash_price: z.number(),
  initial_payment: z.number(), installments: z.number(), installment_amount: z.number(), financed_total: z.number(), commission: z.number(),
  commission_policy_version: z.string(), pricing_policy_version: z.string(), sold_at: z.string(),
}).strict();

function first<T>(result: V16RpcBridgeResult<unknown>, schema: z.ZodType<T>): V16RpcBridgeResult<T | null> {
  if (result.status !== "ok") return result;
  const rows = z.array(schema).safeParse(result.data);
  return rows.success ? { status: "ok", data: rows.data[0] ?? null } : { status: "error", message: "Operational RPC response did not match its contract" };
}

export class V16OperationalAdapter {
  async createClient(params: V16CreateClientParams): Promise<V16RpcBridgeResult<V16CreateClientResult | null>> {
    return first(await SAME_ORIGIN_SECURE_RPC_BRIDGE.call("v16_create_client", {
      p_nombre: params.nombre, p_dni: params.dni ?? null, p_telefono: params.telefono,
      p_telefono2: params.telefonoAlternativo ?? null, p_direccion: params.direccion ?? null,
      p_localidad: params.localidad ?? null, p_ocupacion_actividad: params.ocupacionActividad ?? null,
      p_observaciones: params.observaciones ?? null, p_source: params.source, p_idempotency_key: params.idempotencyKey,
    }), clientRow);
  }

  async getActiveFinancingMode(): Promise<V16RpcBridgeResult<V16ActiveFinancingModeRow | null>> {
    return first(await SAME_ORIGIN_SECURE_RPC_BRIDGE.call("v16_get_active_financing_mode", {}), financingRow);
  }

  async setActiveFinancingMode(params: V16SetActiveFinancingModeParams): Promise<V16RpcBridgeResult<V16ActiveFinancingModeRow | null>> {
    return first(await SAME_ORIGIN_SECURE_RPC_BRIDGE.call("v16_set_active_financing_mode", {
      p_mode: params.mode, p_expected_policy_version: params.expectedPolicyVersion,
      p_reason: params.reason, p_idempotency_key: params.idempotencyKey,
    }), financingRow);
  }

  async confirmSale(params: V16ConfirmSaleParams): Promise<V16RpcBridgeResult<V16ConfirmedSaleRow | null>> {
    return first(await SAME_ORIGIN_SECURE_RPC_BRIDGE.call("v16_confirm_sale", {
      p_client_id: params.clientId, p_authorized_quote_id: params.authorizedQuoteId,
      p_source: params.source, p_idempotency_key: params.idempotencyKey,
    }), saleRow);
  }
}

export const v16OperationalAdapter = new V16OperationalAdapter();
