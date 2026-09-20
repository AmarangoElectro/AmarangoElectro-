import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const standaloneName = "AmarangoElectro-V16-V4.15.3-Admin-Function-Preservation-Audit-Standalone-Android-Desktop.html";

async function runTs(script) {
  const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], { cwd:new URL("../", import.meta.url) });
  return JSON.parse(stdout);
}

test("V4.15.3 inventories the full Legacy parity plus detailed operational domains", async () => {
  const result = await runTs(`
    import { adminFunctionPreservationMatrix, adminAuditStatusCounts } from './lib/internal/admin/v4153-preservation-audit.ts';
    process.stdout.write(JSON.stringify({count:adminFunctionPreservationMatrix.length,counts:adminAuditStatusCounts,areas:[...new Set(adminFunctionPreservationMatrix.map(x=>x.area))],names:adminFunctionPreservationMatrix.map(x=>x.functionName)}));
  `);
  assert.equal(result.count, 108);
  assert.deepEqual(result.counts, { PRESERVADA:13, PARCIAL:32, PENDIENTE:56, "NO ENCONTRADA":7 });
  for (const area of ["catálogo","clientes","ventas","financiación/cobranzas","caja","entregas","asesores","roles","reportes","backup/recuperación","UI Admin"]) assert.ok(result.areas.includes(area), area);
  for (const name of ["Calculadora Contado / Costo / USD / Cuotas","Placas","Ficha Cliente 360","Snapshot inmutable del producto","Caja actual, ingresos, egresos, resultado y trazabilidad"]) assert.ok(result.names.includes(name), name);
});

test("V4.15.3 never marks PRESERVADA without concrete code, preview or test evidence", async () => {
  const result = await runTs(`
    import { adminFunctionPreservationMatrix } from './lib/internal/admin/v4153-preservation-audit.ts';
    process.stdout.write(JSON.stringify(adminFunctionPreservationMatrix.filter(x=>x.status==='PRESERVADA').map(x=>({name:x.functionName,evidence:x.evidence,implementation:x.currentImplementation}))));
  `);
  assert.equal(result.length, 13);
  for (const row of result) {
    assert.match(row.evidence, /(?:\.ts|\.tsx|\.test\.mjs|standalone)/i, row.name);
    assert.doesNotMatch(row.implementation, /sin pantalla final|no conectad[oa]/i, row.name);
  }
});

test("V4.15.3 classifies absent CRM and financial operations honestly", async () => {
  const result = await runTs(`
    import { adminFunctionPreservationMatrix } from './lib/internal/admin/v4153-preservation-audit.ts';
    const find=(name)=>adminFunctionPreservationMatrix.find(x=>x.functionName===name);
    process.stdout.write(JSON.stringify({client360:find('Ficha Cliente 360'),periods:find('Períodos Hoy / 7 días / Mes / Trimestre / Año / Histórico'),cash:find('Caja actual, ingresos, egresos, resultado y trazabilidad'),payments:find('Vencimientos, pagos, pagos parciales y saldo')}));
  `);
  assert.equal(result.client360.status, "NO ENCONTRADA");
  assert.equal(result.periods.status, "NO ENCONTRADA");
  assert.equal(result.cash.status, "PENDIENTE");
  assert.equal(result.payments.status, "PENDIENTE");
});

test("V4.15.3 preserves Calculator and Plates but keeps both PARTIAL until authorized reconnection", async () => {
  const result = await runTs(`
    import { adminAuditClosingStatus, adminFunctionPreservationMatrix } from './lib/internal/admin/v4153-preservation-audit.ts';
    process.stdout.write(JSON.stringify({closing:adminAuditClosingStatus,calculator:adminFunctionPreservationMatrix.find(x=>x.functionName==='Calculadora Contado / Costo / USD / Cuotas'),plates:adminFunctionPreservationMatrix.find(x=>x.functionName==='Placas')}));
  `);
  assert.equal(result.closing.calculatorAdmin, "PARTIAL");
  assert.equal(result.closing.platesSystem, "PARTIAL");
  assert.match(result.calculator.evidence, /amarango-calculator-panel|amarango-calculator/);
  assert.match(result.plates.evidence, /plates-panel|plates-engine/);
  assert.match(result.calculator.currentImplementation, /sin guardar producto/i);
  assert.match(result.plates.currentImplementation, /sin placa gráfica persistente/i);
});

test("V4.15.3 leaves the exact five-product canary unassigned and unmutated", async () => {
  const payload = JSON.parse(await source("V4.15-CANARY-PAYLOAD.json"));
  assert.equal(payload.products.length, 5);
  for (const item of payload.products) {
    assert.equal(item.futureCanonicalProductId, null);
    assert.equal(item.mapping.canonicalProductId, null);
    assert.equal(item.masterPayload.id, null);
    assert.equal(item.productV16.stableId, null);
    assert.equal(item.mutationExecuted, false);
  }
  const hash = createHash("sha256").update(await readFile(new URL("../V4.15-CANARY-PAYLOAD.json", import.meta.url))).digest("hex");
  assert.equal(hash, "85010a4a9dfe7133c0eea6d071977eb54933885300b9a721607f086ed72912b1");
});

