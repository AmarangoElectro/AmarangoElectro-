import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

const root=new URL("../",import.meta.url),resolve=createRequire(import.meta.url);
async function load(path){
 const built=await build({entryPoints:[new URL(path,root).pathname],bundle:true,write:false,format:"esm",platform:"node",jsx:"automatic",plugins:[{name:"shared-react",setup(b){b.onResolve({filter:/^(?:react(?:-dom)?(?:\/|$)|radix-ui$|sonner$)/},a=>({path:["radix-ui","sonner"].includes(a.path)?import.meta.resolve(a.path):pathToFileURL(resolve.resolve(a.path)).href,external:true}))}}]});
 return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}#${Math.random()}`);
}
const facts=await load("lib/photo-intelligence/flyer-text.ts");
const guard=await load("lib/photo-intelligence/product-facts.ts");
const comparison=await load("lib/catalog/comparison.ts");
const base={id:"a",name:"Phone",slug:"phone",brand:"Brand",model:null,price:null,financing:[],features:[],specifications:{},image:null,supplierImage:null,stock:{label:null},warranty:null};

test("multiline phone evidence preserves values and distinguishes camera and charging",()=>{
 const got=facts.extractFlyerFacts('RAM: 8 GB\nAlmacenamiento: 256 GB\nPantalla\n6.7” FHD+\nSuper AMOLED\nCámara principal: 50 MP\nCámara frontal: 13 MP\nBatería\n5.000 mAh\nCarga rápida 25W\nProcesador: Octa-Core\nWi-Fi · Bluetooth 5.3');
 assert.equal(got.specifications.RAM,"8 GB");assert.equal(got.specifications.Almacenamiento,"256 GB");
 assert.match(got.specifications.Pantalla,/6.7/);assert.equal(got.specifications.Resolución,"FHD+");
 assert.equal(got.specifications.Cámara,"50 MP");assert.equal(got.specifications["Cámara frontal"],"13 MP");
 assert.equal(got.specifications.Batería,"5.000 mAh");assert.equal(got.specifications.Carga,"25W");assert.equal(got.specifications.Potencia,undefined);
 assert.match(got.specifications.Conectividad,/Bluetooth/);
});
test("appliance, oven and audio units are evidence, commercial text is excluded",()=>{
 const got=facts.extractFlyerFacts('Capacidad: 6,5 kg\n2800\nRPM\n64 x 40 x 35 cm\nPotencia: 1800 W\nTemperatura: 230 °C\nTemporizador: 60 min\nFunciones: Grill y convección\nConectividad: Bluetooth 5.0\nContado $400.000\n6 cuotas de $90.000\nGarantía: 12 meses\nStock disponible');
 assert.equal(got.specifications.Capacidad,"6,5 kg");assert.equal(got.specifications.Velocidad,"2800 RPM");
 assert.equal(got.specifications.Dimensiones,"64 x 40 x 35 cm");assert.equal(got.specifications.Potencia,"1800 W");
 assert.equal(got.specifications.Temperatura,"230 °C");assert.equal(got.specifications.Temporizador,"60 min");
 assert.doesNotMatch(got.features.join("\n"),/cuotas|contado|garantía|stock/i);
});
test("unreadable or commercial-only flyer never manufactures specifications",()=>{
 assert.deepEqual(facts.extractFlyerFacts("Producto increíble\nConsultá precio\n6 cuotas\nGarantía 12 meses"),{features:[],specifications:{}});
 assert.deepEqual(facts.extractFlyerFacts("CÁMARA TRIPLE\nSOMP + 5MP + 2MP"),{features:[],specifications:{}});
});
test("a reused flyer cannot attach the other storage variant",()=>{
 const got=guard.factsForProduct({...base,features:["256 GB"],specifications:{Almacenamiento:"256 GB"}},facts.extractFlyerFacts("Almacenamiento: 128 GB\nSamsung 128GB\nRAM: 4 GB\nBatería: 5000 mAh"));
 assert.equal(got.specifications.Almacenamiento,"256 GB");assert.equal(got.specifications.RAM,"4 GB");
 assert.doesNotMatch(got.features.join("\n"),/128\s*GB/);assert.match(got.features.join("\n"),/256/);
});
test("comparison normalizes aliases, caps common keys at five and flags real differences",()=>{
 const a={...base,specifications:{"Memoria RAM":"8 GB",Almacenamiento:"256 GB",Pantalla:'6.7"',Procesador:"Octa-Core",Batería:"5000 mAh",Conectividad:"Wi-Fi",Potencia:"20 W",Proveedor:"private"}};
 const b={...a,id:"b",specifications:{...a.specifications,"Memoria RAM":"12 GB"}};
 assert.equal(comparison.commonSpecificationKeys([a,b]).length,5);
 const rows=comparison.buildComparisonRows([a,b]);assert.equal(rows.find(r=>r.id==="spec:RAM").differs,true);
 assert.equal(rows.some(r=>r.id==="spec:Proveedor"),false);
});
test("no common keys falls back to each product's own literal characteristics",()=>{
 const a={...base,features:["Bluetooth 5.3"],specifications:{Batería:"5000 mAh"}},b={...base,id:"b",features:["Grill"],specifications:{Capacidad:"70 L"}};
 const rows=comparison.buildComparisonRows([a,b]);assert.equal(rows.some(r=>r.id.startsWith("spec:")),false);
 const own=rows.find(r=>r.id==="features");assert.match(own.values[0],/Bluetooth/);assert.match(own.values[1],/70 L/);
});
test("PDP hides empty technical sections and renders populated evidence",async()=>{
 const {ProductDecisionDetails}=await load("app/components/product-decision-details.tsx");
 const empty=renderToStaticMarkup(React.createElement(ProductDecisionDetails,{product:base}));
 assert.doesNotMatch(empty,/Características principales|<strong>Especificaciones/);assert.match(empty,/Compra, disponibilidad/);
 const filled=renderToStaticMarkup(React.createElement(ProductDecisionDetails,{product:{...base,features:["Bluetooth 5.3"],specifications:{Potencia:"1800 W"}}}));
 assert.match(filled,/Características principales/);assert.match(filled,/1800 W/);assert.doesNotMatch(filled,/pendientes de la fuente/);
});
test("subscriber storefront keeps base cash-only and shows only its own paid rates",async()=>{
 const {SubscriberStorefront}=await load("components/subscriptions/storefront.tsx");
 const store={id:"own-store",slug:"own-store",name:"Own business",plan:"tienda",primary_color:"#071a39",accent_color:"#ff7920",logo_asset_id:null,whatsapp:"",financing:{"2":15}};
 const products=[{id:"own-product",name:"Own product",cash_price:1000,asset_id:null,features:[],specifications:{}}];
 const free=renderToStaticMarkup(React.createElement(SubscriberStorefront,{store,products}));
 assert.doesNotMatch(free,/2 cuotas|<summary>Características/);assert.match(free,/Compartir producto/);
 const paid=renderToStaticMarkup(React.createElement(SubscriberStorefront,{store:{...store,plan:"cuotas"},products}));
 assert.match(paid,/2 cuotas orientativas de \$\s*575/);assert.match(paid,/Compartir foto y cuotas/);
});

