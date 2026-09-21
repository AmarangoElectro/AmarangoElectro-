import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("purchase intent review keeps customer-facing copy", async () => {
  const intent = await source("app/components/purchase-intent-flow.tsx");

  assert.match(intent, /Si falta algún dato, queda marcado como “A confirmar”/);
  assert.match(intent, /Nada se envía ni se guarda automáticamente/);
  assert.doesNotMatch(intent, /Lo que V16 no sabe|checkpoint|etapa posterior/);
});

test("recently viewed uses customer-facing language", async () => {
  const recent = await source("app/components/recently-viewed-rail.tsx");

  assert.match(recent, /VISTOS RECIENTEMENTE/);
  assert.match(recent, /Guardado en este dispositivo para que puedas retomar productos que ya viste/);
  assert.doesNotMatch(recent, /CONTINUIDAD LOCAL|rastrearte/);
});

test("product comparison traps focus inside the modal", async () => {
  const comparison = await source("app/components/product-comparison.tsx");

  assert.match(comparison, /const panelRef = useRef<HTMLElement>/);
  assert.match(comparison, /event\.key !== "Tab"/);
  assert.match(comparison, /querySelectorAll<HTMLElement>/);
  assert.match(comparison, /ref=\{panelRef\} className="compare-panel"/);
});

test("product decision flow keeps dark/mobile/safe-area parity", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /V16 product decision flow — mobile, safe-area and dark parity/);
  assert.match(css, /html\[data-theme="dark"\] \.purchase-intent-sheet/);
  assert.match(css, /html\[data-theme="dark"\] \.compare-panel/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /\.return-to-results,[\s\S]*min-height: 44px/);
  assert.match(css, /\.recently-viewed-heading > button[\s\S]*width: 44px/);
});

test("missing product image note stays simple and customer-facing", async () => {
  const page = await source("app/producto/[slug]/page.tsx");

  assert.match(page, /La fotografía se mostrará cuando esté disponible/);
  assert.doesNotMatch(page, /fotografía oficial se mostrará desde el catálogo/);
});
