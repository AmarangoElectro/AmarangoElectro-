import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?advisors=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const SUMMARY_FIELDS = ["advisor_id", "advisor_name", "advisor_active", "active_clients", "historical_assignments", "latest_assignment_at"];
const LIST_FIELDS = ["advisor_id", "advisor_name", "advisor_active", "assignment_id", "client_id", "client_name", "client_locality", "assigned_at", "ended_at", "assignment_active"];
const PROFILE_FIELDS = ["advisor_id", "nombre", "telefono", "email", "localidad", "activo", "creado_at"];
const ASSIGNMENT_FIELDS = ["assignment_id", "advisor_id", "client_id", "assigned_at", "ended_at", "active"];
const LIST_ARGS = ["p_advisor_id", "p_active_only", "p_search_text", "p_row_limit", "p_row_offset"];
const CREATE_ARGS = ["p_nombre", "p_telefono", "p_email", "p_localidad", "p_note"];
const ASSIGN_ARGS = ["p_advisor_id", "p_client_id", "p_assigned_at", "p_note"];
const END_ARGS = ["p_assignment_id", "p_reason", "p_ended_at"];

test("Advisors contract types match the frozen document field-for-field", async () => {
  const contract = await source("lib/advisors/advisors-contract.ts");
  for (const field of SUMMARY_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `summary row missing ${field}`);
  for (const field of LIST_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `list row missing ${field}`);
  for (const field of PROFILE_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `profile row missing ${field}`);
  for (const field of ASSIGNMENT_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `assignment row missing ${field}`);
});

test("Advisors adapter uses exact RPC names; portfolio_summary takes no args, the other four are p_-prefixed", async () => {
  const adapter = await source("lib/advisors/advisors-adapter.ts");
  for (const rpc of ["v16_advisor_portfolio_summary", "v16_advisor_portfolio_list", "v16_create_advisor_profile", "v16_assign_advisor_client", "v16_end_advisor_client_assignment"]) {
    assert.match(adapter, new RegExp(`"${rpc}"`), `adapter missing ${rpc}`);
  }
  const summaryBlock = adapter.slice(adapter.indexOf("async getPortfolioSummary"), adapter.indexOf("async listPortfolio"));
  assert.match(summaryBlock, /"v16_advisor_portfolio_summary",\s*\{\}/);

  const listBlock = adapter.slice(adapter.indexOf("async listPortfolio"), adapter.indexOf("async createProfile"));
  const createBlock = adapter.slice(adapter.indexOf("async createProfile"), adapter.indexOf("async assignClient"));
  const assignBlock = adapter.slice(adapter.indexOf("async assignClient"), adapter.indexOf("async endAssignment"));
  const endBlock = adapter.slice(adapter.indexOf("async endAssignment"));

  for (const arg of LIST_ARGS) assert.match(listBlock, new RegExp(`\\b${arg}:`), `list call missing ${arg}`);
  for (const arg of CREATE_ARGS) assert.match(createBlock, new RegExp(`\\b${arg}:`), `create call missing ${arg}`);
  for (const arg of ASSIGN_ARGS) assert.match(assignBlock, new RegExp(`\\b${arg}:`), `assign call missing ${arg}`);
  for (const arg of END_ARGS) assert.match(endBlock, new RegExp(`\\b${arg}:`), `end call missing ${arg}`);
});