test("V4.15.3 keeps V4.15.2 standalone and canary payload byte-identical to the approved checkpoint", async () => {
  const files = ["V4.15-CANARY-PAYLOAD.json","AmarangoElectro-V16-V4.15.2-Product-Card-Premium-Polish-Standalone-Android.html"];
  for (const file of files) {
    const current = await readFile(new URL(`../${file}`, import.meta.url));
    const { stdout } = await execFileAsync("git", ["show", `HEAD:${file}`], { cwd:new URL("../", import.meta.url), encoding:"buffer", maxBuffer:20_000_000 });
    assert.deepEqual(current, stdout, file);
  }
});

test("V4.15.3 standalone is direct, self-contained, script-valid and has no native select", async () => {
  const html = await source(standaloneName);
  assert.match(html, /<!doctype html>/i);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /<select\b/i);
  assert.doesNotMatch(html, /\bfetch\s*\(|XMLHttpRequest|createClient\s*\(/i);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Function(scripts[0][1]));
});

test("V4.15.3 standalone preserves premium app sheets, chips and safe dismissal", async () => {
  const html = await source(standaloneName);
  assert.match(html, /class="overlay" id="filterOverlay"/);
  assert.match(html, /class="sheet" role="dialog" aria-modal="true"/);
  assert.match(html, /class="chipset" id="statusChips"/);
  assert.match(html, /if\(e\.key==='Escape'\)closeFilter/);
  assert.match(html, /if\(e\.target===overlay\)closeFilter/);
  assert.match(html, /env\(safe-area-inset-bottom\)/);
  assert.match(html, /prefers-reduced-motion/);
});

test("V4.15.3 uses complete ARS formatting and avoids compact money labels", async () => {
  const html = await source(standaloneName);
  assert.match(html, /Intl\.NumberFormat\('es-AR',\{style:'currency',currency:'ARS',maximumFractionDigits:0\}\)/);
  assert.doesNotMatch(html, /\$\s?\d+(?:[.,]\d+)?\s?[kKmM]\b/);
  assert.doesNotMatch(html, /notation\s*:\s*['"]compact/);
  assert.match(html, /2\.490\.000|cashPriceARS/);
});

test("V4.15.3 role boundary keeps Advisor and public storefront away from Admin internals", async () => {
  const advisor = await source("app/components/advisor-workspace.tsx");
  const storefront = [await source("app/page.tsx"), await source("app/components/product-card.tsx")].join("\n");
  assert.doesNotMatch(advisor, /AmarangoCalculatorPanel|PlatesPanel|administrative\?\.costArs|lib\/internal\/admin|lib\/internal\/finance/);
  assert.doesNotMatch(storefront, /AdminConsolidatedWorkspace|AmarangoCalculatorPanel|PlatesPanel|lib\/internal\/admin/);
  assert.match(advisor, /no muestra costos, markup, caja, proveedores internos/i);
  const audit = await source("V4.15.3-ROLE-SECURITY-AUDIT.md");
  assert.match(audit, /\| Cliente .*\| PASS \|/);
  assert.match(audit, /\| Asesor .*\| PASS \|/);
});

test("V4.15.3 gaps report lists every non-preserved matrix function", async () => {
  const result = await runTs(`
    import { adminFunctionPreservationMatrix } from './lib/internal/admin/v4153-preservation-audit.ts';
    process.stdout.write(JSON.stringify(adminFunctionPreservationMatrix.filter(x=>x.status!=='PRESERVADA').map(x=>x.functionName)));
  `);
  const gaps = await source("V4.15.3-ADMIN-GAPS-BEFORE-PRODUCTION.md");
  assert.equal(result.length, 95);
  for (const name of result) assert.ok(gaps.includes(`**${name} —`), name);
});

test("V4.15.3 covers seven responsive widths and passes the zero-write safety scan", async () => {
  const harness = await source("V4.15.3-RESPONSIVE-QA.html");
  const html = await source(standaloneName);
  for (const width of [320,360,390,412,768,1024,1440]) assert.match(harness, new RegExp(`V4\\.15\\.3 ${width}px`));
  assert.match(html, /min-width:0/);
  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /@media\(max-width:820px\)/);
  const { stdout } = await execFileAsync(process.execPath, ["scripts/v4153-safety-scan.mjs"], { cwd:new URL("../", import.meta.url) });
  const safety = JSON.parse(stdout);
  assert.equal(safety.passed, true);
  assert.ok(Object.values(safety.counts).every((count) => count === 0));
});

