import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);

test("Step 7E adds persistent, capped comparison selection to spec-driven cards", async () => {
  const card = await readFile(new URL("app/components/product-card.tsx", root), "utf8");
  const catalog = await readFile(new URL("app/components/catalog-client.tsx", root), "utf8");
  const store = await readFile(new URL("lib/commerce/compare-store.ts", root), "utf8");

  assert.match(card, /Comparar producto/);
  assert.match(card, /aria-pressed=\{isCompared\}/);
  assert.match(catalog, /compareLimit/);
  assert.match(catalog, /same category|misma categoría/i);
  assert.match(catalog, /ProductComparison/);
  assert.match(store, /compareLimit = 3/);
  assert.match(store, /localStorage/);
});

test("comparison view defaults to differences and preserves unknown data honestly", async () => {
  const panel = await readFile(new URL("app/components/product-comparison.tsx", root), "utf8");
  const engine = await readFile(new URL("lib/catalog/comparison.ts", root), "utf8");

  assert.match(panel, /useState\(true\)/);
  assert.match(panel, /Mostrar solo diferencias/);
  assert.match(panel, /A confirmar/);
  assert.match(panel, /role="dialog"/);
  assert.match(engine, /A confirmar/);
  assert.doesNotMatch(engine, /infer|guess|fallbackPrice|estimated/i);
});

test("comparison engine marks only actual value differences", async () => {
  const script = `
    import { buildComparisonRows } from './lib/catalog/comparison.ts';
    const base = { category:'celulares', subcategory:null, image:null, financing:[], availability:'unknown', stock:{status:'unknown',quantity:null,label:null}, specifications:{RAM:'8 GB'}, description:null, warranty:null, visible:true, source:'mock' };
    const a = {...base,id:'a',slug:'a',name:'A',brand:'Samsung',model:'A16',price:{amount:100,currency:'ARS'},features:['Android','Batería']};
    const b = {...base,id:'b',slug:'b',name:'B',brand:'Samsung',model:'A17',price:{amount:100,currency:'ARS'},features:['Android','Batería']};
    const rows = buildComparisonRows([a,b]);
    const pick = Object.fromEntries(rows.map(row => [row.id,row.differs]));
    process.stdout.write(JSON.stringify(pick));
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });
  const result = JSON.parse(stdout);
  assert.equal(result.model, true);
  assert.equal(result.price, false);
  assert.equal(result.features, false);
  assert.equal(result["spec:RAM"], false);
});

test("Step 7E comparison adds no network, production writes, WhatsApp or Margarita integration", async () => {
  const files = [
    "app/components/product-comparison.tsx",
    "app/components/product-card.tsx",
    "app/components/catalog-client.tsx",
    "lib/catalog/comparison.ts",
    "lib/commerce/compare-store.ts",
    "lib/ux/sonic-feedback.ts",
  ];
  const sources = await Promise.all(files.map((file) => readFile(new URL(file, root), "utf8")));
  const combined = sources.join("\n");
  const index = await readFile(new URL("lib/catalog/index.ts", root), "utf8");

  assert.doesNotMatch(combined, /fetch\s*\(|XMLHttpRequest|createClient|service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /WhatsApp|webhook|worker|prompt|margarita-ui|amara\.js/i);
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
});
