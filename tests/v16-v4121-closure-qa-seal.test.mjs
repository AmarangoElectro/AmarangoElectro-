import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

function runV412Modules() {
  const script = String.raw`
    import { readFileSync } from "node:fs";
    import { evaluateV412Publication, v412StableSlug } from "./lib/catalog/v412-source-contract.ts";
    import { parseV412SanitizedSnapshot, V412CanonicalCatalogAdapter } from "./lib/catalog/v412-canonical-adapter.ts";
    const deepFreeze = (value) => {
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const item of Object.values(value)) deepFreeze(item);
      }
      return value;
    };
    const snapshot = deepFreeze(JSON.parse(readFileSync("V4.12-SANITIZED-SNAPSHOT-25.json", "utf8")));
    const parsed = parseV412SanitizedSnapshot(snapshot);
    const adapter = new V412CanonicalCatalogAdapter(parsed.products);
    const base = {
      stableId: "-854",
      master: { id: "-854", nombre: "Producto real", categoria: "Audio", venta: 1000, visible: true },
      incremental: { producto_id: "-854", eliminado: false, actualizado: "2026-08-30T00:00:00Z" },
    };
    const available = evaluateV412Publication({ ...base, master: { ...base.master, proveedorStock: 2 } });
    const unknown = evaluateV412Publication(base);
    const tombstone = evaluateV412Publication({ ...base, incremental: { ...base.incremental, eliminado: true } });
    const overlay = evaluateV412Publication({ ...base, overlays: [{ visible: false }] });
    const missingVisible = evaluateV412Publication({ ...base, master: { ...base.master, visible: undefined } });
    const mismatched = evaluateV412Publication({ ...base, incremental: { ...base.incremental, producto_id: "-999" } });
    const audio = await adapter.listProducts({ search: "PARLÁNTE", category: "audio" });
    const affordable = await adapter.listProducts({ maxPrice: 500000 });
    console.log(JSON.stringify({
      metadata: parsed.metadata,
      productCount: parsed.products.length,
      firstKeys: Object.keys(parsed.products[0]).sort(),
      financingLengths: [...new Set(parsed.products.map((product) => product.financing.length))],
      frozen: Object.isFrozen(parsed.products) && parsed.products.every(Object.isFrozen),
      audioCount: audio.length,
      affordableCount: affordable.length,
      slugs: [v412StableSlug("-854"), v412StableSlug("187")],
      decisions: { available, unknown, tombstone, overlay, missingVisible, mismatched },
    }));
  `;
  const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], {
    cwd: new URL(".", root),
    encoding: "utf8",
  });
  return JSON.parse(output.trim());
}

test("V4.12 source hierarchy remains canonical and excludes both legacy fallbacks", async () => {
  const decision = await source("V4.12-CANONICAL-SOURCE-DECISION.md");
  const audit = await source("V4.12-CANONICAL-CATALOG-AUDIT.md");
  assert.match(decision, /tienda_catalogo.*catalogo/i);
  assert.match(decision, /tienda_productos_incremental/i);
  assert.match(decision, /1\.348/);
  assert.match(decision, /48/);
  assert.match(decision, /productos.*(?:no|nunca|exclu|fallback)/is);
  assert.match(decision, /celulares_lista.*(?:no|nunca|exclu|fallback)/is);
  assert.match(audit, /92/);
  assert.match(audit, /6/);
});

test("V4.12 parser executes fail-closed, tombstone and overlay precedence", () => {
  const result = runV412Modules();
  assert.equal(result.decisions.available.publish, true);
  assert.equal(result.decisions.available.availability, "available");
  assert.equal(result.decisions.unknown.publish, true);
  assert.equal(result.decisions.unknown.availability, "unknown");
  assert.equal(result.decisions.tombstone.publish, false);
  assert.ok(result.decisions.tombstone.reasons.includes("incremental_tombstone"));
  assert.equal(result.decisions.overlay.publish, false);
  assert.ok(result.decisions.overlay.reasons.includes("visibility_overlay_blocks"));
  assert.equal(result.decisions.missingVisible.publish, false);
  assert.ok(result.decisions.missingVisible.reasons.includes("master_not_explicitly_visible"));
  assert.equal(result.decisions.mismatched.publish, false);
  assert.ok(result.decisions.mismatched.reasons.includes("incremental_id_mismatch"));
});

