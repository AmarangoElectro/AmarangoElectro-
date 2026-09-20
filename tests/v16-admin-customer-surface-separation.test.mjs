import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const files=["app/page.tsx","app/categoria/[slug]/page.tsx","app/producto/[slug]/page.tsx","app/buscar/page.tsx","app/components/product-card.tsx","app/components/catalog-client.tsx","app/components/home-products-preview.tsx","app/components/featured-sectors-grid.tsx","app/components/all-sectors-sheet.tsx","app/components/brand-locale-hero.tsx"];
const customer=files.map(x=>fs.readFileSync(x,"utf8")).join("\n");
const admin=fs.readFileSync("app/administracion/page.tsx","utf8");
test("customer surfaces expose no internal environment/lab/checkpoint copy",()=>{
  for(const x of [/"READ ONLY"/i,/>READ ONLY</i,/Admin Accelerator/i,/checkpoint/i,/\bLAB\b/i,/Datos no conectados en este entorno/i,/production_catalog_verified/i,/service_role/i,/\bSupabase\b/i,/\bRLS\b/i,/\bfixture\b/i,/\badapter\b/i,/\bcanary\b/i]) assert.ok(!x.test(customer),String(x));
});
test("customer surfaces do not import internal admin components",()=>{assert.ok(!/components\/internal\/admin/.test(customer));});
test("administration remains a distinct internal route",()=>{assert.match(admin,/Admin|Administraci[oó]n|administr/i);});
