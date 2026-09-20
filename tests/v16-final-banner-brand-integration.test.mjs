import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

const mainCampaigns = ["smart-tv", "electrodomesticos", "climatizacion", "audio", "hogar", "descanso"];
const pairedBrands = ["aiwa", "lg", "tcl", "lenovo", "jbl", "ken-brown", "sony", "philips", "infinix", "apple", "samsung", "xiaomi", "redmi", "motorola"];

test("final Home campaigns are real, sharp-first-paint assets", async () => {
  const hero = await source("app/components/hero-slider.tsx");
  for (const campaign of mainCampaigns) {
    const file = await stat(new URL(`public/assets/v16-final/main/${campaign}.png`, root));
    assert.ok(file.size > 100_000, `${campaign} must be materialized`);
    assert.match(hero, new RegExp(`/assets/v16-final/main/${campaign}\\.png`));
  }
  assert.match(hero, /new Set\(\[0\]\)/);
  assert.match(hero, /fetchPriority=\{index === 0 \? "high" : "auto"\}/);
});

test("brand campaigns have explicit light and dark pairs", async () => {
  const component = await source("app/components/brand-campaign-banner.tsx");
  const catalog = await source("app/components/catalog-client.tsx");
  const css = await source("app/globals.css");
  for (const brand of pairedBrands) {
    for (const theme of ["light", "dark"]) {
      const file = await stat(new URL(`public/assets/v16-final/brands/${brand}-${theme}.png`, root));
      assert.ok(file.size > 90_000, `${brand}-${theme} must be materialized`);
      assert.match(component, new RegExp(`${brand}-${theme}\\.png`));
    }
  }
  assert.match(catalog, /<BrandCampaignBanner brand=\{brand\}/);
  assert.match(css, /\[data-theme="dark"\] \.brand-campaign-art-light \{ display: none; \}/);
  assert.match(css, /\[data-theme="dark"\] \.brand-campaign-art-dark \{ display: block; \}/);
});

test("Noblex remains explicitly unpaired instead of reusing a false light variant", async () => {
  const dark = await stat(new URL("public/assets/v16-final/brands/noblex-dark.png", root));
  const component = await source("app/components/brand-campaign-banner.tsx");
  assert.ok(dark.size > 100_000);
  assert.doesNotMatch(component, /noblex-light\.png/);
});
