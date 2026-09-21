import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

function subcategoryForBrand(brand) {
  const value = String(brand).toLowerCase();
  if (value === "apple") return "apple-iphone";
  if (value === "samsung") return "samsung";
  if (value === "motorola") return "motorola";
  if (value === "xiaomi" || value === "redmi") return "xiaomi";
  if (value === "infinix") return "infinix";
  if (value === "poco") return "poco";
  return null;
}

function productKey(product) {
  return [
    product.category,
    product.subcategory ?? "",
    product.brand,
    product.model ?? "",
    product.name,
    product.price ?? "",
  ]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

test("expanded V16 catalog reconstructs to 391 visible unique products", async () => {
  const pilot = JSON.parse(await source("fixtures/v411-catalog-evidence-public.json")).products
    .filter((row) => row.category !== "celulares")
    .map((row) => ({
      category: row.category,
      subcategory: row.subcategory ?? null,
      brand: row.brand,
      model: row.model ?? null,
      name: row.name,
      price: row.sale,
    }));

  const cohort = JSON.parse(await source("fixtures/v16-real-catalog-cohort-0-frozen.json")).products
    .map((row) => ({
      category: row.category,
      subcategory: row.subcategory ?? null,
      brand: row.brand,
      model: null,
      name: row.name,
      price: row.sale,
    }));

  const electro = JSON.parse(await source("fixtures/v16-electrodomesticos-sanitized-20260920.json")).products
    .map((row) => ({
      category: row.category,
      subcategory: row.subcategory,
      brand: row.brand,
      model: row.model ?? null,
      name: row.name,
      price: row.sale,
    }));

  const canonical = JSON.parse(await source("fixtures/v16-90-cellphones-materialized.json")).products;
  const legacy = JSON.parse(await source("fixtures/v413-legacy-cellphones-sanitized.json")).phones;
  const legacyByPosition = new Map(legacy.map((row) => [row.legacyPosition, row]));
  const phones = canonical.map((row) => ({
    category: "celulares",
    subcategory: subcategoryForBrand(row.brand),
    brand: row.brand,
    model: row.model ?? null,
    name: row.name,
    price: legacyByPosition.get(row.legacyPosition).cashPriceARS,
  }));

  const expansion63 = JSON.parse(await source("fixtures/v16-catalog-expansion-63-20260921.json")).products
    .map((row) => ({
      category: row.category,
      subcategory: row.subcategory ?? null,
      brand: row.brand,
      model: null,
      name: row.name,
      price: row.sale,
    }));

  const expansion5 = JSON.parse(await source("fixtures/v16-catalog-expansion-5-v412.json")).products
    .map((row) => ({
      category: row.category,
      subcategory: row.subcategory ?? null,
      brand: row.brand,
      model: row.model ?? null,
      name: row.name,
      price: row.sale,
    }));

  const merged = [];
  const seen = new Set();
  for (const group of [pilot, cohort, electro, phones, expansion63, expansion5]) {
    for (const product of group) {
      const key = productKey(product);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(product);
    }
  }

  assert.equal(merged.length, 391);

  const byCategory = Object.fromEntries(
    [...new Set(merged.map((row) => row.category))]
      .map((category) => [category, merged.filter((row) => row.category === category).length]),
  );

  assert.equal(byCategory.celulares, 90);
  assert.equal(byCategory.electrodomesticos, 251);
  assert.equal(byCategory["smart-tv"], 20);
  assert.equal(byCategory.audio, 10);
  assert.equal(byCategory.gaming, 6);
  assert.equal(byCategory.herramientas, 4);
});

test("expansion fixtures contain only allowlisted public product fields", async () => {
  for (const file of [
    "fixtures/v16-catalog-expansion-63-20260921.json",
    "fixtures/v16-catalog-expansion-5-v412.json",
  ]) {
    const fixture = JSON.parse(await source(file));
    for (const row of fixture.products) {
      const keys = Object.keys(row).map((key) => key.toLowerCase());
      for (const forbidden of ["cost", "costo", "supplier", "proveedor", "mayorista", "markup", "usd", "secret", "token"]) {
        assert.ok(!keys.some((key) => key.includes(forbidden)), `${file}: forbidden field ${forbidden}`);
      }
    }
  }
});

test("63-product expansion preserves image evidence fail-closed", async () => {
  const fixture = JSON.parse(await source("fixtures/v16-catalog-expansion-63-20260921.json"));

  assert.equal(fixture.product_count, 63);
  const withoutImage = fixture.products.filter((row) => !row.image);
  assert.equal(withoutImage.length, 1);
  assert.equal(withoutImage[0].id, "-1009");
  assert.match(withoutImage[0].name, /SMART TV BGH 43/);

  for (const row of fixture.products.filter((item) => item.image)) {
    assert.equal(row.image_evidence_http_status, 200);
    assert.match(row.image, /^https:\/\//);
  }
});

test("five-product V4.12 expansion is fully pictured and public-safe", async () => {
  const fixture = JSON.parse(await source("fixtures/v16-catalog-expansion-5-v412.json"));

  assert.equal(fixture.product_count, 5);
  assert.equal(fixture.products.length, 5);
  for (const row of fixture.products) {
    assert.ok(row.sale > 0);
    assert.match(row.image, /^https:\/\//);
  }
});
