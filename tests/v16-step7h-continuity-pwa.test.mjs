import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("Step 7H preserves catalog context and restores the exact scroll position", async () => {
  const memory = await source("lib/ux/navigation-memory.ts");
  const link = await source("app/components/store-link.tsx");
  const reset = await source("app/components/route-scroll-reset.tsx");
  const productPage = await source("app/producto/[slug]/page.tsx");

  assert.match(memory, /amarango:v16:catalog-return/);
  assert.match(memory, /scrollY/);
  assert.match(memory, /sessionStorage/);
  assert.match(link, /captureCatalogReturnContext/);
  assert.match(reset, /consumeCatalogScrollRestore/);
  assert.match(productPage, /ReturnToResults/);
  assert.match(productPage, /Volver/);
});

test("recently viewed is bounded, local-only and deterministic", async () => {
  const script = `
    import { parseRecentlyViewedSnapshot, recentlyViewedLimit } from './lib/commerce/recently-viewed-store.ts';
    const parsed = parseRecentlyViewedSnapshot(JSON.stringify(['a','b','a','c','d','e','f','g']));
    process.stdout.write(JSON.stringify({ parsed, recentlyViewedLimit }));
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });
  const result = JSON.parse(stdout);
  assert.equal(result.recentlyViewedLimit, 6);
  assert.deepEqual(result.parsed, ["a", "b", "c", "d", "e", "f"]);

  const store = await source("lib/commerce/recently-viewed-store.ts");
  const rail = await source("app/components/recently-viewed-rail.tsx");
  assert.match(store, /localStorage/);
  assert.match(rail, /No se envía ni se usa para rastrearte/);
  assert.doesNotMatch([store, rail].join("\n"), /fetch\s*\(|sendBeacon|XMLHttpRequest|createClient/i);
});

test("PWA foundation is installable without caching live catalog pages", async () => {
  const manifest = JSON.parse(await source("public/manifest.webmanifest"));
  const serviceWorker = await source("public/sw.js");
  const manager = await source("app/components/pwa-manager.tsx");
  const layout = await source("app/layout.tsx");

  assert.equal(manifest.name, "AmarangoElectro");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(layout, /title: "AmarangoElectro"/);
  assert.doesNotMatch(layout, /Product Bridge|Amarango OS V3/);
  assert.match(manager, /serviceWorker\.register\("\/sw\.js"/);
  assert.match(manager, /beforeinstallprompt/);
  assert.match(serviceWorker, /event\.request\.mode === "navigate"/);
  assert.match(serviceWorker, /fetch\(event\.request\)\.catch\(\(\) => caches\.match\(OFFLINE\)\)/);
  assert.doesNotMatch(serviceWorker, /cache\.put\(event\.request|caches\.open\([^)]*\)[\s\S]*fetch\(event\.request\)[\s\S]*cache\.put/i);
});

test("Step 7H intent-prefetch stays conservative and protected commerce layers remain disconnected", async () => {
  const link = await source("app/components/store-link.tsx");
  const index = await source("lib/catalog/index.ts");
  const manager = await source("app/components/pwa-manager.tsx");
  const recent = await source("lib/commerce/recently-viewed-store.ts");
  const memory = await source("lib/ux/navigation-memory.ts");
  const combined = [link, manager, recent, memory].join("\n");

  assert.match(link, /rel = "prefetch"/);
  assert.match(link, /dataset\.performanceProfile === "lean"/);
  assert.match(link, /saveData/);
  assert.match(link, /effectiveType === "2g"/);
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
  assert.doesNotMatch(combined, /SUPABASE_URL|NEXT_PUBLIC_SUPABASE|service_role|WhatsApp|webhook|margarita-ui|amara\.js/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|rpc)\s*\(/i);
});


test("public menu keeps internal-access copy human-facing", async () => {
  const header = await source("app/components/site-header.tsx");
  assert.match(header, /Estos espacios requieren una sesión autorizada/);
  assert.match(header, />Espacios internos<\/Link>/);
  assert.doesNotMatch(header, /perfiles Maxi\/Angie|bloque de identidad aprobado|Ver conexión de espacios/);
});
