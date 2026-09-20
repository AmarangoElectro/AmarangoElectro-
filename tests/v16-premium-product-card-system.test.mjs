import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const card = fs.readFileSync("app/components/product-card.tsx", "utf8");
const themes = fs.readFileSync("lib/theme/product-card-theme.ts", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

test("one canonical ProductCard keeps product data and existing actions", () => {
  assert.match(card, /export function ProductCard/);
  assert.match(card, /product\.price/);
  assert.match(card, /product\.financing/);
  assert.match(card, /product\.stock/);
  assert.match(card, /toggleFavoriteId/);
  assert.match(card, /onCompareToggle/);
  assert.match(card, /Ver producto/);
  assert.doesNotMatch(card, /ProductCard(?:Celulares|Audio|Samsung|Apple|Motorola)/);
});

test("mobile image and grid are built for exactly two cards", () => {
  assert.match(card, /\(max-width: 680px\) 50vw/);
  assert.match(css, /V16 PREMIUM PRODUCT CARD SYSTEM[\s\S]*?@media \(max-width: 680px\)[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /aspect-ratio:\s*4\s*\/\s*5/);
});

test("sector and brand accents come from one central registry", () => {
  assert.match(themes, /PRODUCT_CARD_THEMES/);
  for (const sector of ["celulares", "smart-tv", "audio", "gaming", "hogar", "electrodomesticos"]) assert.match(themes, new RegExp(sector));
  for (const brand of ["apple", "samsung", "motorola", "xiaomi", "infinix", "jbl", "sony", "playstation", "tcl"]) assert.match(themes, new RegExp(brand));
  assert.match(card, /product-card-watermark/);
  assert.match(card, /data-sector-theme/);
  assert.match(card, /data-brand-theme/);
});

test("light and dark skins preserve Inter and high-contrast commerce hierarchy", () => {
  assert.match(css, /V16 PREMIUM PRODUCT CARD SYSTEM[\s\S]*?font-family:\s*Inter/);
  assert.match(css, /product-card-price/);
  assert.match(css, /product-card-installments/);
  assert.match(css, /\[data-theme="dark"\] \.product-card-premium/);
  assert.match(css, /\.product-card-premium:hover\s*\{[^}]*translateY\(-2px\)/s);
});
