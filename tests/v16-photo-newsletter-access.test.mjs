import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {build} from "esbuild";

const root=new URL("../",import.meta.url);
async function loadRoute(path,state){
  globalThis.__v16RouteTest=state;
  const result=await build({stdin:{contents:await readFile(new URL(path,root),"utf8"),loader:"ts",resolveDir:new URL("../",import.meta.url).pathname},bundle:true,write:false,format:"esm",platform:"node",plugins:[{name:"test-boundaries",setup(builder){
    builder.onResolve({filter:/^@\//},args=>({path:args.path,namespace:"mock"}));
    builder.onLoad({filter:/.*/,namespace:"mock"},args=>({contents:
      args.path.includes("chatgpt-auth")?'export async function getChatGPTUser(){return globalThis.__v16RouteTest.user}':
      args.path.includes("server-access")?'export async function resolveSpaceAccess(){return globalThis.__v16RouteTest.access}':
      args.path.includes("lib/catalog")?'export const rawCatalog={async listProducts(){return globalThis.__v16RouteTest.products}}':
      `export async function backendFetch(path,init){const s=globalThis.__v16RouteTest;s.calls.push({path,init});return s.respond(path,init)};export function sameOrigin(r){return !r.headers.get("origin")||r.headers.get("origin")==new URL(r.url).origin};export function privateJson(body,status=200){return Response.json(body,{status})}`
    }));
  }}]});
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${Math.random()}`);
}
const initial=()=>({user:{id:"trusted-sites-user",email:"owner@example.invalid"},access:{admin:true},products:[{id:"p1"}],calls:[],respond:()=>new Response(null,{status:201})});
function photoRequest(overrides={}){const form=new FormData();form.set("image",new Blob([new Uint8Array([255,216,255,0])],{type:"image/jpeg"}),"a.jpg");form.set("metadata",JSON.stringify({productId:"p1",features:["Potencia: 1800 W"],specifications:{Potencia:"1800 W"},sourceText:"Potencia: 1800 W",style:"original",reviewed:true,...overrides}));return new Request("https://site.test/api/v16/product-media",{method:"POST",body:form})}

test("photo mutation rejects non-admin before any storage access",async()=>{const state=initial();state.access.admin=false;const route=await loadRoute("app/api/v16/product-media/route.ts",state);assert.equal((await route.POST(photoRequest())).status,403);assert.equal(state.calls.length,0)});
test("photo metadata requires human review and known product",async()=>{const state=initial();const route=await loadRoute("app/api/v16/product-media/route.ts",state);assert.equal((await route.POST(photoRequest({reviewed:false}))).status,400);assert.equal((await route.POST(photoRequest({productId:"other"}))).status,400);assert.equal(state.calls.length,0)});
test("failed upload cannot publish metadata",async()=>{const state=initial();state.respond=()=>new Response(null,{status:503});const route=await loadRoute("app/api/v16/product-media/route.ts",state);assert.equal((await route.POST(photoRequest())).status,503);assert.equal(state.calls.length,1);assert.match(state.calls[0].path,/storage/)});
test("photo save publishes metadata only after upload and returns asset URL",async()=>{const state=initial();const route=await loadRoute("app/api/v16/product-media/route.ts",state);const response=await route.POST(photoRequest());assert.equal(response.status,200);assert.equal(state.calls.length,2);const metadata=JSON.parse(state.calls[1].init.body);assert.equal(metadata.product_id,"p1");assert.equal(metadata.reviewed_by,"owner@example.invalid");assert.equal((await response.json()).imageUrl,`/api/v16/product-photo/${metadata.asset_id}`)});
test("newsletter ignores submitted identity and stores trusted own consent",async()=>{const state=initial();const route=await loadRoute("app/api/v16/newsletter/route.ts",state);const response=await route.POST(new Request("https://site.test/api/v16/newsletter",{method:"POST",body:JSON.stringify({consent:true,email:"someone-else@example.invalid",site_user_id:"attacker"})}));assert.equal(response.status,200);const data=JSON.parse(state.calls[0].init.body);assert.equal(data.site_user_id,"trusted-sites-user");assert.equal(data.email,"owner@example.invalid");assert.equal(data.active,true);assert.ok(data.consented_at)});
test("newsletter cannot expose subscriber list to non-admin",async()=>{const state=initial();state.access.admin=false;const route=await loadRoute("app/api/v16/newsletter/route.ts",state);assert.equal((await route.GET(new Request("https://site.test/api/v16/newsletter?admin=1"))).status,403);assert.equal(state.calls.length,0)});
test("newsletter rejects cross-origin changes and untrusted sessions",async()=>{const state=initial();const route=await loadRoute("app/api/v16/newsletter/route.ts",state);assert.equal((await route.POST(new Request("https://site.test/api/v16/newsletter",{method:"POST",headers:{origin:"https://other.test"},body:'{"consent":true}'}))).status,403);state.user=null;assert.equal((await route.POST(new Request("https://site.test/api/v16/newsletter",{method:"POST",body:'{"consent":true}'}))).status,401);assert.equal(state.calls.length,0)});
