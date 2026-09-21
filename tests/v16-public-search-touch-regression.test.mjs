import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("public search uses the current composite catalog count", async () => {
  const search = await source("app/buscar/page.tsx");

  assert.match(search, /products\.length/);
  assert.match(search, /Catálogo AmarangoElectro/);
  assert.doesNotMatch(search, /v411CatalogEvidence|Catálogo en incorporación|la muestra disponible/);
});

test("missing product photography uses customer-facing copy", async () => {
  const card = await source("app/components/product-card.tsx");

  assert.match(card, /FOTO EN ACTUALIZACIÓN/);
  assert.doesNotMatch(card, /IMAGEN NO DISPONIBLE/);
});

test("public mobile controls preserve minimum touch targets", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /V16 public mobile touch-target pass/);
  assert.match(css, /\.category-page \.card-tools button[\s\S]*min-width: 44px[\s\S]*min-height: 44px/);
  assert.match(css, /\.product-actions > button:not\(\.consult-button\)/);
  assert.match(css, /\.compare-dock-product button[\s\S]*width: 36px[\s\S]*height: 36px/);
  assert.match(css, /\.sector-bottom-navigation > a[\s\S]*min-height: 52px/);
});
