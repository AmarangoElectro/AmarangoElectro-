import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?payments=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

const FROZEN_ROW_FIELDS = ["payment_id", "sale_id", "client_id", "client_name", "product_label", "installment_number", "payment_kind", "contractual_amount", "adjustment_amount", "adjustment_reason", "amount_received", "paid_at", "payment_method", "reverses_payment_id", "created_at"];
const FROZEN_SUMMARY_FIELDS = ["payment_count", "reversal_count", "payment_amount", "reversed_amount", "net_amount", "first_event_at", "last_event_at"];
const NEVER_EXPOSED = ["idempotency_key", "cash_movement_id", "note", "metadata", "created_by", "payment_reference", "amount_source"];
const P_PREFIXED_ARGS = ["p_client_id", "p_sale_id", "p_payment_kind", "p_from", "p_to", "p_search_text", "p_row_limit", "p_row_offset"];

test("Payment History contract types + RPC args match the frozen corrective contract field-for-field", async () => {
  const contract = await source("lib/payments/payment-history-contract.ts");
  for (const field of FROZEN_ROW_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `row missing ${field}`);
  for (const field of FROZEN_SUMMARY_FIELDS) assert.match(contract, new RegExp(`\\b${field}\\b`), `summary missing ${field}`);

  const adapter = await source("lib/payments/payment-history-adapter.ts");
  assert.match(adapter, /"v16_payment_history_list"/);
  assert.match(adapter, /"v16_payment_history_summary"/);
  for (const arg of P_PREFIXED_ARGS) assert.match(adapter, new RegExp(`${arg}:`), `adapter must send RPC arg ${arg} (corrected p_-prefixed name)`);
});

test("Payment History never requests or renders a field the contract says is intentionally hidden", async () => {
  const adapterSchemaSection = (await source("lib/payments/payment-history-adapter.ts")).split("async listPayments")[0];
  for (const field of NEVER_EXPOSED) {
    assert.doesNotMatch(adapterSchemaSection, new RegExp(`${field}:\\s*z\\.`), `zod schema must not validate ${field}`);
  }
  const panel = await source("components/internal/admin/payment-history-panel.tsx");
  const codeOnly = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  for (const field of NEVER_EXPOSED) {
    assert.doesNotMatch(codeOnly, new RegExp(`payment\\.${field}\\b`), `UI must not render payment.${field}`);
  }
});

test("Payment History adapter is read-only, never reads public.ventas directly, no local success faking", async () => {
  const adapter = await source("lib/payments/payment-history-adapter.ts");
  assert.doesNotMatch(adapter, /rest\/v1\/ventas|from\(["']ventas["']\)/i);
  assert.doesNotMatch(adapter, /\.(?:insert|upsert|update|delete)\s*\(/i);
  assert.match(adapter, /rest\/v1\/rpc\//);
  assert.doesNotMatch(adapter, /createClient/);
  assert.match(adapter, /"not_connected"/);
  const adapterCodeOnly = adapter.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(adapterCodeOnly, /v16_register_customer_payment|v16_reverse_customer_payment/, "this correction does not add the write contract");
});

test("Payment History UI never fabricates/backfills events and uses the exact frozen empty-state + summary wording", async () => {
  const panel = await source("components/internal/admin/payment-history-panel.tsx");
  const codeOnly = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /ventas\.pagadas/);
  assert.doesNotMatch(codeOnly, /El cliente nunca pag[oó]|No tiene pagos|No realiz[oó] ninguna cuota/);
  assert.match(panel, /Todavía no hay pagos registrados en el historial V16\./);
  assert.match(panel, /Pagos registrados/i);
  assert.match(panel, /Reversas/i);
  assert.match(panel, /Total cobrado/i);
  assert.match(panel, /Total revertido/i);
  assert.match(panel, /Neto registrado/i);
  assert.doesNotMatch(codeOnly, /saldo del cliente|deuda restante|caja disponible/i);
  assert.match(panel, /Pago registrado/);
  assert.match(panel, /Pago revertido/);
  assert.doesNotMatch(codeOnly, /eliminado|borrado/i);
});

test("Payment History requires explicit scope (clientId/saleId props) — no unscoped standalone browse mode", async () => {
  const panel = await source("components/internal/admin/payment-history-panel.tsx");
  assert.match(panel, /clientId\s*=\s*null.*saleId\s*=\s*null|clientId.*saleId/s);
});

test("CORRECTION: standalone top-level 'Historial de Pagos' Admin tab is gone; admin:historial-pagos guide removed", async () => {
  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.doesNotMatch(workspace, /paymentHistory|PaymentHistoryPanel|Historial de Pagos/);

  const guides = await source("lib/onboarding/sector-guides.ts");
  assert.doesNotMatch(guides, /sectorId: "historial-pagos"/);
});

test("CORRECTION: Payment History is integrated into Cobranzas (scoped by sale_id + client_id) and Cliente 360 (scoped by client_id, new Pagos tab)", async () => {
  const collections = await source("components/internal/admin/collections-panel.tsx");
  assert.match(collections, /PaymentHistoryPanel/);
  assert.match(collections, /saleId=\{row\.sale_id\}/);
  assert.match(collections, /clientId=\{row\.client_id\}/);
  assert.match(collections, /Historial de pagos/);

  const client360 = await source("components/internal/admin/crm-client-360-panel.tsx");
  assert.match(client360, /PaymentHistoryPanel/);
  assert.match(client360, /clientId=\{clientId\}/);
  assert.match(client360, />Pagos</);
  // Client 360 must never pass another client's id.
  assert.doesNotMatch(client360, /clientId=\{(?!clientId\})/);
});

test("Cobranzas projection and Cliente 360 pre-existing sections remain intact and conceptually distinct from Payment History", async () => {
  const collections = await source("components/internal/admin/collections-panel.tsx");
  assert.match(collections, /OVERDUE/);
  assert.match(collections, /DUE_TODAY/);
  assert.match(collections, /UPCOMING/);
  assert.match(collections, /DATA_INCOMPLETE/);

  const client360 = await source("components/internal/admin/crm-client-360-panel.tsx");
  assert.match(client360, />Resumen</);
  assert.match(client360, />Ventas</);
  assert.match(client360, /ventas_total/);
});

test("Home, catalog, CRM adapter, Cobranzas adapter, Reports and Providers remain untouched by this correction", async () => {
  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /PaymentHistoryPanel|v16_payment_history/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /PaymentHistoryPanel|v16_payment_history/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /payment/i);

  const crmAdapter = await source("lib/crm/client-crm-adapter.ts");
  assert.doesNotMatch(crmAdapter, /payment_history/i);

  const collectionsAdapter = await source("lib/collections/collections-adapter.ts");
  assert.doesNotMatch(collectionsAdapter, /payment_history/i);
});

test("Production routes render unchanged; /administracion no longer has a standalone Payment History tab", async () => {
  const home = await render("/");
  assert.equal(home.status, 200);
  assert.doesNotMatch(await home.text(), /Historial de Pagos|v16_payment_history/i);

  const search = await render("/buscar?q=A16");
  assert.equal(search.status, 200);
  assert.doesNotMatch(await search.text(), /Historial de Pagos|v16_payment_history/i);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  const adminHtml = await admin.text();
  assert.match(adminHtml, /Cobranzas/);
  assert.doesNotMatch(adminHtml, />\s*Historial de Pagos\s*</);
});
