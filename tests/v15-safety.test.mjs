import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Supabase adapter exposes GET-only catalogue access", async () => {
  const source = await readFile(new URL("lib/catalog/supabase-readonly.ts", root), "utf8");
  assert.match(source, /method:\s*"GET"/);
  assert.doesNotMatch(source, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/);
  assert.doesNotMatch(source, /\.(?:insert|upsert|update|delete)\s*\(/);
  assert.match(source, /params\.set\("visible",\s*"eq\.true"\)/);
  assert.match(source, /safeParse\(rows\)/);
});

test("V14 checkpoint remains byte-identical", async () => {
  const { createHash } = await import("node:crypto");
  const bytes = await readFile(new URL("public/reference/amarango-mega-home-v14-original.zip", root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "af9625aa43f2389866cd8ec3689539e0bb5ecbd5e6e84a9da6cc094e77212d3b");
});

test("responsive rules cover requested mobile and tablet ranges", async () => {
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(max-width: 840px\)/);
  assert.match(css, /@media \(max-width: 1100px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 412px\)/);
  assert.match(css, /@media \(max-width: 320px\)/);
});

test("banner artwork stays complete while cinematic motion remains decorative", async () => {
  const slider = await readFile(new URL("app/components/hero-slider.tsx", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(slider, /media="\(max-width: 620px\)"/);
  assert.match(slider, /--slide-desktop/);
  assert.match(slider, /--slide-mobile/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /v16-backdrop-cinema/);
  assert.match(css, /active picture img[^}]*animation:\s*none/s);
});

test("product UI renders official images and keeps an honest branded fallback", async () => {
  const card = await readFile(new URL("app/components/product-card.tsx", root), "utf8");
  const detail = await readFile(new URL("app/producto/[slug]/page.tsx", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(card, /product\.image\s*\?/);
  assert.match(card, /FOTO OFICIAL PENDIENTE/);
  assert.match(detail, /detail-product-image/);
  assert.match(css, /brand-apple/);
  assert.match(css, /brand-samsung/);
  assert.match(css, /brand-motorola/);
  assert.match(css, /brand-xiaomi/);
  assert.match(css, /brand-infinix/);
});

test("category hubs preserve real universes and link phone lines to an initial brand filter", async () => {
  const page = await readFile(new URL("app/categoria/[slug]/page.tsx", root), "utf8");
  const client = await readFile(new URL("app/components/catalog-client.tsx", root), "utf8");
  const definitions = await readFile(new URL("lib/catalog/categories.ts", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(page, /marca=.*#catalogo/);
  assert.match(page, /initialBrand=\{initialBrand\}/);
  assert.match(client, /initialBrand = "Todos"/);
  assert.match(client, /initialFavoritesOnly/);
  for (const brand of ["Apple", "Samsung", "Motorola", "Xiaomi", "Infinix"]) {
    assert.match(definitions, new RegExp(`brand: "${brand}"`));
  }
  for (const theme of ["electrodomesticos", "smart-tv", "audio", "hogar-descanso", "gaming"]) {
    assert.match(css, new RegExp(`category-theme-${theme}`));
  }
});
