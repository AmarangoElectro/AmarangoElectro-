import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
const worker=readFileSync('src/worker.mjs','utf8');
const fotoInicio=html.indexOf('function fotoOpt(url, ancho){');
const fotoFin=html.indexOf('function guardarFotoBanco(',fotoInicio);
assert.ok(fotoInicio>0&&fotoFin>fotoInicio);

const fn=new Function('URL',html.slice(fotoInicio,fotoFin)+'return fotoOpt;');
const fotoOpt=fn(function ParseURL(url){
  const corte=String(url).indexOf('/',8);
  this.pathname=String(url).slice(corte).split('?')[0].split('#')[0];
});

test('Fotos propias usan optimización de Cloudflare con ancho acotado',()=>{
  const origen='https://proyecto.supabase.co/storage/v1/object/public/tienda-fotos/electro/test.jpg';
  const salida=fotoOpt(origen,400);
  assert.match(salida,/^\/api\/imagen-tienda\?src=/);
  assert.match(salida,/w=400$/);
  assert.ok(salida.includes(encodeURIComponent(origen)));
  assert.match(fotoOpt(origen,99999),/w=1400$/);
  assert.match(fotoOpt(origen,2),/w=80$/);
  assert.match(worker,/url\.pathname === "\/api\/imagen-tienda"/);
  assert.match(worker,/x-amarango-image-cache/);
});
test('Imágenes externas y data URI conservan la URL original',()=>{
  const externa='https://example.com/catalogo/foto.webp';
  const data='data:image/jpeg;base64,AAAA';
  assert.equal(fotoOpt(externa,400),externa);
  assert.equal(fotoOpt(data,400),data);
  assert.equal(fotoOpt('',400),'');
});
test('La portada prioriza máximo cuatro fotos y el resto es lazy',()=>{
  assert.match(html,/function tiendaCardsHtml\(sublista, prioridadInicial\)/);
  assert.match(html,/var fotoPrioritaria=prioridadInicial===true&&_idx<4/);
  assert.match(html,/loading="'\+\(fotoPrioritaria\?'eager':'lazy'\)\+'"/);
  assert.match(html,/fetchpriority="'\+\(fotoPrioritaria\?'high':'low'\)\+'"/);
  assert.match(html,/decoding="async" width="400" height="230"/);
  assert.match(html,/return tiendaCardsHtml\(items,desde===0\)/);
  assert.match(html,/function vaciar\(\)\{if\(bloque\.length\)\{html\+=tiendaCardsHtml\(bloque,primero\);bloque=\[\];primero=false;\}\}/);
  assert.match(html,/tiendaCardsBusquedaPorEstado\(_tiendaListaFull\.slice\(desde, hasta\),desde\)/);
  assert.match(html,/logoFotoCatalogo\?'<img loading="lazy" decoding="async" fetchpriority="low"/);
});
test('Foto original se usa de respaldo y las cuotas no provocan renders innecesarios',()=>{
  assert.match(html,/onerror="this\.onerror=null;this\.src=/);
  assert.match(html,/if\(cambioFormato\)tiendaRender\(\)/);
  assert.match(html,/cambioFormato=localStorage\.getItem\('ae_formato_cuota'\)!==nuevoFormato/);
  assert.match(html,/function tiendaDatosPrecio\(/);
});
test('Clientes y asesores no ven ocultos aunque la sesión de administración continúe abierta',()=>{
  const a=html.indexOf('function aeProductoBuscablePublico(p){');
  const b=html.indexOf('function aeEstadoBuscadoProducto(p){',a);
  assert.ok(a>0&&b>a);
  const visible=new Function('tiendaEsPendienteImagenAdmin','tiendaEstaVisibleYConStock',html.slice(a,b)+'return aeProductoBuscablePublico;')(
    p=>p.pendienteFoto===true,
    p=>true // simula que otro módulo permite al admin visualizar productos ocultos
  );
  assert.equal(visible({visible:true,sinStock:false}),true);
  assert.equal(visible({visible:false,sinStock:false}),false);
  assert.equal(visible({visible:true,sinStock:true}),false);
  assert.equal(visible({visible:true,ocultoManualProveedor:true}),false);
  assert.equal(visible({visible:true,pendienteFoto:true}),false);
  assert.equal(visible({visible:true,estadoProveedor:'sin_stock'}),false);
  assert.equal(visible({visible:true,ocultoPorDuplicado:true}),false);
  assert.equal(visible({visible:true,eliminado:true}),false);
  assert.equal(visible({esCelu:true,visible:false,sinStock:false}),false);
  assert.match(html,/if\(vistaPreviaCliente\)universo=universo\.filter\(aeProductoBuscablePublico\)/);
});
test('Scripts de la tienda mantienen sintaxis sin tocar stock o precios',()=>{
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1])).map(m=>m[2]).filter(Boolean);
  scripts.forEach((code,i)=>assert.doesNotThrow(()=>new Script(code,{filename:'inline-'+i})));
  assert.match(html,/function tiendaSubirNube\(/);
  assert.match(html,/function tiendaGuardarPrecios\(/);
  assert.match(html,/function tiendaCardsHtml\(/);
});
