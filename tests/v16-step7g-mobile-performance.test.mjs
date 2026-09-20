import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("Step 7G adds stable route skeletons for store, category and PDP", async () => {
  const shell = await source("app/components/store-loading-shell.tsx");
  const rootLoading = await source("app/loading.tsx");
  const categoryLoading = await source("app/categoria/[slug]/loading.tsx");
  const productLoading = await source("app/producto/[slug]/loading.tsx");
  const css = await source("app/globals.css");

  assert.match(shell, /aria-busy="true"/);
  assert.match(shell, /route-skeleton-product-shell/);
  assert.match(shell, /route-skeleton-card-grid/);
  assert.match(rootLoading, /StoreLoadingShell/);
  assert.match(categoryLoading, /variant="category"/);
  assert.match(productLoading, /variant="product"/);
  assert.match(css, /route-skeleton-product-shell[\s\S]*grid-template-columns:\s*\.9fr 1\.1fr/);
  assert.match(css, /route-skeleton-card[\s\S]*height:\s*690px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*skeleton-surface::after/);
});

test("hero sleeps when offscreen, hidden, reduced-motion or constrained and bounds image preloading", async () => {
  const hero = await source("app/components/hero-slider.tsx");

  assert.match(hero, /IntersectionObserver/);
  assert.match(hero, /document\.visibilityState/);
  assert.match(hero, /prefers-reduced-motion:\s*reduce/);
  assert.match(hero, /saveData/);
  assert.match(hero, /effectiveType === "2g"/);
  assert.match(hero, /paused \|\| !inViewport \|\| !pageVisible \|\| reducedMotion \|\| constrainedRuntime/);
  assert.match(hero, /!constrainedRuntime && slides\[next\]/);
  assert.doesNotMatch(hero, /new Set\(\[1\]\)/);
});

test("catalog defers expensive result work and URL synchronization while keeping immediate controls", async () => {
  const catalog = await source("app/components/catalog-client.tsx");

  assert.match(catalog, /const deferredSearch = useDeferredValue\(search\)/);
  assert.match(catalog, /const deferredBrand = useDeferredValue\(brand\)/);
  assert.match(catalog, /const deferredSort = useDeferredValue\(sort\)/);
  assert.match(catalog, /const deferredFavoritesOnly = useDeferredValue\(favoritesOnly\)/);
  assert.match(catalog, /params\.set\("q", deferredSearch\.trim\(\)\)/);
  assert.match(catalog, /catalogUpdating/);
  assert.match(catalog, /aria-busy=\{catalogUpdating\}/);
  assert.match(catalog, /Actualizando…/);
});

test("performance budget is local-only and CSS reduces expensive polish on constrained/touch devices", async () => {
  const budget = await source("app/components/performance-budget.tsx");
  const layout = await source("app/layout.tsx");
  const css = await source("app/globals.css");
  const index = await source("lib/catalog/index.ts");
  const combined = [budget, layout, css].join("\n");

  assert.match(layout, /PerformanceBudget/);
  assert.match(budget, /data\.performanceProfile|dataset\.performanceProfile/);
  assert.match(budget, /saveData/);
  assert.match(budget, /cpuPerformance/);
  assert.match(budget, /cpuTier <= 2/);
  assert.match(css, /data-performance-profile="lean"/);
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(css, /content-visibility:\s*auto/);
  assert.match(css, /contain-intrinsic-size:\s*auto 720px/);
  assert.doesNotMatch(combined, /fetch\s*\(|XMLHttpRequest|sendBeacon|createClient|service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|rpc)\s*\(/i);
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
});
