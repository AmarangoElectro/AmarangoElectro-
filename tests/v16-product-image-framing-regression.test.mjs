import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("product cards expose category and subcategory for presentation-only framing", async () => {
  const card = await source("app/components/product-card.tsx");
  assert.match(card, /data-product-category=\{product\.category\}/);
  assert.match(card, /data-product-subcategory=\{product\.subcategory \?\? ""\}/);
});

test("product detail exposes the same framing context without mutating catalog data", async () => {
  const page = await source("app/producto/[slug]/page.tsx");
  assert.match(page, /data-product-category=\{product\.category\}/);
  assert.match(page, /data-product-subcategory=\{product\.subcategory \?\? ""\}/);
});

test("photo framing keeps contain and adapts by product shape", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /V16 PRODUCT PHOTO FRAMING/);
  assert.match(css, /data-product-category="celulares"[\s\S]*?\.product-image/);
  assert.match(css, /data-product-category="smart-tv"[\s\S]*?\.product-image/);
  assert.match(css, /data-product-category="audio"[\s\S]*?object-position:\s*center bottom/);
  assert.match(css, /data-product-subcategory="refrigeracion"[\s\S]*?object-position:\s*center bottom/);
  assert.match(css, /data-product-subcategory="lavado"[\s\S]*?object-position:\s*center bottom/);
  assert.match(css, /\.product-card-premium \.product-image\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.detail-product-image\s*\{[^}]*object-fit:\s*contain/);
});
