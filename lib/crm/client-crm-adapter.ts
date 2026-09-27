import { z } from "zod";
import {
  NOT_CONNECTED_SECURE_RPC_BRIDGE,
  SAME_ORIGIN_SECURE_RPC_BRIDGE,
  type V16SecureRpcBridge,
} from "@/lib/internal/auth/secure-rpc-session-bridge-contract";
import {
  V16_CRM_LIST_CLIENTS_DEFAULTS,
  type V16CrmClient360Row,
  type V16CrmClientListRow,
  type V16CrmClientSaleRow,
  type V16CrmListClientsParams,
} from "./client-crm-contract";

/**
 * V16 CRM — read-only adapter over the frozen RPC contract.
 *
 * UI → this adapter → `POST /rest/v1/rpc/<name>` on PostgREST → the 3
 * approved RPCs. Never reads `public.clientes`/`public.ventas` directly
 * (that endpoint shape isn't even available to this adapter). Mirrors the
 * existing `lib/catalog/supabase-readonly.ts` pattern: config is injected,
 * never hardcoded, and this class is only ever instantiated with real
 * config when a real session exists — which it does not in this
 * environment (no `.env`, no `SUPABASE_*` vars, no CLI, no MCP DB tool;
 * reconfirmed for this gate).
 *
 * The 3 RPCs are `EXECUTE: authenticated` only — an anon key alone is not
 * enough, an authenticated user access token is required. There is no
 * authentication system implemented in this repo yet
 * (`v418bStorefrontAdminModeContract.serverSideBusinessAuthorizationImplemented
 * === false`), so `getCrmAccessConfig()` always returns `null` here by
 * design — not a bug to "fix" in this gate.
 */

export interface CrmAccessConfig {
  url: string;
  accessToken: string;
}

/** Always null in this environment: no auth session mechanism exists yet. Never hardcode a real config here. */
export function getCrmAccessConfig(): CrmAccessConfig | null {
  return null;
}

export type CrmReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

const clientListRowSchema = z.object({
  id: z.string(),
  nombre: z.string().nullable(),
  telefono: z.string().nullable(),
  localidad: z.string().nullable(),
  direccion: z.string().nullable(),
  dni: z.string().nullable(),
  telefono2: z.string().nullable(),
  responsable: z.string().nullable(),
  alta: z.string().nullable(),
}).strict();

const client360RowSchema = z.object({
  id: z.string(),
  nombre: z.string().nullable(),
  telefono: z.string().nullable(),
  localidad: z.string().nullable(),
  direccion: z.string().nullable(),
  observaciones: z.string().nullable(),
  alta: z.string().nullable(),
  dni: z.string().nullable(),
  telefono2: z.string().nullable(),
  responsable: z.string().nullable(),
  ventas_total: z.number(),
  cuotas_total: z.number(),
  cuotas_pagadas: z.number(),
  cuotas_pendientes: z.number(),
}).strict();

const numericOrString = z.union([z.number(), z.string()]).nullable();

const clientSaleRowSchema = z.object({
  id: z.string(),
  cliente_id: z.string(),
  producto: z.string().nullable(),
  precio_venta: numericOrString,
  envio: numericOrString,
  responsable: z.string().nullable(),
  fecha: z.string().nullable(),
  cuotas: z.number().nullable(),
  pagadas: z.number().nullable(),
  cuotas_pendientes: z.number(),
  tipo: z.string().nullable(),
  total: numericOrString,
  precio: numericOrString,
  archivada: z.boolean().nullable(),
  monto_cuota: numericOrString,
  vence_manual: z.string().nullable(),
}).strict();

async function callRpc<T>(
  config: CrmAccessConfig,
  name: "v16_crm_list_clients" | "v16_crm_client_360" | "v16_crm_client_sales",
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<CrmReadResult<T[]>> {
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
  if (!response.ok) return { status: "error", message: `RPC ${name} failed (${response.status})` };

  let rows: unknown;
  try {
    rows = await response.json();
  } catch {
    return { status: "error", message: `RPC ${name} returned a non-JSON response` };
  }

  const parsed = z.array(rowSchema).safeParse(rows);
  if (!parsed.success) return { status: "error", message: `RPC ${name} response did not match the frozen contract` };
  return { status: "ok", data: parsed.data };
}

export class CrmReadOnlyAdapter {
  constructor(
    private readonly config: CrmAccessConfig | null,
    private readonly bridge: V16SecureRpcBridge = NOT_CONNECTED_SECURE_RPC_BRIDGE,
  ) {}

  private async secureRows<T>(name: "v16_crm_list_clients" | "v16_crm_client_360" | "v16_crm_client_sales", args: Record<string, unknown>, schema: z.ZodType<T>): Promise<CrmReadResult<T[]>> {
    const result = await this.bridge.call<unknown>(name, args);
    if (result.status === "unauthenticated" || result.status === "step_up_required") return { status: "unauthorized" };
    if (result.status !== "ok") return result;
    const parsed = z.array(schema).safeParse(result.data);
    return parsed.success ? { status: "ok", data: parsed.data } : { status: "error", message: `RPC ${name} response did not match the frozen contract` };
  }

  async listClients(params: V16CrmListClientsParams = {}): Promise<CrmReadResult<V16CrmClientListRow[]>> {
    const args = {
      search_text: params.search_text ?? V16_CRM_LIST_CLIENTS_DEFAULTS.search_text,
      row_limit: params.row_limit ?? V16_CRM_LIST_CLIENTS_DEFAULTS.row_limit,
      row_offset: params.row_offset ?? V16_CRM_LIST_CLIENTS_DEFAULTS.row_offset,
    };
    return this.config ? callRpc(this.config, "v16_crm_list_clients", args, clientListRowSchema) : this.secureRows("v16_crm_list_clients", args, clientListRowSchema);
  }

  async getClient360(clientId: string): Promise<CrmReadResult<V16CrmClient360Row | null>> {
    const args = { p_client_id: clientId };
    const result = this.config ? await callRpc(this.config, "v16_crm_client_360", args, client360RowSchema) : await this.secureRows("v16_crm_client_360", args, client360RowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  async getClientSales(clientId: string): Promise<CrmReadResult<V16CrmClientSaleRow[]>> {
    const args = { p_client_id: clientId };
    return this.config ? callRpc(this.config, "v16_crm_client_sales", args, clientSaleRowSchema) : this.secureRows("v16_crm_client_sales", args, clientSaleRowSchema);
  }
}

export function createCrmReadOnlyAdapter(): CrmReadOnlyAdapter {
  return new CrmReadOnlyAdapter(getCrmAccessConfig(), SAME_ORIGIN_SECURE_RPC_BRIDGE);
}
