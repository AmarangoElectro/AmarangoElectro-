import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

const banners = [
  "refrigeracion.webp",
  "climatizacion.webp",
  "coccion.webp",
  "lavado.webp",
  "pequenos-electrodomesticos.webp",
  "limpieza.webp",
];

test("Step 7O integrates the six approved Electrodomésticos internal banners as replaceable assets", async () => {
  const categories = await source("lib/catalog/categories.ts");
  for (const banner of banners) {
    assert.match(categories, new RegExp(`/assets/banners/subcategories/electrodomesticos/${banner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    const file = await stat(new URL(`public/assets/banners/subcategories/electrodomesticos/${banner}`, root));
    assert.ok(file.size > 50000, `${banner} should be a real banner asset`);
  }
  assert.match(categories, /imageStatus: "ready"/);
});

test("Step 7O keeps the exact official logo as a site layer on cards and selected-sector hero", async () => {
  const cards = await source("app/components/subcategory-banner-card.tsx");
  const hero = await source("app/components/subcategory-sector-hero.tsx");
  assert.match(cards, /\/logo-320\.webp/);
  assert.match(cards, /subcategory-banner-logo-patch/);
  assert.match(cards, /#sector-activo/);
  assert.match(hero, /\/logo-320\.webp/);
  assert.match(hero, /Volver a/);
  assert.doesNotMatch(cards + hero, /fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
});

test("Step 7O provides two-column desktop editorial banners, one-column mobile, and a selected-sector presentation", async () => {
  const css = await source("app/globals.css");
  const page = await source("app/categoria/[slug]/page.tsx");
  assert.match(css, /Step 7O — Electrodomésticos/);
  assert.match(css, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /subcategory-banner-editorial/);
  assert.match(css, /subcategory-sector-hero/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(page, /SubcategorySectorHero/);
  assert.match(page, /activeSector &&/);
});
