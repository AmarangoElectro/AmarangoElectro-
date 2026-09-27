/** V16 secure RPC session bridge — browser contract for the same-origin route. */
export type V16SecureRpcName =
  "v16_advisor_portfolio_list" |
  "v16_advisor_portfolio_summary" |
  "v16_assign_advisor_client" |
  "v16_cash_movements_list" |
  "v16_cash_summary" |
  "v16_collections_list" |
  "v16_collections_summary" |
  "v16_create_advisor_profile" |
  "v16_create_client" |
  "v16_create_delivery" |
  "v16_confirm_sale" |
  "v16_crm_client_360" |
  "v16_crm_client_sales" |
  "v16_crm_list_clients" |
  "v16_deliveries_list" |
  "v16_delivery_detail" |
  "v16_end_advisor_client_assignment" |
  "v16_get_active_financing_mode" |
  "v16_payment_history_list" |
  "v16_payment_history_summary" |
  "v16_register_customer_payment" |
  "v16_post_cash_movement" |
  "v16_provider_inbox_append_message" |
  "v16_provider_inbox_create_thread" |
  "v16_provider_inbox_thread_detail" |
  "v16_provider_inbox_thread_messages" |
  "v16_provider_inbox_threads_list" |
  "v16_provider_inbox_transition_thread" |
  "v16_provider_unmapped_legacy_labels" |
  "v16_providers_list" |
  "v16_reports_sales_by_month" |
  "v16_reports_sales_by_responsible" |
  "v16_reports_sales_summary" |
  "v16_reverse_cash_movement" |
  "v16_reverse_customer_payment" |
  "v16_set_active_financing_mode" |
  "v16_transition_delivery";

export const V16_SECURE_RPC_ALLOWLIST = Object.freeze([
  "v16_advisor_portfolio_list",
  "v16_advisor_portfolio_summary",
  "v16_assign_advisor_client",
  "v16_cash_movements_list",
  "v16_cash_summary",
  "v16_collections_list",
  "v16_collections_summary",
  "v16_create_advisor_profile",
  "v16_create_client",
  "v16_create_delivery",
  "v16_confirm_sale",
  "v16_crm_client_360",
  "v16_crm_client_sales",
  "v16_crm_list_clients",
  "v16_deliveries_list",
  "v16_delivery_detail",
  "v16_end_advisor_client_assignment",
  "v16_get_active_financing_mode",
  "v16_payment_history_list",
  "v16_payment_history_summary",
  "v16_register_customer_payment",
  "v16_post_cash_movement",
  "v16_provider_inbox_append_message",
  "v16_provider_inbox_create_thread",
  "v16_provider_inbox_thread_detail",
  "v16_provider_inbox_thread_messages",
  "v16_provider_inbox_threads_list",
  "v16_provider_inbox_transition_thread",
  "v16_provider_unmapped_legacy_labels",
  "v16_providers_list",
  "v16_reports_sales_by_month",
  "v16_reports_sales_by_responsible",
  "v16_reports_sales_summary",
  "v16_reverse_cash_movement",
  "v16_reverse_customer_payment",
  "v16_set_active_financing_mode",
  "v16_transition_delivery",
] as const);

export type V16RpcBridgeResult<T> =
  | { status: "ok"; data: T }
  | { status: "unauthenticated" }
  | { status: "unauthorized" }
  | { status: "step_up_required" }
  | { status: "not_connected" }
  | { status: "error"; message: string };

export interface V16SecureRpcBridge {
  call<T>(
    rpc: V16SecureRpcName,
    args: Readonly<Record<string, unknown>>,
  ): Promise<V16RpcBridgeResult<T>>;
}

export const NOT_CONNECTED_SECURE_RPC_BRIDGE: V16SecureRpcBridge = {
  async call<T>(): Promise<V16RpcBridgeResult<T>> {
    return { status: "not_connected" };
  },
};

/**
 * The only browser transport. It sends no Supabase key or user/advisor id.
 * The server derives identity from the authenticated application request.
 */
export const SAME_ORIGIN_SECURE_RPC_BRIDGE: V16SecureRpcBridge = {
  async call<T>(rpc: V16SecureRpcName, args: Readonly<Record<string, unknown>>): Promise<V16RpcBridgeResult<T>> {
    let response: Response;
    try {
      response = await fetch("/api/v16/rpc", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ rpc, args }),
        cache: "no-store",
      });
    } catch {
      return { status: "not_connected" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { status: "error", message: "Secure RPC bridge returned a non-JSON response" };
    }

    if (!payload || typeof payload !== "object" || !("status" in payload)) {
      return { status: "error", message: "Secure RPC bridge returned an invalid response" };
    }
    return payload as V16RpcBridgeResult<T>;
  },
};

export const v16SecureRpcSessionBridgeContract = Object.freeze({
  authenticatedAppSessionRequired: true,
  platformAuthority: "v16_user_access",
  directTableAccessAllowed: false,
  browserCredentialBridgeAllowed: false,
  browserPrivilegedCredentialAllowed: false,
  serverCapabilityCheckRequired: true,
  serverAalCheckRequired: true,
  failClosedWhenIdentityMappingMissing: true,
  failClosedWhenSupabaseUserSessionMissing: true,
  sameOriginServerBoundaryRequired: true,
});
