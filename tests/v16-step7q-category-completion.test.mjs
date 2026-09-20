import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

const writePattern = /fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(|method\s*:\s*["'](?:POST|PATCH|PUT|DELETE)["']/i;

test("Step 7Q applies the premium hero to the approved architecture without redesigning compatibility routes", async () => {
  const page = await source("app/categoria/[slug]/page.tsx");
  const hero = await source("app/components/premium-category-hero.tsx");
  assert.match(page, /!isCompatibilityRoute \|\| category\.bannerImage/);
  assert.match(page, /PremiumCategoryHero/);
  assert.match(page, /CategoryVisual/);
  assert.match(hero, /has-prepared-art/);
  assert.match(hero, /category\.bannerImage \?/);
  assert.match(hero, /premium-category-prepared-art/);
  assert.match(hero, /logo-320\.webp/);
  assert.doesNotMatch(page + hero, writePattern);
});

test("Step 7Q completes every requested category with scalable real or prepared visual states", async () => {
  const categories = await source("lib/catalog/categories.ts");
  for (const slug of [
    "herramientas",
    "tecnologia-accesorios",
    "hogar",
    "descanso",
    "cuidado-personal-salud",
    "bebes-juguetes",
    "auto-motos-energia",
    "camping-aire-libre-mascotas",
    "gaming",
    "otros",
  ]) assert.match(categories, new RegExp(`slug: "${slug}"`));
  for (const title of ["Cargadores y accesorios", "Hogar y deco", "Bazar y mesa", "Blanquería", "Colchones y sommiers", "PlayStation", "Xbox", "Nintendo", "Accesorios gamer"]) assert.match(categories, new RegExp(title));
  assert.match(categories, /heroTagline/);
});

test("Step 7Q keeps active sectors navigable even while their replaceable image is pending", async () => {
  const page = await source("app/categoria/[slug]/page.tsx");
  const sector = await source("app/components/subcategory-sector-hero.tsx");
  assert.match(page, /activeSector &&/);
  assert.match(sector, /subcategory\.image \?/);
  assert.match(sector, /subcategory-sector-prepared-art/);
  assert.match(sector, /data-image-status/);
  assert.doesNotMatch(sector, writePattern);
});

test("Step 7Q makes Explorar más progressive, searchable and filterable without catalog writes", async () => {
  const page = await source("app/categoria/[slug]/page.tsx");
  const explorer = await source("app/components/progressive-category-explorer.tsx");
  assert.match(page, /ProgressiveCategoryExplorer/);
  assert.match(explorer, /type="search"/);
  assert.match(explorer, /Casa y bienestar/);
  assert.match(explorer, /Tecnología y entretenimiento/);
  assert.match(explorer, /Proyectos y aire libre/);
  assert.match(explorer, /filtered\.slice\(0, 4\)/);
  assert.doesNotMatch(explorer, writePattern);
});

test("Step 7Q responsive system protects 320px layouts and optimized category LCP artwork", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /Step 7Q/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /prefers-reduced-motion/);
  const optimized = await stat(new URL("public/assets/banners/categories/electrodomesticos-premium.webp", root));
  const sourcePng = await stat(new URL("public/assets/banners/categories/electrodomesticos-premium.png", root));
  assert.ok(optimized.size < sourcePng.size / 5, `expected major compression, got ${optimized.size} vs ${sourcePng.size}`);
});

test("Step 7Q leaves Admin, CRM, Margarita and production integration boundaries intact", async () => {
  const admin = await source("components/internal/admin/admin-product-grid.tsx");
  const futureCrm = await source("V16-FUTURE-CRM-INTEGRATION-NOTES.md");
  const margarita = await source("app/components/margarita-button.tsx");
  assert.match(admin, /AdminProductCard/);
  assert.match(futureCrm, /pendiente, no implementado/i);
  assert.match(margarita, /Preparada para integración/i);
  assert.doesNotMatch([admin, margarita].join("\n"), writePattern);
});
