import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("supplier photo review stays local and supports batch plus per-card work", () => {
  const panel = read("components/internal/admin/photo-review-panel.tsx");
  assert.match(panel, /fotos para revisar/i);
  assert.match(panel, /Foto del mayorista/i);
  assert.match(panel, /Flyer económico/);
  assert.match(panel, /Seleccionar todas/);
  assert.match(panel, /Característica \$\{index \+ 1\}/);
  assert.match(panel, /Nada se envía a producción/);
  assert.doesNotMatch(panel, /fetch\(/i);
});

test("product photos fill their frames and customer cards expose 2, 4 and 6 installments", () => {
  const css = read("app/globals.css");
  const card = read("app/components/product-card.tsx");
  const advisor = read("app/components/advisor-workspace.tsx");
  assert.match(css, /\.product-card-premium \.product-image,[\s\S]*object-fit: cover !important/);
  assert.match(css, /\.admin-product-card__media > img[\s\S]*padding: 0 !important/);
  assert.match(card, /\[2, 4, 6\]/);
  assert.match(advisor, /\[2, 4, 6\]/);
});

test("public home and administrative navigation preserve the oval V16 language", () => {
  const featured = read("app/components/featured-sectors-grid.tsx");
  const admin = read("app/components/admin-consolidated-workspace.tsx");
  assert.match(featured, /featured-sector-card/);
  assert.match(admin, /Fotos · revisión/);
  assert.match(admin, /PhotoReviewPanel/);
});
