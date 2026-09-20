import { z } from "zod";
import { getCrmAccessConfig, type CrmAccessConfig } from "@/lib/crm/client-crm-adapter";
import {
  V16_REPORTS_PARAMS_DEFAULTS,
  type V16ReportsPeriodParams,
  type V16ReportsSalesByMonthRow,
  type V16ReportsSalesByResponsibleRow,
  type V16ReportsSalesSummaryRow,
} from "./reports-contract";

/**
 * V16 Reportes — read-only adapter over the frozen RPC contract.
 *
 * Same pattern as `lib/crm/client-crm-adapter.ts` and
 * `lib/collections/collections-adapter.ts`: `POST /rest/v1/rpc/<name>`
 * only, config injected (never hardcoded), no mutation method exists.
 * Reuses `getCrmAccessConfig()` — all three contracts require the same
 * `authenticated` session shape, absent in this environment, so every
 * call resolves to `{status: "not_connected"}`.
 */

export type ReportsReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

const salesSummaryRowSchema = z.object({
  sales_count: z.number(),
  product_sales: z.number(),
  loan_sales: z.number(),
  other_sales: z.number(),
  precio_venta_sum: z.number(),
  shipping_amount_sum: z.number(),
  distinct_clients: z.number(),
  distinct_responsibles: z.number(),
  first_sale_date: z.string().nullable(),
  last_sale_date: z.string().nullable(),
}).strict();

const salesByMonthRowSchema = z.object({
  period_month: z.string(),
  sales_count: z.number(),
  product_sales: z.number(),
  loan_sales: z.number(),
  other_sales: z.number(),
  precio_venta_sum: z.number(),
  shipping_amount_sum: z.number(),
}).strict();

const salesByResponsibleRowSchema = z.object({
  responsible: z.string().nullable(),
  sales_count: z.number(),
  product_sales: z.number(),
  loan_sales: z.number(),
  other_sales: z.number(),
  precio_venta_sum: z.number(),
  shipping_amount_sum: z.number(),
}).strict();

async function callRpc<T>(
  config: CrmAccessConfig,
  name: "v16_reports_sales_summary" | "v16_reports_sales_by_month" | "v16_reports_sales_by_responsible",
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<ReportsReadResult<T[]>> {
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

function buildArgs(params: V16ReportsPeriodParams) {
  return {
    period_from: params.period_from ?? V16_REPORTS_PARAMS_DEFAULTS.period_from,
    period_to: params.period_to ?? V16_REPORTS_PARAMS_DEFAULTS.period_to,
    include_archived: params.include_archived ?? V16_REPORTS_PARAMS_DEFAULTS.include_archived,
  };
}

export class ReportsReadOnlyAdapter {
  constructor(private readonly config: CrmAccessConfig | null) {}

  async getSalesSummary(params: V16ReportsPeriodParams = {}): Promise<ReportsReadResult<V16ReportsSalesSummaryRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_reports_sales_summary", buildArgs(params), salesSummaryRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  async getSalesByMonth(params: V16ReportsPeriodParams = {}): Promise<ReportsReadResult<V16ReportsSalesByMonthRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_reports_sales_by_month", buildArgs(params), salesByMonthRowSchema);
  }

  async getSalesByResponsible(params: V16ReportsPeriodParams = {}): Promise<ReportsReadResult<V16ReportsSalesByResponsibleRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_reports_sales_by_responsible", buildArgs(params), salesByResponsibleRowSchema);
  }
}

export function createReportsReadOnlyAdapter(): ReportsReadOnlyAdapter {
  return new ReportsReadOnlyAdapter(getCrmAccessConfig());
}
