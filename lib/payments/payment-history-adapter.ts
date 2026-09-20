import { z } from "zod";
import { getCrmAccessConfig, type CrmAccessConfig } from "@/lib/crm/client-crm-adapter";
import {
  type V16PaymentHistoryListParams,
  type V16PaymentHistoryRow,
  type V16PaymentHistorySummaryParams,
  type V16PaymentHistorySummaryRow,
} from "./payment-history-contract";

/**
 * V16 Payment History — read-only adapter over the frozen RPC contract.
 *
 * Same `POST /rest/v1/rpc/<name>`-only pattern as CRM/Cobranzas/Reports/
 * Providers; reuses `getCrmAccessConfig()` (absent in this environment,
 * so every call resolves to `{status: "not_connected"}` before any
 * network attempt). Read-only: no mutation method exists — the certified
 * write RPCs (`v16_register_customer_payment`, `v16_reverse_customer_payment`)
 * belong to a separately certified write contract this correction does
 * not touch.
 *
 * RPC argument names below use the `p_`-prefixed convention from the
 * frozen contract (`p_client_id`, `p_sale_id`, `p_payment_kind`, `p_from`,
 * `p_to`, `p_search_text`, `p_row_limit`, `p_row_offset`) — corrected
 * from the unprefixed names used in the first, incomplete pass.
 */

export type PaymentHistoryReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

const paymentHistoryRowSchema = z.object({
  payment_id: z.string(),
  sale_id: z.string(),
  client_id: z.string(),
  client_name: z.string().nullable(),
  product_label: z.string().nullable(),
  installment_number: z.number().nullable(),
  payment_kind: z.string(),
  contractual_amount: z.number().nullable(),
  adjustment_amount: z.number().nullable(),
  adjustment_reason: z.string().nullable(),
  amount_received: z.number().nullable(),
  paid_at: z.string().nullable(),
  payment_method: z.string().nullable(),
  reverses_payment_id: z.string().nullable(),
  created_at: z.string().nullable(),
}).strict();

const summaryRowSchema = z.object({
  payment_count: z.number(),
  reversal_count: z.number(),
  payment_amount: z.number(),
  reversed_amount: z.number(),
  net_amount: z.number(),
  first_event_at: z.string().nullable(),
  last_event_at: z.string().nullable(),
}).strict();

async function callRpc<T>(
  config: CrmAccessConfig,
  name: "v16_payment_history_list" | "v16_payment_history_summary",
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<PaymentHistoryReadResult<T[]>> {
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

export class PaymentHistoryReadOnlyAdapter {
  constructor(private readonly config: CrmAccessConfig | null) {}

  async listPayments(params: V16PaymentHistoryListParams = {}): Promise<PaymentHistoryReadResult<V16PaymentHistoryRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_payment_history_list", {
      p_client_id: params.clientId ?? null,
      p_sale_id: params.saleId ?? null,
      p_payment_kind: params.paymentKind ?? null,
      p_from: params.from ?? null,
      p_to: params.to ?? null,
      p_search_text: params.searchText ?? null,
      p_row_limit: params.rowLimit ?? 100,
      p_row_offset: params.rowOffset ?? 0,
    }, paymentHistoryRowSchema);
  }

  async getSummary(params: V16PaymentHistorySummaryParams = {}): Promise<PaymentHistoryReadResult<V16PaymentHistorySummaryRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_payment_history_summary", {
      p_client_id: params.clientId ?? null,
      p_sale_id: params.saleId ?? null,
      p_from: params.from ?? null,
      p_to: params.to ?? null,
    }, summaryRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }
}

export function createPaymentHistoryAdapter(): PaymentHistoryReadOnlyAdapter {
  return new PaymentHistoryReadOnlyAdapter(getCrmAccessConfig());
}
