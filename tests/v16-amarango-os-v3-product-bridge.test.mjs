import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function runTs(script) {
  const { stdout } = await execFileAsync(process.execPath, [
    "--experimental-strip-types",
    "--experimental-loader",
    "./tests/ts-extension-loader.mjs",
    "--input-type=module",
    "-e",
    script,
  ], { cwd: new URL("../", import.meta.url) });
  return JSON.parse(stdout);
}

const baseProduct = `{
  slug:'sample',category:'celulares',subcategory:'samsung',image:null,
  price:{amount:510000,currency:'ARS'},financing:[],availability:'available',
  stock:{status:'in_stock',quantity:null,label:'Disponible'},features:[],specifications:{},
  description:null,warranty:null,visible:true,source:'mock'
}`;

test("Product Bridge searches name, model, memory, category and brand without partial numeric collisions", async () => {
  const result = await runTs(`
    import { ReadOnlyProductBridge } from './lib/integration/product-bridge.ts';
    const base=${baseProduct};
    const products=[
      {...base,id:'a16-128',slug:'a16-128',name:'Samsung Galaxy A16 128 GB',brand:'Samsung',model:'A16',features:['128 GB']},
      {...base,id:'a16-256',slug:'a16-256',name:'Samsung Galaxy A16 256 GB',brand:'Samsung',model:'A16',features:['256 GB']},
      {...base,id:'a17-128',slug:'a17-128',name:'Samsung Galaxy A17 128 GB',brand:'Samsung',model:'A17',features:['128 GB']},
      {...base,id:'moto',slug:'moto',name:'Motorola Moto G15 256 GB',brand:'Motorola',model:'G15',subcategory:'motorola',features:['Cámara nítida','256 GB']}
    ];
    const adapter={source:'mock',async listProducts(){return products},async getProductBySlug(){return null}};
    const bridge=new ReadOnlyProductBridge(adapter);
    const ctx={role:'admin'};
    const searches={
      a16:(await bridge.search('A16',ctx)).map(x=>x.id),
      exact:(await bridge.search('SÁMSUNG a17',ctx)).map(x=>x.id),
      memory:(await bridge.search('256 gb',ctx)).map(x=>x.id),
      category:(await bridge.search('CELULARES',ctx)).map(x=>x.id),
      brand:(await bridge.search('motorola',ctx)).map(x=>x.id),
      accent:(await bridge.search('sámsung',ctx)).map(x=>x.id)
    };
    process.stdout.write(JSON.stringify(searches));
  `);
  assert.deepEqual(result.a16, ["a16-128", "a16-256"]);
  assert.deepEqual(result.exact, ["a17-128"]);
  assert.deepEqual(new Set(result.memory), new Set(["a16-256", "moto"]));
  assert.equal(result.category.length, 4);
  assert.deepEqual(result.brand, ["moto"]);
  assert.deepEqual(result.accent, ["a16-128", "a16-256", "a17-128"]);
});

test("Product Bridge is fail-closed, exposes honest missing states and gates cost/supplier by role", async () => {
  const result = await runTs(`
    import { ReadOnlyProductBridge } from './lib/integration/product-bridge.ts';
    const base=${baseProduct};
    const products=[
      {...base,id:'ok',name:'Producto visible',brand:'Marca',model:null},
      {...base,id:'out',slug:'out',name:'Producto sin stock',brand:'Marca',model:null,availability:'unavailable',stock:{status:'out_of_stock',quantity:0,label:'Sin stock'}},
      {...base,id:'unknown',slug:'unknown',name:'Producto sin costo ni foto',brand:'Marca',model:null,price:null,availability:'unknown',stock:{status:'unknown',quantity:null,label:null}},
      {...base,id:'hidden',slug:'hidden',name:'Producto oculto',brand:'Marca',model:null,visible:false}
    ];
    const adapter={source:'mock',async listProducts(){return products},async getProductBySlug(){return null}};
    const facts=[{productId:'ok',costArs:300000,supplier:'Proveedor auditado',priceUpdatedAt:'2026-08-28'}];
    const bridge=new ReadOnlyProductBridge(adapter,facts);
    const admin=await bridge.list({role:'admin'}), advisor=await bridge.list({role:'advisor'});
    process.stdout.write(JSON.stringify({
      admin:admin.map(x=>({id:x.id,eligibility:x.saleEligibility,missing:x.missingFields,administrative:x.administrative})),
      advisor:advisor.find(x=>x.id==='ok')?.administrative,
      frozen:Object.isFrozen(admin)&&admin.every(Object.isFrozen)
    }));
  `);
  assert.deepEqual(result.admin.map((item) => item.id), ["ok", "out", "unknown"]);
  assert.equal(result.admin.find((item) => item.id === "out").eligibility, "unavailable");
  assert.equal(result.admin.find((item) => item.id === "unknown").eligibility, "review_required");
  assert.ok(result.admin.find((item) => item.id === "unknown").missing.includes("foto"));
  assert.ok(result.admin.find((item) => item.id === "unknown").missing.includes("precio vigente ARS"));
  assert.deepEqual(result.admin.find((item) => item.id === "ok").administrative, { costArs: 300000, supplier: "Proveedor auditado" });
  assert.equal(result.advisor, null);
  assert.equal(result.frozen, true);
});

