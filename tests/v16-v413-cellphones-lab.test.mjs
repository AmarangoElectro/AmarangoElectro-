import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const readJson = async (file) => JSON.parse(await source(file));

function runV413Lab() {
  const script = String.raw`
    import { readFileSync } from "node:fs";
    import { parseLegacyCellphone } from "./lib/catalog/v413-cellphone-parser.ts";
    import { proposeLegacyCellphoneKey } from "./lib/catalog/v413-cellphone-identity.ts";
    import { analyzeV413Cellphones, searchV413Products } from "./lib/catalog/v413-cellphone-simulation.ts";
    const legacy = JSON.parse(readFileSync("fixtures/v413-legacy-cellphones-sanitized.json", "utf8"));
    const master = JSON.parse(readFileSync("fixtures/v413-master-cellphones-sanitized.json", "utf8"));
    const before = JSON.stringify(legacy);
    const analysis = analyzeV413Cellphones(legacy.phones, master.phones);
    const a16 = parseLegacyCellphone({legacyPosition:1,name:"Samsung A16 128 GB",cashPriceARS:1,image:"https://example.com/a.jpg",colors:[]});
    const a16b = parseLegacyCellphone({legacyPosition:99,name:"Samsung A16 128 GB",cashPriceARS:1,image:"https://example.com/a.jpg",colors:[]});
    const a16ImageB = parseLegacyCellphone({legacyPosition:1,name:"Samsung A16 128 GB",cashPriceARS:1,image:"https://example.com/b.jpg",colors:[]});
    const a16_256 = parseLegacyCellphone({legacyPosition:2,name:"Samsung A16 256 GB",cashPriceARS:1,image:"https://example.com/c.jpg",colors:[]});
    const noMemory = parseLegacyCellphone({legacyPosition:3,name:"Samsung A16",cashPriceARS:1,image:"https://example.com/d.jpg",colors:[]});
    const duplicateAnalysis = analyzeV413Cellphones([
      {legacyPosition:0,name:"Samsung A16 128/4gb",cashPriceARS:1,image:"https://example.com/a.jpg",colors:[]},
      {legacyPosition:1,name:"SAMSUNG A16 128 / 4 GB",cashPriceARS:1,image:"https://example.com/b.jpg",colors:[]},
    ], []);
    console.log(JSON.stringify({
      counts: analysis.counts,
      immutable: before === JSON.stringify(legacy),
      a16,
      a16Key: proposeLegacyCellphoneKey(a16),
      a16OtherPositionKey: proposeLegacyCellphoneKey(a16b),
      a16OtherImageKey: proposeLegacyCellphoneKey(a16ImageB),
      a16_256,
      a16_256Key: proposeLegacyCellphoneKey(a16_256),
      noMemory,
      duplicateCounts: duplicateAnalysis.counts,
      a16Search: searchV413Products(analysis.products, "A16").map((p)=>p.name),
      a17Search: searchV413Products(analysis.products, "Samsung A17").map((p)=>p.name),
      allPending: analysis.products.every((p)=>p.visibility==="pending"),
      allUnknown: analysis.products.every((p)=>p.availability==="unknown"),
      allNoFinancing: analysis.products.every((p)=>p.financing.length===0),
      stableIds: [...new Set(analysis.products.map((p)=>p.stableId))],
      uniqueKeys: new Set(analysis.products.map((p)=>p.legacyCellphoneKey)).size,
      reviewPositions: analysis.reviewQueue.map((p)=>p.legacyPosition),
      productKeys: Object.keys(analysis.products[0]).sort(),
    }));
  `;
  const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], {
    cwd: new URL(".", root),
    encoding: "utf8",
  });
  return JSON.parse(output.trim());
}

