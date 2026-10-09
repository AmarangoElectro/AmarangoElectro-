import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {runInNewContext} from "node:vm";
import {build} from "esbuild";

async function load(file){const result=await build({entryPoints:[file],bundle:true,write:false,format:"esm",platform:"node"});return import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].text).toString("base64"));}
const parser=await load("lib/photo-intelligence/flyer-text.ts"),comparison=await load("lib/catalog/comparison.ts"),facts=await load("lib/photo-intelligence/product-facts.ts");
const base={id:"a",name:'IPHONE 16 Pro 512GB',brand:"Apple",model:"iPhone 16 PRO",features:[],specifications:{Colores:"Natural"},stock:{label:"A confirmar"},warranty:null,price:{amount:2490000},financing:[]};

test("Android screenshot fragments become separate facts without duplicate camera text",()=>{
  const other={...base,id:"b",name:'IPHONE 16 E 128GB',features:["16e 128GB y\nCÁMARA 48 MP"],specifications:{Colores:"black"}};
  const rows=comparison.buildComparisonRows([base,other]);
  assert.equal(facts.presentableProductFacts(base).specifications.Almacenamiento,"512GB");
  assert.equal(facts.presentableProductFacts(other).specifications.Almacenamiento,"128GB");
  assert.equal(facts.presentableProductFacts(other).specifications.Cámara,"48 MP");
  assert.deepEqual(rows.map(row=>row.id),["price"]);
  assert.doesNotMatch(JSON.stringify(rows),/16e 128GB y|CÁMARA 48 MP/);
  assert.equal(rows.some(row=>row.id.startsWith("financing:")),false);
  assert.equal(rows.some(row=>row.id==="warranty"||row.id==="availability"),false);
});
test("unreadable and incomplete OCR cannot make a technical comparison",()=>{
  const bad=parser.extractFlyerFacts("Cámara: SOMP\nProcesador: ultrarrápido 16e\nPantalla: increíbles colores\nqR??48\nFunciones: cosas buenas\nColores: Natural 16e128GB");
  assert.deepEqual(bad,{features:[],specifications:{}});
  const rows=comparison.buildComparisonRows([{...base,name:"A",specifications:{},features:["?? 16e y CAMARA"]},{...base,id:"b",name:"B",specifications:{},features:["Comprar en cuotas"]}]);
  assert.equal(rows.some(row=>row.id==="features"||row.id.startsWith("spec:")),false);
});
test("a partial financing row remains only when an actual amount exists",()=>{
  const rows=comparison.buildComparisonRows([base,{...base,id:"b",financing:[{installments:6,installmentAmount:{amount:200000}}]}]);
  assert.deepEqual(rows.filter(row=>row.id.startsWith("financing:")).map(row=>row.id),["financing:6"]);
  assert.equal(rows.find(row=>row.id==="financing:6").values[0],"A confirmar");
});
test("Apple chip evidence is displayed without the promotional heading",()=>{
  const got=parser.extractFlyerFacts("CHIP A18 PRO\nULTRARRÁPIDO\nCÁMARA PRO\n48 MP\nPANTALLA\n6.3 pulgadas\nSuper Retina XDR");
  assert.equal(got.specifications.Procesador,"A18 PRO");
  assert.equal(got.specifications.Cámara,"48 MP");
  assert.match(got.specifications.Pantalla,/6.3/);
  assert.doesNotMatch(got.features.join(" "),/ULTRARRÁPIDO/);
});
test("installed app never intercepts Sites OAuth or signout, while normal navigation stays offline-capable",async()=>{
  const listeners={};let calls=0;
  runInNewContext(await readFile("public/sw.js","utf8"),{URL,self:{location:{origin:"https://shop.test"},addEventListener:(event,fn)=>{listeners[event]=fn}},fetch:()=>Promise.resolve("ok"),caches:{match:()=>Promise.resolve("offline")}});
  for(const path of ["/callback?code=secret","/callback/","/signin-with-chatgpt?return_to=%2F","/signout-with-chatgpt"]){
    listeners.fetch({request:{method:"GET",mode:"navigate",url:"https://shop.test"+path},respondWith:()=>{calls++}});
  }
  assert.equal(calls,0);
  listeners.fetch({request:{method:"GET",mode:"navigate",url:"https://shop.test/categoria/celulares"},respondWith:()=>{calls++}});
  assert.equal(calls,1);
});