test("Sale Snapshot remains historical and immutable after catalog values change", async () => {
  const result = await runTs(`
    import { createSaleItemSnapshot } from './lib/integration/sale-snapshot.ts';
    const product={id:'stable-1',slug:'a16',name:'Samsung Galaxy A16',brand:'Samsung',model:'A16',memory:'128 GB',category:'celulares',subcategory:'samsung',imageUrl:null,currentPriceArs:510000,availability:'available',stockStatus:'in_stock',stockQuantity:null,stockLabel:'Disponible',priceUpdatedAt:'2026-08-28',source:'mock',saleEligibility:'eligible',missingFields:[],administrative:{costArs:340000,supplier:'MEGA'}};
    const snapshot=createSaleItemSnapshot({product,priceUsedArs:510000,soldAt:'2026-08-29T10:00:00Z'});
    product.name='Nombre cambiado';product.currentPriceArs=999999;product.administrative.costArs=1;
    process.stdout.write(JSON.stringify({snapshot,frozen:Object.isFrozen(snapshot)}));
  `);
  assert.equal(result.snapshot.productName, "Samsung Galaxy A16");
  assert.equal(result.snapshot.priceUsedArs, 510000);
  assert.equal(result.snapshot.costUsedArs, 340000);
  assert.equal(result.snapshot.supplier, "MEGA");
  assert.equal(result.frozen, true);
});

test("V2.1 fixture contains only product-lab fields and preserves exact ARS evidence", async () => {
  const fixture = JSON.parse(await source("fixtures/amarango-os-product-bridge-v21-lab.json"));
  assert.equal(fixture.length, 4);
  assert.equal(fixture[0].name, "Samsung Galaxy A16 128 GB");
  assert.equal(fixture[0].sale, 510000);
  assert.equal(fixture[0].cost, 340000);
  assert.equal(fixture[1].sale, 585000);
  assert.ok(fixture.every((item) => item.source_reference === "Amarango OS CRM Lab V2.1 · ARS"));
  const forbidden = /client|customer|dni|phone|token|credential|password/i;
  assert.ok(fixture.every((item) => Object.keys(item).every((key) => !forbidden.test(key))));
});

test("Product Bridge and Amarango OS V3 contain no network or write primitive", async () => {
  const integrationFiles = (await readdir(new URL("../lib/integration/", import.meta.url)))
    .filter((name) => /\.(?:ts|tsx|js|mjs)$/.test(name));
  const sources = await Promise.all([
    ...integrationFiles.map((name) => source(`lib/integration/${name}`)),
    source("app/amarango-os/page.tsx"),
    source("app/components/amarango-os-product-bridge.tsx"),
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /createClient|service_role|SUPABASE_URL|fetch\s*\(/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
  assert.doesNotMatch(combined, /margarita|whatsapp|openai|webhook/i);
});

test("Amarango OS V3 keeps APP controls custom, ARS complete and mobile layouts bounded", async () => {
  const component = await source("app/components/amarango-os-product-bridge.tsx");
  const css = await source("app/globals.css");
  const prototype = await source("prototypes/AmarangoOS-V3-Product-Bridge.html");
  assert.doesNotMatch(component, /<(?:select|dialog)\b/i);
  assert.doesNotMatch(prototype, /<(?:select|dialog)\b/i);
  assert.match(component, /Intl\.NumberFormat\("es-AR"/);
  assert.doesNotMatch(`${component}\n${prototype}`, /notation\s*:\s*["']compact|\$\d+(?:[.,]\d+)?[Mk]\b/i);
  assert.match(css, /\.os-page[\s\S]*overflow-x:\s*clip/);
  for (const width of [1120, 900, 620, 390, 360, 320]) assert.match(css, new RegExp(`max-width: ${width}px`));
  assert.match(css, /\.os-topbar > div\s*\{\s*min-width:\s*0/);
  assert.match(css, /\.os-topbar h1[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/);
  assert.match(prototype, /viewport-fit=cover/);
});

test("Data Contract documents every requested domain without creating persistence", async () => {
  const contract = await source("AMARANGO-OS-DATA-CONTRACT.md");
  const fields = await source("AMARANGO-OS-V3-FIELD-INVENTORY.md");
  for (const term of ["clientes", "ventas", "sale_items", "cuotas", "pagos", "revendedores", "comisiones", "Responsables múltiples", "Inversionistas", "movimientos_caja", "entregas", "comprobantes", "auditoría"]) {
    assert.match(contract, new RegExp(term, "i"));
  }
  for (const term of ["revendedor", "comisión", "descuento", "envío", "mensual/quincenal", "capital a invertir", "reparto de ganancias", "solicitud de inversión", "observaciones"]) {
    assert.match(fields, new RegExp(term, "i"));
  }
  assert.match(contract, /No crea tablas, migraciones, políticas, funciones, credenciales ni escrituras/i);
});

test("Static preview preserves Amarango OS V3 inside the complete V4.9 selector", async () => {
  const preview = await source("scripts/create-static-preview.mjs");
  assert.match(preview, /AmarangoOS-V3-Product-Bridge\.html/);
  assert.match(preview, /show\("home"\)/);
  for (const view of ["os", "home", "advisor", "admin", "platform", "celulares", "electrodomesticos", "herramientas", "tecnologia", "hogar", "descanso", "gaming", "productoA16", "productoG15"]) {
    assert.match(preview, new RegExp(`${view}:`));
  }
});
