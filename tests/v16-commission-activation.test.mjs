import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function load(path,plugins=[]){const r=await build({entryPoints:[path],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',external:['react','react/*','react-dom','react-dom/*','lucide-react','next/*','radix-ui','sonner'],plugins});const m={exports:{}};new Function('require','module','exports',r.outputFiles[0].text)(require,m,m.exports);return m.exports}
const {applyCommissionPolicy,parseCommissionPolicy}=await load('lib/advisor-compensation/server-policy.ts');
const {buildV16AuthorizedQuoteDraft}=await load('lib/operations/authorized-sale-quote-engine.ts');
const policy={cap:25000,revision:1,version:'2026-10-09|1',policyActive:true};
test('activation changes only commission metadata; every existing Classic/Protected price and customer payment remains exact',()=>{
 const facts={productId:'electro:qa',productName:'Producto QA',productModel:null,costArs:150000,currentSalePriceArs:500000};
 for(const [mode,count] of [['CLASSIC',1],['CLASSIC',2],['CLASSIC',4],['CLASSIC',6],['PROTECTED',1],['PROTECTED',3],['PROTECTED',6]]){
  const original=buildV16AuthorizedQuoteDraft(facts,mode,{paymentMode:count===1?'CASH':'FINANCED',installments:count});
  const applied=applyCommissionPolicy(original,policy);
  for(const key of Object.keys(original).filter(k=>!['commission','commissionPolicyVersion'].includes(k)))assert.deepEqual(applied[key],original[key],`${mode}/${count}: ${key}`);
  assert.equal(applied.commissionPolicyVersion,'2026-10-09|1');assert.notEqual(original.commissionPolicyVersion,applied.commissionPolicyVersion);
  assert.ok(Object.isFrozen(applied));assert.deepEqual(original.paymentAmounts,applied.paymentAmounts);
 }
});
test('commission policy parser rejects inactive, stale, invalid or forged metadata',()=>{
 assert.deepEqual(parseCommissionPolicy(policy),policy);
 for(const changed of [{policyActive:false},{revision:0},{revision:1.5},{version:'old'},{version:'2026-10-09|2'},{cap:-1},{cap:'25000'},{cap:NaN},{cap:100000001}])assert.throws(()=>parseCommissionPolicy({...policy,...changed}));
 assert.equal(parseCommissionPolicy({...policy,cap:null}).cap,null);
});
test('active gain card announces commission detail and drops activation-pending copy',async()=>{
 const {CommissionProductGain}=await load('app/components/commission-product-gain.tsx');
 const html=renderToStaticMarkup(React.createElement(CommissionProductGain,{name:'Producto QA',price:500000,cap:25000,modality:'financed',active:true}));
 assert.match(html,/Ganás.*25\.000/);assert.match(html,/ver detalle/);assert.doesNotMatch(html,/pendiente de habilitación|Costo|Markup/);
});
const ctx=()=>globalThis.__act;
const plugin={name:'quote-policy-boundary',setup(b){
 b.onResolve({filter:/^@\/(app\/chatgpt-auth|lib\/server\/backend)$/},a=>({path:a.path,namespace:'act-mock'}));
 b.onLoad({filter:/.*/,namespace:'act-mock'},a=>({contents:a.path.endsWith('chatgpt-auth')?'export const getChatGPTUser=async()=>globalThis.__act.user':`export const backendFetch=async(path,init)=>{const body=JSON.parse(init.body);globalThis.__act.policyCalls.push(body);return Response.json(globalThis.__act.policy)};`,loader:'js'}));
}};
// Isolated test transport: no credentials or actual network requests.
process.env.SUPABASE_URL='https://example.invalid';
process.env.SUPABASE_SECRET_KEY='test-only-no-secret';
process.env.V16_COMMISSION_ACTIVATED='true';
const route=await load('app/api/v16/sale-quote/route.ts',[plugin]);
const originalFetch=globalThis.fetch;
function setup(){globalThis.__act={user:{email:'verified@example.test'},policy,policyCalls:[],calls:[],conflict:false};globalThis.fetch=async(url,init)=>{const body=JSON.parse(init.body);ctx().calls.push({url,body});if(url.includes('operational_bridge'))return Response.json([{active_financing_mode:'CLASSIC'}]);if(url.includes('resolve_operational'))return Response.json([{current_sale_price:500000,cost_ars:null,product_name:'Producto QA',product_model:null}]);if(ctx().conflict)return Response.json({message:'commission_policy_conflict'},{status:400});return Response.json('authorized-test-id')};}
const req=()=>new Request('https://app.test/api/v16/sale-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:'electro:qa',paymentMode:'FINANCED',installments:6,costArs:1,cap:1,commissionPolicyVersion:'forged',commission:1})});
test('quote issuance takes commission/cap from server, preserving original customer schedule and private-cost redaction',async()=>{
 setup();try{
  const response=await route.POST(req());assert.equal(response.status,200);const body=(await response.json()).data;
  assert.deepEqual(ctx().policyCalls,[{p_email:'verified@example.test',p_action:'policy'}]);
  const issued=ctx().calls.at(-1).body;assert.equal(issued.p_commission_policy_version,policy.version);assert.equal(issued.p_commercial_snapshot.commission,25000);
  assert.equal(issued.p_commercial_snapshot.cashPrice,500000);assert.equal(issued.p_cash_price,body.cashPrice);assert.deepEqual(issued.p_payment_amounts,body.paymentAmounts);
  for(const field of ['costArs','cap','margin','supplier'])assert.equal(field in body,false);
 }finally{globalThis.fetch=originalFetch}
});
test('concurrent cap change requires fresh quote; missing policy cannot emit a guessed commission',async()=>{
 setup();try{
  ctx().conflict=true;assert.equal((await route.POST(req())).status,409);
  setup();ctx().policy={...policy,policyActive:false};assert.equal((await route.POST(req())).status,503);assert.equal(ctx().calls.some(c=>c.url.includes('issue_authorized')),false);
 }finally{globalThis.fetch=originalFetch}
});

test('disabled rollout preserves existing quote issuer and never reads active cap policy',async()=>{
 setup();process.env.V16_COMMISSION_ACTIVATED='false';
 try{
  const response=await route.POST(req());assert.equal(response.status,200);assert.equal(ctx().policyCalls.length,0);
  const issued=ctx().calls.at(-1).body;assert.notEqual(issued.p_commission_policy_version,policy.version);
  const original=buildV16AuthorizedQuoteDraft({productId:'electro:qa',productName:'Producto QA',productModel:null,currentSalePriceArs:500000,costArs:null},'CLASSIC',{paymentMode:'FINANCED',installments:6});
  assert.equal(issued.p_commercial_snapshot.commission,original.commission);assert.deepEqual(issued.p_payment_amounts,original.paymentAmounts);
 }finally{process.env.V16_COMMISSION_ACTIVATED='true';globalThis.fetch=originalFetch}
});
