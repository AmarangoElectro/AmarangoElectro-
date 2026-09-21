import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("90-cellphone review copy does not imply the whole public cellphone catalog is disabled", async () => {
  const phones = await source("components/internal/admin/v16-90-cellphones-preview.tsx");

  assert.match(phones, /90 CELULARES · MATRIZ DE REVISIÓN/);
  assert.match(phones, /La visibilidad pública se controla por separado/);
  assert.doesNotMatch(phones, /No visible en Storefront, no publicado/);
  assert.doesNotMatch(phones, /canonicalProductId real/);
});

test("quick actions expose human-facing availability and review-only language", async () => {
  const quick = await source("components/internal/admin/v418a-quick-actions-sheet.tsx");

  for (const label of ["Disponible", "Consultar disponibilidad", "Sin stock"]) assert.ok(quick.includes(label), label);
  assert.match(quick, /Foto para vista previa/);
  assert.match(quick, /EDICIÓN REAL BLOQUEADA/);
  assert.doesNotMatch(quick, /No se sube a Storage/);
  assert.doesNotMatch(quick, /no tiene autoridad para aplicar cambios productivos/);
});

test("bulk catalog actions cannot look executable before implementation", async () => {
  const grid = await source("components/internal/admin/admin-product-grid.tsx");

  assert.match(grid, /Edición real bloqueada en esta vista/);
  for (const label of ["Confirmar precio", "Mayorista", "Visibilidad", "Stock"]) {
    assert.match(grid, new RegExp(`<button type="button" disabled>${label}<\\/button>`));
  }
});

test("review surfaces have explicit mobile and dark-mode parity", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /V16 Administration — Storefront review, 90-cellphone review and admin catalog polish/);
  assert.match(css, /html\[data-theme="dark"\] \.v418b-storefront-lab__chrome/);
  assert.match(css, /html\[data-theme="dark"\] \.v418a-sheet/);
  assert.match(css, /html\[data-theme="dark"\] \.admin-product-grid-shell/);
  assert.match(css, /\.v16-cellphones-90-preview__chrome/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.admin-product-grid[\s\S]*grid-template-columns: 1fr/);
});