test("V4.12 stable IDs and slugs depend only on persistent numeric IDs", () => {
  const result = runV412Modules();
  assert.deepEqual(result.slugs, ["product-n854", "product-p187"]);
  assert.equal(result.decisions.available.stableId, "-854");
});

test("V4.12 sanitized snapshot has exactly 25 allowlisted real products", async () => {
  const snapshot = JSON.parse(await source("V4.12-SANITIZED-SNAPSHOT-25.json"));
  assert.equal(snapshot.evidence_status, "production_readonly_sanitized_snapshot");
  assert.equal(snapshot.canonical_master, "tienda_catalogo/catalogo");
  assert.equal(snapshot.incremental_read_model, "tienda_productos_incremental");
  assert.equal(snapshot.production_write_enabled, false);
  assert.deepEqual(snapshot.excluded_sources, ["celulares_lista/lista", "productos"]);
  assert.equal(snapshot.products.length, 25);
  assert.equal(new Set(snapshot.products.map((product) => product.stableId)).size, 25);
  assert.ok(snapshot.products.every((product) => /^-?\d+$/.test(product.stableId)));
  assert.ok(snapshot.products.every((product) => Number.isFinite(product.cashPriceARS) && product.cashPriceARS > 0));
  assert.ok(snapshot.products.every((product) => product.image.startsWith("https://")));
  assert.ok(snapshot.products.every((product) => product.visibility === "visible"));
  assert.ok(snapshot.products.every((product) => Array.isArray(product.financing) && product.financing.length === 0));
  const categoryCounts = Object.groupBy(snapshot.products, (product) => product.sourceCategory);
  assert.deepEqual(Object.values(categoryCounts).map((products) => products.length).sort(), [5, 5, 5, 5, 5]);
});

test("V4.12 public snapshot and Product V16 exclude admin/raw fields", async () => {
  const snapshot = JSON.parse(await source("V4.12-SANITIZED-SNAPSHOT-25.json"));
  const result = runV412Modules();
  const forbidden = /cost|costo|supplier|proveedor|mayorista|usd|cotizacion|raw|client|cliente|token|credential|password/i;
  assert.ok(snapshot.products.every((product) => Object.keys(product).every((key) => !forbidden.test(key))));
  assert.ok(result.firstKeys.every((key) => !forbidden.test(key)));
  assert.deepEqual(result.financingLengths, [0]);
  assert.equal(result.frozen, true);
});

test("V4.12 canonical adapter validates the snapshot and executes read-only filters", () => {
  const result = runV412Modules();
  assert.equal(result.metadata.productCount, 25);
  assert.equal(result.metadata.canonicalMaster, "tienda_catalogo/catalogo");
  assert.equal(result.metadata.incrementalReadModel, "tienda_productos_incremental");
  assert.equal(result.metadata.productionWriteEnabled, false);
  assert.equal(result.audioCount, 3);
  assert.ok(result.affordableCount > 0 && result.affordableCount < 25);
});

test("V4.12 audit adapter remains inactive while V4.11 storefront regression stays locked", async () => {
  const index = await source("lib/catalog/index.ts");
  const types = await source("lib/catalog/types.ts");
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
  assert.doesNotMatch(index, /V412CanonicalCatalogAdapter/);
  assert.match(types, /v412-canonical-audit/);
});

