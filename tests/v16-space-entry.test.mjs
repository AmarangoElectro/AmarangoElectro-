import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const root = new URL('../', import.meta.url);
const resolvePackage = createRequire(import.meta.url);
const owner = {role:'owner',owner:true,admin:true,advisor:true};
const admin = {role:'admin',owner:false,admin:true,advisor:true};
const advisor = {role:'asesor',owner:false,admin:false,advisor:true};
const customer = {role:'cliente',owner:false,admin:false,advisor:false};
const initial = (access=customer, store=null) => ({
  user:{id:'trusted-sites-account',email:'trusted@example.invalid'}, access, store, calls:[], reads:[],
});

async function load(path,state) {
  globalThis.__spaceEntryTest=state;
  const result=await build({entryPoints:[new URL(path,root).pathname],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'trusted-boundaries',setup(b){
    b.onResolve({filter:/^(?:react(?:\/|$)|lucide-react$)/},args=>({path:pathToFileURL(resolvePackage.resolve(args.path)).href,external:true}));
    b.onResolve({filter:/^next\//},args=>({path:args.path,namespace:'mock'}));
    b.onResolve({filter:/^@\//},args=>{
      if(args.path.includes('chatgpt-auth') || args.path.includes('lib/server/backend') || args.path.includes('/components/') || args.path==='@/lib/catalog' || args.path.includes('product-bridge-lab')) return {path:args.path,namespace:'mock'};
      return {path:new URL(args.path.slice(2)+'.ts',root).pathname};
    });
    b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:
      args.path==='next/navigation' ? `export function redirect(path){const error=new Error('redirect');error.destination=path;throw error}` :
      args.path.includes('chatgpt-auth') ? `export async function getChatGPTUser(){return globalThis.__spaceEntryTest.user};export async function requireChatGPTUser(path){if(!globalThis.__spaceEntryTest.user){const error=new Error('sign-in');error.destination='/signin-with-chatgpt?return_to='+encodeURIComponent(path);throw error}return globalThis.__spaceEntryTest.user}` :
      args.path.includes('lib/server/backend') ? `export async function backendFetch(path,init){const s=globalThis.__spaceEntryTest;s.calls.push({path,init});if(s.backendDown)return new Response(null,{status:503});return Response.json(path.includes('v16_chatgpt_space_access')?s.access:{store:s.store})}` :
      args.path==='@/lib/catalog' ? `export const catalog={async listProducts(){globalThis.__spaceEntryTest.reads.push('catalog');return []}}` :
      args.path.includes('product-bridge-lab') ? `export const amarangoOsLabProductBridge={async list(){globalThis.__spaceEntryTest.reads.push('private-bridge');return []}}` :
      args.path.includes('v411-pilot-products') ? 'export const v411PilotAdminProducts=[]' :
      `export default function Component(){return null};export const InternalSpaceHeader=Component,ProtectedSpaceLink=Component,CustomerReferralHub=Component,AdvisorWorkspace=Component,AdminConsolidatedWorkspace=Component,OwnerSubscriptions=Component,AmarangoOsProductBridge=Component;`
    }));
  }}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')+'#'+Math.random());
}

async function destination(page,state) {
  const {default:render}=await load(page,state);
  try {await render();return null} catch(error) {if(error.destination)return error.destination;throw error}
}

test('entry gives trusted internal grants priority over an owner test store',async()=>{
  for(const [access,expected] of [[owner,'/administracion'],[admin,'/administracion'],[advisor,'/mi-amarango'],[{...owner,admin:false},'/propietarios']]) {
    const state=initial(access,{id:'own-test-store',plan:'tienda'});
    assert.equal(await destination('app/mi-espacio/page.tsx',state),expected);
    assert.equal(state.calls.length,1);
    assert.equal(JSON.parse(state.calls[0].init.body).p_email,state.user.email);
  }
});

test('subscriber entry reads only own identity and never changes the current plan',async()=>{
  for(const status of ['active','pending','paused']) {
    const state=initial(customer,{id:'own-store',status,plan:'tienda'});
    assert.equal(await destination('app/mi-espacio/page.tsx',state),'/mi-tienda');
    const call=JSON.parse(state.calls[1].init.body);
    assert.deepEqual(call,{p_user_id:state.user.id,p_email:state.user.email,p_action:'identity',p_payload:{}});
    assert.equal(state.store.plan,'tienda');
  }
});

test('customer entry opens a customer account without advisor catalog data',async()=>{
  const state=initial();
  assert.equal(await destination('app/mi-espacio/page.tsx',state),'/mi-cuenta');
  assert.deepEqual(state.reads,[]);
  assert.equal(await destination('app/mi-amarango/page.tsx',state),'/mi-espacio');
  assert.deepEqual(state.reads,[]);
});

test('anonymous entry signs in to the same entry route before any backend access',async()=>{
  const state=initial();state.user=null;
  assert.equal(await destination('app/mi-espacio/page.tsx',state),'/signin-with-chatgpt?return_to=%2Fmi-espacio');
  assert.deepEqual(state.calls,[]);
});

test('unavailable backend renders retry state and grants no private destination',async()=>{
  const state=initial();state.backendDown=true;
  assert.equal(await destination('app/mi-espacio/page.tsx',state),null);
  assert.deepEqual(state.reads,[]);
});

test('malformed role responses cannot turn truthy strings into permissions',async()=>{
  const {parseSpaceAccess}=await load('lib/internal/auth/space-entry.ts',initial());
  for(const input of [null,[],{role:'cliente',owner:true,admin:true,advisor:true},{role:'asesor',admin:true,owner:true},{role:'owner',admin:'true',owner:1,advisor:'false'},{role:'superadmin',owner:true,admin:true,advisor:true}]) {
    const parsed=parseSpaceAccess(input);
    assert.equal(parsed.owner,false);assert.equal(parsed.admin,false);assert.equal(parsed.advisor,false);
  }
  assert.deepEqual(parseSpaceAccess({role:'owner'}),{role:'owner',owner:false,admin:false,advisor:false});
});

test('direct administration, platform and operations routes reject advisors and customers before data loads',async()=>{
  for(const access of [advisor,customer])for(const page of ['app/administracion/page.tsx','app/plataforma/page.tsx','app/amarango-os/page.tsx']) {
    const state=initial(access);
    assert.equal(await destination(page,state),'/acceso-denegado');
    assert.deepEqual(state.reads,[]);
  }
});

test('direct owners route rejects admin, advisor, customer and subscriber accounts',async()=>{
  for(const access of [admin,advisor,customer]) {
    const state=initial(access,{id:'own-store',plan:'premium'});
    assert.equal(await destination('app/propietarios/page.tsx',state),'/acceso-denegado');
    assert.deepEqual(state.reads,[]);
  }
});

test('authorized advisor retains the advisor route and customer hub',async()=>{
  const state=initial(advisor);
  assert.equal(await destination('app/mi-amarango/page.tsx',state),null);
  assert.deepEqual(state.reads,['catalog']);
});
