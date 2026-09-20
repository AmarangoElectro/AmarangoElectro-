import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

const toolBanners = ["taladros.webp", "amoladoras.webp", "sierras.webp"];

test("Step 7P integrates Herramientas as a premium banner universe with three active internal sectors", async () => {
  const categories = await source("lib/catalog/categories.ts");
  assert.match(categories, /slug: "herramientas"/);
  assert.match(categories, /bannerImage: "\/assets\/banners\/categories\/herramientas-premium-clean\.webp"/);
  assert.match(categories, /sub\("taladros", "Taladros"/);
  assert.match(categories, /sub\("amoladoras", "Amoladoras"/);
  assert.match(categories, /sub\("sierras", "Sierras"/);
  const main = await stat(new URL("public/assets/banners/categories/herramientas-premium-clean.webp", root));
  assert.ok(main.size > 80000);
  for (const banner of toolBanners) {
    const file = await stat(new URL(`public/assets/banners/subcategories/herramientas/${banner}`, root));
    assert.ok(file.size > 70000, `${banner} should be a real optimized banner`);
  }
});

test("Step 7P keeps one exact official logo layer and removes dependence on generated banner logos", async () => {
  const cards = await source("app/components/subcategory-banner-card.tsx");
  const hero = await source("app/components/subcategory-sector-hero.tsx");
  const premium = await source("app/components/premium-category-hero.tsx");
  assert.match(cards, /\/logo-320\.webp/);
  assert.match(hero, /\/logo-320\.webp/);
  assert.match(premium, /\/logo-320\.webp/);
  assert.match(cards + hero, /subcategory-logo-bee/);
  assert.doesNotMatch(cards + hero + premium, /fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
});

test("Step 7P applies the same large editorial-banner behavior to Electrodomésticos and Herramientas", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /data-category="Electrodomésticos"/);
  assert.match(css, /data-category="Herramientas"/);
  assert.match(css, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /subcategory-banner:nth-child\(3\)/);
  assert.match(css, /Step 7P — logo de-duplication \+ Herramientas premium integration/);
});
