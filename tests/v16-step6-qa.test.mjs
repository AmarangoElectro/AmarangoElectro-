import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("storefront remains on an offline adapter with no automatic Supabase writes", async () => {
  const index = await readFile(new URL("lib/catalog/index.ts", root), "utf8");
  const adapter = await readFile(new URL("lib/catalog/supabase-readonly.ts", root), "utf8");

  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
  assert.doesNotMatch(index, /new SupabaseReadOnlyCatalogAdapter\(/);
  assert.doesNotMatch(adapter, /NEXT_PUBLIC_SUPABASE|service_role/i);
  assert.doesNotMatch(adapter, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
  assert.doesNotMatch(adapter, /\.(?:insert|upsert|update|delete)\s*\(/i);
});

test("favorites storage is validated and synchronized without catalogue writes", async () => {
  const store = await readFile(new URL("lib/commerce/favorites-store.ts", root), "utf8");
  const header = await readFile(new URL("app/components/site-header.tsx", root), "utf8");

  assert.match(store, /Array\.isArray/);
  assert.match(store, /amarango:favorites-change/);
  assert.match(store, /removeEventListener/);
  assert.match(header, /favoritos=1#catalogo/);
});

test("Margarita drawer is isolated, keyboard-stable and integration-only", async () => {
  const component = await readFile(new URL("app/components/margarita-button.tsx", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(component, /role="dialog"/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /amarango:consult-product/);
  assert.match(component, /removeEventListener/);
  assert.match(component, /disabled/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
});

test("optimized circular logo is lightweight", async () => {
  const logo = await stat(new URL("public/logo-320.webp", root));
  assert.ok(logo.size < 50_000, `optimized logo is ${logo.size} bytes`);
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(css, /\.header-logo[\s\S]*border-radius:\s*50%/);
});

test("store links use resilient document navigation in local and future hosts", async () => {
  const link = await readFile(new URL("app/components/store-link.tsx", root), "utf8");
  const sources = [
    "app/components/site-header.tsx",
    "app/components/product-card.tsx",
    "app/components/hero-slider.tsx",
    "app/page.tsx",
  ];

  assert.match(link, /<a href=\{href\}/);
  for (const source of sources) {
    const contents = await readFile(new URL(source, root), "utf8");
    assert.doesNotMatch(contents, /from ["']next\/link["']/);
  }
});

test("hero preloads banners progressively instead of mounting the full image set", async () => {
  const hero = await readFile(new URL("app/components/hero-slider.tsx", root), "utf8");

  assert.match(hero, /loadedImages/);
  assert.match(hero, /new Set\(\)/);
  assert.match(hero, /new Set\(previous\)\.add\(1\)/);
  assert.match(hero, /!constrainedRuntime && slides\[next\]/);
  assert.match(hero, /loadedImages\.has\(index\)/);
});

test("legacy migration documents define the evidence gate and full matrix", async () => {
  const plan = await readFile(new URL("LEGACY-STORE-MIGRATION-PLAN.md", root), "utf8");
  const matrix = await readFile(new URL("docs/MIGRATION-MATRIX.md", root), "utf8");
  for (const term of ["Supabase", "catálogo", "favoritos", "WhatsApp", "Margarita", "asesores", "administradores", "roles"]) {
    assert.match(plan, new RegExp(term, "i"));
  }
  assert.match(matrix, /REUTILIZAR/);
  assert.match(matrix, /REESCRIBIR/);
  assert.match(matrix, /DESCARTAR/);
  assert.match(matrix, /PENDIENTE DE AUDITORÍA/);
});

test("primary routes render safely, including filtered and empty catalogue states", async () => {
  const workerUrl = new URL(`../dist/server/index.js?qa=${process.pid}-${Date.now()}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  for (const path of ["/", "/categoria/celulares", "/categoria/celulares?marca=Samsung&q=A16#catalogo", "/producto/samsung-galaxy-a16-128-gb-a16-128"]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  }

  const missing = await worker.fetch(new Request("http://localhost/producto/no-existe", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(missing.status, 404);
});
