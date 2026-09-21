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


test("model extraction raises structured model coverage without using provider codes", () => {
  const fixturePaths = [
    "fixtures/v16-electrodomesticos-sanitized-20260920.json",
    "fixtures/v16-smart-tv-audio-sanitized-20260920.json",
    "fixtures/v16-tools-care-sanitized-20260920.json",
    "fixtures/v16-home-sanitized-20260920.json",
    "fixtures/v16-gaming-tech-outdoor-sanitized-20260920.json",
    "fixtures/v16-sports-toys-it-sanitized-20260920.json",
    "fixtures/v16-rest-others-sanitized-20260920.json",
    "fixtures/v16-uncategorized-sanitized-20260920.json",
  ];
  const products = fixturePaths.flatMap((path) => JSON.parse(fs.readFileSync(path, "utf8")).products);
  const withModel = products.filter((product) => product.model);
  assert.equal(products.length, 553);
  assert.ok(withModel.length >= 128);

  const modelSource = fs.readFileSync("lib/catalog/model-normalization.ts", "utf8");
  assert.match(modelSource, /source: "product-name-only"/);
  assert.match(modelSource, /providerCodeUsedAsModel: false/);
  assert.match(modelSource, /dimensionsUsedAsModel: false/);
  assert.match(modelSource, /capacitiesUsedAsModel: false/);
});

test("externally verified unresolved products now have brand/model identity", () => {
  const electro = JSON.parse(fs.readFileSync("fixtures/v16-electrodomesticos-sanitized-20260920.json", "utf8"));
  const tools = JSON.parse(fs.readFileSync("fixtures/v16-tools-care-sanitized-20260920.json", "utf8"));
  const gaming = JSON.parse(fs.readFileSync("fixtures/v16-gaming-tech-outdoor-sanitized-20260920.json", "utf8"));

  const expected = [
    [electro, "-632", "Telefunken", "Smart Wash 550"],
    [electro, "-112", "Oryx", "OR-SA01"],
    [tools, "-429", "Ultracomb", "SC4622"],
    [tools, "-14", "Gamma", "G12417AR"],
    [tools, "-219", "Konan", "KGH253"],
    [gaming, "44", "3o3", "SG NR 01"],
  ];

  for (const [fixture, id, brand, model] of expected) {
    const product = fixture.products.find((row) => String(row.id) === id);
    assert.equal(product?.brand, brand);
    assert.equal(product?.model, model);
  }
});
