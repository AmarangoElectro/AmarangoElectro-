import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFile} from "node:fs/promises";

async function load(path){const result=await build({entryPoints:[path],bundle:true,write:false,format:"esm",platform:"node"});return import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].text).toString("base64"));}
const {buildComparisonRows}=await load("lib/catalog/comparison.ts");
const motion=await load("lib/ux/interaction-motion.ts");

test("financial comparison never reads photo facts and preserves last-installment adjustment",()=>{
 const product={id:"a",price:{amount:391999},financing:[{installments:2,installmentAmount:{amount:225000},totalAmount:{amount:450799}}]};
 for(const key of ["features","specifications","image","supplierImage"]){Object.defineProperty(product,key,{get(){throw new Error("Financial comparison must not read photos or facts")}})}
 const rows=buildComparisonRows([product,{id:"b",price:{amount:510000},financing:[]}]);
 assert.deepEqual(rows.map(row=>row.id),["price","financing:2"]);
 assert.equal(rows[0].differs,true);
 assert.match(rows[1].values[0],/225\.000.*Última.*225\.799.*Total.*450\.799/);
 assert.equal(rows[1].values[1],"A confirmar");
});
test("invalid money or installment counts cannot produce misleading numeric rows",()=>{
 const bad={price:{amount:NaN},financing:[{installments:0,installmentAmount:{amount:100}},{installments:2.5,installmentAmount:{amount:200}},{installments:4,installmentAmount:{amount:-50}},{installments:6,installmentAmount:{amount:Infinity}}]};
 assert.deepEqual(buildComparisonRows([bad,{price:null,financing:[]}]),[]);
});
test("comparison clients omit photo reading while subscriber rates stay workspace-scoped",async()=>{
 const main=await readFile("app/components/product-comparison.tsx","utf8"),own=await readFile("components/subscriptions/storefront.tsx","utf8");
 assert.doesNotMatch(main,/useProductFlyerFacts|commonSpecificationKeys|Características de cada producto/);
 assert.match(main,/Compará precios y cuotas/);assert.match(own,/Compará precios y cuotas/);
 assert.doesNotMatch(own,/comparison-financing|commonSpecificationKeys|technicalSpecifications/);
 assert.match(own,/canUse\(store.plan,"calculator"\)/);assert.match(own,/store.financing/);
});

// Test the event contract with a small DOM adapter; this is not browser/Android QA.
function surface(){
 const handlers=new Map(),nodes=[],timers=new Map(),scrolls=[];
 class Element {
  constructor(){this.style={};this.attrs={};this.rect={left:20,right:100,top:180,width:80,height:40};this.scrollLeft=0;this.clientWidth=200;this.scrollWidth=200;this.ownerDocument=doc;}
  closest(selector){return selector==='[data-motion="off"]'?null:selector.includes("catalog-quick")?this.rail??null:this;}
  matches(){return Boolean(this.disabled)}
  setAttribute(k,v){this.attrs[k]=v} getBoundingClientRect(){return this.rect}
  remove(){this.removed=true} scrollTo(data){this.scrolled=data}
 }
 class Anchor extends Element {constructor(href){super();this.href=href}}
 const win={Element,HTMLAnchorElement:Anchor,location:{origin:"https://shop.test",href:"https://shop.test/"},innerHeight:800,scrollY:200,matchMedia:()=>({matches:win.reduced??false}),setTimeout:fn=>{const id=timers.size+1;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id),scrollTo:data=>scrolls.push(data)};
 const doc={documentElement:{dataset:{}},hidden:false,body:{appendChild:node=>nodes.push(node)},createElement:()=>new Element(),addEventListener:(type,fn,options)=>{handlers.set(type,fn);if(type!=="visibilitychange")assert.equal(options.passive,true)},removeEventListener:type=>handlers.delete(type)};
 function fire(type,target,extra={}){handlers.get(type)?.({target,clientX:50,clientY:200,pointerId:1,isPrimary:true,button:0,detail:1,preventDefault(){throw new Error("Motion intercepted a user action")},...extra})}
 return {win,doc,nodes,timers,scrolls,handlers,Element,Anchor,fire};
}
test("taps and keyboard activation give bounded feedback; drags, disabled and auth links do not",()=>{
 const s=surface(),dispose=motion.installInteractionMotion(s.doc,s.win),button=new s.Element();
 s.fire("pointerdown",button);s.fire("pointerup",button);assert.equal(s.nodes.length,1);assert.equal(s.nodes[0].attrs["aria-hidden"],"true");
 s.fire("pointerdown",button);s.fire("pointermove",button,{clientX:100});s.fire("pointerup",button);assert.equal(s.nodes.length,1);
 s.fire("pointerdown",button);s.fire("pointercancel",button);s.fire("pointerup",button);assert.equal(s.nodes.length,1);
 button.disabled=true;s.fire("click",button,{detail:0});button.disabled=false;
 for(const url of ["https://shop.test/callback?code=private","https://shop.test/signin-with-chatgpt","https://wa.me/123"]){s.fire("click",new s.Anchor(url),{detail:0})}
 assert.equal(s.nodes.length,1);s.fire("click",button,{detail:0});assert.equal(s.nodes.length,2);
 for(let i=0;i<20;i++)s.fire("click",button,{detail:0});assert.equal(s.nodes.length,4);
 dispose();assert.equal(s.handlers.size,0);assert.equal(s.timers.size,0);assert.equal(s.nodes.every(n=>n.removed),true);
});
test("reduced motion, lean devices and hidden tabs suppress decorative feedback",()=>{
 for(const mode of ["reduced","lean","hidden"]){const s=surface();if(mode==="reduced")s.win.reduced=true;if(mode==="lean")s.doc.documentElement.dataset.performanceProfile="lean";if(mode==="hidden")s.doc.hidden=true;
 const dispose=motion.installInteractionMotion(s.doc,s.win);s.fire("click",new s.Element(),{detail:0});assert.equal(s.nodes.length,0);dispose();}
});
test("scroll assists only hidden content and overflowing selected pills, without viewport jumps for visible content",()=>{
 const s=surface(),panel=new s.Element();motion.revealIfNeeded(panel,s.win);assert.equal(s.scrolls.length,0);
 panel.rect.top=750;motion.revealIfNeeded(panel,s.win);assert.deepEqual(s.scrolls[0],{top:850,behavior:"smooth"});
 s.win.reduced=true;motion.revealIfNeeded(panel,s.win);assert.equal(s.scrolls[1].behavior,"auto");
 s.win.innerHeight=300;motion.revealIfNeeded(panel,s.win);assert.equal(s.scrolls.length,2);
 const pill=new s.Element(),rail=new s.Element();pill.rail=rail;rail.scrollWidth=600;rail.rect={left:0,right:200};pill.rect={left:210,right:290};
 motion.revealSelectedPill(pill,s.win);assert.deepEqual(rail.scrolled,{left:98,behavior:"auto"});
 rail.scrolled=null;pill.rect={left:20,right:100};motion.revealSelectedPill(pill,s.win);assert.equal(rail.scrolled,null);
});
