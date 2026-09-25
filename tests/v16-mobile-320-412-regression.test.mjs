import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("320-412 mobile widths keep the approved two-card catalog layout", async () => {
  const css = await source("app/globals.css");

  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\.catalog-grid,[\s\S]*?\.home-products-grid\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/
  );
  assert.match(
    css,
    /@media \(max-width: 340px\)[\s\S]*?\.catalog-grid,[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/
  );
});

test("390px and narrower keep search text at mobile-safe 16px", async () => {
  const css = await source("app/globals.css");

  assert.match(
    css,
    /@media \(max-width: 390px\)\s*\{[\s\S]*?\.header-search input\s*\{\s*font-size:\s*16px;/
  );
});

test("320px header remains compact without horizontal collision", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /@media \(max-width: 320px\)[\s\S]*?grid-template-columns:\s*43px minmax\(0,1fr\) 70px/);
  assert.match(css, /@media \(max-width: 320px\)[\s\S]*?\.header-actions > a\s*\{\s*display:\s*none/);
});

test("sector tabs and bottom navigation remain touch-safe on 412px and narrower", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.sector-showroom-tabs[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /\.sector-bottom-navigation[\s\S]*?env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.sector-bottom-navigation > a,[\s\S]*?min-height:\s*52px/);
});
