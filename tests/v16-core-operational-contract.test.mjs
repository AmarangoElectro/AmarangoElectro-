import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

function interfaceBody(text, name) {
  const match = text.match(new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `missing interface ${name}`);
  return match[1];
}

test("same-origin operational bridge derives identity server-side and exposes no privileged browser credential", async () => {
  const route = await source("app/api/v16/rpc/route.ts");
  const browser = await source("lib/internal/auth/secure-rpc-session-bridge-contract.ts");
  assert.match(route, /getChatGPTUser/);
  assert.match(route, /v16_chatgpt_operational_bridge/);
  assert.match(route, /p_email:\s*user\.email/);
  assert.match(route, /p_aal:\s*"aal1"/);
  assert.match(route, /step_up_required/);
  assert.doesNotMatch(browser, /SUPABASE_SECRET_KEY|service_role|p_email/);
  assert.doesNotMatch(browser, /localStorage|advisor_id/);
});

test("browser sale contract cannot supply advisor identity or authoritative totals", async () => {
  const sale = await source("lib/sales/sale-operational-contract.ts");
  const request = sale.slice(sale.indexOf("export interface V16ConfirmSaleParams"), sale.indexOf("export interface V16ConfirmedSaleRow"));
  assert.match(request, /authorizedQuoteId/);
  assert.doesNotMatch(request, /advisorId|cashPrice|financedTotal|commission|installmentAmount/);
  assert.match(sale, /serverAuthorizedQuoteRequired:\s*true/);
  assert.match(sale, /immutableCommercialSnapshotRequired:\s*true/);
});

test("consolidated migration is prepared but not wired into runtime migration execution", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  for (const object of [
    "v16_create_client", "v16_get_active_financing_mode", "v16_set_active_financing_mode",
    "v16_authorized_sale_quotes", "v16_confirm_sale", "v16_sale_snapshots",
    "v16_advisor_commission_ledger", "v16_advisor_monthly_closes",
    "v16_advisor_monthly_close_operations", "v16_chatgpt_operational_bridge",
  ]) assert.match(sql, new RegExp(`\\b${object}\\b`));
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke execute[\s\S]*anon,authenticated/);
  assert.match(sql, /grant execute[\s\S]*service_role/);
  assert.match(sql, /v16_sale_snapshots_immutable/);
  assert.match(sql, /v16_financing_mode_history_immutable/);
  assert.doesNotMatch(await source("package.json"), /supabase db push|apply_migration/);
});

test("write idempotency serializes retries and rejects the same key with another payload", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /v16_operational_idempotency_guard/);
  assert.match(sql, /on conflict \(idempotency_key\) do nothing/);
  assert.match(sql, /payload_fingerprint<>v_fingerprint/);
  assert.match(sql, /v_claim\.payload_fingerprint<>v_fingerprint/);
  assert.match(sql, /pg_advisory_xact_lock[\s\S]*v16-client-request:/);
  assert.match(sql, /pg_advisory_xact_lock[\s\S]*v16-confirm-sale:/);
  assert.match(sql, /v_existing\.authorized_quote_id is distinct from p_authorized_quote_id/);
  for (const rpc of ["v16_register_customer_payment", "v16_reverse_customer_payment", "v16_confirm_sale"]) {
    assert.match(sql, new RegExp(`v16_core_claim_idempotency[\\s\\S]*${rpc}`));
  }
});

test("advisor writes are bound to canonical portfolio and newly-created clients are assigned server-side", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /v16_advisor_can_access_client\(btrim\(p_client_id\)\)/);
  assert.match(sql, /advisor_client_scope_denied/);
  assert.match(sql, /client_duplicate_outside_advisor_scope/);
  assert.match(sql, /insert into public\.v16_advisor_client_portfolio/);
  assert.match(sql, /v_advisor uuid := public\.v16_current_advisor_id\(\)/);
});

test("payment write cannot accept a browser client id and reversal remains an append-only event", async () => {
  const payment = await source("lib/payments/payment-history-contract.ts");
  const register = interfaceBody(payment, "V16RegisterCustomerPaymentParams");
  const reversal = interfaceBody(payment, "V16ReverseCustomerPaymentResult");
  assert.match(register, /saleId/);
  assert.doesNotMatch(register, /clientId|client_id/);
  assert.match(reversal, /reversal_payment_id/);
  assert.match(reversal, /original_payment_id/);
  assert.match(reversal, /amount_reversed/);
});

test("operational DTO rows omit private commercial and investor fields", async () => {
  const [sale, crm, payment, delivery] = await Promise.all([
    source("lib/sales/sale-operational-contract.ts"),
    source("lib/crm/client-crm-contract.ts"),
    source("lib/payments/payment-history-contract.ts"),
    source("lib/deliveries/deliveries-contract.ts"),
  ]);
  const exposed = [
    interfaceBody(sale, "V16ConfirmedSaleRow"),
    interfaceBody(crm, "V16CrmClientListRow"),
    interfaceBody(crm, "V16CrmClient360Row"),
    interfaceBody(crm, "V16CrmClientSaleRow"),
    interfaceBody(payment, "V16PaymentHistoryRow"),
    interfaceBody(delivery, "V16DeliveryRow"),
  ].join("\n");
  assert.doesNotMatch(exposed, /\b(?:cost|cost_|markup|profit|supplier|investor|costo|ganancia|proveedor|inversor|inversionista|inversores)\b/i);
});

