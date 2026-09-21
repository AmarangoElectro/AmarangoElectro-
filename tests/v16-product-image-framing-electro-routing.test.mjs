import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("product cards use full-image framing instead of cropping supplier flyers", () => {
  const css = fs.readFileSync("app/globals.css", "utf8");
  assert.match(css, /V16 — product image framing hard gate/);
  assert.match(css, /object-fit:\s*contain\s*!important/);
  assert.match(css, /object-position:\s*center center\s*!important/);
  assert.match(css, /aspect-ratio:\s*3\s*\/\s*4/);
  assert.match(css, /transform:\s*none\s*!important/);
});

test("obvious cleaning appliances are routed to Electrodomésticos > Limpieza", () => {
  const fixture = JSON.parse(fs.readFileSync("fixtures/v16-electrodomesticos-sanitized-20260920.json", "utf8"));
  const expectedCleaningIds = ["604", "-632"];
  for (const id of expectedCleaningIds) {
    const product = fixture.products.find((row) => String(row.id) === id);
    assert.ok(product, id);
    assert.equal(product.category, "electrodomesticos", id);
    assert.equal(product.subcategory, "limpieza", id);
  }

  const counts = fixture.products.reduce((acc, product) => {
    acc[product.subcategory] = (acc[product.subcategory] ?? 0) + 1;
    return acc;
  }, {});
  assert.equal(counts["pequenos-electrodomesticos"], 65);
  assert.equal(counts.limpieza, 13);
});
