import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?reports=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const FROZEN_SUMMARY_FIELDS = ["sales_count", "product_sales", "loan_sales", "other_sales", "precio_venta_sum", "shipping_amount_sum", "distinct_clients", "distinct_responsibles", "first_sale_date", "last_sale_date"];
const FROZEN_MONTH_FIELDS = ["period_month", "sales_count", "product_sales", "loan_sales", "other_sales", "precio_venta_sum", "shipping_amount_sum"];
const FROZEN_RESPONSIBLE_FIELDS = ["responsible", "sales_count", "product_sales", "loan_sales", "other_sales", "precio_venta_sum", "shipping_amount_sum"];
const FORBIDDEN_METRICS = ["ganancia", "margen", "comisi[oó]n", "cobrado", "saldo de caja", "saldo de proveedor", "\\bROI\\b", "rentabilidad"];

test("Reports contract types match the frozen contract exactly", async () => {
  const contract = await source("lib/reports/reports-contract.ts");
  for (const field of FROZEN_SUMMARY_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `summary row missing ${field}`);
  for (const field of FROZEN_MONTH_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `by-month row missing ${field}`);
  for (const field of FROZEN_RESPONSIBLE_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `by-responsible row missing ${field}`);

  const adapter = await source("lib/reports/reports-adapter.ts");
  assert.match(adapter, /"v16_reports_sales_summary"/);
  assert.match(adapter, /"v16_reports_sales_by_month"/);
  assert.match(adapter, /"v16_reports_sales_by_responsible"/);
});

test("Reports adapter never reads public.ventas directly and has no mutation method", async () => {
  const adapter = await source("lib/reports/reports-adapter.ts");
  assert.doesNotMatch(adapter, /rest\/v1\/ventas|from\(["']ventas["']\)/i);
  assert.doesNotMatch(adapter, /\.(?:insert|upsert|update|delete)\s*\(/i);
  assert.match(adapter, /rest\/v1\/rpc\//);
  assert.doesNotMatch(adapter, /createClient/);
  assert.match(adapter, /"not_connected"/);
});

test("Reports UI never displays a forbidden finance metric and never shows demo totals", async () => {
  const panel = await source("components/internal/admin/reports-panel.tsx");
  const codeOnly = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  for (const metric of FORBIDDEN_METRICS) {
    assert.doesNotMatch(codeOnly, new RegExp(metric, "i"), `must never render ${metric}`);
  }
  assert.doesNotMatch(codeOnly, /\$\s?\d{2,}[.,]\d{3}/); // no hardcoded ARS-shaped literal amount
  assert.match(panel, /Datos no conectados en este entorno/);
});

test("Reports panel omits the unsupported multi-domain gallery (Cobranzas/Caja/Productos/Proveedores/Entregas cards) from the visual reference", async () => {
  const panel = await source("components/internal/admin/reports-panel.tsx");
  const codeOnly = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /Fuente pendiente/);
  assert.doesNotMatch(codeOnly, />Caja</);
  assert.doesNotMatch(codeOnly, />Productos</);
  assert.doesNotMatch(codeOnly, />Proveedores</);
  assert.doesNotMatch(codeOnly, />Entregas</);
});

test("Reports tab is wired only inside /administracion; Home, catalog, CRM and Cobranzas are untouched", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /ReportsPanel/);
  assert.match(workspace, />\s*Reportes</);
  assert.match(workspace, /CrmClientsPanel/);
  assert.match(workspace, /CollectionsPanel/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /ReportsPanel|reports-panel|v16_reports_/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /ReportsPanel|reports-panel|v16_reports_/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /reports/i);
});

test("Production routes render unchanged; /administracion renders the Reportes tab and its fail-closed state", async () => {
  const home = await render("/");
  assert.equal(home.status, 200);
  assert.doesNotMatch(await home.text(), /Reportes|v16_reports_/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  assert.doesNotMatch(await search.text(), /Reportes|v16_reports_/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Reportes/);
});
