import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const snapshotPaths = [
  "fixtures/v16-electrodomesticos-sanitized-20260920.json",
  "fixtures/v16-smart-tv-audio-sanitized-20260920.json",
  "fixtures/v16-tools-care-sanitized-20260920.json",
  "fixtures/v16-home-sanitized-20260920.json",
  "fixtures/v16-gaming-tech-outdoor-sanitized-20260920.json",
  "fixtures/v16-sports-toys-it-sanitized-20260920.json",
  "fixtures/v16-rest-others-sanitized-20260920.json",
  "fixtures/v16-uncategorized-sanitized-20260920.json",
];

const adapterPaths = [
  "lib/catalog/v16-electro-snapshot-adapter.ts",
  "lib/catalog/v16-media-snapshot-adapter.ts",
  "lib/catalog/v16-tools-care-snapshot-adapter.ts",
  "lib/catalog/v16-home-snapshot-adapter.ts",
  "lib/catalog/v16-gaming-tech-outdoor-snapshot-adapter.ts",
  "lib/catalog/v16-sports-toys-it-snapshot-adapter.ts",
  "lib/catalog/v16-rest-others-snapshot-adapter.ts",
  "lib/catalog/v16-uncategorized-snapshot-adapter.ts",
];

test("current sanitized snapshot coverage is exactly 553 unique source IDs", () => {
  const products = snapshotPaths.flatMap((path) => JSON.parse(fs.readFileSync(path, "utf8")).products);
  assert.equal(products.length, 553);
  assert.equal(new Set(products.map((product) => String(product.id))).size, 553);
});

test("legacy V4.11 and Cohort 0 remain evidence-only and are not runtime catalog adapters", () => {
  const index = fs.readFileSync("lib/catalog/index.ts", "utf8");
  assert.doesNotMatch(index, /new V411AuditedPilotCatalogAdapter\(\)/);
  assert.doesNotMatch(index, /new Cohort0FrozenCatalogAdapter\(\)/);
  assert.match(index, /V16CurrentSnapshotCompositeCatalogAdapter/);
});

test("all eight current snapshot adapters use one financing rule", () => {
  const financing = fs.readFileSync("lib/catalog/financing.ts", "utf8");
  assert.match(financing, /installments: 2, markup: 0\.15/);
  assert.match(financing, /installments: 4, markup: 0\.35/);
  assert.match(financing, /installments: 6, markup: 0\.55/);
  for (const path of adapterPaths) {
    const adapter = fs.readFileSync(path, "utf8");
    assert.match(adapter, /buildFixedInstallments\(row\.sale\)/, path);
  }
});

test("Deportes y Movilidad is a public V16 category with explicit subsectors", () => {
  const categories = fs.readFileSync("lib/catalog/categories.ts", "utf8");
  const fixture = JSON.parse(fs.readFileSync("fixtures/v16-sports-toys-it-sanitized-20260920.json", "utf8"));
  assert.match(categories, /slug: "deportes-movilidad"/);
  for (const subcategory of ["bicicletas", "fitness", "movilidad-personal"]) {
    assert.match(categories, new RegExp(`sub\\("${subcategory}"`));
  }
  const sports = fixture.products.filter((product) => product.category === "deportes-movilidad");
  assert.equal(sports.length, 20);
  assert.ok(sports.every((product) => ["bicicletas", "fitness", "movilidad-personal"].includes(product.subcategory)));
});

test("audited external image CDN is explicitly allowed", () => {
  const config = fs.readFileSync("next.config.ts", "utf8");
  assert.match(config, /zctaukyrhsmpjkcddcqq\.supabase\.co/);
  assert.match(config, /cdn\.catalog-store\.link/);
});