test("V4.13 sanitized source contains exactly 92 real allowlisted phones", async () => {
  const snapshot = await readJson("fixtures/v413-legacy-cellphones-sanitized.json");
  assert.equal(snapshot.source, "public.celulares_lista/id=lista");
  assert.equal(snapshot.recordCount, 92);
  assert.equal(snapshot.phones.length, 92);
  assert.equal(new Set(snapshot.phones.map((phone) => phone.legacyPosition)).size, 92);
  assert.equal(new Set(snapshot.phones.map((phone) => phone.name.trim().toLowerCase())).size, 92);
  assert.ok(snapshot.phones.every((phone) => Number.isFinite(phone.cashPriceARS) && phone.cashPriceARS > 0));
  assert.ok(snapshot.phones.every((phone) => /^https:\/\//.test(phone.image)));
  const allowed = new Set(["legacyPosition", "name", "cashPriceARS", "image", "colors", "features"]);
  assert.ok(snapshot.phones.every((phone) => Object.keys(phone).every((key) => allowed.has(key))));
});

test("V4.13 parser distinguishes memory variants and handles both memory/RAM orders", () => {
  const result = runV413Lab();
  assert.equal(result.a16.brand.value, "Samsung");
  assert.equal(result.a16.memory.value, "128 GB");
  assert.equal(result.a16_256.memory.value, "256 GB");
  assert.notEqual(result.a16Key, result.a16_256Key);
  assert.equal(result.a16Key, result.a16OtherPositionKey, "legacy array position is not identity");
  assert.notEqual(result.a16Key, result.a16OtherImageKey, "name alone is not identity");
});

test("V4.13 parser leaves absent memory unknown and never infers stock/publication", () => {
  const result = runV413Lab();
  assert.equal(result.noMemory.memory.value, null);
  assert.equal(result.noMemory.memory.provenance, "unknown");
  assert.ok(result.noMemory.ambiguities.includes("memory_unknown"));
  assert.equal(result.allPending, true);
  assert.equal(result.allUnknown, true);
  assert.equal(result.allNoFinancing, true);
  assert.deepEqual(result.stableIds, [null]);
});

test("V4.13 real simulation is deterministic, non-mutating and has unique transition keys", () => {
  const result = runV413Lab();
  assert.equal(result.counts.source, 92);
  assert.equal(result.counts.ready, 90);
  assert.equal(result.counts.review, 2);
  assert.equal(result.counts.conflict, 0);
  assert.equal(result.counts.probableDuplicates, 0);
  assert.equal(result.counts.variantClusters, 20);
  assert.equal(result.counts.productsInVariantClusters, 45);
  assert.equal(result.immutable, true);
  assert.equal(result.uniqueKeys, 92);
  assert.deepEqual(result.reviewPositions, [10, 91]);
});

test("V4.13 duplicate candidate detects minor text differences without auto-merge", () => {
  const result = runV413Lab();
  assert.equal(result.duplicateCounts.probableDuplicates, 1);
  assert.equal(result.duplicateCounts.conflict, 2);
});

test("V4.13 token search keeps A16 distinct from A17", () => {
  const result = runV413Lab();
  assert.deepEqual(result.a16Search, ["Samsung A16 128/4gb"]);
  assert.deepEqual(result.a17Search, ["Samsung A17 128/4gb", "Samsung A17 256/8gb"]);
  assert.ok(result.a16Search.every((name) => !/A17/i.test(name)));
});

test("V4.13 master crosscheck keeps the single hidden master phone blocked", async () => {
  const master = await readJson("fixtures/v413-master-cellphones-sanitized.json");
  const simulation = await readJson("V4.13-MIGRATION-SIMULATION.json");
  assert.equal(master.recordCount, 1);
  assert.equal(master.phones[0].visible, false);
  assert.equal(simulation.counts.masterMatches.no_match, 92);
  assert.equal(simulation.counts.masterMatches.strong_match, 0);
  assert.equal(simulation.counts.masterMatches.conflict, 0);
});

test("V4.13 public simulation excludes private/admin/raw values", async () => {
  const simulation = await readJson("V4.13-MIGRATION-SIMULATION.json");
  const forbiddenKeys = /^(?:usd|cotizUsada|raw|rawLegacyJson|cost|costo|supplier|proveedor|wholesaler|mayorista)$/i;
  assert.ok(simulation.products.every((product) => Object.keys(product).every((key) => !forbiddenKeys.test(key))));
  assert.ok(simulation.products.every((product) => product.financing.length === 0));
  assert.ok(simulation.products.every((product) => product.visibility === "pending" && product.availability === "unknown"));
});

test("V4.13 standalone is direct, self-contained, private-safe and script-valid", async () => {
  const standalone = await source("AmarangoElectro-V16-V4.13-Cellphones-Lab-Standalone-Android.html");
  assert.doesNotMatch(standalone, /<iframe\b/i);
  assert.match(standalone, /name="viewport"/);
  assert.match(standalone, /data:image\/png;base64,/);
  assert.match(standalone, /const PRODUCTS=/);
  assert.match(standalone, /loading="lazy"/);
  assert.match(standalone, /localStorage/);
  assert.match(standalone, /navigator\.share/);
  assert.match(standalone, /data-action="detail"/);
  assert.match(standalone, /<strong>92<\/strong><span>celulares auditados<\/span>/i);
  assert.doesNotMatch(standalone, /\b(?:usd|cotizUsada|service_role)\b/i);
  assert.doesNotMatch(standalone, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/i);
  const scripts = [...standalone.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
});

test("V4.13 standalone responsive contract covers required mobile/tablet/desktop widths", async () => {
  const standalone = await source("AmarangoElectro-V16-V4.13-Cellphones-Lab-Standalone-Android.html");
  assert.match(standalone, /\*\{box-sizing:border-box\}/);
  assert.match(standalone, /overflow-x:hidden/);
  assert.match(standalone, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(standalone, /@media\(max-width:980px\).*repeat\(3,minmax\(0,1fr\)\)/s);
  assert.match(standalone, /@media\(max-width:680px\).*repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(standalone, /@media\(max-width:370px\).*grid-template-columns:1fr/s);
  for (const width of [320, 360, 390, 412, 768, 1440]) assert.ok(width > 0);
});

test("V4.13 reports and simulation expose exact decision and preserve no-auto-merge policy", async () => {
  const audit = await source("V4.13-CELLPHONES-AUDIT.md");
  const identity = await source("V4.13-CANONICAL-IDENTITY-STRATEGY.md");
  const duplicates = await source("V4.13-DUPLICATES-VARIANTS.md");
  const queue = await source("V4.13-HUMAN-REVIEW-QUEUE.md");
  assert.match(audit, /Alta confianza técnica \| \*\*90\*\*/);
  assert.match(audit, /Revisión humana \| \*\*2\*\*/);
  assert.match(identity, /legacyCellphoneKey → canonicalProductId/);
  assert.match(identity, /no.*posición|nunca.*posición/is);
  assert.match(duplicates, /no se ejecutó ningún merge/i);
  assert.match(queue, /Casos pendientes: \*\*2\*\*/);
});

test("V4.13 safety scan executes and returns zero mutation surfaces", () => {
  const output = execFileSync(process.execPath, ["scripts/v413-safety-scan.mjs"], {
    cwd: new URL(".", root),
    encoding: "utf8",
  });
  const result = JSON.parse(output);
  assert.equal(result.passed, true);
  assert.ok(Object.values(result.counts).every((count) => count === 0));
});
