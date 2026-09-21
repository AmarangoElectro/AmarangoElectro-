import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const brandSource = fs.readFileSync("lib/catalog/brand-normalization.ts", "utf8");
const advisorSource = fs.readFileSync("lib/advisor/sales-assistant.ts", "utf8");

test("short brand rules use boundaries and cannot match inside unrelated words", () => {
  assert.match(brandSource, /\(\?:\^\|\[\^a-z0-9\]\)lg/);
  assert.match(brandSource, /\(\?:\^\|\[\^a-z0-9\]\)om/);
  assert.match(brandSource, /Martin & Martin/);
  assert.match(brandSource, /Kanjihome/);
  assert.match(brandSource, /Kanji Tools/);
});

test("curated catalog fixes remove known false-positive LG and OM assignments", () => {
  const electro = JSON.parse(fs.readFileSync("fixtures/v16-electrodomesticos-sanitized-20260920.json", "utf8"));
  const tools = JSON.parse(fs.readFileSync("fixtures/v16-tools-care-sanitized-20260920.json", "utf8"));
  const home = JSON.parse(fs.readFileSync("fixtures/v16-home-sanitized-20260920.json", "utf8"));

  const martin = electro.products.find((p) => p.id === "-208");
  assert.equal(martin.brand, "Martin & Martin");

  for (const id of ["-415", "-414"]) {
    assert.equal(tools.products.find((p) => p.id === id).brand, "Varios");
  }
  assert.equal(tools.products.find((p) => p.id === "-165").brand, "Eurotech");
  assert.equal(tools.products.find((p) => p.id === "-952").brand, "Lusqtoff");

  for (const id of ["-186", "-337", "-338", "-378", "-365"]) {
    assert.equal(home.products.find((p) => p.id === id).brand, "Varios");
  }
});

test("Kanjihome aliases are consolidated for brand grouping", () => {
  const electro = JSON.parse(fs.readFileSync("fixtures/v16-electrodomesticos-sanitized-20260920.json", "utf8"));
  for (const id of ["-1015", "-94", "-662", "-1014", "-1013", "-659", "-748"]) {
    assert.equal(electro.products.find((p) => p.id === id).brand, "Kanjihome");
  }
});

test("advisor sales assistant is provider-safe and supports comparison, WhatsApp proposal and alternatives", () => {
  assert.match(advisorSource, /buildAdvisorWhatsAppProposal/);
  assert.match(advisorSource, /compareAdvisorProducts/);
  assert.match(advisorSource, /rankAdvisorAlternatives/);
  assert.match(advisorSource, /maxComparisonProducts: 3/);
  assert.match(advisorSource, /exposesProvider: false/);
  assert.match(advisorSource, /exposesCost: false/);
  assert.doesNotMatch(advisorSource, /specifications\.Proveedor|supplierCode|mayorista|costo/i);
  assert.match(advisorSource, /Consultame y te confirmo disponibilidad antes de cerrar el pedido/);
});
