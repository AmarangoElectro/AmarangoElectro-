import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
const source=readFileSync('public/busqueda-inteligente.js','utf8');
function api(){
  const context={};
  context.window=context;
  runInNewContext(source,context);
  return context.AEBusqueda;
}
function rank(busqueda,nombres){
  const busc=api(),plan=busc.preparar(busqueda);
  return {busc,plan,orden:nombres.map(nombre=>({nombre,...busc.puntuar({nombre},plan)})).sort((a,b)=>b.valor-a.valor)};
}
test('Busca el nombre sin importar su posición y da prioridad a coincidencias directas',()=>{
  const r=rank('licuadora',['MIXER PLASTICA 500W','Licuadora Novohome 1.5lts','CALABRIA LICUADORA 400w JARRA','Sandwichera Novohome','Batidora Planetaria']).orden;
  assert.equal(r[0].tipo,'directo');
  assert.equal(r[1].tipo,'directo');
  assert.ok(r[0].valor>r[2].valor);
  assert.ok(r[2].valor>0);
  assert.ok(r[3].valor>0);
  assert.equal(r[4].valor,0);
});
test('Encuentra equivalentes comerciales y plurales sin devolver categorías sin relación',()=>{
  const r=rank('licuadora',['Licuadora inox Delhi','Mixer Liliana','Batidora con bowl','Procesadora Kanji','Sandwichera Kanji']).orden;
  assert.equal(r.filter(x=>x.valor>0).length,4);
  assert.equal(r.find(x=>x.nombre==='Sandwichera Kanji').valor,0);
  assert.ok(rank('notebook',['Notebook HP','HP Notebook N150','Heladera HP']).orden.filter(x=>x.valor>0).length>=2);
});
test('Corrige erratas y ofrece Quizás quisiste decir',()=>{
  for(const q of ['licuadra','liqcuadora']){
    const r=rank(q,['Licuadora portátil','MIXER 500W','Sandwichera']);
    assert.ok(r.orden[0].valor>0);
    assert.equal(r.busc.sugerir(r.plan,r.orden.filter(x=>x.valor>0)),'licuadora');
  }
  const r=rank('samsnug a17',['Samsung Galaxy A17','Samsung Galaxy A16']);
  assert.ok(r.orden[0].valor>0);
  assert.equal(r.busc.sugerir(r.plan,r.orden.filter(x=>x.valor>0)),'samsung a17');
});
test('Los modelos con números son exactos: A17 no devuelve A16',()=>{
  const r=rank('samsung a17',['Samsung A16','Samsung Galaxy A17','Samsung A17 128GB']);
  assert.equal(r.orden.find(x=>x.nombre==='Samsung A16').valor,0);
  assert.ok(r.orden.filter(x=>x.valor>0).length===2);
  assert.equal(rank('a17',['Samsung A16','Samsung A17']).orden.find(x=>x.nombre==='Samsung A16').valor,0);
});
test('Búsqueda global administrativa anula la carpeta pero mantiene filtro de mayorista',()=>{
  assert.match(html,/var busquedaGlobalAdmin=!!\(tiendaEsAdmin&&!vistaPreviaCliente&&String\(document\.getElementById\('tienda-buscar'\)\.value\|\|''\)\.trim\(\)\);/);
  assert.match(html,/if\(busquedaGlobalAdmin\)\{[\s\S]*?universo=tiendaProductos\.filter\([\s\S]*?if\(aeFiltroMayoristaActual\)universo=universo\.filter/);
  assert.match(html,/if\(tiendaEsAdmin && tiendaBandejaAdmin && !busquedaGlobalAdmin\)/);
  assert.match(html,/if\(!tiendaBandejaAdmin && \(c\.ocultoTienda \|\| c\.sinStock\) && !busquedaGlobalAdmin\)return/);
  assert.match(html,/Búsqueda en todo el catálogo/);
});
test('Sugerencias en el header y resumen en la grilla comparten el motor',()=>{
  assert.match(html,/busqueda-inteligente\.js\?v=20261103-global1/);
  assert.match(html,/AEBusqueda\.preparar\(q\)/);
  assert.match(html,/AEBusqueda\.puntuar\(p,plan\)/);
  assert.match(html,/AEBusqueda\.puntuar\(p,planBusq\)/);
  assert.match(html,/AEBusqueda\.sugerir\(planBusq,lista\.slice\(0,12\)\)/);
  assert.match(html,/Quizás quisiste decir:/);
  assert.match(html,/producto'\+\(similares===1\?'':'s'\)\+' similar'/);
  assert.match(html,/function tiendaUsarSugerenciaBuscador\(texto\)/);
});
test('El motor es aislado y no cambia descuentos, cuotas ni productos de Supabase',()=>{
  assert.doesNotThrow(()=>new Script(source));
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1])&&!/\btype\s*=\s*["']module/.test(m[1]))
    .map(m=>m[2]).filter(Boolean);
  scripts.forEach((script,i)=>assert.doesNotThrow(()=>new Script(script,{filename:'inline-'+i})));
  assert.doesNotMatch(source,/fetch\(|localStorage|supabase|sbCalc|\.upsert\(|p\.venta\s*=|p\.costo\s*=/i);
  assert.match(html,/function tiendaGuardarPrecios\(/);
  assert.match(html,/function tiendaGuardarLocal\(/);
  assert.match(html,/function tiendaGuardarVisibilidadAdminNube\(/);
});
