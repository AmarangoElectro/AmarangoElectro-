import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("POCO, PlayStation, Redmi and Celulares artwork is materialized", async () => {
  for (const file of [
    "public/assets/v16-final/brands/poco-light.jpg",
    "public/assets/v16-final/brands/poco-dark.jpg",
    "public/assets/v16-final/brands/playstation-light.png",
    "public/assets/v16-final/brands/playstation-dark.png",
    "public/assets/v16-final/brands/redmi-light.png",
    "public/assets/v16-final/brands/redmi-dark.png",
    "public/assets/v16-final/main/celulares-multimarca.jpg",
  ]) {
    assert.ok((await stat(new URL(file, root))).size > 100_000, file);
  }
});

test("dark touch scrolling never forces the catalog search back to white", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /html\[data-theme="dark"\]\[data-scroll-activity="active"\] \.catalog-toolbar/);
  assert.match(css, /html\[data-theme="dark"\]\[data-scroll-activity="active"\] \.catalog-search/);
  assert.match(css, /html\[data-theme="dark"\] \{ color-scheme: dark; \}/);
});

test("brand routes use the compact campaign-first experience", async () => {
  const category = await source("app/categoria/[slug]/page.tsx");
  const showroom = await source("app/components/sector-showroom.tsx");
  const catalog = await source("app/components/catalog-client.tsx");

  assert.doesNotMatch(category, /<BrandLocaleHero/);
  assert.match(category, /compactBrandView=\{Boolean\(requestedCampaignBrand\)\}/);
  assert.match(category, /compactBrandMode=\{Boolean\(requestedCampaignBrand\)\}/);
  assert.match(showroom, /Todos los sectores/);
  assert.match(showroom, /!compactBrandView \? <div/);
  assert.ok(catalog.indexOf("<BrandCampaignBanner") < catalog.indexOf("catalog-quick-brands"));
});

test("the global sector drawer is available from category navigation", async () => {
  const category = await source("app/categoria/[slug]/page.tsx");
  const showroom = await source("app/components/sector-showroom.tsx");
  assert.match(category, /<AllSectorsSheet/);
  assert.match(showroom, /OpenSectorsSheetButton/);
});
