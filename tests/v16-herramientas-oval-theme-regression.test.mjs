import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("Herramientas keeps three separate full-card oval banners without a logo layer", async () => {
  const cards = await source("app/components/subcategory-banner-card.tsx");

  assert.match(cards, /taladros:[\s\S]*Percutores[\s\S]*Atornilladores[\s\S]*Batería/);
  assert.match(cards, /amoladoras:[\s\S]*Corte[\s\S]*Desbaste[\s\S]*Terminación/);
  assert.match(cards, /sierras:[\s\S]*Caladoras[\s\S]*Circulares[\s\S]*Banco/);
  assert.match(cards, /tools-subcategory-banner/);
  assert.match(cards, /showEditorialLogo = hasEditorialBanner && categorySlug !== "herramientas"/);

  const toolsBranch = cards.match(/if \(toolsMeta && artwork\) \{([\s\S]*?)\n  \}\n\n  if \(subcategory\.brand/);
  assert.ok(toolsBranch, "tools banner branch must remain explicit");
  assert.match(toolsBranch[1], /<Link/);
  assert.match(toolsBranch[1], /href=\{href\}/);
  assert.match(toolsBranch[1], /Entrar al sector/);
  assert.doesNotMatch(toolsBranch[1], /logo-320|subcategory-banner-logo-patch|subcategory-logo-bee/);
});

test("Herramientas keeps the V16 oval geometry and explicit light-dark parity", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /V16 Herramientas — logo-free oval banners/);
  assert.match(css, /data-category="Herramientas"[\s\S]*tools-subcategory-banner/);
  assert.match(css, /aspect-ratio:\s*3\.5\s*\/\s*1/);
  assert.match(css, /border-radius:\s*999px/);
  assert.match(css, /html\[data-theme="dark"\][\s\S]*tools-subcategory-banner/);
  assert.match(css, /tools-subcategory-banner-media/);
  assert.match(css, /@media \(max-width: 390px\)/);
});
