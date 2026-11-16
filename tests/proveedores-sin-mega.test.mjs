import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Mega Electro se retiró como proveedor el 16/11/2026. Electro Impacto sigue sincronizando igual.
const sync=await import('../src/proveedores-sync.mjs');
test('la sincronización ya no tiene configurado a Mega Electro',()=>{
 const src=readFileSync(new URL('../src/proveedores-sync.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/KIpPe9qXMa/,'sin el owner de Mega en Parse');
 assert.doesNotMatch(src,/clave:\s*"mega"/);
 assert.match(src,/clave: "impacto",\n    nombre: "Electro Impacto",\n    owner: "P9ovvzhWkx"/,'Electro Impacto intacto');
});
test('la corrida completa consulta sólo a Electro Impacto',async()=>{
 const urls=[];const prior=globalThis.fetch;
 globalThis.fetch=async(url)=>{urls.push(String(url));return new Response(JSON.stringify({results:[],count:0}),{status:200,headers:{'content-type':'application/json'}});};
 try{
  await assert.rejects(()=>sync.ejecutarSincronizacion({SUPABASE_URL:'https://ejemplo.invalid',SUPABASE_SECRET_KEY:'x'}),err=>{assert.match(String(err.message),/Electro Impacto/);assert.doesNotMatch(String(err.message),/Mega/);return true;});
  const parse=urls.filter(u=>u.includes('/parse/classes/'));assert.ok(parse.length>0,'consultó al proveedor');
  assert.ok(parse.every(u=>!decodeURIComponent(u).includes('KIpPe9qXMa')),'nunca consulta a Mega');
  assert.ok(parse.some(u=>decodeURIComponent(u).includes('P9ovvzhWkx')),'sí consulta a Electro Impacto');
 }finally{globalThis.fetch=prior;}
});
test('con sólo Electro Impacto, los productos manuales y los de otros proveedores quedan intactos',()=>{
 const manual={id:1,nombre:'Producto manual',precio:1000,visible:true};
 const otro={id:2,nombre:'Viejo automático de otro proveedor',precio:2000,visible:true,automaticoProveedor:true,proveedorClave:'mega',proveedorId:'abc'};
 const fusion=sync.fusionarCatalogo([manual,otro],[{proveedor:{clave:'impacto',nombre:'Electro Impacto',owner:'P9ovvzhWkx',minimoEsperado:10,categoriasExcluidas:new Set()},disponibles:[],recibidos:0,excluidos:0}],new Date().toISOString());
 const byId=new Map(fusion.catalogo.map(p=>[p.id,p]));
 assert.deepEqual(byId.get(1),manual);assert.deepEqual(byId.get(2),otro);
});
