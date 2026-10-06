import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("Nueva Venta never writes Supabase directly or imports Admin-only pricing policy", async () => {
  const sale = await source("app/components/advisor-sale-draft-panel.tsx");

  assert.doesNotMatch(sale, /supabase|sbCalc|\.from\(|upsert\(|insert\(|guardarPedidoHistorial/);
  assert.doesNotMatch(sale, /amarango-policy|amarango-calculator|AMARANGO_CURRENT_POLICY|costArs|markup/);
  assert.match(sale, /Product/);
  assert.match(sale, /product\.financing/);
});

test("Nueva Venta registers only through the authorized server quote and operational bridge", async () => {
  const sale = await source("app/components/advisor-sale-draft-panel.tsx");

  assert.match(sale, /\/api\/v16\/sale-quote/);
  assert.match(sale, /v16OperationalAdapter\.createClient/);
  assert.match(sale, /v16OperationalAdapter\.confirmSale/);
  assert.match(sale, /authorizedQuoteId/);
  assert.match(sale, /idempotencyKey/);
  assert.match(sale, /Preparar cotización/);
  assert.match(sale, /Registrar venta/);
  assert.doesNotMatch(sale, /<button type="button" disabled>Registrar venta<\/button>/);
});

test("Nueva Venta follows the server active financing mode: Classic 2-4-6 or Protected 3-6", async () => {
  const sale = await source("app/components/advisor-sale-draft-panel.tsx");

  assert.match(sale, /getActiveFinancingMode/);
  assert.match(sale, /activeMode === "PROTECTED"/);
  assert.match(sale, /\[0, 3, 6\]/);
  assert.match(sale, /\[0, 2, 4, 6\]/);
  assert.match(sale, /Plan Protegido/);
});

test("Nueva Venta keeps private cost, supplier and commission facts out of advisor UI", async () => {
  const sale = await source("app/components/advisor-sale-draft-panel.tsx");
  for (const privateField of ["Proveedor", "Costo", "Comisión", "costArs", "supplier"]) {
    assert.ok(!sale.includes(privateField), privateField);
  }
});

test("Mi Amarango connects Nueva Venta locally and keeps Administration isolated", async () => {
  const advisor = await source("app/components/advisor-workspace.tsx");

  assert.match(advisor, /href="#advisor-sale-draft"/);
  assert.match(advisor, /AdvisorSaleDraftPanel products=\{products\}/);
  assert.doesNotMatch(advisor, /href="\/administracion"/);
});
