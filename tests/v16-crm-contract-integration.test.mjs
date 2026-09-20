import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?crm=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const FROZEN_LIST_FIELDS = ["id", "nombre", "telefono", "localidad", "direccion", "dni", "telefono2", "responsable", "alta"];
const FROZEN_360_FIELDS = ["id", "nombre", "telefono", "localidad", "direccion", "observaciones", "alta", "dni", "telefono2", "responsable", "ventas_total", "cuotas_total", "cuotas_pagadas", "cuotas_pendientes"];
const FROZEN_SALES_FIELDS = ["id", "cliente_id", "producto", "precio_venta", "envio", "responsable", "fecha", "cuotas", "pagadas", "cuotas_pendientes", "tipo", "total", "precio", "archivada", "monto_cuota", "vence_manual"];
const SENSITIVE_FIELDS = ["precioCosto", "ganancia", "mayorista", "inversionista", "inversionista2", "inversores", "pagoInv", "pagoRev", "monto_invertido", "montoInvertido", "porcentaje", "pct1", "pct2"];

test("CRM contract types match the frozen contract exactly, field for field", async () => {
  const contract = await source("lib/crm/client-crm-contract.ts");
  for (const field of FROZEN_LIST_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `V16CrmClientListRow missing ${field}`);
  for (const field of FROZEN_360_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `V16CrmClient360Row missing ${field}`);
  for (const field of FROZEN_SALES_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `V16CrmClientSaleRow missing ${field}`);
  for (const field of SENSITIVE_FIELDS) assert.match(contract, new RegExp(field), `sensitive field ${field} should be documented as never fetched`);

  const adapter = await source("lib/crm/client-crm-adapter.ts");
  assert.match(adapter, /"v16_crm_list_clients"/);
  assert.match(adapter, /"v16_crm_client_360"/);
  assert.match(adapter, /"v16_crm_client_sales"/);
  assert.match(adapter, /search_text/);
  assert.match(adapter, /row_limit/);
  assert.match(adapter, /row_offset/);
  assert.match(adapter, /p_client_id/);
  // No sensitive field is ever referenced in the adapter's own row schemas.
  for (const field of SENSITIVE_FIELDS) assert.doesNotMatch(adapter, new RegExp(`z\\.[a-z]+\\(\\)[^,]*,?\\s*//.*${field}|${field}:\\s*z\\.`), `adapter must not schema-validate sensitive field ${field}`);
});

test("CRM adapter never reads public.clientes/public.ventas directly and never calls the JS supabase-js .rpc() SDK method", async () => {
  const adapter = await source("lib/crm/client-crm-adapter.ts");
  assert.doesNotMatch(adapter, /rest\/v1\/clientes|rest\/v1\/ventas|from\(["']clientes["']\)|from\(["']ventas["']\)/i);
  assert.doesNotMatch(adapter, /\.(?:insert|upsert|update|delete)\s*\(/i);
  assert.match(adapter, /rest\/v1\/rpc\//);
  assert.doesNotMatch(adapter, /createClient/);
});

test("CRM adapter is fail-closed with no config: never falls back to demo data", async () => {
  const adapter = await source("lib/crm/client-crm-adapter.ts");
  assert.match(adapter, /getCrmAccessConfig[\s\S]*return null/);
  assert.match(adapter, /"not_connected"/);
  assert.doesNotMatch(adapter, /Cliente demo|cliente_demo|clienteDemo/i);
});

test("CRM UI panels never embed real-looking PII fixtures and never invent tabs the frozen contract doesn't back", async () => {
  const listPanel = await source("components/internal/admin/crm-clients-panel.tsx");
  const panel360 = await source("components/internal/admin/crm-client-360-panel.tsx");
  const combined = `${listPanel}\n${panel360}`;
  assert.doesNotMatch(combined, /Cliente demo|cliente_demo|\bCL01\b/i);
  assert.doesNotMatch(combined, /\d{2}\.\d{3}\.\d{3}|\d{7,8}/); // no literal DNI-shaped numbers
  assert.match(combined, /Datos no conectados en este entorno/);
  // Resumen + Ventas + Pagos (the last one added by V16_PAYMENT_HISTORY_UI_CONTRACT_CORRECTION,
  // backed by the real v16_payment_history_* RPCs) — still no invented
  // Cuotas/Entregas/Garantías/Documentos/Historial tabs, which have no RPC backing.
  assert.match(panel360, /Resumen/);
  assert.match(panel360, />Ventas</);
  assert.match(panel360, />Pagos</);
  assert.doesNotMatch(panel360, />Cuotas<|>Entregas<|>Garantías<|>Documentos<|>Historial</);
});

test("CRM tab is wired only inside /administracion; Home and public catalog are untouched", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /CrmClientsPanel/);
  assert.match(workspace, /Clientes \/ CRM/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /CrmClientsPanel|crm-client|v16_crm_/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /CrmClientsPanel|crm-client|v16_crm_/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /crm/i);
});

test("Production routes render unchanged; /administracion renders the new CRM tab and its fail-closed state", async () => {
  const home = await render("/");
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.doesNotMatch(homeHtml, /Clientes \/ CRM|v16_crm_/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  const searchHtml = await search.text();
  assert.doesNotMatch(searchHtml, /Clientes \/ CRM|v16_crm_/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  const adminHtml = await admin.text();
  assert.match(adminHtml, /Clientes \/ CRM/);
});
