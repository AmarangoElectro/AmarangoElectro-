import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("sector routes expose the anchor used by Home and contextual navigation", async () => {
  const page = await source("app/categoria/[slug]/page.tsx");
  const retail = await source("lib/catalog/retail-categories.ts");
  const context = await source("lib/navigation/subcategory-context.ts");

  assert.match(page, /id="sector-activo"/);
  assert.match(retail, /#sector-activo/);
  assert.match(context, /#sector-activo/);
});

test("searching inside an active non-brand sector preserves that sector", async () => {
  const showroom = await source("app/components/sector-showroom.tsx");

  assert.match(showroom, /activeSector && !activeSector\.brand/);
  assert.match(showroom, /name="sector" value=\{activeSector\.slug\}/);
});

test("subcategory context navigation stays inside storefront continuity", async () => {
  const nav = await source("app/components/subcategory-context-navigation.tsx");

  assert.match(nav, /import Link from "\.\/store-link"/);
  assert.match(nav, /<Link/);
  assert.doesNotMatch(nav, /<a[\s>]/);
});

test("global favorites are supported by the public search catalog", async () => {
  const search = await source("app/buscar/page.tsx");
  const catalog = await source("app/components/catalog-client.tsx");

  assert.match(search, /initialFavoritesOnly=\{values\.favoritos === "1"\}/);
  assert.match(catalog, /favoriteIds\.has\(product\.id\)/);
  assert.match(catalog, /Favoritos \(\{favoriteIds\.size\}\)/);
});

test("mobile category filters and anchors preserve touch/readability targets", async () => {
  const css = await source("app/globals.css");

  assert.match(css, /V16 category\/filters mobile continuity/);
  assert.match(css, /#sector-activo,[\s\S]*#catalogo[\s\S]*scroll-margin-top/);
  assert.match(css, /\.catalog-advanced-filters button,[\s\S]*min-height: 44px/);
  assert.match(css, /\.catalog-search input,[\s\S]*font-size: 16px/);
});

test("visible category copy does not restore retired slogans or draft labels", async () => {
  const showroom = await source("app/components/sector-showroom.tsx");
  const catalog = await source("app/components/catalog-client.tsx");

  assert.doesNotMatch(showroom, /Sentí cada momento\.|Tu espacio\. Tu estilo\./);
  assert.match(showroom, /Audio para cada ambiente\./);
  assert.match(showroom, /Diseñá tu espacio a tu manera\./);
  assert.doesNotMatch(catalog, /Quick Actions|V4\.18A · draft/);
  assert.match(catalog, /Acciones rápidas/);
  assert.match(catalog, /Vista de revisión/);
});
