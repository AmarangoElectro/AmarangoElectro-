/**
 * V16 secure RPC session bridge — SOURCE-ONLY PREFLIGHT CONTRACT.
 *
 * This file does not connect Supabase and contains no credentials.
 * Browser code must never receive a privileged database credential as a
 * workaround for the missing session bridge.
 */
export type V16SecureRpcName =
  "v16_advisor_portfolio_list" |
  "v16_advisor_portfolio_summary" |
  "v16_assign_advisor_client" |
  "v16_cash_movements_list" |
  "v16_cash_summary" |
  "v16_collections_list" |
  "v16_collections_summary" |
  "v16_create_advisor_profile" |
  "v16_create_delivery" |
  "v16_crm_client_360" |
  "v16_crm_client_sales" |
  "v16_crm_list_clients" |
  "v16_deliveries_list" |
  "v16_delivery_detail" |
  "v16_end_advisor_client_assignment" |
  "v16_payment_history_list" |
  "v16_payment_history_summary" |
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
  "v16_create_delivery",
  "v16_crm_client_360",
  "v16_crm_client_sales",
  "v16_crm_list_clients",
  "v16_deliveries_list",
  "v16_delivery_detail",
  "v16_end_advisor_client_assignment",
  "v16_payment_history_list",
  "v16_payment_history_summary",
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