test("V4.12 standalone is direct, script-valid and exposes required local interactions", async () => {
  const standalone = await source("AmarangoElectro-V16-V4.12-Standalone-Android.html");
  assert.doesNotMatch(standalone, /<iframe\b/i);
  assert.match(standalone, /name="viewport"/);
  assert.match(standalone, /Buscar en los 25 productos auditados/);
  assert.match(standalone, /data-action="detail"/);
  assert.match(standalone, /data-action="favorite"/);
  assert.match(standalone, /data-action="share"/);
  assert.match(standalone, /navigator\.share/);
  assert.match(standalone, /localStorage/);
  assert.match(standalone, /#producto-/);
  const scripts = [...standalone.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length >= 2);
  assert.doesNotThrow(() => new Script(scripts.at(-1)[1]));
});

test("V4.12 standalone responsive contract is bounded at every required width", async () => {
  const standalone = await source("AmarangoElectro-V16-V4.12-Standalone-Android.html");
  assert.match(standalone, /\*\{box-sizing:border-box\}/);
  assert.match(standalone, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(standalone, /@media\(max-width:920px\).*repeat\(3,1fr\)/s);
  assert.match(standalone, /@media\(max-width:640px\).*repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(standalone, /@media\(max-width:370px\).*grid-template-columns:1fr/s);
  assert.match(standalone, /width:min\(940px,100%\)/);
  const layouts = [
    { width: 320, columns: 1, padding: 11, gap: 10 },
    { width: 360, columns: 1, padding: 11, gap: 10 },
    { width: 390, columns: 2, padding: 11, gap: 10 },
    { width: 412, columns: 2, padding: 11, gap: 10 },
    { width: 768, columns: 3, padding: 16, gap: 10 },
    { width: 1440, columns: 4, padding: 16, gap: 14 },
  ];
  for (const layout of layouts) {
    const cardWidth = (layout.width - layout.padding * 2 - layout.gap * (layout.columns - 1)) / layout.columns;
    assert.ok(cardWidth > 0, `${layout.width}px has a positive bounded card width`);
  }
});

test("V4.12 storefront and standalone safety scan contains no mutation surface", async () => {
  const files = [
    "lib/catalog/v412-source-contract.ts",
    "lib/catalog/v412-canonical-adapter.ts",
    "lib/catalog/index.ts",
    "AmarangoElectro-V16-V4.12-Standalone-Android.html",
  ];
  const combined = (await Promise.all(files.map(source))).join("\n");
  assert.doesNotMatch(combined, /createClient|service_role|secret[_-]?key/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /\.from\s*\([^)]*\)\s*\.delete\s*\(/i);
  assert.doesNotMatch(combined, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/i);
  assert.doesNotMatch(combined, /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
});

test("V4.12 canonical blocker list remains explicitly open for human review", async () => {
  const audit = await source("V4.12-CANONICAL-CATALOG-AUDIT.md");
  const decision = await source("V4.12-CANONICAL-SOURCE-DECISION.md");
  const mapping = await source("V4.12-PRODUCT-V16-MAPPING.md");
  const combined = `${audit}\n${decision}\n${mapping}`;
  for (const term of ["92", "6", "proyección"]) assert.match(combined, new RegExp(term, "i"), term);
});

test("V4.12.1 reports are complete and safety seal preserves every required zero", async () => {
  const qa = await source("V4.12-QA-REPORT.md");
  const seal = await source("V4.12.1-SAFETY-SEAL.md");
  assert.doesNotMatch(qa, /Resultados\s*[—-]\s*PENDIENTE DE RELLENO/i);
  for (const operation of ["INSERT", "UPDATE", "DELETE", "UPSERT", "RPC escritura", "Storage writes", "Migraciones", "Cambios RLS", "Deploy", "Cambios `main`"]) {
    assert.ok(seal.includes(`| ${operation} | **0** |`), operation);
  }
  for (const blocker of ["92 celulares", "6 conflictos", "Maxi/Angie", "Staging/deploy"]) assert.match(seal, new RegExp(blocker, "i"), blocker);
});
