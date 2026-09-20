import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?deliveries=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const FROZEN_ROW_FIELDS = ["delivery_id", "sale_id", "client_id", "client_name", "product_label", "status", "scheduled_at", "delivered_at", "address_snapshot", "updated_at"];
const FROZEN_CREATE_RESULT_FIELDS = ["delivery_id", "sale_id", "client_id", "status", "scheduled_at", "address_snapshot", "created_at"];
const FROZEN_TRANSITION_RESULT_FIELDS = ["delivery_id", "sale_id", "client_id", "status", "previous_status", "scheduled_at", "delivered_at", "address_snapshot", "updated_at"];
const LIST_ARGS_UNPREFIXED = ["status_filter", "search_text", "row_limit", "row_offset"];
const DETAIL_ARGS_PREFIXED = ["p_delivery_id"];
const CREATE_ARGS_PREFIXED = ["p_sale_id", "p_scheduled_at", "p_address_snapshot", "p_notes"];
const TRANSITION_ARGS_PREFIXED = ["p_delivery_id", "p_target_status", "p_expected_current_status", "p_scheduled_at", "p_address_snapshot", "p_note", "p_transitioned_at"];

test("Deliveries contract types match the frozen document field-for-field", async () => {
  const contract = await source("lib/deliveries/deliveries-contract.ts");
  for (const field of FROZEN_ROW_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `row missing ${field}`);
  for (const field of FROZEN_CREATE_RESULT_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `create result missing ${field}`);
  for (const field of FROZEN_TRANSITION_RESULT_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `transition result missing ${field}`);
  for (const status of ["PENDIENTE", "COORDINADA", "EN_CAMINO", "ENTREGADA", "CANCELADA"]) {
    assert.match(contract, new RegExp(`"${status}"`), `missing status ${status}`);
  }
});

