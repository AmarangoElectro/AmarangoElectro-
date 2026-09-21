import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

const operationalPanels = [
  "components/internal/admin/crm-clients-panel.tsx",
  "components/internal/admin/collections-panel.tsx",
  "components/internal/admin/cash-panel.tsx",
  "components/internal/admin/deliveries-panel.tsx",
  "components/internal/admin/advisors-panel.tsx",
  "components/internal/admin/payment-history-panel.tsx",
  "components/internal/admin/reports-panel.tsx",
];

test("Administration operational panels keep human-facing status copy", async () => {
  const contents = await Promise.all(operationalPanels.map(source));
  const rendered = contents.join("\n");

  for (const oldCopy of [
    "Solo lectura · vía RPC segura (`v16_crm_list_clients`)",
    "Solo lectura · vía RPC segura (`v16_collections_list` / `v16_collections_summary`)",
    "Solo lectura/escritura vía RPC segura · ledger operativo V16",
    "Solo lectura/escritura vía RPC segura · nunca usa ni modifica el estado de ventas legacy",
    "Solo lectura/escritura vía RPC segura · cartera scoped por asesor",
    "Eventos registrados en el ledger canónico",
    "Registro canónico del ciclo de vida de entregas V16, por venta.",
    "Cartera canónica V16 por asesor — nunca inferida desde el responsable de venta.",
  ]) {
    assert.ok(!rendered.includes(oldCopy), oldCopy);
  }

  for (const expected of [
    "Conexión segura · datos reales de clientes",
    "Conexión segura · cobranzas reales",
    "Conexión segura · movimientos reales de caja",
    "Conexión segura · cada entrega conserva su propio estado",
    "Conexión segura · cada asesor ve y gestiona únicamente su cartera asignada",
    "Pagos y reversas registrados",
  ]) {
    assert.ok(rendered.includes(expected), expected);
  }
});

test("Administration operational panels preserve safe adapter boundaries", async () => {
  const crm = await source("components/internal/admin/crm-clients-panel.tsx");
  const collections = await source("components/internal/admin/collections-panel.tsx");
  const cash = await source("components/internal/admin/cash-panel.tsx");
  const deliveries = await source("components/internal/admin/deliveries-panel.tsx");
  const advisors = await source("components/internal/admin/advisors-panel.tsx");

  assert.match(crm, /createCrmReadOnlyAdapter/);
  assert.match(collections, /createCollectionsReadOnlyAdapter/);
  assert.match(cash, /createCashAdapter/);
  assert.match(deliveries, /createDeliveriesAdapter/);
  assert.match(advisors, /createAdvisorsAdapter/);
});

test("Administration mobile-depth CSS protects 320-412 layouts and dark surfaces", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /V16 Administration — mobile-depth pass/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.crm-client-row \.crm-open/);
  assert.match(css, /\.collections-actions \.crm-open/);
  assert.match(css, /html\[data-theme="dark"\] \.crm-search/);
  assert.match(css, /html\[data-theme="dark"\] \.collections-row/);
  assert.match(css, /font-size: 16px/);
});
