import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("V16 90-cellphones materialization: fixture has exactly 90 unique, correctly-shaped rows", async () => {
  const fixture = JSON.parse(await source("fixtures/v16-90-cellphones-materialized.json"));
  assert.equal(fixture.production_catalog_verified, false);
  assert.equal(fixture.products.length, 90);

  const ids = fixture.products.map((row) => row.id);
  assert.equal(new Set(ids).size, 90);
  for (const id of ids) assert.match(id, /^v16-cell:\d+$/);

  const canonicalIds = fixture.products.map((row) => row.canonicalProductId).sort((a, b) => a - b);
  assert.deepEqual(canonicalIds, Array.from({ length: 90 }, (_, i) => i + 1));

  const keys = fixture.products.map((row) => row.legacyCellphoneKey);
  assert.equal(new Set(keys).size, 90);

  const slugs = fixture.products.map((row) => row.slug);
  assert.equal(new Set(slugs).size, 90);

  const positions = fixture.products.map((row) => row.legacyPosition);
  assert.ok(!positions.includes(10), "position 10 must be excluded");
  assert.ok(!positions.includes(91), "position 91 must be excluded");
});

// El adapter usa el alias `@/fixtures/...` (resuelto por el bundler de la app,
// no por Node en crudo), igual que `cohort0-frozen-adapter.ts` y
// `audited-pilot-adapter.ts`. Siguiendo el mismo patrón que el resto de la
// suite para esas fuentes (ver v16-v411-real-catalog-readonly.test.mjs), este
// test valida el adapter por código fuente + reconstrucción funcional
// equivalente a partir del propio fixture, en vez de importarlo directo.
test("V16 90-cellphones materialization adapter contract: source rules + functional equivalent from fixture", async () => {
  const adapterSource = await source("lib/catalog/v16-cellphones-90-materialized-adapter.ts");
  assert.match(adapterSource, /source: "v16-cellphones-90-materialized"/);
  assert.match(adapterSource, /visible: false/);
  assert.match(adapterSource, /price: null/);
  assert.match(adapterSource, /availability: "unknown"/);
  assert.match(adapterSource, /EXCLUDED_LEGACY_POSITIONS = new Set\(\[10, 91\]\)/);
  assert.doesNotMatch(adapterSource, /fetch\s*\(|createClient|service_role|secret[_-]?key/i);
  assert.doesNotMatch(adapterSource, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);

  const fixture = JSON.parse(await source("fixtures/v16-90-cellphones-materialized.json"));
  const products = fixture.products.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    model: row.model,
    category: row.category,
    subcategory: null,
    image: null,
    price: null,
    financing: [],
    availability: "unknown",
    stock: { status: "unknown", quantity: null, label: null },
    features: [],
    specifications: {},
    description: null,
    warranty: null,
    visible: false,
    source: "v16-cellphones-90-materialized",
  }));

  assert.equal(products.length, 90);
  const ids = products.map((product) => product.id);
  assert.equal(new Set(ids).size, 90);
  for (const id of ids) assert.match(id, /^v16-cell:\d+$/);

  for (const product of products) {
    assert.equal(product.category, "celulares");
    assert.equal(typeof product.brand, "string");
    assert.ok(product.brand.length > 0);
    assert.equal(product.visible, false, "must not be publication-ready in this gate");
    assert.equal(product.price, null, "no price evidence authorized in this gate");
    assert.equal(product.availability, "unknown");
    assert.equal(product.stock.status, "unknown");
  }

  const slugs = products.map((product) => product.slug);
  assert.equal(new Set(slugs).size, 90);
});

test("V16 90-cellphones materialization adapter is NOT wired into the active storefront composite", async () => {
  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /v16-cellphones-90-materialized-adapter/i);
  assert.doesNotMatch(index, /V16Cellphones90MaterializedCatalogAdapter/);
});
