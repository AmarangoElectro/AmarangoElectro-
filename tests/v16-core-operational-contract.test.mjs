import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

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
    "v16_advisor_commission_ledger", "v16_advisor_monthly_closes", "v16_chatgpt_operational_bridge",
  ]) assert.match(sql, new RegExp(`\\b${object}\\b`));
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke execute[\s\S]*anon,authenticated/);
  assert.match(sql, /grant execute[\s\S]*service_role/);
  assert.match(sql, /v16_sale_snapshots_immutable/);
  assert.doesNotMatch(await source("package.json"), /supabase db push|apply_migration/);
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
  for (const field of ["financingMode", "cashPrice", "initialPayment", "installments", "installmentAmount", "financedTotal", "commission", "commissionPolicyVersion", "pricingPolicyVersion", "soldAt"]) {
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
  assert.match(sql, /s\.client_id\s+is\s+distinct\s+from\s+p_client_id/i);
  assert.match(sql, /s\.authorized_quote_id\s+is\s+distinct\s+from\s+p_authorized_quote_id/i);
  assert.match(sql, /s\.source\s+is\s+distinct\s+from\s+p_source/i);
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

test("advisor close evaluates active append-only payment events as of the close timestamp", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /p\.payment_kind='PAYMENT'/);
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