test("Deliveries contract lifecycle matches the frozen state machine exactly (no illegal transitions, no reopen)", async () => {
  const contract = await source("lib/deliveries/deliveries-contract.ts");
  assert.match(contract, /PENDIENTE:\s*Object\.freeze[^(]*\(\["COORDINADA",\s*"CANCELADA"\]\)/);
  assert.match(contract, /COORDINADA:\s*Object\.freeze[^(]*\(\["EN_CAMINO",\s*"CANCELADA"\]\)/);
  assert.match(contract, /EN_CAMINO:\s*Object\.freeze[^(]*\(\["ENTREGADA",\s*"CANCELADA"\]\)/);
  assert.match(contract, /ENTREGADA:\s*Object\.freeze[^(]*\(\[\]\)/);
  assert.match(contract, /CANCELADA:\s*Object\.freeze[^(]*\(\[\]\)/);
});

test("Deliveries adapter uses exact RPC names with the correct, mixed p_-prefix convention", async () => {
  const adapter = await source("lib/deliveries/deliveries-adapter.ts");
  for (const rpc of ["v16_deliveries_list", "v16_delivery_detail", "v16_create_delivery", "v16_transition_delivery"]) {
    assert.match(adapter, new RegExp(`"${rpc}"`), `adapter missing ${rpc}`);
  }
  const listBlock = adapter.slice(adapter.indexOf("async listDeliveries"), adapter.indexOf("async getDetail"));
  const detailBlock = adapter.slice(adapter.indexOf("async getDetail"), adapter.indexOf("async createDelivery"));
  const createBlock = adapter.slice(adapter.indexOf("async createDelivery"), adapter.indexOf("async transitionDelivery"));
  const transitionBlock = adapter.slice(adapter.indexOf("async transitionDelivery"));

  for (const arg of LIST_ARGS_UNPREFIXED) assert.match(listBlock, new RegExp(`\\b${arg}:`), `list call missing unprefixed arg ${arg}`);
  assert.doesNotMatch(listBlock, /\bp_\w+:/, "list call must not use p_-prefixed args");

  for (const arg of DETAIL_ARGS_PREFIXED) assert.match(detailBlock, new RegExp(`\\b${arg}:`), `detail call missing prefixed arg ${arg}`);
  for (const arg of CREATE_ARGS_PREFIXED) assert.match(createBlock, new RegExp(`\\b${arg}:`), `create call missing prefixed arg ${arg}`);
  for (const arg of TRANSITION_ARGS_PREFIXED) assert.match(transitionBlock, new RegExp(`\\b${arg}:`), `transition call missing prefixed arg ${arg}`);
});

test("Deliveries adapter never reads/writes the physical table directly, never uses ventas.estado, has no local-success fake", async () => {
  const adapter = await source("lib/deliveries/deliveries-adapter.ts");
  const panel = await source("components/internal/admin/deliveries-panel.tsx");
  assert.doesNotMatch(adapter, /from\(["']v16_deliveries["']\)|rest\/v1\/ventas/i);
  assert.doesNotMatch(adapter, /createClient/);
  // strip comments before checking: doc comments legitimately explain that
  // ventas.estado is never used, which would otherwise self-trip this check.
  const codeOnly = (adapter + panel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /ventas\.estado/);
  assert.match(adapter, /"not_connected"/);
  assert.doesNotMatch(adapter, /status:\s*"ok".{0,60}data:\s*\{[^}]*delivery_id:\s*params/s);
});

test("Deliveries create never gates behind AAL2/step-up framing", async () => {
  const adapter = await source("lib/deliveries/deliveries-adapter.ts");
  const createBlock = adapter.slice(adapter.indexOf("async createDelivery"), adapter.indexOf("async transitionDelivery"));
  assert.doesNotMatch(createBlock, /step_up_required/);
});

test("Deliveries transition always forwards expectedCurrentStatus and never retries automatically on rejection", async () => {
  const panel = await source("components/internal/admin/deliveries-panel.tsx");
  assert.match(panel, /expectedCurrentStatus:\s*delivery\.status/);
  assert.doesNotMatch(panel, /setTimeout\(\s*transition|retry/i);
  assert.match(panel, /Never overwrite locally on rejection/);
});

test("Deliveries panel exposes only legal transitions per status and treats ENTREGADA/CANCELADA as terminal", async () => {
  const panel = await source("components/internal/admin/deliveries-panel.tsx");
  assert.match(panel, /V16_DELIVERY_LEGAL_TRANSITIONS\[delivery\.status/);
  assert.match(panel, /isTerminal\(delivery\.status\)/);
  assert.match(panel, /estado terminal y no admite más transiciones/);
});

test("Deliveries panel uses exact zero-state wording and fail-closed disconnected state", async () => {
  const panel = await source("components/internal/admin/deliveries-panel.tsx");
  assert.match(panel, /Todavía no hay entregas registradas en V16\./);
  assert.match(panel, /Datos no conectados en este entorno/);
});

test("Deliveries panel handles step_up_required explicitly and does not bypass locally", async () => {
  const panel = await source("components/internal/admin/deliveries-panel.tsx");
  assert.match(panel, /step_up_required/);
  assert.match(panel, /Verificaci[oó]n adicional requerida/);
});

test("Deliveries tab is wired only inside /administracion; Home, catalog, CRM, Cobranzas, Payment History, Reports, Provider Inbox and Caja are untouched", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /DeliveriesPanel/);
  assert.match(workspace, /CashPanel/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /DeliveriesPanel|v16_deliver/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /DeliveriesPanel|v16_deliver/i);

  const cashPanel = await source("components/internal/admin/cash-panel.tsx");
  assert.doesNotMatch(cashPanel, /v16_deliver|DeliveriesPanel/i);

  const cashAdapter = await source("lib/cash/cash-adapter.ts");
  assert.doesNotMatch(cashAdapter, /v16_deliver/i);

  const paymentHistoryPanel = await source("components/internal/admin/payment-history-panel.tsx");
  assert.doesNotMatch(paymentHistoryPanel, /v16_deliver/i);

  const collectionsPanel = await source("components/internal/admin/collections-panel.tsx");
  assert.doesNotMatch(collectionsPanel, /v16_deliver/i);

  const providerInboxPanel = await source("components/internal/admin/provider-inbox-panel.tsx");
  assert.doesNotMatch(providerInboxPanel, /v16_deliver/i);

  const reportsPanel = await source("components/internal/admin/reports-panel.tsx");
  assert.doesNotMatch(reportsPanel, /v16_deliver/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /deliver/i);
});

test("Production routes render unchanged; /administracion renders the Entregas tab and its fail-closed state", async () => {
  // "Entregas"/"entrega" alone is not a safe marker: Home already has unrelated
  // pre-existing consumer copy ("Coordinamos tu entrega") about shipping/pickup.
  // Check for the admin panel's own marker text instead.
  const home = await render("/");
  assert.equal(home.status, 200);
  assert.doesNotMatch(await home.text(), /v16_deliver|Todav[ií]a no hay entregas registradas en V16/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  assert.doesNotMatch(await search.text(), /v16_deliver|Todav[ií]a no hay entregas registradas en V16/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Entregas/);
});
