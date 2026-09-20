import { z } from "zod";
import { getCrmAccessConfig, type CrmAccessConfig } from "@/lib/crm/client-crm-adapter";
import {
  V16_PROVIDER_INBOX_ERROR_COPY,
  type V16ProviderInboxAppendMessageParams,
  type V16ProviderInboxCreateThreadParams,
  type V16ProviderInboxMessageRow,
  type V16ProviderInboxStatus,
  type V16ProviderInboxThreadDetailRow,
  type V16ProviderInboxThreadListRow,
  type V16ProviderInboxThreadsListParams,
  type V16ProviderInboxTransitionThreadParams,
  type V16ProviderListRow,
  type V16ProviderUnmappedLegacyLabelRow,
  type V16ProvidersListParams,
} from "./provider-inbox-contract";

/**
 * V16 Providers + Provider Inbox — adapter over the frozen RPC contract.
 *
 * Same `POST /rest/v1/rpc/<name>`-only pattern as CRM/Cobranzas/Reports;
 * reuses `getCrmAccessConfig()` (all these contracts need the same
 * `authenticated` session, absent in this environment). Read methods AND
 * write methods (create thread, append message, transition thread) are
 * implemented per this gate's explicit authorization — but since no
 * config exists here, every call — read or write — resolves to
 * `{status: "not_connected"}` before any network attempt. No write is
 * ever locally faked as successful: success is only ever the literal
 * parsed response of a real RPC call.
 */

export type ProviderInboxReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "step_up_required" }
  | { status: "error"; code: string | null; message: string };

const providerListRowSchema = z.object({
  provider_id: z.string(),
  provider_key: z.string(),
  canonical_name: z.string(),
  active: z.boolean(),
  alias_count: z.number(),
  product_count: z.number(),
  sales_attribution_count: z.number(),
  data_quality_flags: z.array(z.string()),
}).strict();

const unmappedLegacyLabelRowSchema = z.record(z.string(), z.unknown());