test("CLASSIC snapshots stay immutable after future financing-mode changes", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /financing_mode text not null check \(financing_mode in \('CLASSIC','PROTECTED'\)\)/);
  assert.match(sql, /v16_sale_snapshots_immutable before update or delete/);
  assert.match(sql, /insert into public\.v16_financing_mode_history/);
  assert.doesNotMatch(sql, /update public\.v16_sale_snapshots[\s\S]*financing_mode/i);
});

test("payment, delivery and CRM adapters select the same-origin bridge when direct config is absent", async () => {
  for (const file of [
    "lib/crm/client-crm-adapter.ts", "lib/collections/collections-adapter.ts",
    "lib/payments/payment-history-adapter.ts", "lib/deliveries/deliveries-adapter.ts",
  ]) {
    const adapter = await source(file);
    assert.match(adapter, /SAME_ORIGIN_SECURE_RPC_BRIDGE/);
    assert.doesNotMatch(adapter, /SUPABASE_SECRET_KEY/);
  }
});

test("commercial snapshot freezes financing, pricing and commission versions", async () => {
  const snapshot = await source("lib/integration/sale-snapshot.ts");
  for (const field of ["financingMode", "cashPrice", "initialPayment", "installments", "installmentAmount", "financedTotal", "paymentSchedule", "commission", "commissionPolicyVersion", "pricingPolicyVersion", "soldAt"]) {
    assert.match(snapshot, new RegExp(`\\b${field}\\b`));
  }
  assert.match(snapshot, /Object\.freeze/);
});

test("prepared operational SQL uses the canonical stored V16 role vocabulary", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.doesNotMatch(sql, /v_role\s*=\s*['"]advisor['"]/);
  assert.doesNotMatch(sql, /v_role\s*=\s*['"]customer['"]/);
  assert.match(sql, /v_role\s*=\s*['"]asesor['"]/);
  assert.match(sql, /v_role\s+in\s*\(['"]owner['"],['"]admin['"]\)/);
});

test("sale idempotency rejects a reused key with a different client quote or source", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /idempotency_key_conflict/);
  assert.match(sql, /v_existing\.client_id\s+is\s+distinct\s+from\s+btrim\(p_client_id\)/i);
  assert.match(sql, /v_existing\.authorized_quote_id\s+is\s+distinct\s+from\s+p_authorized_quote_id/i);
  assert.match(sql, /v_existing\.source\s+is\s+distinct\s+from\s+btrim\(p_source\)/i);
});

test("monthly advisor close is fail-closed until delivery and collection facts are resolved", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /v16_advisor_operation_close_fact/);
  assert.match(sql, /v_delivery\.status<>'ENTREGADA'/);
  assert.match(sql, /Financiación en mora al cierre/);
  assert.match(sql, /Cobranza pendiente de validación/);
  assert.match(sql, /advisor_month_has_pending_operations/);
  assert.match(sql, /v16_advisor_monthly_close_operations/);
  assert.match(sql, /validation in \('ACCEPTED','EXCLUDED'\)/);
  assert.match(sql, /floor\(v_equiv-20\)\*7500/);
});

test("advisor close evaluates immutable schedule and append-only payment events at close time", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /p\.payment_kind='PAYMENT'/);
  assert.match(sql, /p\.contractual_amount=v_expected_amount/);
  assert.match(sql, /p\.paid_at<=p_close_at/);
  assert.match(sql, /r\.reverses_payment_id=p\.payment_id/);
  assert.match(sql, /r\.paid_at<=p_close_at/);
  assert.match(sql, /America\/Argentina\/Buenos_Aires/);
});

test("application role contract explicitly normalizes stored asesor and cliente roles", async () => {
  const auth = await source("lib/internal/auth/user-access-contract.ts");
  assert.match(auth, /V16StoredPlatformRole = "owner" \| "admin" \| "asesor" \| "cliente"/);
  assert.match(auth, /role === "asesor"\) return "advisor"/);
  assert.match(auth, /role === "cliente"\) return "customer"/);
});

test("new V16 payment and delivery writes derive client scope from the sale", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /v16_register_customer_payment\(p_args->>'p_sale_id'/);
  assert.match(sql, /v16_create_delivery\(p_args->>'p_sale_id'/);
  assert.doesNotMatch(sql, /v16_register_customer_payment\([^;\n]*p_client_id/);
  assert.doesNotMatch(sql, /v16_create_delivery\([^;\n]*p_client_id/);
});
