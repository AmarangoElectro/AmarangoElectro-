import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("Home header navigation points only to real destinations", async () => {
  const [header, home, products, offers, footer] = await Promise.all([
    source("app/components/site-header.tsx"),
    source("app/page.tsx"),
    source("app/components/home-products-preview.tsx"),
    source("app/components/offers-showcase.tsx"),
    source("app/components/site-footer.tsx"),
  ]);

  for (const href of ['"/#productos"', '"/#ofertas"', '"/#experiencia"']) {
    assert.ok(header.includes(href), href);
  }

  assert.match(home, /id="experiencia"/);
  assert.match(home, /id="financiacion"/);
  assert.match(products, /id="productos"/);
  assert.match(offers, /id={advisor ? undefined : "ofertas"}/);

  assert.doesNotMatch([header, footer].join("\n"), /#como-comprar/);
  assert.doesNotMatch(header, /categoria\/celulares\?favoritos=1/);
  assert.match(header, /\/buscar\?favoritos=1#catalogo/);
  assert.match(header, /> Espacios internos<\/Link>|>Espacios internos<\/Link>/);
});

test("Home featured sectors do not restore retired slogans", async () => {
  const featured = await source("app/components/featured-sectors-grid.tsx");

  for (const retired of [
    "Jugá sin límites.",
    "Tu espacio. Tu estilo.",
    "Sentí cada momento.",
  ]) {
    assert.ok(!featured.includes(retired), retired);
  }

  for (const current of [
    "Audio para cada ambiente.",
    "Consolas, juegos y accesorios.",
    "Muebles, deco y soluciones para tu casa.",
  ]) {
    assert.ok(featured.includes(current), current);
  }
});

test("mobile Home navigation keeps sticky-header offsets and safe drawer spacing", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /V16 Home\/header mobile navigation polish/);
  assert.match(css, /#productos,[\s\S]*#ofertas,[\s\S]*#experiencia,[\s\S]*#financiacion[\s\S]*scroll-margin-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /\.header-search input[\s\S]*font-size: 16px/);
  assert.match(css, /\.store-drawer nav a,[\s\S]*min-height: 48px/);
});

test("footer routes to actual Home sections and advisor space", async () => {
  const footer = await source("app/components/site-footer.tsx");

  for (const href of ["/#productos", "/#experiencia", "/#financiacion", "/mi-amarango"]) {
    assert.ok(footer.includes(`href="${href}"`), href);
  }
});