const threadListRowSchema = z.object({
  thread_id: z.string(),
  provider_id: z.string(),
  provider_name: z.string(),
  subject: z.string(),
  status: z.enum(["OPEN", "WAITING_PROVIDER", "WAITING_US", "RESOLVED", "CANCELLED"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  opened_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  reference_text: z.string().nullable(),
  updated_at: z.string().nullable(),
  last_message_at: z.string().nullable(),
  message_count: z.number(),
}).strict();

const threadDetailRowSchema = z.object({
  thread_id: z.string(),
  provider_id: z.string(),
  provider_name: z.string(),
  subject: z.string(),
  status: z.enum(["OPEN", "WAITING_PROVIDER", "WAITING_US", "RESOLVED", "CANCELLED"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  opened_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  reference_text: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  message_count: z.number(),
  last_message_at: z.string().nullable(),
}).strict();

const messageRowSchema = z.object({
  message_id: z.string(),
  thread_id: z.string(),
  message_kind: z.enum(["OUTBOUND_NOTE", "INBOUND_NOTE", "INTERNAL_NOTE"]),
  body: z.string(),
  occurred_at: z.string().nullable(),
  external_reference: z.string().nullable(),
  created_at: z.string().nullable(),
  created_by: z.string().nullable(),
}).strict();

type RpcName =
  | "v16_providers_list"
  | "v16_provider_unmapped_legacy_labels"
  | "v16_provider_inbox_threads_list"
  | "v16_provider_inbox_thread_detail"
  | "v16_provider_inbox_thread_messages"
  | "v16_provider_inbox_create_thread"
  | "v16_provider_inbox_append_message"
  | "v16_provider_inbox_transition_thread";

async function callRpc<T>(
  config: CrmAccessConfig,
  name: RpcName,
  args: Record<string, unknown>,
  rowSchema: z.ZodType<T>,
): Promise<ProviderInboxReadResult<T[]>> {
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
      const body = (await response.json()) as { code?: string; message?: string; hint?: string };
      code = typeof body.code === "string" ? body.code : null;
      if (code === "step_up_required") return { status: "step_up_required" };
      message = (code && V16_PROVIDER_INBOX_ERROR_COPY[code]) || body.message || message;
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

export class ProviderInboxAdapter {
  constructor(private readonly config: CrmAccessConfig | null) {}

  async listProviders(params: V16ProvidersListParams = {}): Promise<ProviderInboxReadResult<V16ProviderListRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_providers_list", {
      search_text: params.search_text ?? null,
      include_inactive: params.include_inactive ?? false,
      row_limit: params.row_limit ?? 100,
      row_offset: params.row_offset ?? 0,
    }, providerListRowSchema);
  }

  /** Only the row COUNT is meaningful here — see the contract note on this RPC's unspecified row shape. */
  async getUnmappedLegacyLabels(sourceFilter: string | null = null): Promise<ProviderInboxReadResult<V16ProviderUnmappedLegacyLabelRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_provider_unmapped_legacy_labels", { source_filter: sourceFilter }, unmappedLegacyLabelRowSchema);
  }

  async listThreads(params: V16ProviderInboxThreadsListParams = {}): Promise<ProviderInboxReadResult<V16ProviderInboxThreadListRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_provider_inbox_threads_list", {
      provider_id: params.provider_id ?? null,
      status: params.status ?? null,
      priority: params.priority ?? null,
      search_text: params.search_text ?? null,
      row_limit: params.row_limit ?? 100,
      row_offset: params.row_offset ?? 0,
    }, threadListRowSchema);
  }

  async getThreadDetail(threadId: string): Promise<ProviderInboxReadResult<V16ProviderInboxThreadDetailRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_provider_inbox_thread_detail", { thread_id: threadId }, threadDetailRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  async getThreadMessages(threadId: string, rowLimit = 200, rowOffset = 0): Promise<ProviderInboxReadResult<V16ProviderInboxMessageRow[]>> {
    if (!this.config) return { status: "not_connected" };
    return callRpc(this.config, "v16_provider_inbox_thread_messages", { thread_id: threadId, row_limit: rowLimit, row_offset: rowOffset }, messageRowSchema);
  }

  /** Returns the created thread's detail row on success. Never locally faked before the server confirms. */
  async createThread(params: V16ProviderInboxCreateThreadParams): Promise<ProviderInboxReadResult<V16ProviderInboxThreadDetailRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_provider_inbox_create_thread", {
      provider_id: params.provider_id,
      subject: params.subject,
      priority: params.priority,
      reference_text: params.reference_text ?? null,
      idempotency_key: params.idempotency_key,
    }, threadDetailRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /** Returns the appended message row on success. Never locally faked before the server confirms. */
  async appendMessage(params: V16ProviderInboxAppendMessageParams): Promise<ProviderInboxReadResult<V16ProviderInboxMessageRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_provider_inbox_append_message", {
      thread_id: params.thread_id,
      message_kind: params.message_kind,
      body: params.body,
      external_reference: params.external_reference ?? null,
      idempotency_key: params.idempotency_key ?? null,
    }, messageRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }

  /** Returns the transitioned thread's detail row on success. Never locally faked before the server confirms. */
  async transitionThread(params: V16ProviderInboxTransitionThreadParams): Promise<ProviderInboxReadResult<V16ProviderInboxThreadDetailRow | null>> {
    if (!this.config) return { status: "not_connected" };
    const result = await callRpc(this.config, "v16_provider_inbox_transition_thread", {
      thread_id: params.thread_id,
      status: params.status,
      reason: params.reason ?? null,
      expected_current_status: params.expected_current_status ?? null,
    }, threadDetailRowSchema);
    if (result.status !== "ok") return result;
    return { status: "ok", data: result.data[0] ?? null };
  }
}

export function createProviderInboxAdapter(): ProviderInboxAdapter {
  return new ProviderInboxAdapter(getCrmAccessConfig());
}

export function isTerminalStatus(status: V16ProviderInboxStatus) {
  return status === "RESOLVED" || status === "CANCELLED";
}
