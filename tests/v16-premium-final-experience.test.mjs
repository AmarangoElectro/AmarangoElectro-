import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const catalog = fs.readFileSync("app/components/catalog-client.tsx", "utf8");
const card = fs.readFileSync("app/components/product-card.tsx", "utf8");
const themes = fs.readFileSync("lib/theme/product-card-theme.ts", "utf8");
const comparison = fs.readFileSync("app/components/product-comparison.tsx", "utf8");
const calculator = fs.readFileSync("components/internal/admin/amarango-calculator-panel.tsx", "utf8");
const plates = fs.readFileSync("components/internal/admin/plates-panel.tsx", "utf8");
const home = fs.readFileSync("app/page.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

test("catalog keeps search visible and moves secondary controls into a compact disclosure", () => {
  assert.match(catalog, /catalog-toolbar-shell/);
  assert.match(catalog, /catalog-filter-toggle/);
  assert.match(catalog, /catalog-advanced-filters/);
  assert.match(catalog, /hidden=!\{?filtersOpen\}?|hidden=\{!filtersOpen\}/);
  assert.doesNotMatch(catalog, /Explorá todas las marcas en un solo lugar/);
  assert.equal((catalog.match(/aria-label="Filtrar por marca"/g) ?? []).length, 0);
  assert.match(css, /\.catalog-toolbar-shell\s*\{[^}]*position:\s*sticky/s);
});

test("product cards switch between Amarango, sector and brand identity without forking the card", () => {
  assert.match(card, /visualContext/);
  assert.match(card, /getProductCardVisualTheme\(product\.category, product\.brand, visualContext\)/);
  assert.match(themes, /ProductCardVisualContext = "amarango" \| "sector" \| "brand"/);
  assert.match(themes, /AMARANGO_BRAND/);
  assert.match(catalog, /showCategoryFilter \? "amarango" : "sector"/);
});

test("comparison presents real product visuals in aligned columns", () => {
  assert.match(comparison, /compare-product-visual/);
  assert.match(comparison, /product\.image\.src/);
  assert.match(css, /\.compare-product-visual\s*\{/);
  assert.match(css, /\.compare-product-head\s*\{[^}]*min-height:\s*220px/s);
});

test("Home removes the long explanatory tail while preserving its commerce sequence", () => {
  assert.doesNotMatch(home, /EmotionalRoutesRail|how-section|Cómo comprar/);
  assert.match(home, /HeroSlider/);
  assert.match(home, /FeaturedSectorsGrid/);
  assert.match(home, /HomeProductsPreview/);
  assert.match(home, /BrandLogoRail/);
});

test("Calculator and Placas share one premium private-tool system and preserve their engines", () => {
  assert.match(calculator, /admin-finance-tool/);
  assert.match(calculator, /quoteAmarangoCalculator/);
  assert.match(plates, /admin-finance-tool/);
  assert.match(plates, /buildPlate/);
  assert.match(css, /\.admin-finance-tool\s*\{/);
  assert.match(css, /\[data-theme="dark"\] \.admin-finance-tool/);
});

