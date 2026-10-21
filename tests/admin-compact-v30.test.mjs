import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {imagenProducto} from '../src/ai-product-image.mjs';

const uri='https://amarangoelectro.com.ar/api/crear-imagen-producto';

test('IA sin activar no expone servicio ni inicia generación',async()=>{
  const result=await imagenProducto(new Request(uri,{method:'GET'}),{});
  assert.equal(result.status,200);
  assert.equal(result.headers.get('cache-control'),'no-store');
  const body=await result.json();
  assert.equal(body.enabled,false);
});

test('POST sin autorización explícita devuelve 503 sin acceder al proveedor',async()=>{
  const result=await imagenProducto(new Request(uri,{method:'POST'}),{});
  assert.equal(result.status,503);
  assert.match((await result.json()).error,/desactivado/i);
});

test('la IA rechaza consumo si falta limitador global',async()=>{
  const env={AI_IMAGES_ENABLED:'true',AI_ADMIN_TOKEN:'x'.repeat(40),OPENAI_API_KEY:'fake-for-test'};
  const result=await imagenProducto(new Request(uri,{method:'POST'}),env);
  assert.equal(result.status,503);
  assert.match((await result.json()).error,/control de consumo/i);
});

test('los scripts nuevos no sustituyen las acciones comerciales existentes',async()=>{
  const worker=await readFile(new URL('../src/worker.mjs',import.meta.url),'utf8');
  const legacy=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const ux=await readFile(new URL('../public/admin-compact-v30.js',import.meta.url),'utf8');
  assert.match(worker,/admin-compact-v30\.js/);
  assert.match(worker,/api\/crear-imagen-producto/);
  for(const fn of ['tiendaEditarPrecio','compartirProducto','compartirInstagram','tiendaToggleVisibleProd']){
    assert.match(legacy,new RegExp('function\\s+'+fn+'\\s*\\('));
  }
  assert.match(ux,/window\.tiendaEditarPrecio\(id\)/);
  assert.match(ux,/buttonIcono|botonIcono/);
});
