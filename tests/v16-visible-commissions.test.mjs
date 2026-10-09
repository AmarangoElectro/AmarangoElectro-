import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function load(path,plugins=[]){const r=await build({entryPoints:[path],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',external:['react','react/*','react-dom','react-dom/*','lucide-react','next/*','radix-ui','sonner'],plugins});const m={exports:{}};new Function('require','module','exports',r.outputFiles[0].text)(require,m,m.exports);return m.exports}
const {commercialCommission,sortCommissionProducts}=await load('lib/advisor-compensation/commercial-policy.ts');
const {liveAdvisorMonth}=await load('lib/advisor-compensation/live-model.ts');
const op=(changes={})=>({saleId:'sale-a',advisorId:'advisor-a',advisorName:'Asesor QA',productId:'product-a',productLabel:'Producto QA',finalCashPriceArs:350000,modality:'financed',commissionTotalArs:12345,paymentCount:2,paymentAmounts:[6172,6173],commissionCollectedArs:3000,validation:'ACCEPTED',validationReason:'Validada',saleEquivalent:1,policyVersion:'historic-policy',closedAt:null,...changes});
const workspace=(operations)=>({role:'asesor',advisorId:'advisor-a',advisorName:'Asesor QA',period:'2026-10',cap:null,revision:0,version:'2026-10-09-preview',policyActive:false,operations,salesCounts:{},updatedAt:'2026-10-09T00:00:00Z'});

test('new commission estimate: all cash and financed thresholds, zero, decimals and cap',()=>{
 for(const [price,expected] of [[0,7500],[49999,7500],[50000,12000],[99999,12000],[100000,20000],[199999,20000],[200000,28000],[299999,28000],[300000,30000],[1000000,100000]])assert.equal(commercialCommission(price,'financed').amount,expected);
 assert.equal(commercialCommission(199999,'cash').amount,19999.9);
 assert.equal(commercialCommission(200000,'cash').amount,14000);
 assert.equal(commercialCommission(199999.99,'cash').rate,10);
 assert.equal(commercialCommission(1000000,'financed',6,40000).amount,40000);
 assert.equal(commercialCommission(200000,'financed',6,100).amount,28000);
 assert.equal(commercialCommission(1000000,'cash',6,100).amount,70000);
 for(const invalid of [-1,NaN,Infinity])assert.throws(()=>commercialCommission(invalid,'cash'));
 for(const invalid of [-1,NaN,Infinity,100000001])assert.throws(()=>commercialCommission(300000,'financed',6,invalid));
});
test('three installments preview two commission payments; six preview three; split preserves total cents',()=>{
 for(const count of [3,6]){const quote=commercialCommission(333333.33,'financed',count);assert.equal(quote.payments.length,count===3?2:3);assert.equal(Math.round(quote.payments.reduce((a,b)=>a+b,0)*100),Math.round(quote.amount*100));}
 assert.equal(commercialCommission(50000,'cash').payments.length,1);
});
test('sorting uses commissions, recorded sales and sale price without mutating catalog',()=>{
 const products=[{id:'a',price:{amount:199000}},{id:'b',price:{amount:200000}},{id:'c',price:null}];
 assert.equal(sortCommissionProducts(products,'commission','cash',null,{})[0].id,'a');
 assert.equal(sortCommissionProducts(products,'commission','financed',null,{})[0].id,'b');
 assert.equal(sortCommissionProducts(products,'sales','cash',null,{b:5})[0].id,'b');
 assert.equal(sortCommissionProducts(products,'price','cash',null,{})[0].id,'a');
 assert.deepEqual(products.map(p=>p.id),['a','b','c']);
});
test('month uses historical ledger amounts, own advisor only, and actual partial payments',()=>{
 const month=liveAdvisorMonth(workspace([op(),op({saleId:'low',finalCashPriceArs:49000,saleEquivalent:.5,commissionTotalArs:7000,commissionCollectedArs:0}),op({saleId:'pending',validation:'PENDING',commissionTotalArs:5000,commissionCollectedArs:0}),op({saleId:'void',validation:'EXCLUDED',commissionTotalArs:20000,commissionCollectedArs:0}),op({saleId:'foreign',advisorId:'advisor-b',commissionTotalArs:999999,commissionCollectedArs:999999})]));
 assert.equal(month.validSales,2);assert.equal(month.equivalentSales,1.5);
 assert.equal(month.commissionGeneratedArs,24345);assert.equal(month.commissionCollectedArs,3000);assert.equal(month.commissionPendingArs,21345);
 assert.equal(month.operations.length,4);assert.equal(month.operations[0].commissionPayments.length,2);
 assert.equal(month.operations[0].commissionTotalArs,12345);assert.equal(month.policyVersion,'historic-policy');
 assert.equal(month.operations[0].commissionPayments[0].status,'pending');
 assert.equal(month.pendingOperations,1);assert.equal(month.excludedOperations,1);
});
test('monthly prizes preserve 5/10/15/20 thresholds, half sales and post-20 full equivalent increments',()=>{
 for(const [equiv,bonus] of [[4.5,0],[5,10000],[10,35000],[15,65000],[20,100000],[20.5,100000],[21,107500],[22,115000]]){
  const operations=Array.from({length:Math.floor(equiv)},(_,i)=>op({saleId:String(i)}));
  if(equiv%1)operations.push(op({saleId:'half',saleEquivalent:.5}));
  const month=liveAdvisorMonth(workspace(operations));assert.equal(month.bonusArs,bonus);
 }
 assert.equal(liveAdvisorMonth(workspace([])).commissionGeneratedArs,0);
});
test('advisor gain card is an explicit pending estimate, with no cost or markup',async()=>{
 const {CommissionProductGain}=await load('app/components/commission-product-gain.tsx');
 const html=renderToStaticMarkup(React.createElement(CommissionProductGain,{name:'Producto QA',price:200000,cap:null}));
 assert.match(html,/Ganás.*14\.000/);assert.match(html,/pendiente de habilitación/);assert.doesNotMatch(html,/Costo real|costArs|markup/);
 const unavailable=renderToStaticMarkup(React.createElement(CommissionProductGain,{name:'Producto QA',price:200000,cap:undefined}));
 assert.match(unavailable,/A confirmar/);assert.doesNotMatch(unavailable,/14\.000|NaN/);
});
const plugin={name:'mock-trusted-boundary',setup(b){
 b.onResolve({filter:/^@\/(app\/chatgpt-auth|lib\/internal\/auth\/server-access|lib\/server\/backend)$/},a=>({path:a.path,namespace:'trusted-mock'}));
 b.onLoad({filter:/.*/,namespace:'trusted-mock'},a=>({contents:a.path.endsWith('chatgpt-auth')?'export const getChatGPTUser=async()=>globalThis.__commTest.user':a.path.endsWith('server-access')?'export const resolveSpaceAccess=async()=>globalThis.__commTest.access':`export const sameOrigin=r=>!r.headers.get('origin')||r.headers.get('origin')===new URL(r.url).origin;export const privateJson=(x,s=200)=>Response.json(x,{status:s,headers:{'Cache-Control':'no-store'}});export const backendFetch=async(path,init)=>{globalThis.__commTest.calls.push({path,body:JSON.parse(init.body)});return Response.json(globalThis.__commTest.payload)};`,loader:'js'}));
}};
process.env.V16_COMMISSION_ACTIVATED='true';
process.env.SUPABASE_URL='https://ugujgbamqmrvxbvzxxou.supabase.co';
const route=await load('app/api/v16/commissions/route.ts',[plugin]);
const ctx=(access={role:'asesor',advisor:true,admin:false,owner:false})=>(globalThis.__commTest={user:{email:'verified@example.test'},access,payload:workspace([op({costArs:111111,marginArs:222222,secret:'never'})]),calls:[]});
const request=(method='GET',headers={})=>new Request('https://app.test/api/v16/commissions?advisorId=foreign',{method,headers});
test('GET scopes by authenticated identity; advisor DTO redacts cost and margin even from malformed backend',async()=>{
 const c=ctx();const response=await route.GET(request());assert.equal(response.status,200);const json=await response.json();assert.equal(json.data.operations[0].commissionTotalArs,12345);
 for(const key of ['costArs','marginArs','secret'])assert.equal(key in json.data.operations[0],false);
 assert.deepEqual(c.calls[0].body,{p_email:'verified@example.test',p_period:null,p_action:'read'});assert.equal(response.headers.get('cache-control'),'no-store');
});
test('internal admin DTO contains cost and margin; foreign advisor response fails closed',async()=>{
 ctx({role:'admin',admin:true,owner:false,advisor:false});assert.equal((await (await route.GET(request())).json()).data.operations[0].costArs,111111);
 const c=ctx();c.payload.operations.push(op({advisorId:'foreign'}));assert.equal((await route.GET(request())).status,503);
});
test('anonymous, customer, cross-origin and invalid periods never read commission backend',async()=>{
 let c=ctx();c.user=null;assert.equal((await route.GET(request())).status,401);assert.equal(c.calls.length,0);
 c=ctx({role:'cliente',advisor:false,admin:false,owner:false});assert.equal((await route.GET(request())).status,403);assert.equal(c.calls.length,0);
 c=ctx();assert.equal((await route.GET(request('GET',{origin:'https://evil.test'}))).status,403);assert.equal(c.calls.length,0);
 assert.equal((await route.GET(new Request('https://app.test/api/v16/commissions?period=2026-13'))).status,400);
});
test('only owners can save a cap; server validates value, revision, identity and origin',async()=>{
 let c=ctx();assert.equal((await route.POST(request('POST'))).status,403);assert.equal(c.calls.length,0);
 c=ctx({role:'admin',owner:false,admin:true,advisor:false});assert.equal((await route.POST(request('POST'))).status,403);assert.equal(c.calls.length,0);
 const write=(body,headers={})=>new Request('https://app.test/api/v16/commissions',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 c=ctx({role:'owner',owner:true,admin:true,advisor:false});
 for(const body of [{cap:-1,revision:1},{cap:100000001,revision:1},{cap:'20000',revision:1},{cap:null,revision:0},{cap:20000}])assert.equal((await route.POST(write(body))).status,400);
 assert.equal(c.calls.length,0);
 assert.equal((await route.POST(write({cap:20000,revision:1},{origin:'https://evil.test'}))).status,403);
 c.payload={cap:20000,revision:2,version:'2026-10-09|2',policyActive:true};
 const response=await route.POST(write({cap:20000,revision:1,email:'foreign@example.test',advisorId:'foreign'}));
 assert.equal(response.status,200);assert.equal((await response.json()).data.cap,20000);
 assert.deepEqual(c.calls[0].body,{p_email:'verified@example.test',p_action:'set_cap',p_cap:20000,p_revision:1});
});
test('applied report migration is read-only, server-only and exact advisor-scoped; financial SQL remains a proposal',async()=>{
 const sql=await readFile('supabase/migrations/20261009051736_v16_commission_visibility_readonly.sql','utf8');
 assert.doesNotMatch(sql,/insert into|update public|alter table|create trigger|issue_authorized_sale_quote/i);
 assert.match(sql,/l.advisor_id=a.advisor_id/);assert.match(sql,/metadata->>'advisor_id'=l.advisor_id::text/);assert.match(sql,/reverses_movement_id=c.movement_id/);
 assert.match(sql,/case when internal then jsonb_build_object\('costArs'/);
 assert.match(sql,/revoke all.*from public,anon,authenticated/);assert.match(sql,/grant execute.*to service_role/);
});
test('disabled rollout keeps existing read RPC and blocks owner cap writes without any backend mutation',async()=>{
 process.env.V16_COMMISSION_ACTIVATED='false';
 try{
  let c=ctx();const response=await route.GET(request());assert.equal(response.status,200);
  assert.equal(c.calls[0].path,'/rest/v1/rpc/v16_commission_visibility_read');assert.deepEqual(c.calls[0].body,{p_email:'verified@example.test',p_period:null});
  c=ctx({role:'owner',owner:true,admin:true,advisor:false});assert.equal((await route.POST(request('POST'))).status,409);assert.equal(c.calls.length,0);
 }finally{process.env.V16_COMMISSION_ACTIVATED='true'}
});
