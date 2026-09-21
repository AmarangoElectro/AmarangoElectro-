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

test("all 90 isolated cellphones have HTTPS images and remain non-public", () => {
  const fixture = JSON.parse(fs.readFileSync("fixtures/v16-90-cellphones-materialized.json", "utf8"));
  assert.equal(fixture.products.length, 90);
  assert.ok(fixture.products.every((product) => /^https:\/\//.test(product.image)));
  assert.equal(fixture.photo_materialization?.public_activation, false);

  const adapter = fs.readFileSync("lib/catalog/v16-cellphones-90-materialized-adapter.ts", "utf8");
  assert.match(adapter, /visible: false/);
  assert.match(adapter, /image: \{ src: row\.image, alt: row\.name \}/);

  const index = fs.readFileSync("lib/catalog/index.ts", "utf8");
  assert.doesNotMatch(index, /new V16Cellphones90MaterializedCatalogAdapter\(\)/);
});

test("product cards use preserve framing instead of cropping source artwork", () => {
  const card = fs.readFileSync("app/components/product-card.tsx", "utf8");
  const css = fs.readFileSync("app/globals.css", "utf8");
  assert.match(card, /data-image-framing=\{imageFraming\}/);
  assert.match(card, /product\.category === "celulares" \? "product-photo" : "full-composition"/);
  assert.match(css, /data-image-framing="full-composition"/);
  assert.match(css, /object-fit: contain !important/);
  assert.match(css, /object-position: center top !important/);
  assert.match(css, /aspect-ratio: 3 \/ 4 !important/);
});

test("all 229 electro products are assigned to supported V16 subcategories", () => {
  const supported = new Set([
    "refrigeracion",
    "climatizacion",
    "coccion",
    "lavado",
    "pequenos-electrodomesticos",
    "limpieza",
  ]);
  const products = snapshotPaths.flatMap((path) => JSON.parse(fs.readFileSync(path, "utf8")).products);
  const electro = products.filter((product) => product.category === "electrodomesticos");
  assert.equal(electro.length, 229);
  for (const product of electro) {
    assert.ok(supported.has(product.subcategory), `${product.id} ${product.name}: ${product.subcategory}`);
  }

  const router = fs.readFileSync("lib/catalog/electro-subcategory.ts", "utf8");
  assert.match(router, /failClosed: true/);
  assert.match(router, /sourceWrite: false/);
});


test("binary integrity audit isolates only cross-model photo conflict", () => {
  const audit = JSON.parse(fs.readFileSync("fixtures/v16-90-cellphones-photo-integrity-audit-20260921.json", "utf8"));
  assert.equal(audit.summary.products, 90);
  assert.equal(audit.summary.missing_storage_metadata, 0);
  assert.equal(audit.summary.non_image_mimetype_count, 0);
  assert.equal(audit.summary.duplicate_binary_groups, 6);
  assert.equal(audit.summary.same_model_variant_reuse_groups, 5);
  assert.equal(audit.summary.cross_model_conflict_groups, 1);

  const conflict = audit.duplicateBinaryGroups.find((group) => group.type === "cross-model-conflict");
  assert.ok(conflict);
  assert.deepEqual(conflict.products.map((product) => product.canonicalProductId).sort((a,b) => a-b), [23, 46]);
  assert.equal(conflict.requiresHumanVisualReview, true);
});
