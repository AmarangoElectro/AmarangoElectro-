import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const require=createRequire(import.meta.url);
async function load(path){const r=await build({entryPoints:[path],bundle:true,write:false,metafile:true,format:"cjs",platform:"node",jsx:"automatic",external:["react","react/*","react-dom","react-dom/*","lucide-react","next/*","radix-ui","sonner"]});const module={exports:{}};new Function("require","module","exports",r.outputFiles[0].text)(require,module,module.exports);return {...module.exports,inputs:Object.keys(r.metafile.inputs)}}
const plans=[{installments:2,installmentAmount:{amount:225000,currency:"ARS"},totalAmount:{amount:450799,currency:"ARS"},label:null},{installments:6,installmentAmount:{amount:116333,currency:"ARS"},totalAmount:{amount:697999,currency:"ARS"},label:null}];

test("customer selection changes displayed installment, total and rounding without exposing private calculator",async()=>{
 const {InstallmentCalculatorDetails,inputs}=await load("app/components/product-installment-calculator.tsx");
 assert.equal(inputs.some(path=>/internal\/finance|amarango-calculator-panel|fixtures\//.test(path)),false);
 const view=count=>renderToStaticMarkup(React.createElement(InstallmentCalculatorDetails,{plans,count,onCount:()=>{},cash:"$ 391.999",loading:false}));
 const two=view(2),six=view(6);
 assert.match(two,/aria-pressed="true">2 cuotas/);assert.match(two,/2 cuotas de.*225\.000.*Última.*225\.799.*Total.*450\.799/);
 assert.match(six,/aria-pressed="true">6 cuotas/);assert.match(six,/6 cuotas de.*116\.333.*Última.*116\.334.*Total.*697\.999/);
 for(const html of [two,six]){assert.match(html,/Contado:.*391\.999/);assert.doesNotMatch(html,/Costo|Markup|Comisión|Ganancia/)}
});
test("customer calculator fails honestly on unavailable plans and rejects invalid money",async()=>{
 const {InstallmentCalculatorDetails}=await load("app/components/product-installment-calculator.tsx");
 const props={plans:[{...plans[0],installmentAmount:{amount:-1}}],count:2,onCount:()=>{},cash:null,loading:false};
 const html=renderToStaticMarkup(React.createElement(InstallmentCalculatorDetails,props));assert.match(html,/Consultá con Amarango/);assert.doesNotMatch(html,/cuotas de|\$0|NaN/);
});
test("private product calculator loads real product cost into the original engine",async()=>{
 const {AmarangoCalculatorPanel}=await load("components/internal/admin/amarango-calculator-panel.tsx");
 const {quoteAmarangoCalculator}=await load("lib/internal/finance/amarango-calculator.ts");
 const quote=quoteAmarangoCalculator({mode:"cost_ars",amount:50000,installmentPlans:[2,4,6]});
 const html=renderToStaticMarkup(React.createElement(AmarangoCalculatorPanel,{initialProduct:{name:"Mi producto",costArs:50000}}));
 assert.match(html,/Mi producto/);assert.match(html,/value="50000"/);assert.match(html,new RegExp(quote.salePrice.toLocaleString("es-AR").replaceAll(".","\\.")));
 assert.match(html,/ADMINISTRACIÓN Y PROPIETARIOS/);assert.match(html,/No modifica el precio publicado/);
});
test("unknown private cost never becomes an invented sample or reverse cash calculation",async()=>{
 const {AmarangoCalculatorPanel}=await load("components/internal/admin/amarango-calculator-panel.tsx");
 const html=renderToStaticMarkup(React.createElement(AmarangoCalculatorPanel,{initialProduct:{name:"Sin costo",costArs:null,salePrice:999999}}));
 assert.match(html,/Cargá el costo real/);assert.doesNotMatch(html,/PRECIO CONTADO DEFINITIVO|value="150000"|999\.999/);
});
test("server keeps cost data behind admin grants; advisors cannot gain access through UI flags",async()=>{
 const {parseSpaceAccess}=await load("lib/internal/auth/space-entry.ts");
 for(const role of ["cliente","asesor",null])assert.equal(parseSpaceAccess({role,admin:true,owner:true}).admin,false);
 assert.equal(parseSpaceAccess({role:"owner",admin:true,owner:true}).admin,true);
 assert.equal(parseSpaceAccess({role:"admin",admin:true}).admin,true);
 const admin=await readFile("app/administracion/page.tsx","utf8");assert.ok(admin.indexOf('requireSpaceAccess("admin")')<admin.indexOf('const administrativeFacts'));
 const owners=await readFile("app/propietarios/page.tsx","utf8");assert.match(owners,/requireSpaceAccess\("owner"\)/);assert.match(owners,/access.admin&&/);
});
