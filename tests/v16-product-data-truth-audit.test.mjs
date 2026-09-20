import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const mat=fs.readFileSync("lib/catalog/v16-cellphones-90-materialized-adapter.ts","utf8");
const idx=fs.readFileSync("lib/catalog/index.ts","utf8");
const card=fs.readFileSync("app/components/product-card.tsx","utf8");
const pdp=fs.readFileSync("app/producto/[slug]/page.tsx","utf8");

test("90-cellphone materialization explicitly contains no invented commerce fields",()=>{for(const x of ["image: null","price: null","financing: []",'availability: "unknown"',"quantity: null","description: null","warranty: null","visible: false"]) assert.ok(mat.includes(x),x);});
test("90-cellphone adapter remains isolated from active public catalog",()=>{assert.match(mat,/NO ACTIVACIÓN/);assert.ok(!idx.includes("V16Cellphones90MaterializedCatalogAdapter"));});
test("customer ProductCard visibly falls back when source data is absent",()=>{for(const x of ["FOTO OFICIAL PENDIENTE","Información pendiente del catálogo oficial.","A confirmar","Precio y cuotas"]) assert.ok(card.includes(x),x);});
test("PDP visibly falls back instead of fabricating missing fields",()=>{for(const x of ["Dato pendiente del catálogo","Información pendiente del catálogo oficial.","V16 no completa información ausente"]) assert.ok(pdp.includes(x),x);});