const shareInput={name:"Product",url:"https://shop.test/producto/a",imageUrl:"https://shop.test/a.jpg",cashPriceArs:391999,installments:[{installments:2,amountArs:225000,totalArs:450799}],productId:"a"};
test("native share contains real image bytes, canonical link, installments and last remainder",async()=>{
 const share=await load("lib/commerce/share-product.ts"),old=globalThis.fetch;let sent;
 globalThis.fetch=async()=>new Response(new Uint8Array([255,216,255,0]),{headers:{"content-type":"image/jpeg"}});
 try{const result=await share.shareProductLink(shareInput,{canShare:d=>d.files[0] instanceof File,share:async d=>{sent=d},userActivation:{isActive:true}});
 assert.equal(result,"shared");assert.equal(sent.files[0].size,4);assert.match(sent.text,/225\.000/);assert.match(sent.text,/225\.799/);
 assert.match(sent.text,/450\.799/);assert.match(sent.text,/https:\/\/shop.test\/producto\/a/);assert.match(sent.text,/orientativas/);
 }finally{globalThis.fetch=old}
});
test("lost activation prepares a fresh tap instead of claiming a completed share",async()=>{
 const share=await load("lib/commerce/share-product.ts");let count=0;const p={...shareInput,imageUrl:null};
 const cap={share:async()=>{count++},userActivation:{isActive:false}};
 assert.equal(await share.shareProductLink(p,cap),"ready");assert.equal(count,0);
 cap.userActivation.isActive=true;assert.equal(await share.shareProductLink(p,cap),"shared");assert.equal(count,1);
});
test("cancelled native share does not copy or send anything",async()=>{
 const share=await load("lib/commerce/share-product.ts");let copied=false;
 const result=await share.shareProductLink({...shareInput,imageUrl:null},{share:async()=>{const error=new Error();error.name="AbortError";throw error},clipboard:{writeText:async()=>{copied=true}}});
 assert.equal(result,"cancelled");assert.equal(copied,false);
});
test("browser without file sharing explicitly reports text-only result",async()=>{
 const share=await load("lib/commerce/share-product.ts"),old=fetch;let sent;
 globalThis.fetch=async()=>new Response("photo",{headers:{"content-type":"image/jpeg"}});
 try{assert.equal(await share.shareProductLink(shareInput,{canShare:()=>false,share:async d=>{sent=d}}),"shared-text");assert.equal(sent.files,undefined);assert.equal(sent.url,shareInput.url)}finally{globalThis.fetch=old}
});
test("unavailable server financing is not guessed and clipboard includes link",async()=>{
 const share=await load("lib/commerce/share-product.ts"),old=fetch;let copied;
 globalThis.fetch=async()=>Response.json({status:"unavailable",data:{}});
 try{assert.equal(await share.shareProductLink({...shareInput,installments:[],imageUrl:null},{clipboard:{writeText:async text=>{copied=text}}}),"copied");assert.match(copied,/consultá las opciones/);assert.doesNotMatch(copied,/225\.000|2 cuotas/);assert.match(copied,/https:\/\/shop.test/)}finally{globalThis.fetch=old}
});
test("main sharing uses only returned policy values; subscriber sharing never fetches main finance",async()=>{
 const share=await load("lib/commerce/share-product.ts"),old=fetch;let requests=0,copied;
 globalThis.fetch=async()=>{requests++;return Response.json({status:"ok",data:{a:[{installments:4,installmentAmount:{amount:123.45},totalAmount:{amount:493.8}}]}})};
 try{await share.shareProductLink({...shareInput,installments:[],imageUrl:null},{clipboard:{writeText:async t=>{copied=t}}});assert.match(copied,/4 cuotas de \$123,45/);assert.equal(requests,1);
 await share.shareProductLink({...shareInput,brandName:"Own shop",installments:[],imageUrl:null},{clipboard:{writeText:async()=>{}}});assert.equal(requests,1);
 }finally{globalThis.fetch=old}
});
