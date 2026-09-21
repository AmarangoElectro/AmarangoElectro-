import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("internal visible surfaces keep human-facing language", async () => {
  const platform = await source("app/plataforma/page.tsx");
  const owners = await source("app/propietarios/page.tsx");
  const operations = await source("app/components/amarango-os-product-bridge.tsx");
  const categories = await source("components/internal/admin/admin-category-manager.tsx");
  const visible = [platform, owners, operations, categories].join("\n");

  for (const oldCopy of [
    "Tienda V16 = catálogo oficial",
    "Product V16",
    "CONTROL CENTER · V3 LAB",
    "MODO LABORATORIO",
    "Piloto técnico aislado",
    "fixture recuperado",
    "PRODUCT BRIDGE V3",
    "Fixture V2.1",
    "COMPATIBILIDAD LEGACY",
    "CRM Legacy",
    "V3 BLOQUEA ESCRITURAS",
    "Catálogo consultado por adaptador",
    "Sin Supabase productivo",
    "CATEGORÍAS V16",
    "rutas V16 preservadas",
    "Storefront congelado",
    "Todo por workspace",
    "SIGUIENTE GATE",
  ]) {
    assert.ok(!visible.includes(oldCopy), oldCopy);
  }

  for (const expected of [
    "Una sola fuente para toda la tienda",
    "CENTRO DE OPERACIONES",
    "MODO REVISIÓN",
    "Vista de demostración",
    "CATÁLOGO DE REFERENCIA",
    "CAMBIOS BLOQUEADOS",
    "CATEGORÍAS",
    "Tienda protegida",
    "Todo por tienda",
    "PRÓXIMO PASO",
  ]) {
    assert.ok(visible.includes(expected), expected);
  }
});

test("public metadata and internal operations metadata stay product-facing", async () => {
  const layout = await source("app/layout.tsx");
  const operationsPage = await source("app/amarango-os/page.tsx");

  assert.match(layout, /title: "AmarangoElectro"/);
  assert.match(operationsPage, /title: "Amarango Operaciones"/);
  assert.doesNotMatch([layout, operationsPage].join("\n"), /Product Bridge|V3 Lab/i);
});
