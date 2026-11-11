import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
function fn(name){
  const start=html.indexOf('function '+name+'(');
  assert.ok(start>=0,name);
  for(let end=html.indexOf('}',start);end>=0;end=html.indexOf('}',end+1)){
    const source=html.slice(start,end+1);
    try{new Script('('+source+')');return source;}catch{}
  }
  throw new Error('No se pudo extraer '+name);
}
function context(names,extra={}){
  const values=new Map(),ctx={Promise,Error,console,Array,Object,Number,String,Math,
    localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},
    tiendaConfirmarReparacionCacheV25(){},...extra};
  runInNewContext(names.map(fn).join('\n'),ctx);return ctx;
}

test('manuales externos no provocan recarga completa; una fila faltante sí',()=>{
  const c=context(['tiendaCantidadLocalIncremental'],{
    tiendaProductos:[{id:'auto'},{id:'manual-extra'},{id:'papelera',eliminado:true}],
    _tiendaIdsIncrementalesActivos:['auto']});
  assert.equal(c.tiendaCantidadLocalIncremental(),1);
  c.tiendaProductos=[{id:'manual-extra'}];
  assert.equal(c.tiendaCantidadLocalIncremental(),-1);
  c._tiendaIdsIncrementalesActivos=null;
  assert.equal(c.tiendaCantidadLocalIncremental(),null);
});

test('delta conserva precios/fotos y aplica altas/bajas al inventario del caché',()=>{
  const original={id:'a',costo:100,venta:180,foto:'original.jpg',visible:true};
  const c=context(['tiendaAplicarCambiosIncrementales','tiendaGuardarVersionIncremental'],{
    tiendaProductos:[original,{id:'b',venta:500},{id:'manual',venta:700}],
    _tiendaIdsIncrementalesActivos:['a','b'],TIENDA_INCREMENTAL_VERSION_KEY:'version'});
  assert.equal(c.tiendaAplicarCambiosIncrementales([
    {producto_id:'b',eliminado:true,version:11},
    {producto_id:'c',eliminado:false,version:12,datos:{id:'c',costo:90,venta:150,foto:'c.jpg'}}
  ],10),12);
  assert.deepEqual(JSON.parse(JSON.stringify(c._tiendaIdsIncrementalesActivos)),['a','c']);
  assert.deepEqual(c.tiendaProductos.find(p=>p.id==='a'),original);
  assert.ok(c.tiendaProductos.some(p=>p.id==='manual'));
  assert.ok(!c.tiendaProductos.some(p=>p.id==='b'));
});

test('IndexedDB bloqueada rechaza y cierra una apertura tardía sin bloquear la red',async()=>{
  let timer,closed=0;const req={};
  const c=context(['tiendaCacheGrandeAbrir'],{
    window:{indexedDB:{}},indexedDB:{open:()=>req},
    setTimeout:cb=>(timer=cb,1),clearTimeout(){}});
  const p=c.tiendaCacheGrandeAbrir();const rejected=assert.rejects(p,/a tiempo/);
  timer();await rejected;
  req.result={close(){closed++;}};req.onsuccess();assert.equal(closed,1);
});

test('lectura IndexedDB detenida vence sin aplicar una copia tardía',async()=>{
  let timer,closed=0;const req={};
  const db={close(){closed++;},transaction:()=>({objectStore:()=>({get:()=>req})})};
  const c=context(['tiendaCacheGrandeCargar'],{
    tiendaCacheGrandeAbrir:()=>Promise.resolve(db),
    setTimeout:cb=>(timer=cb,1),clearTimeout(){}});
  const p=c.tiendaCacheGrandeCargar();const rejected=assert.rejects(p,/a tiempo/);
  await Promise.resolve();timer();await rejected;
  req.result={productos:[{id:'viejo'}]};req.onsuccess();assert.equal(closed,1);
});

test('foto rota no repite la misma URL ni sustituye la identidad del producto',()=>{
  const estado={hidden:true,textContent:''};let assignments=0;
  const img={parentNode:{querySelector:()=>estado},getAttribute:()=>'/misma.jpg',
    set src(v){assignments++;}};
  const c=context(['tiendaFotoFallida','tiendaFotoCargada']);
  c.tiendaFotoFallida(img);c.tiendaFotoFallida(img);
  assert.equal(assignments,0);assert.equal(estado.textContent,'Foto no disponible');
  c.tiendaFotoCargada(img);assert.equal(estado.hidden,true);
});

test('fallo de miniatura permite una sola recuperación al original exacto',()=>{
  let src='/mini.jpg',assignments=0;const estado={};
  const img={parentNode:{querySelector:()=>estado},
    getAttribute:k=>k==='src'?src:'/original.jpg',
    set src(v){src=v;assignments++;}};
  const c=context(['tiendaFotoFallida']);c.tiendaFotoFallida(img);c.tiendaFotoFallida(img);
  assert.equal(src,'/original.jpg');assert.equal(assignments,1);
  assert.equal(estado.textContent,'Foto no disponible');
});
