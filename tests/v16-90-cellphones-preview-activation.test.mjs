import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("90-cellphone Admin preview remains isolated from the active public adapter", async () => {
  const preview = await source("components/internal/admin/v16-90-cellphones-preview.tsx");
  const index = await source("lib/catalog/index.ts");

  assert.match(preview, /v16Cellphones90MaterializedProducts/);
  assert.doesNotMatch(preview, /from ["']@\/lib\/catalog["']/);
  assert.doesNotMatch(preview, /fetch\s*\(|createClient|service_role|secret[_-]?key/i);
  assert.doesNotMatch(preview, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);

  assert.match(index, /V16Cellphones90PublicCatalogAdapter/);
  assert.doesNotMatch(index, /V16Cellphones90MaterializedCatalogAdapter/);
});

test("public 90-cellphone adapter joins canonical identity with sanitized public fields", async () => {
  const adapter = await source("lib/catalog/v16-cellphones-90-public-adapter.ts");

  assert.match(adapter, /v16-90-cellphones-materialized\.json/);
  assert.match(adapter, /v413-legacy-cellphones-sanitized\.json/);
  assert.match(adapter, /EXCLUDED_LEGACY_POSITIONS = new Set\(\[10, 91\]\)/);
  assert.match(adapter, /id: row\.id/);
  assert.match(adapter, /price: \{ amount: publicRow\.cashPriceARS/);
  assert.match(adapter, /image: \{ src: publicRow\.image/);
  assert.match(adapter, /visible: true/);
  assert.match(adapter, /source: "v16-cellphones-90-public"/);
  assert.doesNotMatch(adapter, /cost|costo|markup|proveedor|supplier|usd/i);
  assert.doesNotMatch(adapter, /fetch\s*\(|createClient|service_role|secret[_-]?key/i);
  assert.doesNotMatch(adapter, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);
});

test("all 90 canonical rows have matching sanitized price and image evidence", async () => {
  const canonical = JSON.parse(await source("fixtures/v16-90-cellphones-materialized.json"));
  const legacy = JSON.parse(await source("fixtures/v413-legacy-cellphones-sanitized.json"));
  const byPosition = new Map(legacy.phones.map((row) => [row.legacyPosition, row]));

  assert.equal(canonical.products.length, 90);
  const positions = canonical.products.map((row) => row.legacyPosition);
  assert.ok(!positions.includes(10));
  assert.ok(!positions.includes(91));

  for (const row of canonical.products) {
    const publicRow = byPosition.get(row.legacyPosition);
    assert.ok(publicRow, `missing public row at position ${row.legacyPosition}`);
    assert.ok(Number(publicRow.cashPriceARS) > 0, `invalid price at ${row.legacyPosition}`);
    assert.match(publicRow.image, /^https:\/\//, `invalid image at ${row.legacyPosition}`);
  }
});

test("legacy pilot cellphones are excluded once canonical 90 are active", async () => {
  const index = await source("lib/catalog/index.ts");

  assert.match(index, /primaryWithoutLegacyCellphones/);
  assert.match(index, /product\.category !== "celulares"/);
  assert.match(index, /primaryMatch && primaryMatch\.category !== "celulares"/);
});
