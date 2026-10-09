import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

const require=createRequire(import.meta.url);
const product={id:"continuity-phone",name:"Phone",slug:"phone",brand:"Brand",category:"celulares",model:null,price:{amount:391999,currency:"ARS"},financing:[],features:[],specifications:{},image:null,stock:{label:null},warranty:null};
const plans=[{installments:2,installmentAmount:{amount:225000,currency:"ARS"},totalAmount:{amount:450799,currency:"ARS"}},{installments:6,installmentAmount:{amount:116333,currency:"ARS"},totalAmount:{amount:697999,currency:"ARS"}}];
async function load(path,mock=false){
 const result=await build({entryPoints:[path],bundle:true,write:false,format:"cjs",platform:"node",jsx:"automatic",external:["react","react/*","react-dom","react-dom/*","lucide-react","next/*","radix-ui","sonner"],plugins:mock?[{name:"current-quote-hook",setup(b){b.onResolve({filter:/use-storefront-financing$/},()=>({path:"quote-hook",namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:'export function useStorefrontFinancing(){return globalThis.pdpQuoteFixture}'}))}}]:[]});
 const module={exports:{}};new Function("require","module","exports",result.outputFiles[0].text)(require,module,module.exports);return module.exports;
}

test("detail summary and commerce drawer display returned quotes even when catalog financing is empty",async()=>{
 globalThis.pdpQuoteFixture={data:{[product.id]:plans},loading:false};
 const {ProductFinancingSummary}=await load("app/components/product-financing-summary.tsx",true);
 const {ProductDecisionDetails}=await load("app/components/product-decision-details.tsx",true);
 const summary=renderToStaticMarkup(React.createElement(ProductFinancingSummary,{product}));
 assert.match(summary,/6 cuotas de.*116\.333.*Última.*116\.334.*Total.*697\.999/);
 assert.match(summary,/orientativas/);assert.doesNotMatch(summary,/A confirmar|Consultando cuotas/);
 const detail=renderToStaticMarkup(React.createElement(ProductDecisionDetails,{product}));
 assert.match(detail,/2 cuotas de.*225\.000.*Última.*225\.799.*Total.*450\.799/);
 assert.match(detail,/6 cuotas de.*116\.333.*Última.*116\.334/);
 assert.doesNotMatch(detail,/Características principales|<strong>Especificaciones/);
});
test("pending and unavailable quote states stay truthful without a made-up installment",async()=>{
 const {ProductFinancingSummary}=await load("app/components/product-financing-summary.tsx",true);
 globalThis.pdpQuoteFixture={data:{},loading:true};
 let html=renderToStaticMarkup(React.createElement(ProductFinancingSummary,{product}));
 assert.match(html,/Consultando cuotas/);assert.doesNotMatch(html,/116\.333|225\.000/);
 globalThis.pdpQuoteFixture.loading=false;
 html=renderToStaticMarkup(React.createElement(ProductFinancingSummary,{product}));
 assert.match(html,/Consultá las opciones de pago/);assert.doesNotMatch(html,/6 cuotas de|\$0/);
});
test("formatting ignores invalid totals, includes the real rounding remainder, and never edits source amounts",async()=>{
 const {formatStorefrontPlan}=await load("lib/commerce/storefront-financing.ts");
 const before=JSON.stringify(plans);
 assert.match(formatStorefrontPlan(plans[0]),/Última.*225\.799/);
 assert.doesNotMatch(formatStorefrontPlan({...plans[0],totalAmount:{amount:NaN}}),/Última|Total|NaN/);
 assert.equal(formatStorefrontPlan({...plans[0],installmentAmount:{amount:-5}}),"Consultá las opciones de cuotas");
 assert.equal(JSON.stringify(plans),before);
});
