import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("Step 7N wires a replaceable premium category banner without changing the 11-category taxonomy", async () => {
  const categories = await source("lib/catalog/categories.ts");
  assert.match(categories, /bannerImage\?: string/);
  assert.match(categories, /electrodomesticos-premium\.webp/);
  assert.match(categories, /navigationCategories/);
  assert.match(categories, /compatibilityCategories/);
  const banner = await stat(new URL("public/assets/banners/categories/electrodomesticos-premium.webp", root));
  const logo = await stat(new URL("public/brand/amarango-logo-official.png", root));
  assert.ok(banner.size > 50_000 && banner.size < 250_000, `optimized category banner is ${banner.size} bytes`);
  assert.ok(logo.size > 100000);
});

test("Step 7N renders the exact uploaded logo as a site layer instead of depending on generated logo artwork", async () => {
  const hero = await source("app/components/premium-category-hero.tsx");
  const page = await source("app/categoria/[slug]/page.tsx");
  assert.match(hero, /\/logo-320\.webp/);
  assert.match(hero, /premium-category-brand/);
  assert.match(hero, /premium-category-watermark/);
  assert.match(hero, /🐝/);
  assert.match(page, /PremiumCategoryHero/);
  assert.match(page, /category\.bannerImage/);
  assert.doesNotMatch(hero, /fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
});

test("Step 7N keeps the premium banner readable on mobile and preserves sector navigation", async () => {
  const css = await source("app/globals.css");
  const hero = await source("app/components/premium-category-hero.tsx");
  assert.match(css, /premium-category-hero/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /premium-category-honeycomb/);
  assert.match(css, /premium-category-wave/);
  assert.match(hero, /activeSubcategories\.map/);
  assert.match(hero, /category\.heroTagline \?\? category\.description/);
});
