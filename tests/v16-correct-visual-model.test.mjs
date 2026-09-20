import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const showroom = fs.readFileSync(path.join(root, "app/components/sector-showroom.tsx"), "utf8");
const categoryPage = fs.readFileSync(path.join(root, "app/categoria/[slug]/page.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");

test("the recovered sector showroom keeps the approved copy and navigation", () => {
  assert.match(showroom, /Tu próximo celular empieza acá\./);
  assert.match(showroom, /Sentí el ritmo\. Viví la música\./);
  assert.match(showroom, /Buscar en este sector/);
  for (const label of ["Celulares", "Smart TV", "Audio", "Gaming", "Samsung", "iPhone", "Motorola"]) {
    assert.match(showroom, new RegExp(label));
  }
  assert.match(showroom, /ThemeToggle/);
  assert.match(showroom, /sector-bottom-navigation/);
});

test("mobile sector catalog is exactly two canonical product cards per row", () => {
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.category-page \.catalog-grid,[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(categoryPage, /<CatalogClient/);
  assert.doesNotMatch(categoryPage, /ProductCard/);
});

test("approved editorial banners are present as real app assets", () => {
  for (const file of ["audio.jpg", "smart-tv.jpg", "climatizacion.jpg", "refrigeracion.jpg", "hogar.jpg", "home-amarango.jpg"]) {
    const asset = path.join(root, "public/assets/v16-correcto", file);
    assert.ok(fs.statSync(asset).size > 10_000, `${file} must be a materialized image asset`);
  }
});
