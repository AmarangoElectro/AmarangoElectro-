import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deriveFacetGroups, matchesFacets } from "../lib/catalog/smart-facets.ts";

const evidence = JSON.parse(readFileSync(new URL("../fixtures/v16-catalog-expansion-63-20260921.json", import.meta.url)));
const products = evidence.products.map((row) => ({
  id: row.id, name: row.name, model: null, brand: row.brand,
  category: row.category, subcategory: row.subcategory ?? null,
  specifications: {}, stock: { status: row.availability === "available" ? "in_stock" : "unknown" },
}));
const sector = (category, subcategory) => products.filter((product) => product.category === category && (!subcategory || product.subcategory === subcategory));
const options = (rows, scope, key) => deriveFacetGroups(rows, scope).find((group) => group.key === key)?.options ?? [];

test("Smart TV sizes come from actual TV entries, without treating 4K, monitor size or 86 as a requested chip", () => {
  const tv = sector("smart-tv");
  const sizes = options(tv, "smart-tv", "measure");
  for (const size of ["32″", "43″", "58″", "60″", "65″", "75″", "85″"]) assert.ok(sizes.includes(size), size);
  for (const size of ["40″", "50″", "55″", "70″"]) assert.ok(!sizes.includes(size), size);
  const matching = tv.filter((product) => matchesFacets(product, "smart-tv", { measure: "65″" }));
  assert.ok(matching.length > 0);
  assert.ok(matching.every((product) => /65/.test(product.name)));
});

test("laundry capacity preserves decimal data and clear selection restores full sector", () => {
  const laundry = sector("electrodomesticos", "lavado");
  const sizes = options(laundry, "lavado", "capacity");
  assert.ok(sizes.includes("6,5 kg"));
  assert.ok(sizes.includes("8 kg"));
  assert.ok(sizes.includes("9 kg"));
  assert.ok(!sizes.includes("6 kg"));
  const filtered = laundry.filter((product) => matchesFacets(product, "lavado", { capacity: "8 kg" }));
  assert.ok(filtered.length > 0 && filtered.length < laundry.length);
  assert.equal(laundry.filter((product) => matchesFacets(product, "lavado", {})).length, laundry.length);
});

test("refrigeration liters and audio types never borrow products from other sectors", () => {
  const refrigeration = sector("electrodomesticos", "refrigeracion");
  assert.ok(options(refrigeration, "refrigeracion", "liters").includes("312 L"));
  assert.ok(options(refrigeration, "refrigeracion", "liters").includes("120 L"));
  const audio = sector("audio");
  assert.ok(options(audio, "audio", "kind").includes("Torre"));
  assert.ok(audio.filter((product) => matchesFacets(product, "audio", { kind: "Torre" })).every((product) => /torre/i.test(product.name)));
});

test("phone storage and mattress size require an explicit matching value", () => {
  const phone = { ...products[0], category: "celulares", name: "Motorola 256/8", brand: "Motorola" };
  const other = { ...phone, id: "other", name: "Motorola 128GB" };
  assert.deepEqual(options([phone, other], "celulares", "storage"), ["128 GB", "256 GB"]);
  assert.ok(matchesFacets(phone, "celulares", { storage: "256 GB" }));
  assert.ok(!matchesFacets(other, "celulares", { storage: "256 GB" }));
  const bed = { ...phone, name: "Sommier Queen" };
  assert.deepEqual(options([bed, { ...bed, id: "king", name: "Colchón King" }], "colchones-y-sommiers", "size"), ["Queen", "King"]);
});

test("real Samsung and POCO supplier names populate every documented storage drawer", () => {
  const evidence = JSON.parse(readFileSync(new URL("../fixtures/v16-90-cellphones-materialized.json", import.meta.url)));
  const phones = evidence.products.map((row) => ({
    id: row.id, name: row.name, model: row.model ?? null, brand: row.brand,
    category: "celulares", specifications: {},
  }));
  for (const brand of ["Samsung", "POCO"]) {
    const rows = phones.filter((phone) => phone.brand.toLowerCase() === brand.toLowerCase());
    assert.ok(rows.length > 2, brand);
    const values = options(rows, "celulares", "storage");
    assert.ok(values.includes("256 GB"), `${brand}: ${values}`);
    assert.ok(values.includes("512 GB"), `${brand}: ${values}`);
    assert.ok(rows.filter((phone) => matchesFacets(phone, "celulares", { storage: "256 GB" })).every((phone) => /256\s*(?:gb|g|\/)/i.test(phone.name)));
  }
  const samsung = phones.filter((phone) => phone.brand.toLowerCase() === "samsung");
  assert.ok(options(samsung, "celulares", "storage").includes("1 TB"));
  assert.ok(options(samsung, "celulares", "storage").includes("128 GB"));
});

test("laundry chips distinguish small and large capacities without inventing buckets", () => {
  const laundry = ["4", "5", "6.5", "11", "15"].map((kg, index) => ({ ...products[0], id: `wash-${index}`, name: `Lavarropas ${kg} kg`, category: "electrodomesticos", subcategory: "lavado" }));
  assert.deepEqual(options(laundry, "lavado", "capacity"), ["4 kg", "5 kg", "6,5 kg", "11 kg", "15 kg"]);
  assert.deepEqual(laundry.filter((product) => matchesFacets(product, "lavado", { capacity: "5 kg" })).map((product) => product.name), ["Lavarropas 5 kg"]);
  assert.equal(laundry.filter((product) => matchesFacets(product, "lavado", { capacity: "6 kg" })).length, 0);
});

test("a brand with one known memory still exposes its actual chip", () => {
  const phone = { ...products[0], category: "celulares", name: "Motorola 256/8", brand: "Motorola" };
  assert.deepEqual(deriveFacetGroups([phone], "celulares", true).find((group) => group.key === "storage")?.options, ["256 GB"]);
  assert.ok(matchesFacets(phone, "celulares", {}));
  assert.ok(!matchesFacets(phone, "celulares", { storage: "128 GB" }));
});
