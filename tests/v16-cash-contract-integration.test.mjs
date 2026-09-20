import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?cash=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const FROZEN_LIST_FIELDS = ["movement_id", "occurred_at", "movement_type", "direction", "amount", "sale_id", "client_id", "client_name", "source_reference", "reverses_movement_id", "created_at"];
const FROZEN_SUMMARY_FIELDS = ["total_in", "total_out", "net_balance", "movement_count", "customer_payment_in", "supplier_purchase_out", "investor_payout_out", "reseller_payout_out", "delivery_expense_out", "operating_expense_out", "reversal_in", "reversal_out"];
const FROZEN_POST_RESULT_FIELDS = ["movement_id", "amount", "client_id", "direction", "movement_type", "occurred_at", "sale_id", "source_reference", "created_at"];
const FROZEN_REVERSE_RESULT_FIELDS = ["original_movement_id", "reversal_movement_id", "amount", "client_id", "direction", "movement_type", "occurred_at", "sale_id", "source_reference", "created_at"];
const LIST_ARGS_UNPREFIXED = ["direction_filter", "movement_type_filter", "period_from", "period_to", "search_text", "row_limit", "row_offset"];
const SUMMARY_ARGS_UNPREFIXED = ["period_from", "period_to"];
const POST_ARGS_PREFIXED = ["p_movement_type", "p_amount", "p_occurred_at", "p_source_reference", "p_sale_id", "p_client_id", "p_note", "p_idempotency_key"];
const REVERSE_ARGS_PREFIXED = ["p_movement_id", "p_reason", "p_reversed_at", "p_idempotency_key"];
const NEVER_EXPOSED = ["created_by", "idempotency_key", "metadata", "note"];
const FORBIDDEN_WORDING = ["Saldo bancario", "Saldo actual", "Saldo disponible", "Dinero en banco", "Efectivo disponible", "\\bGanancia\\b", "\\bMargen\\b", "Balance contable", "Conciliaci[oó]n bancaria"];

test("Cash contract types match the frozen document field-for-field", async () => {
  const contract = await source("lib/cash/cash-contract.ts");
  for (const field of FROZEN_LIST_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `list row missing ${field}`);
  for (const field of FROZEN_SUMMARY_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `summary row missing ${field}`);
  for (const field of FROZEN_POST_RESULT_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `post result row missing ${field}`);
  for (const field of FROZEN_REVERSE_RESULT_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `reverse result row missing ${field}`);
  for (const type of ["CUSTOMER_PAYMENT", "OWNER_CAPITAL_IN", "INVESTOR_CAPITAL_IN", "OTHER_IN", "SUPPLIER_PURCHASE", "INVESTOR_PAYOUT", "RESELLER_PAYOUT", "DELIVERY_EXPENSE", "OPERATING_EXPENSE", "OTHER_OUT", "REVERSAL"]) {
    assert.match(contract, new RegExp(`"${type}"`), `missing movement type ${type}`);
  }
});

test("Cash adapter uses exact RPC names with the correct, asymmetric p_-prefix convention", async () => {
  const adapter = await source("lib/cash/cash-adapter.ts");
  for (const rpc of ["v16_cash_movements_list", "v16_cash_summary", "v16_post_cash_movement", "v16_reverse_cash_movement"]) {
    assert.match(adapter, new RegExp(`"${rpc}"`), `adapter missing ${rpc}`);
  }
  for (const arg of LIST_ARGS_UNPREFIXED) assert.match(adapter, new RegExp(`\\b${arg}:`), `list call missing unprefixed arg ${arg}`);
  for (const arg of SUMMARY_ARGS_UNPREFIXED) assert.match(adapter, new RegExp(`\\b${arg}:`), `summary call missing unprefixed arg ${arg}`);
  for (const arg of POST_ARGS_PREFIXED) assert.match(adapter, new RegExp(`\\b${arg}:`), `post call missing prefixed arg ${arg}`);
  for (const arg of REVERSE_ARGS_PREFIXED) assert.match(adapter, new RegExp(`\\b${arg}:`), `reverse call missing prefixed arg ${arg}`);
  // the read RPCs must never receive p_-prefixed args
  const listBlock = adapter.slice(adapter.indexOf("async listMovements"), adapter.indexOf("async getSummary"));
  const summaryBlock = adapter.slice(adapter.indexOf("async getSummary"), adapter.indexOf("async postMovement"));
  assert.doesNotMatch(listBlock, /\bp_\w+:/, "list call must not use p_-prefixed args");
  assert.doesNotMatch(summaryBlock, /\bp_\w+:/, "summary call must not use p_-prefixed args");
});

