import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?v411=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

function renderedProductIds(html) {
  return [...html.matchAll(/<article class="catalog-card[^"]*"[^>]*data-product-id="([^"]+)"/g)].map((match) => match[1]);
}

test("V4.11 public evidence is sanitized and explicitly not claimed as production", async () => {
  const fixture = JSON.parse(await source("fixtures/v411-catalog-evidence-public.json"));
  assert.equal(fixture.production_catalog_verified, false);
  assert.equal(fixture.evidence_status, "laboratory_snapshot_only");
  assert.equal(fixture.products.length, 4);
  const forbidden = /cost|costo|supplier|proveedor|mayorista|client|dni|phone|token|credential|password/i;
  assert.ok(fixture.products.every((product) => Object.keys(product).every((key) => !forbidden.test(key))));
  assert.ok(fixture.products.every((product) => product.visible === true));
  assert.ok(fixture.products.every((product) => product.image === null || product.image.startsWith("https://")));
});

test("V4.11 catalog boundary is offline, fail-closed and has no write surface", async () => {
  const adapter = await source("lib/catalog/audited-pilot-adapter.ts");
  const index = await source("lib/catalog/index.ts");
  const combined = `${adapter}\n${index}`;
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
  assert.match(adapter, /visible !== true/);
  assert.match(adapter, /Object\.freeze/);
  assert.doesNotMatch(combined, /fetch\s*\(|createClient|service_role|secret[_-]?key/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
});

test("V4.11 uses the same stable Product V16 IDs across customer, advisor and admin", async () => {
  const fixture = JSON.parse(await source("fixtures/v411-catalog-evidence-public.json"));
  const adapter = await source("lib/catalog/audited-pilot-adapter.ts");
  const advisor = await source("app/mi-amarango/page.tsx");
  const category = await source("app/categoria/[slug]/page.tsx");
  const admin = await source("components/internal/admin/v411-pilot-products.ts");
  for (const row of fixture.products) {
    assert.match(adapter, /`v411-evidence:\$\{row\.id\}`/);
    assert.match(admin, /v411PilotProducts/);
    assert.ok(row.id.length > 0);
  }
  assert.match(advisor, /catalog\.listProducts/);
  assert.match(category, /catalog\.listProducts/);
  assert.doesNotMatch(advisor, /cost|supplier|proveedor|margen|comisi[oó]n|USD/i);
});

test("V4.11 search and category routes return only evidence-backed matches", async () => {
  const cases = [
    ["/buscar?q=A16", 2],
    ["/buscar?q=Samsung%20A16", 2],
    ["/buscar?q=TV%2050", 0],
    ["/buscar?q=parlante", 0],
    ["/buscar?q=heladera", 0],
    ["/categoria/celulares?marca=Samsung&q=A16", 2],
    ["/categoria/electrodomesticos?sector=lavado", 1],
  ];
  for (const [path, count] of cases) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.equal(renderedProductIds(html).length, count, path);
  }
});

test("V4.11 product routes, commercial cards and role views preserve field boundaries", async () => {
  for (const slug of ["samsung-galaxy-a16-128-gb-a16-128", "motorola-moto-g15-256-gb-g15-256", "codini-secarropas-6-5-kg-sec-65"]) {
    const response = await render(`/producto/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    assert.match(html, /Dato pendiente del catálogo|A confirmar|Disponible/);
  }
  const customer = await source("app/components/product-card.tsx");
  const advisor = await source("app/components/advisor-workspace.tsx");
  const admin = await source("components/internal/admin/admin-product-card.tsx");
  assert.match(customer, /sixInstallments/);
  assert.match(customer, /Contado/);
  assert.doesNotMatch(customer, /costArs|supplier|proveedor|margen|comisi[oó]n|USD/);
  assert.doesNotMatch(advisor, /product\.(?:costArs|supplier|provider|margin|commission|costUsd)/i);
  assert.match(admin, /Costo/);
  assert.match(admin, /product\.supplier/);
});

test("V4.11 retains local favorites/share and prepares 1200+ catalog behavior", async () => {
  const favorites = await source("lib/commerce/favorites-store.ts");
  const share = await source("lib/commerce/share-product.ts");
  const catalog = await source("app/components/catalog-client.tsx");
  const adminScale = await source("lib/internal/admin/catalog-scale.ts");
  assert.match(favorites, /localStorage/);
  assert.match(favorites, /amarango:favorites-change/);
  assert.match(share, /capabilities\.share/);
  assert.match(share, /clipboard/);
  assert.match(catalog, /useDeferredValue/);
  assert.match(catalog, /price-asc/);
  assert.match(catalog, /availableOnly/);
  assert.match(adminScale, /getAdminCatalogWindow/);
});

test("V4.11 outputs both QA preview and direct Android standalone without iframe", async () => {
  const qa = await source("AmarangoElectro-V16-V4.11-Real-Catalog-QA-Preview.html");
  const standalone = await source("AmarangoElectro-V16-V4.11-Standalone-Android.html");
  assert.match(qa, /<iframe\b/i);
  assert.match(qa, /Buscador maestro/);
  assert.doesNotMatch(standalone, /<iframe\b/i);
  assert.match(standalone, /Standalone Android/);
  assert.match(standalone, /catalog-card\[data-product-id\]/);
  assert.match(standalone, /navigator\.share/);
  assert.ok((await stat(new URL("AmarangoElectro-V16-V4.11-Standalone-Android.html", root))).size > 1_000_000);
});

test("V4.11 preserves the V4.10 category artwork closure", async () => {
  const categories = await source("lib/catalog/retail-categories.ts");
  const entries = [...categories.matchAll(/\{ id: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(entries.length, 22);
  assert.equal(new Set(entries).size, 22);
  assert.match(categories, /officialArt\("celulares"\)/);
  assert.match(categories, /officialMobileArt\("smart-tv"\)/);
  assert.match(categories, /officialArt\("audio"\)/);
});

test("V4.11 identity handoff stays credential-free and Margarita remains untouched", async () => {
  const header = await source("app/components/site-header.tsx");
  const identitySources = `${header}\n${await source("app/plataforma/page.tsx")}`;
  assert.match(identitySources, /Maxi\/Angie|identidad/i);
  assert.doesNotMatch(identitySources, /password\s*=|pin\s*=|master[_-]?pin|service_role/i);
  const catalogSources = `${await source("lib/catalog/index.ts")}\n${await source("lib/catalog/audited-pilot-adapter.ts")}`;
  assert.doesNotMatch(catalogSources, /margarita|whatsapp|webhook|worker/i);
});