test("Advisors adapter never calls the internal v16_advisor_can_access_client helper, never uses direct tables, has no local-success fake", async () => {
  const adapter = await source("lib/advisors/advisors-adapter.ts");
  const panel = await source("components/internal/admin/advisors-panel.tsx");
  const codeOnly = (adapter + panel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /v16_advisor_can_access_client/);
  assert.doesNotMatch(adapter, /from\(["'](?:v16_advisor_client_portfolio|v16_user_access|v16_advisor_auth_enrollments)["']\)/);
  assert.doesNotMatch(adapter, /createClient/);
  assert.match(adapter, /"not_connected"/);
  assert.doesNotMatch(adapter, /status:\s*"ok".{0,60}data:\s*\{[^}]*advisor_id:\s*params/s);
});

test("Advisors panel does not expose identity link/disable or enrollment-claim actions (no safe user_id/enrollment_id source exists in repo)", async () => {
  const panel = await source("components/internal/admin/advisors-panel.tsx");
  const adapter = await source("lib/advisors/advisors-adapter.ts");
  // strip comments before checking: doc comments legitimately explain why
  // these RPCs/concepts are NOT used, which would otherwise self-trip this check.
  const codeOnly = (panel + adapter).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /v16_link_advisor_identity|v16_disable_advisor_identity|v16_claim_advisor_auth_enrollment/);
  assert.doesNotMatch(codeOnly, /auth\.users|auth\.admin/i);
  assert.doesNotMatch(panel, /type="password"/i);
});

test("Advisors panel never infers portfolio scope from ventas.responsable, name, email or reseller heuristics", async () => {
  const panel = await source("components/internal/admin/advisors-panel.tsx");
  const adapter = await source("lib/advisors/advisors-adapter.ts");
  const codeOnly = (panel + adapter).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /ventas\.responsable/);
});

test("Advisors panel handles step_up_required explicitly for create/assign/end and never bypasses it", async () => {
  const panel = await source("components/internal/admin/advisors-panel.tsx");
  assert.match(panel, /step_up_required/);
  assert.match(panel, /Verificaci[oó]n adicional requerida/);
});

test("Advisors panel requires a mandatory reason to end an assignment and never deletes assignment history", async () => {
  const panel = await source("components/internal/admin/advisors-panel.tsx");
  assert.match(panel, /Motivo para finalizar la asignaci[oó]n \(obligatorio\)/);
  assert.doesNotMatch(panel, /Eliminar asignaci[oó]n|deleteAssignment/i);
  assert.match(panel, /if \(!reason \|\| !reason\.trim\(\)\) return;/);
});

test("Advisors panel uses exact zero-state wording and fail-closed disconnected state", async () => {
  const panel = await source("components/internal/admin/advisors-panel.tsx");
  assert.match(panel, /Todav[ií]a no hay clientes asignados a este asesor\./);
  assert.match(panel, /Todav[ií]a no hay asesores disponibles en la cartera V16\./);
  assert.match(panel, /Datos no conectados en este entorno/);
});

test("Advisors tab is wired only inside /administracion; Home, catalog, CRM, Cobranzas, Payment History, Reports, Provider Inbox, Caja and Entregas are untouched", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /AdvisorsPanel/);
  assert.match(workspace, /DeliveriesPanel/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /AdvisorsPanel|v16_advisor/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /AdvisorsPanel|v16_advisor/i);

  const deliveriesPanel = await source("components/internal/admin/deliveries-panel.tsx");
  assert.doesNotMatch(deliveriesPanel, /v16_advisor/i);

  const cashPanel = await source("components/internal/admin/cash-panel.tsx");
  assert.doesNotMatch(cashPanel, /v16_advisor/i);

  const paymentHistoryPanel = await source("components/internal/admin/payment-history-panel.tsx");
  assert.doesNotMatch(paymentHistoryPanel, /v16_advisor/i);

  const collectionsPanel = await source("components/internal/admin/collections-panel.tsx");
  assert.doesNotMatch(collectionsPanel, /v16_advisor/i);

  const crmClientsPanel = await source("components/internal/admin/crm-clients-panel.tsx");
  assert.doesNotMatch(crmClientsPanel, /v16_advisor/i);

  const providerInboxPanel = await source("components/internal/admin/provider-inbox-panel.tsx");
  assert.doesNotMatch(providerInboxPanel, /v16_advisor/i);

  const reportsPanel = await source("components/internal/admin/reports-panel.tsx");
  assert.doesNotMatch(reportsPanel, /v16_advisor/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /advisor/i);
});

test("Production routes render unchanged; /administracion renders the Asesores tab and its fail-closed state", async () => {
  const home = await render("/");
  assert.equal(home.status, 200);
  assert.doesNotMatch(await home.text(), /v16_advisor|Todav[ií]a no hay asesores disponibles en la cartera V16/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  assert.doesNotMatch(await search.text(), /v16_advisor|Todav[ií]a no hay asesores disponibles en la cartera V16/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Asesores/);
});
