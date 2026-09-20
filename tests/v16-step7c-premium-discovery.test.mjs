import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const root = new URL("../", import.meta.url);
const execFileAsync = promisify(execFile);

const base = {
  slug: "sample",
  category: "celulares",
  subcategory: null,
  image: null,
  price: null,
  financing: [],
  availability: "unknown",
  stock: { status: "unknown", quantity: null, label: null },
  specifications: {},
  description: null,
  warranty: null,
  visible: true,
  source: "mock",
};

const products = [
  { ...base, id: "a17", name: "Samsung Galaxy A17", brand: "Samsung", model: "A17", features: ["Android", "Cámara"] },
  { ...base, id: "g15", name: "Motorola Moto G15", brand: "Motorola", model: "G15", features: ["Android", "Batería"] },
  { ...base, id: "iphone", name: "iPhone 15", brand: "Apple", model: "15", features: ["iOS", "Cámara"] },
];

test("predictive search suggestions are catalog-derived, relevant and deduplicated", async () => {
  const script = `
    import { buildCatalogSuggestions } from './lib/catalog/search.ts';
    const products = ${JSON.stringify(products)};
    const suggestions = buildCatalogSuggestions(products, 'sam');
    process.stdout.write(JSON.stringify(suggestions));
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: root });
  const suggestions = JSON.parse(stdout);
  assert.equal(suggestions[0].kind, "brand");
  assert.equal(suggestions[0].label, "Samsung");
  assert.ok(suggestions.some((item) => item.label === "Samsung Galaxy A17"));
  assert.equal(new Set(suggestions.map((item) => item.query.toLowerCase())).size, suggestions.length);
});

test("typo recovery is conservative and never auto-rewrites numeric models", async () => {
  const script = `
    import { suggestCatalogCorrection } from './lib/catalog/search.ts';
    const products = ${JSON.stringify(products)};
    process.stdout.write(JSON.stringify([
      suggestCatalogCorrection(products, 'samsng'),
      suggestCatalogCorrection(products, 'motrola'),
      suggestCatalogCorrection(products, 'A16'),
      suggestCatalogCorrection(products, 'G16'),
    ]));
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: root });
  const result = JSON.parse(stdout);
  assert.deepEqual(result, ["Samsung", "Motorola", null, null]);
});

test("mobile search exposes explicit submit, autocomplete semantics and no-results recovery", async () => {
  const source = await readFile(new URL("app/components/catalog-client.tsx", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(source, /aria-autocomplete="list"/);
  assert.match(source, /catalog-search-submit/);
  assert.match(source, /¿Quisiste decir/);
  assert.match(source, /ArrowDown/);
  assert.match(source, /Escape/);
  assert.match(css, /catalog-search-suggestions/);
  assert.match(css, /catalog-search-submit/);
});

test("Step 7C discovery layer adds no network or production mutation path", async () => {
  const search = await readFile(new URL("lib/catalog/search.ts", root), "utf8");
  const client = await readFile(new URL("app/components/catalog-client.tsx", root), "utf8");
  const index = await readFile(new URL("lib/catalog/index.ts", root), "utf8");
  const combined = `${search}\n${client}`;

  assert.doesNotMatch(combined, /fetch\s*\(|createClient|service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /method\s*:\s*["\'](?:POST|PUT|PATCH|DELETE)["\']/i);
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
});
