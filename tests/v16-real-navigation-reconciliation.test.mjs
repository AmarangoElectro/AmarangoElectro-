import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("app/page.tsx","utf8");
const sectors = fs.readFileSync("app/components/featured-sectors-grid.tsx","utf8");
const sheet = fs.readFileSync("app/components/all-sectors-sheet.tsx","utf8");
const category = fs.readFileSync("app/categoria/[slug]/page.tsx","utf8");
const pdp = fs.readFileSync("app/producto/[slug]/page.tsx","utf8");

test("Home delegates real sector navigation without review-dashboard UI", () => {
  assert.match(home, /<FeaturedSectorsGrid/);
  assert.match(home, /<AllSectorsSheet/);
  assert.match(sectors + sheet, /\/categoria\//);
  assert.doesNotMatch(home, /MAPA VISUAL|INTEGRACION VISUAL NAVEGABLE|V16 · IR A/i);
});

test("Category exposes dynamic brand-local links", () => {
  assert.match(category, /getBrandLocalesForSector\(slug, availableBrands\)/);
  assert.match(category, /encodeURIComponent\(locale\.brand\)/);
  assert.match(category, /#catalogo/);
});

test("Category renders real catalog", () => {
  assert.match(category, /<CatalogClient/);
  assert.match(category, /products=\{products\}/);
});

test("PDP preserves contextual return and related ProductCards", () => {
  assert.match(pdp, /ReturnToResults fallbackHref=\{`\/categoria\/\$\{product\.category\}#catalogo`\}/);
  assert.match(pdp, /<ProductCard key=\{item\.id\} product=\{item\}/);
  assert.match(pdp, /Volver al catálogo/);
});
