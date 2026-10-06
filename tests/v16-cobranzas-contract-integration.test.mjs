import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?collections=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const FROZEN_LIST_FIELDS = ["sale_id", "client_id", "client_name", "product_label", "responsible", "sale_date", "installments_total", "installments_paid", "installments_pending", "installment_amount", "next_due_date", "due_source", "collection_status", "data_quality_flags"];
const FROZEN_SUMMARY_FIELDS = ["active_sales", "pending_sales", "pending_installments", "known_amount_pending_sales", "missing_amount_pending_sales", "nominal_pending_amount_known", "overdue_sales", "due_today_sales", "upcoming_sales", "data_incomplete_sales"];

test("Cobranzas contract types match the frozen contract exactly", async () => {
  const contract = await source("lib/collections/collections-contract.ts");
  for (const field of FROZEN_LIST_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `list row missing ${field}`);
  for (const field of FROZEN_SUMMARY_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `summary row missing ${field}`);
  assert.match(contract, /"COMPLETE"/);
  assert.match(contract, /"OVERDUE"/);
  assert.match(contract, /"DUE_TODAY"/);
  assert.match(contract, /"UPCOMING"/);
  assert.match(contract, /"DATA_INCOMPLETE"/);
  assert.match(contract, /"PROJECTED_FROM_SALE_DATE"/);

  const adapter = await source("lib/collections/collections-adapter.ts");
  assert.match(adapter, /"v16_collections_list"/);
  assert.match(adapter, /"v16_collections_summary"/);
});

test("Cobranzas adapter never reads public.ventas/public.clientes and has no mutation method", async () => {
  const adapter = await source("lib/collections/collections-adapter.ts");
  assert.doesNotMatch(adapter, /rest\/v1\/ventas|rest\/v1\/clientes|from\(["']ventas["']\)|from\(["']clientes["']\)/i);
  assert.doesNotMatch(adapter, /\.(?:insert|upsert|update|delete)\s*\(/i);
  assert.match(adapter, /rest\/v1\/rpc\//);
  assert.doesNotMatch(adapter, /createClient/);
  assert.match(adapter, /"not_connected"/);
});

test("Cobranzas registers payments only through the certified payment RPC adapter", async () => {
  const panel = await source("components/internal/admin/collections-panel.tsx");
  const codeOnly = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  assert.match(panel, /createPaymentHistoryAdapter/);
  assert.match(panel, /registerPayment/);
  assert.match(panel, /Registrar pago/);
  assert.match(panel, /Confirmar pago/);
  assert.match(panel, /idempotencyKey/);
  assert.doesNotMatch(codeOnly, /\.from\(|upsert\(|insert\(|update\(|delete\(/);
  assert.doesNotMatch(codeOnly, /whatsapp/i);
  assert.doesNotMatch(codeOnly, /[Cc]obrado este mes|COBRADO ESTE MES/);
  assert.doesNotMatch(codeOnly, /Cliente demo|cliente_demo/i);
  assert.match(panel, /Conexión requerida/);
  assert.match(panel, /Ver Cliente 360/);
});

test("Cobranzas filters match exactly the 4 required statuses plus Todas, no extra invented filter", async () => {
  const panel = await source("components/internal/admin/collections-panel.tsx");
  assert.match(panel, /"Atrasadas".*value:\s*"OVERDUE"/s);
  assert.match(panel, /"Vencen hoy".*value:\s*"DUE_TODAY"/s);
  assert.match(panel, /"Próximas".*value:\s*"UPCOMING"/s);
  assert.match(panel, /"Datos incompletos".*value:\s*"DATA_INCOMPLETE"/s);
});

test("Collections tab is wired only inside /administracion; Home and public catalog are untouched", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /CollectionsPanel/);
  assert.match(workspace, /Cobranzas/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /CollectionsPanel|collections-|v16_collections_/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /CollectionsPanel|collections-|v16_collections_/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /collections/i);
});

test("Production routes render unchanged; /administracion renders the Cobranzas tab and its fail-closed state", async () => {
  const home = await render("/");
  assert.equal(home.status, 200);
  assert.doesNotMatch(await home.text(), /Cobranzas|v16_collections_/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  assert.doesNotMatch(await search.text(), /Cobranzas|v16_collections_/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Cobranzas/);
});
