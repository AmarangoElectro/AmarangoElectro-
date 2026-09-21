import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("Nueva Venta draft never writes Supabase or imports Admin-only pricing policy", async () => {
  const sale = await source("app/components/advisor-sale-draft-panel.tsx");

  assert.doesNotMatch(sale, /supabase|sbCalc|\.from\(|upsert\(|insert\(|guardarPedidoHistorial/);
  assert.doesNotMatch(sale, /amarango-policy|amarango-calculator|AMARANGO_CURRENT_POLICY|costArs|markup/);
  assert.match(sale, /Product/);
  assert.match(sale, /product\.financing/);
});

test("Nueva Venta draft keeps registration disabled until a secure write path exists", async () => {
  const sale = await source("app/components/advisor-sale-draft-panel.tsx");

  assert.match(sale, /Registro seguro pendiente/);
  assert.match(sale, /La venta todavía no se guarda/);
  assert.match(sale, /<button type="button" disabled>Registrar venta<\/button>/);
  assert.match(sale, /Copiar resumen/);
});

test("Nueva Venta draft supports catalog selection, paste and 2-4-6 plans without exposing private fields", async () => {
  const sale = await source("app/components/advisor-sale-draft-panel.tsx");

  for (const text of ["Pegar", "Contado", "2 cuotas", "4 cuotas", "6 cuotas", "Seña o entrega"]) {
    assert.ok(sale.includes(text), text);
  }
  for (const privateField of ["Proveedor", "Costo", "Comisión", "markup", "costArs", "supplier"]) {
    assert.ok(!sale.includes(privateField), privateField);
  }
});

test("Mi Amarango connects Nueva Venta locally and keeps Administration isolated", async () => {
  const advisor = await source("app/components/advisor-workspace.tsx");

  assert.match(advisor, /href="#advisor-sale-draft"/);
  assert.match(advisor, /AdvisorSaleDraftPanel products=\{products\}/);
  assert.doesNotMatch(advisor, /href="\/administracion"/);
});
