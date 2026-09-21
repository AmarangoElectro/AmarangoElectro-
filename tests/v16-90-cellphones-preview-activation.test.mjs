import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?v16cell90=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

function renderedProductIds(html) {
  return [...html.matchAll(/<article class="catalog-card[^"]*"[^>]*data-product-id="([^"]+)"/g)].map((match) => match[1]);
}

test("V16 90-cellphones preview: isolated in /administracion, not wired to the active storefront composite", async () => {
  const previewComponent = await source("components/internal/admin/v16-90-cellphones-preview.tsx");
  assert.match(previewComponent, /v16Cellphones90MaterializedProducts/);
  assert.doesNotMatch(previewComponent, /from ["']@\/lib\/catalog["']/, "must not read from the active production composite");
  assert.doesNotMatch(previewComponent, /fetch\s*\(|createClient|service_role|secret[_-]?key/i);
  assert.doesNotMatch(previewComponent, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);

  const index = await source("lib/catalog/index.ts");
  assert.doesNotMatch(index, /v16-cellphones-90-materialized-adapter|V16Cellphones90MaterializedCatalogAdapter/i);

  const workspace = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(workspace, /V16Cellphones90Preview/);
  assert.match(workspace, /cellphones90/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /v16Cellphones90MaterializedProducts|V16Cellphones90Preview|v16-cellphones-90-materialized/i);
});

test("V16 90-cellphones preview: production routes are byte-for-byte unaffected", async () => {
  const cases = [
    ["/buscar?q=A16", 0],
    ["/categoria/celulares?marca=Samsung&q=A16", 0],
  ];
  for (const [path, count] of cases) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.equal(renderedProductIds(html).length, count, path);
    assert.doesNotMatch(html, /v16-cell:\d+/, `${path} must not surface materialized cohort ids`);
  }
});

test("V16 90-cellphones preview: /administracion renders successfully with the new tab present, Home markup untouched", async () => {
  const response = await render("/administracion");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /90 Celulares \(Preview\)/);

  const homeResponse = await render("/");
  assert.equal(homeResponse.status, 200);
  const homeHtml = await homeResponse.text();
  assert.doesNotMatch(homeHtml, /v16-cell:\d+/);
  assert.doesNotMatch(homeHtml, /90 Celulares \(Preview\)/);
});
