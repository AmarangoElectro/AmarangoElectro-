import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const hero = fs.readFileSync("app/components/hero-slider.tsx", "utf8");
const home = fs.readFileSync("app/page.tsx", "utf8");
const sectors = fs.readFileSync("app/components/sector-showroom.tsx", "utf8");
const categories = fs.readFileSync("lib/catalog/categories.ts", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

const retiredCopy = [
  "Jugá sin límites",
  "Tu casa. Tu lugar.",
  "El sonido también se siente",
  "Viví cada momento",
  "Celulares, tecnología que va con vos",
  "Entrá por lo que querés vivir",
  "Explorar más",
];

test("Home hero uses only the approved premium advertising batch", () => {
  for (const asset of [
    "smart-tv.png",
    "electrodomesticos.png",
    "climatizacion.png",
    "audio.png",
    "hogar.png",
    "descanso.png",
  ]) assert.match(hero, new RegExp(asset.replace(".", "\\.")));

  assert.doesNotMatch(hero, /\/assets\/banners\/(?:electrodomesticos|celulares|smart-tv|audio|hogar|playstation5)\.webp/);
  assert.doesNotMatch(hero, /\/assets\/mobile\/(?:electrodomesticos|celulares|smart-tv|audio|hogar|playstation5)\.webp/);
  for (const phrase of retiredCopy) assert.doesNotMatch(`${hero}\n${home}\n${sectors}\n${categories}`, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("Home shortens the path from advertising to sectors and products", () => {
  const heroAt = home.indexOf("<HeroSlider />");
  const sectorsAt = home.indexOf("<FeaturedSectorsGrid />");
  const productsAt = home.indexOf("<HomeProductsPreview");
  const brandsAt = home.indexOf("<BrandLogoRail />");
  assert.ok(heroAt >= 0 && sectorsAt > heroAt && productsAt > sectorsAt && brandsAt > productsAt);
  assert.match(home, /home-quick-trust/);
  assert.doesNotMatch(home, /statement-section|story-section|finance-section/);
});

test("sector showroom has one Amarango shell and distinct visual identities", () => {
  for (const slug of [
    "celulares",
    "electrodomesticos",
    "smart-tv",
    "audio",
    "gaming",
    "hogar",
    "tecnologia-accesorios",
    "descanso",
    "cuidado-personal-salud",
    "bebes-juguetes",
  ]) assert.ok(sectors.includes(slug), `missing sector visual: ${slug}`);

  assert.match(sectors, /--sector-accent/);
  assert.match(sectors, /sector-editorial-cta/);
  assert.match(sectors, /sector-showroom-search/);
  assert.match(sectors, /sector-showroom-brands/);
  assert.match(css, /V16 — ajuste visual definitivo/);
  assert.match(css, /\.sector-editorial\.has-image\s*\{\s*height:/);
});

test("mobile storefront remains two cards per row and uses compact sector controls", () => {
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?\.home-products-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.sector-showroom-tabs a\s*\{[^}]*min-height:\s*62px/);
  assert.match(css, /\.featured-sectors-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3/);
});
