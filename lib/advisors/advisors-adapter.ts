import { z } from "zod";
import { getCrmAccessConfig, type CrmAccessConfig } from "@/lib/crm/client-crm-adapter";
import {
  type V16AdvisorAssignClientParams,
  type V16AdvisorAssignmentRow,
  type V16AdvisorCreateProfileParams,
  type V16AdvisorEndAssignmentParams,
  type V16AdvisorPortfolioListParams,
  type V16AdvisorPortfolioListRow,
  type V16AdvisorPortfolioSummaryRow,
  type V16AdvisorProfileRow,
} from "./advisors-contract";

/**
 * V16 Asesores — adapter over the frozen RPC contract
 * (AMARANGOELECTRO-V16-ADVISORS-RPC-FROZEN-CONTRACT-V3-20260915.md).
 *
 * Same `POST /rest/v1/rpc/<name>`-only pattern as CRM/Cobranzas/Reports/
 * Providers/Payment History/Caja/Entregas; reuses `getCrmAccessConfig()`
 * (absent in this environment, so every call — read or write — resolves to
 * `{status: "not_connected"}` before any network attempt). No write is ever
 * locally faked as successful: success is only ever the literal parsed
 * response of a real RPC call.
 *
 * All five RPCs implemented here take `p_`-prefixed args except
 * `v16_advisor_portfolio_summary`, which takes no args at all. Create/
 * assign/end are all AAL2-gated on the backend (confirmed by
 * AMARANGOELECTRO-V16-ADVISORS-WRITE-AAL2-PREFLIGHT-20260915.md) — this
 * adapter surfaces `step_up_required` explicitly and never bypasses it.
 */

export type AdvisorsReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "step_up_required" }
  | { status: "error"; code: string | null; message: string };

const portfolioSummaryRowSchema = z.object({
  advisor_id: z.string(),
  advisor_name: z.string(),
  advisor_active: z.boolean(),
  active_clients: z.number(),
  historical_assignments: z.number(),
  latest_assignment_at: z.string(),
}).strict();

const portfolioListRowSchema = z.object({
  advisor_id: z.string(),
  advisor_name: z.string(),
  advisor_active: z.boolean(),
  assignment_id: z.number(),
  client_id: z.string(),
  client_name: z.string(),
  client_locality: z.string(),
  assigned_at: z.string(),
  ended_at: z.string(),
  assignment_active: z.boolean(),
}).strict();

const profileRowSchema = z.object({
  advisor_id: z.string(),
  nombre: z.string(),
  telefono: z.string(),
  email: z.string(),
  localidad: z.string(),
  activo: z.boolean(),
  creado_at: z.string(),
}).strict();

const assignmentRowSchema = z.object({
  assignment_id: z.number(),
  advisor_id: z.string(),
  client_id: z.string(),
  assigned_at: z.string(),
  ended_at: z.string(),
  active: z.boolean(),
}).strict();

type RpcName =
  | "v16_advisor_portfolio_summary"
  | "v16_advisor_portfolio_list"
  | "v16_create_advisor_profile"
  | "v16_assign_advisor_client"
  | "v16_end_advisor_client_assignment";

const ADVISORS_ERROR_COPY: Record<string, string> = {
  authentication_required: "Tu sesión ya no es válida. Volvé a ingresar.",
  step_up_required: "Por seguridad, necesitás verificar nuevamente tu identidad para continuar.",
  not_authorized: "Esta identidad no tiene permiso para esta acción de Asesores.",
  advisor_not_found: "No encontramos este asesor.",
  client_not_found: "No encontramos este cliente.",
  assignment_not_found: "No encontramos esta asignación.",
};

async function callRpc<T>(
  config: CrmAccessConfig,
  name: RpcName,
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<AdvisorsReadResult<T[]>> {
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
      message = (code && ADVISORS_ERROR_COPY[code]) || body.message || message;
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

export class AdvisorsAdapter {
  constructor(private readonly config: CrmAccessConfig | null) {}

  /** Read. `v16_advisor_portfolio_summary` takes no args at all, per the frozen contract. */
  async getPortfolioSummary(): Promise<AdvisorsReadResult<V16AdvisorPortfolioSummaryRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_advisor_portfolio_summary", {}, portfolioSummaryRowSchema);
  }

  /** Read. `p_`-prefixed args, per the frozen contract. */
  async listPortfolio(params: V16AdvisorPortfolioListParams = {}): Promise<AdvisorsReadResult<V16AdvisorPortfolioListRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_advisor_portfolio_list", {
      p_advisor_id: params.advisorId ?? null,
      p_active_only: params.activeOnly ?? false,
      p_search_text: params.searchText ?? null,
      p_row_limit: params.rowLimit ?? 100,
      p_row_offset: params.rowOffset ?? 0,
    }, portfolioListRowSchema);
  }

  /** Write. AAL2-gated on the backend — never bypassed. Returns the server's literal parsed response on success; never faked. */
  async createProfile(params: V16AdvisorCreateProfileParams): Promise<AdvisorsReadResult<V16AdvisorProfileRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_create_advisor_profile", {
      p_nombre: params.nombre,
      p_telefono: params.telefono,
      p_email: params.email ?? null,
      p_localidad: params.localidad ?? null,
      p_note: params.note ?? null,
    }, profileRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /** Write. AAL2-gated on the backend — never bypassed. Returns the server's literal parsed response on success; never faked. */
  async assignClient(params: V16AdvisorAssignClientParams): Promise<AdvisorsReadResult<V16AdvisorAssignmentRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_assign_advisor_client", {
      p_advisor_id: params.advisorId,
      p_client_id: params.clientId,
      p_assigned_at: params.assignedAt ?? null,
      p_note: params.note ?? null,
    }, assignmentRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /** Write. AAL2-gated on the backend — never bypassed. Returns the server's literal parsed response on success; never faked. */
  async endAssignment(params: V16AdvisorEndAssignmentParams): Promise<AdvisorsReadResult<V16AdvisorAssignmentRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_end_advisor_client_assignment", {
      p_assignment_id: params.assignmentId,
      p_reason: params.reason,
      p_ended_at: params.endedAt ?? null,
    }, assignmentRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }
}

export function createAdvisorsAdapter(): AdvisorsAdapter {
  return new AdvisorsAdapter(getCrmAccessConfig());
}
