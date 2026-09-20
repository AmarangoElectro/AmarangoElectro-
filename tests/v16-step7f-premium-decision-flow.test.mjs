import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);

test("Step 7F makes the PDP next step explicit without routing through Margarita", async () => {
  const actions = await readFile(new URL("app/components/product-actions.tsx", root), "utf8");
  const page = await readFile(new URL("app/producto/[slug]/page.tsx", root), "utf8");

  assert.match(actions, /Quiero este/);
  assert.match(actions, /buildPurchaseIntentProduct/);
  assert.match(actions, /announcePurchaseIntent/);
  assert.doesNotMatch(actions, /announceConsultation|amarango:consult-product/);
  assert.match(page, /PurchaseIntentFlow/);
});

test("decision sheet uses four clear intents, review-before-handoff and no personal-data form", async () => {
  const flow = await readFile(new URL("app/components/purchase-intent-flow.tsx", root), "utf8");

  assert.match(flow, /Quiero este/);
  assert.match(flow, /Ver cuotas/);
  assert.match(flow, /Confirmar disponibilidad/);
  assert.match(flow, /Consultar entrega/);
  assert.match(flow, /No se envía nada todavía/);
  assert.match(flow, /Copiar consulta/);
  assert.match(flow, /maxLength=\{240\}/);
  assert.match(flow, /role="dialog"/);
  assert.match(flow, /event\.key === "Escape"/);
  assert.match(flow, /event\.key !== "Tab"/);
  assert.doesNotMatch(flow, /type="(?:tel|email)"|name="(?:dni|telefono|phone|address|direccion|email|nombre)"/i);
});

test("purchase intent summary stays honest when commercial fields are unknown", async () => {
  const script = `
    import { buildPurchaseIntentProduct, buildPurchaseIntentSummary } from './lib/commerce/purchase-intent.ts';
    const product = {
      id:'demo-a17', slug:'a17', name:'Samsung A17', brand:'Samsung', model:'A17', category:'celulares', subcategory:null,
      image:null, price:null, financing:[], availability:'unknown', stock:{status:'unknown',quantity:null,label:null},
      features:[], specifications:{}, description:null, warranty:null, visible:true, source:'mock'
    };
    const publicProduct = buildPurchaseIntentProduct(product, 'https://amarango.test/producto/a17');
    const summary = buildPurchaseIntentSummary({ product: publicProduct, intent:'installments', note:'Quiero saber opciones.' });
    process.stdout.write(summary);
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });

  assert.match(stdout, /Samsung A17/);
  assert.match(stdout, /Modelo: A17/);
  assert.match(stdout, /Precio publicado: A confirmar/);
  assert.match(stdout, /Disponibilidad: A confirmar/);
  assert.match(stdout, /Financiación publicada: A confirmar/);
  assert.match(stdout, /Comentario: Quiero saber opciones\./);
  assert.doesNotMatch(stdout, /estimad|aproximad|inferid/i);
});

test("Step 7F remains local-only and does not integrate external channels or production writes", async () => {
  const files = [
    "app/components/product-actions.tsx",
    "app/components/purchase-intent-flow.tsx",
    "lib/commerce/purchase-intent.ts",
    "lib/ux/sonic-feedback.ts",
  ];
  const sources = await Promise.all(files.map((file) => readFile(new URL(file, root), "utf8")));
  const combined = sources.join("\n");
  const index = await readFile(new URL("lib/catalog/index.ts", root), "utf8");

  assert.doesNotMatch(combined, /fetch\s*\(|XMLHttpRequest|createClient|service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /WhatsApp|webhook|worker|prompt|margarita-ui|amara\.js/i);
  assert.match(combined, /navigator\.clipboard/);
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
});
