import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const resolve=createRequire(import.meta.url);
async function load(path,plugins=[]){const r=await build({entryPoints:[path],bundle:true,write:false,format:"esm",platform:"node",jsx:"automatic",plugins});return import("data:text/javascript;base64,"+Buffer.from(r.outputFiles[0].text).toString("base64")+"#"+Math.random());}
const plan={installments:6,installmentAmount:{amount:219000,currency:"ARS"},totalAmount:{amount:1316310,currency:"ARS"},label:"Clásica · orientativa"};
const pricing={id:"a",price:{amount:739500,currency:"ARS"},financing:[]};

test("distinct audio brands and sector banners resolve to distinct real image files",async()=>{
 const {getBrandDrawerBackdrop,hasDistinctBrandDrawerArtwork}=await load("lib/visual/brand-drawer-art.ts");
 const {audioSectorScenes}=await load("lib/visual/audio-scenes.ts");
 const brands=["Audisat","Harrison","Joog","Stromberg","Ken Brown"];
 const paths=brands.map(brand=>{assert.equal(hasDistinctBrandDrawerArtwork("audio",brand),true);return getBrandDrawerBackdrop("audio",undefined,brand).image});
 paths.push(...Object.values(audioSectorScenes));assert.equal(new Set(paths).size,8);
 const bytes=await Promise.all(paths.map(path=>readFile("public"+path)));
 assert.equal(new Set(bytes.map(b=>createHash("sha256").update(b).digest("hex"))).size,8);
 for(const image of bytes){assert.equal(image.subarray(8,12).toString(),"WEBP");assert.ok(image.length>20000)}
 assert.match(getBrandDrawerBackdrop("smart-tv",undefined,"Samsung").image,/smart-tv-brands-v2\/samsung.webp/);
 assert.equal(hasDistinctBrandDrawerArtwork("smart-tv","Ken Brown"),false);
});
test("cards batch and deduplicate quote reads while sending no browser prices",async()=>{
 const api=await load("lib/commerce/storefront-financing.ts"),old=fetch,requests=[];
 globalThis.fetch=async(_url,options)=>{const payload=JSON.parse(options.body);requests.push(payload);assert.deepEqual(Object.keys(payload),["ids"]);return Response.json({status:"ok",data:Object.fromEntries(payload.ids.map(id=>[id,[plan,{...plan,installmentAmount:{amount:-1}}]]))})};
 try{
  const first=api.loadStorefrontFinancing(pricing);assert.equal(api.loadStorefrontFinancing(pricing),first);
  const quotes=await Promise.all([first,...Array.from({length:116},(_,i)=>api.loadStorefrontFinancing({...pricing,id:`phone-${i}`}))]);
  assert.equal(requests.length,2);assert.ok(requests.every(body=>body.ids.length<=100));assert.ok(quotes.every(plans=>plans.length===1));
  assert.deepEqual(await api.loadStorefrontFinancing(pricing),[plan]);assert.equal(requests.length,2);
  await api.loadStorefrontFinancing({...pricing,price:{amount:0}});assert.equal(requests.length,2);
 }finally{globalThis.fetch=old}
});
test("unavailable quote reads never turn into estimated client-side rates",async()=>{
 const api=await load("lib/commerce/storefront-financing.ts"),old=fetch;globalThis.fetch=async()=>Response.json({status:"unavailable",data:{}});
 try{assert.deepEqual(await api.loadStorefrontFinancing(pricing),[])}finally{globalThis.fetch=old}
});
const routeMocks={name:"route-test-boundaries",setup(b){
 b.onResolve({filter:/^@\/app\/chatgpt-auth$|^@\/lib\/server\/backend$|^@\/lib\/catalog$/},a=>({path:a.path,namespace:"quote-test"}));
 b.onLoad({filter:/.*/,namespace:"quote-test"},a=>({contents:a.path.endsWith("chatgpt-auth")?'export async function getChatGPTUser(){return globalThis.quoteRouteTest.user}':a.path.endsWith("backend")?'export const backendFetch=(...args)=>globalThis.quoteRouteTest.backend(...args);export const privateJson=(body,status=200)=>Response.json(body,{status});export const sameOrigin=(req)=>!req.headers.get("origin")||req.headers.get("origin")===new URL(req.url).origin;':'export const rawCatalog={listProducts:async()=>globalThis.quoteRouteTest.products};'}));
}};
test("quote route reads the authorized bridge and returns only requested public prices",async()=>{
 const {POST}=await load("app/api/v16/comparison-financing/route.ts",[routeMocks]);let read=0;
 globalThis.quoteRouteTest={user:{email:"owner@example.test"},products:[{...pricing,id:"a",visible:true},{...pricing,id:"b",visible:true}],backend:async(path,options)=>{
  read++;assert.equal(path,"/rest/v1/rpc/v16_chatgpt_operational_bridge");assert.deepEqual(JSON.parse(options.body),{p_email:"owner@example.test",p_rpc:"v16_get_active_financing_mode",p_args:{},p_aal:"aal1"});return Response.json([{active_financing_mode:"CLASSIC"}]);
 }};
 const request=body=>new Request("https://shop.test/api/v16/comparison-financing",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://shop.test"},body:JSON.stringify(body)});
 const body=await (await POST(request({ids:["a"],price:1,email:"attacker@example.test"}))).json();
 assert.equal(body.status,"ok");assert.deepEqual(Object.keys(body.data),["a"]);assert.deepEqual(body.data.a.map(p=>p.installments),[2,4,6]);assert.equal(body.data.a[2].installmentAmount.amount,219000);
 assert.doesNotMatch(JSON.stringify(body),/owner@example|cost|commission|secret|markup/i);
 globalThis.quoteRouteTest.user=null;assert.equal((await POST(request({ids:["a"]}))).status,401);assert.equal(read,1);
 const external=new Request("https://shop.test/api/v16/comparison-financing",{method:"POST",headers:{Origin:"https://evil.test"},body:'{"ids":["a"]}'});assert.equal((await POST(external)).status,403);assert.equal(read,1);
});
test("mode failures and protected mode fail closed without guessing protected costs",async()=>{
 const {POST}=await load("app/api/v16/comparison-financing/route.ts",[routeMocks]);
 const request=()=>new Request("https://shop.test/api/v16/comparison-financing",{method:"POST",body:'{"ids":["a"]}'});
 for(const response of [()=>Response.json([{active_financing_mode:"PROTECTED"}]),()=>Response.json({error:"private"},{status:403}),()=>{throw new Error("offline")}]){
  globalThis.quoteRouteTest={user:{email:"owner@example.test"},products:[pricing],backend:async()=>response()};assert.deepEqual(await (await POST(request())).json(),{status:"unavailable",data:{}});
 }
});
test("card renders large installment then smaller cash, preserving sharing and two-column structure",async()=>{
 const bundle=await build({entryPoints:["app/components/product-card.tsx"],bundle:true,write:false,format:"cjs",platform:"node",jsx:"automatic",external:["react","react/*","react-dom","react-dom/*","lucide-react","next/*","radix-ui","sonner"]});
 const module={exports:{}};new Function("require","module","exports",bundle.outputFiles[0].text)(resolve,module,module.exports);
 const {ProductCard}=module.exports;
 const product={...pricing,slug:"a",name:"Torre A",brand:"Ken Brown",category:"audio",subcategory:"torres",model:null,image:null,features:[],specifications:{},description:null,stock:{status:"unknown",label:"Consultar"},financing:[plan]};
 const html=renderToStaticMarkup(React.createElement(ProductCard,{product,onCompareToggle:()=>{}}));
 assert.match(html,/product-card-installment-hero/);assert.match(html,/6 cuotas de/);assert.match(html,/219\.000/);assert.match(html,/Contado:.*739\.500/);
 assert.ok(html.indexOf("219.000")<html.indexOf("739.500"));assert.doesNotMatch(html,/class="product-card-price"/);assert.match(html,/Compartir producto/);assert.match(html,/Comparar producto/);
 const css=await readFile("app/storefront-quotes.css","utf8");assert.match(css,/background: transparent/);assert.doesNotMatch(css,/grid-template|background[^;]*orange|background[^;]*#ff/i);
});
