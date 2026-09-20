import { z } from "zod";
import { getCrmAccessConfig, type CrmAccessConfig } from "@/lib/crm/client-crm-adapter";
import {
  V16_COLLECTIONS_LIST_DEFAULTS,
  type V16CollectionsListParams,
  type V16CollectionsListRow,
  type V16CollectionsSummaryRow,
} from "./collections-contract";

/**
 * V16 Cobranzas — read-only adapter over the frozen RPC contract.
 *
 * Same pattern as `lib/crm/client-crm-adapter.ts` and
 * `lib/catalog/supabase-readonly.ts`: `POST /rest/v1/rpc/<name>` only,
 * config injected (never hardcoded), no mutation method exists. Reuses
 * `getCrmAccessConfig()` — both contracts require the same `authenticated`
 * session shape, and neither exists in this environment, so every call
 * resolves to `{status: "not_connected"}`.
 */

export type CollectionsReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

const collectionStatusSchema = z.enum(["COMPLETE", "OVERDUE", "DUE_TODAY", "UPCOMING", "DATA_INCOMPLETE"]);
const dueSourceSchema = z.enum(["PROJECTED_FROM_SALE_DATE", "NONE", "UNKNOWN"]);

const collectionsListRowSchema = z.object({
  sale_id: z.string(),
  client_id: z.string(),
  client_name: z.string().nullable(),
  product_label: z.string().nullable(),
  responsible: z.string().nullable(),
  sale_date: z.string().nullable(),
  installments_total: z.number().nullable(),
  installments_paid: z.number().nullable(),
  installments_pending: z.number().nullable(),
  installment_amount: z.number().nullable(),
  next_due_date: z.string().nullable(),
  due_source: dueSourceSchema,
  collection_status: collectionStatusSchema,
  data_quality_flags: z.array(z.string()),
}).strict();

const collectionsSummaryRowSchema = z.object({
  active_sales: z.number(),
  pending_sales: z.number(),
  pending_installments: z.number(),
  known_amount_pending_sales: z.number(),
  missing_amount_pending_sales: z.number(),
  nominal_pending_amount_known: z.number(),
  overdue_sales: z.number(),
  due_today_sales: z.number(),
  upcoming_sales: z.number(),
  data_incomplete_sales: z.number(),
}).strict();

async function callRpc<T>(
  config: CrmAccessConfig,
  name: "v16_collections_list" | "v16_collections_summary",
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<CollectionsReadResult<T[]>> {
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

export class CollectionsReadOnlyAdapter {
  constructor(private readonly config: CrmAccessConfig | null) {}

  async listCollections(params: V16CollectionsListParams = {}): Promise<CollectionsReadResult<V16CollectionsListRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_collections_list", {
      search_text: params.search_text ?? V16_COLLECTIONS_LIST_DEFAULTS.search_text,
      status_filter: params.status_filter ?? V16_COLLECTIONS_LIST_DEFAULTS.status_filter,
      include_complete: params.include_complete ?? V16_COLLECTIONS_LIST_DEFAULTS.include_complete,
      row_limit: params.row_limit ?? V16_COLLECTIONS_LIST_DEFAULTS.row_limit,
      row_offset: params.row_offset ?? V16_COLLECTIONS_LIST_DEFAULTS.row_offset,
    }, collectionsListRowSchema);
  }

  async getSummary(): Promise<CollectionsReadResult<V16CollectionsSummaryRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_collections_summary", {}, collectionsSummaryRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }
}

export function createCollectionsReadOnlyAdapter(): CollectionsReadOnlyAdapter {
  return new CollectionsReadOnlyAdapter(getCrmAccessConfig());
}
