import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const categoryPage = readFileSync("app/categoria/[slug]/page.tsx", "utf8");
const component = readFileSync("app/components/brand-locale-hero.tsx", "utf8");
const theme = readFileSync("lib/theme/brand-locale.ts", "utf8");
const home = readFileSync("app/page.tsx", "utf8");

test("brand locale recovery follows the active sector and publishable brand selection", () => {
  assert.match(categoryPage, /getBrandLocale\(requestedBrand, slug\)/);
  assert.match(categoryPage, /getBrandLocalesForSector\(slug, availableBrands\)/);
  assert.match(categoryPage, /<BrandLocaleHero locale=\{brandLocale\}/);
  assert.match(categoryPage, /availableBrands\.has\(rawRequestedBrand\)/);
});

test("owner-approved Apple Samsung Motorola locale tokens are present", () => {
  for (const value of ["LOCAL APPLE", "LOCAL SAMSUNG", "LOCAL MOTOROLA", "#1428a0", "#5ec6f4", "#111827"]) {
    assert.ok(theme.includes(value), `missing approved locale token: ${value}`);
  }
});

test("locale navigation reuses the active canonical sector and marca filter", () => {
  assert.match(component, /\/categoria\/\$\{sectorSlug\}\?marca=/);
  assert.match(component, /\/categoria\/\$\{sectorSlug\}#catalogo/);
  assert.doesNotMatch(component, /precio|cuota|stock|costo|proveedor/i);
});

test("Home remains structurally outside the brand locale recovery", () => {
  assert.doesNotMatch(home, /BrandLocaleHero|getBrandLocale|brand-locale/);
});