test("Cash adapter never sends direction on post, never reads the physical table directly, has no local-success fake", async () => {
  const adapter = await source("lib/cash/cash-adapter.ts");
  assert.doesNotMatch(adapter, /p_direction\s*:/);
  assert.doesNotMatch(adapter, /rest\/v1\/ventas|from\(["']v16_cash_movements["']\)/i);
  assert.doesNotMatch(adapter, /createClient/);
  assert.match(adapter, /"not_connected"/);
  assert.doesNotMatch(adapter, /status:\s*"ok".{0,60}data:\s*\{[^}]*movement_id:\s*params/s);
});

test("Cash contract never exposes fields the list RPC does not return", async () => {
  const contract = await source("lib/cash/cash-contract.ts");
  const adapter = await source("lib/cash/cash-adapter.ts");
  const panel = await source("components/internal/admin/cash-panel.tsx");
  for (const field of NEVER_EXPOSED) {
    assert.match(contract, new RegExp(field), `contract should document ${field} as never-exposed`);
  }
  // the movement-row zod schema in the adapter must stay strict and must not declare these fields
  const schemaBlock = adapter.slice(adapter.indexOf("const movementRowSchema"), adapter.indexOf("const summaryRowSchema"));
  for (const field of NEVER_EXPOSED) assert.doesNotMatch(schemaBlock, new RegExp(`\\b${field}\\b`), `movement row schema must not declare ${field}`);
  const panelCodeOnly = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(panelCodeOnly, /\btotal_count\b/);
});

test("Cash panel never uses bank-balance/profit/margin wording and always frames net_balance as Neto registrado", async () => {
  const panel = await source("components/internal/admin/cash-panel.tsx");
  const codeOnly = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  for (const term of FORBIDDEN_WORDING) assert.doesNotMatch(codeOnly, new RegExp(term, "i"), `must never render "${term}"`);
  assert.match(panel, /Neto registrado/i);
  assert.match(panel, /Entradas registradas/i);
  assert.match(panel, /Salidas registradas/i);
  assert.match(panel, /Todavía no hay movimientos registrados en Caja V16/);
  assert.match(panel, /Datos no conectados en este entorno/);
});

test("Cash panel reversal UX creates a linked movement, never deletes, requires a reason, and never offers reversal of a REVERSAL row", async () => {
  const panel = await source("components/internal/admin/cash-panel.tsx");
  assert.doesNotMatch(panel, /Eliminar movimiento|Borrar movimiento|deleteMovement/i);
  assert.match(panel, /Revertir movimiento/);
  assert.match(panel, /movement\.movement_type !== "REVERSAL"/);
  assert.match(panel, /disabled={submitting \|\| !reason\.trim\(\)}/);
});

test("Cash panel handles step_up_required explicitly and does not bypass locally", async () => {
  const panel = await source("components/internal/admin/cash-panel.tsx");
  assert.match(panel, /step_up_required/);
  assert.match(panel, /Verificaci[oó]n adicional requerida/);
});

test("Cash panel manual-post type options exclude CUSTOMER_PAYMENT and REVERSAL (reserved for the canonical Payment/reverse flows)", async () => {
  const contract = await source("lib/cash/cash-contract.ts");
  const manualBlock = contract.slice(contract.indexOf("V16_CASH_MANUAL_POST_TYPES"), contract.indexOf("V16_CASH_MOVEMENT_TYPE_LABEL"));
  assert.doesNotMatch(manualBlock, /"CUSTOMER_PAYMENT"/);
  assert.doesNotMatch(manualBlock, /"REVERSAL"/);
});

test("Cash tab is wired only inside /administracion; Home, catalog, CRM, Cobranzas, Payment History, Reports and Provider Inbox are untouched", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /CashPanel/);
  assert.match(workspace, /CrmClientsPanel/);
  assert.match(workspace, /CollectionsPanel/);
  assert.match(workspace, /ReportsPanel/);
  assert.match(workspace, /ProvidersAreaPanel/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /CashPanel|v16_cash/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /CashPanel|v16_cash/i);

  const paymentHistoryPanel = await source("components/internal/admin/payment-history-panel.tsx");
  assert.doesNotMatch(paymentHistoryPanel, /v16_cash|CashPanel/i);

  const collectionsPanel = await source("components/internal/admin/collections-panel.tsx");
  assert.doesNotMatch(collectionsPanel, /v16_cash|CashPanel/i);

  const providerInboxPanel = await source("components/internal/admin/provider-inbox-panel.tsx");
  assert.doesNotMatch(providerInboxPanel, /v16_cash/i);

  const reportsPanel = await source("components/internal/admin/reports-panel.tsx");
  assert.doesNotMatch(reportsPanel, /v16_cash/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /cash/i);
});

test("Production routes render unchanged; /administracion renders the Caja tab and its fail-closed state", async () => {
  const home = await render("/");
  assert.equal(home.status, 200);
  assert.doesNotMatch(await home.text(), /Caja \/ Movimientos|v16_cash/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  assert.doesNotMatch(await search.text(), /Caja \/ Movimientos|v16_cash/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Caja/);
});
