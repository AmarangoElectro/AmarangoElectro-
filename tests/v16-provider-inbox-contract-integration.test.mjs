import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?providers=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const FROZEN_PROVIDER_FIELDS = ["provider_id", "provider_key", "canonical_name", "active", "alias_count", "product_count", "sales_attribution_count", "data_quality_flags"];
const FROZEN_THREAD_LIST_FIELDS = ["thread_id", "provider_id", "provider_name", "subject", "status", "priority", "opened_at", "resolved_at", "reference_text", "updated_at", "last_message_at", "message_count"];
const FROZEN_THREAD_DETAIL_FIELDS = ["thread_id", "provider_id", "provider_name", "subject", "status", "priority", "opened_at", "resolved_at", "reference_text", "created_at", "updated_at", "message_count", "last_message_at"];
const FROZEN_MESSAGE_FIELDS = ["message_id", "thread_id", "message_kind", "body", "occurred_at", "external_reference", "created_at", "created_by"];
const FORBIDDEN_TERMS = ["Saldo del proveedor", "Cuenta corriente", "Deuda con proveedor", "Orden de compra", "Fecha de pago proveedor", "Mercader[ií]a recibida", "Estado de env[ií]o proveedor", "Ganancia.{0,10}proveedor", "margen.{0,10}proveedor"];

test("Provider Inbox contract types match the frozen document field-for-field", async () => {
  const contract = await source("lib/providers/provider-inbox-contract.ts");
  for (const field of FROZEN_PROVIDER_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `provider row missing ${field}`);
  for (const field of FROZEN_THREAD_LIST_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `thread list row missing ${field}`);
  for (const field of FROZEN_THREAD_DETAIL_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `thread detail row missing ${field}`);
  for (const field of FROZEN_MESSAGE_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `message row missing ${field}`);
  assert.match(contract, /"OPEN"/);
  assert.match(contract, /"WAITING_PROVIDER"/);
  assert.match(contract, /"WAITING_US"/);
  assert.match(contract, /"RESOLVED"/);
  assert.match(contract, /"CANCELLED"/);
  assert.match(contract, /"LOW"/);
  assert.match(contract, /"NORMAL"/);
  assert.match(contract, /"HIGH"/);
  assert.match(contract, /"URGENT"/);
  assert.match(contract, /"OUTBOUND_NOTE"/);
  assert.match(contract, /"INBOUND_NOTE"/);
  assert.match(contract, /"INTERNAL_NOTE"/);

  const adapter = await source("lib/providers/provider-inbox-adapter.ts");
  for (const rpc of ["v16_providers_list", "v16_provider_unmapped_legacy_labels", "v16_provider_inbox_threads_list", "v16_provider_inbox_thread_detail", "v16_provider_inbox_thread_messages", "v16_provider_inbox_create_thread", "v16_provider_inbox_append_message", "v16_provider_inbox_transition_thread"]) {
    assert.match(adapter, new RegExp(`"${rpc}"`), `adapter missing ${rpc}`);
  }
});

test("Provider Inbox adapter never reads legacy tables/mensajes, never falls back to catalog.read/write, has no local-success fake", async () => {
  const adapter = await source("lib/providers/provider-inbox-adapter.ts");
  assert.doesNotMatch(adapter, /rest\/v1\/ventas|rest\/v1\/mensajes|from\(["'](?:ventas|mensajes|proveedores)["']\)/i);
  assert.doesNotMatch(adapter, /catalog\.read|catalog\.write/);
  assert.doesNotMatch(adapter, /createClient/);
  assert.match(adapter, /"not_connected"/);
  // write methods must return the parsed server response, never a locally constructed "success" object.
  assert.doesNotMatch(adapter, /status:\s*"ok".{0,40}data:\s*\{[^}]*thread_id:\s*params/s);
});

test("Provider Inbox UI never invents an unmapped-labels row shape, never fabricates demo providers/threads, and labels sales attribution correctly", async () => {
  const providersPanel = await source("components/internal/admin/providers-panel.tsx");
  const providersPanelCodeOnly = providersPanel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(providersPanelCodeOnly, /Stagliano|Mega Electro|\bSofj\b|Women Buenos Aires|New Red/); // no hardcoded certified-sample providers as demo fixtures
  assert.match(providersPanel, /Ventas atribuidas/);
  assert.doesNotMatch(providersPanelCodeOnly, /Compras|Saldo proveedor|\bDeuda\b|Cuenta corriente/i);
  assert.match(providersPanel, /Datos no conectados en este entorno/);

  const inboxPanel = await source("components/internal/admin/provider-inbox-panel.tsx");
  const codeOnly = inboxPanel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  for (const term of FORBIDDEN_TERMS) assert.doesNotMatch(codeOnly, new RegExp(term, "i"), `must never render "${term}"`);
  assert.doesNotMatch(codeOnly, /WhatsApp|enviado.{0,10}entregado|le[ií]do/i);
  assert.match(inboxPanel, /Todavía no hay seguimientos abiertos con proveedores/);
  assert.match(inboxPanel, /Datos no conectados en este entorno/);
});

test("Provider Inbox messages are append-only in the UI (no edit/delete controls)", async () => {
  const inboxPanel = await source("components/internal/admin/provider-inbox-panel.tsx");
  assert.doesNotMatch(inboxPanel, /Editar nota|Eliminar nota|deleteMessage|editMessage/i);
});

test("Provider Inbox UI respects terminal-status and aal2 step-up handling from the frozen contract", async () => {
  const inboxPanel = await source("components/internal/admin/provider-inbox-panel.tsx");
  assert.match(inboxPanel, /isTerminalStatus/);
  assert.match(inboxPanel, /step_up_required|Verificación adicional/);
  assert.match(inboxPanel, /cerrado y no puede reabrirse/);
});

test("Providers/Provider Inbox tabs are wired only inside /administracion; Home, catalog, CRM, Cobranzas and Reports are untouched", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /ProvidersAreaPanel/);
  assert.match(workspace, /CrmClientsPanel/);
  assert.match(workspace, /CollectionsPanel/);
  assert.match(workspace, /ReportsPanel/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /ProvidersAreaPanel|ProviderInboxPanel|v16_provider/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /ProvidersAreaPanel|ProviderInboxPanel|v16_provider/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /provider/i);
});

test("Production routes render unchanged; /administracion renders the Proveedores tab and its fail-closed state", async () => {
  const home = await render("/");
  assert.equal(home.status, 200);
  assert.doesNotMatch(await home.text(), /Proveedores|v16_provider/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  assert.doesNotMatch(await search.text(), /Proveedores|v16_provider/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Proveedores/);
});
