import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const sheet = fs.readFileSync(path.join(root, "app/components/all-sectors-sheet.tsx"), "utf8");
const catalog = fs.readFileSync(path.join(root, "lib/catalog/retail-categories.ts"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const assets = fs.readdirSync(path.join(root, "public/assets/v16-generated/sectors-v2"));

test("all 22 commercial sectors use the new editable-background art system", () => {
  assert.equal(assets.filter((asset) => asset.endsWith(".webp")).length, 22);
  assert.match(catalog, /const sectorArt =/);
  assert.equal((catalog.match(/image: sectorArt\(/g) ?? []).length, 22);
  assert.equal((catalog.match(/mobileImage: sectorArt\(/g) ?? []).length, 22);
});

test("the all-sector selector behaves as an accessible tap-to-toggle drawer", () => {
  assert.match(sheet, /openSectorId/);
  assert.match(sheet, /aria-expanded=\{expanded\}/);
  assert.match(sheet, /aria-controls=\{panelId\}/);
  assert.match(sheet, /current === category\.id \? null : category\.id/);
  assert.match(sheet, /sectors-sheet-row-category/);
  assert.match(sheet, /sectors-sheet-row-name/);
  assert.match(sheet, /sectors-sheet-row-toggle/);
  assert.match(sheet, /Entrar al sector/);
});

test("sector rows keep artwork, category, name and arrow in a stable foreground stack", () => {
  assert.match(css, /\.sectors-sheet-row \{[\s\S]*grid-template-columns: minmax\(0,1fr\) 36px;/);
  assert.match(css, /\.sectors-sheet-row-art \{ z-index: 0; pointer-events: none; \}/);
  assert.match(css, /\.sectors-sheet-row-shade \{[\s\S]*z-index: 1;/);
  assert.match(css, /\.sectors-sheet-row-copy \{ position: relative; z-index: 2;/);
  assert.match(css, /\.sectors-sheet-row-toggle \{[\s\S]*z-index: 2;/);
});

test("dark mobile scrolling and route changes cannot fall back to white", () => {
  assert.match(css, /@view-transition\s*\{\s*navigation: none;/);
  assert.match(css, /\[data-theme="dark"\]\[data-scroll-activity="active"\] \.site-header/);
  assert.match(css, /background: rgba\(6,10,18,\.998\) !important/);
  assert.match(css, /::view-transition-new\(root\) \{ background: var\(--background\); \}/);
});
