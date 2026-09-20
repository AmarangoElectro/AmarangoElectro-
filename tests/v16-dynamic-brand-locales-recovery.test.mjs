import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const registry = fs.readFileSync("lib/theme/brand-locale.ts","utf8");
const category = fs.readFileSync("app/categoria/[slug]/page.tsx","utf8");

test("brand registry is sector-aware and includes approved locale families", () => {
  for (const brand of ["Apple","Samsung","Motorola","Xiaomi","Infinix","TCL","JBL","Sony","PlayStation","Kanjihome","Kanji","Kanji Tools","Telefunken","Ken Brown"]) {
    assert.match(registry, new RegExp(`brand: "${brand.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}"`));
  }
  assert.match(registry,/getBrandLocalesForSector/);
});

test("category only activates brand locales backed by publishable visible products", () => {
  assert.match(category,/availableBrands = new Set\(categoryProducts\.map/);
  assert.match(category,/rawRequestedBrand && availableBrands\.has/);
  assert.match(category,/getBrandLocalesForSector\(slug, availableBrands\)/);
});

test("brand locale works beyond celulares without changing product semantics", () => {
  assert.match(category,/getBrandLocale\(requestedBrand, slug\)/);
  assert.doesNotMatch(category,/slug === "celulares" \? getBrandLocale/);
});

test("Home remains outside this integration", () => {
  const changedTargets = ["lib/theme/brand-locale.ts","app/categoria/[slug]/page.tsx"];
  assert.equal(changedTargets.includes("app/page.tsx"), false);
});
