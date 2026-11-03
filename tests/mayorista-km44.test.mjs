import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
const logos=readFileSync('public/supplier-logos.js','utf8');

test('Mayorista KM 44 se registra sin reemplazar nombres anteriores',()=>{
  assert.match(html,/var AE_MAYORISTAS_FIJOS=\[\{nombre:'Mayorista KM 44',referencia:'Electro Smart Mayorista'\}\]/);
  const inicio=html.indexOf('var AE_MAYORISTAS_FIJOS=');
  const fin=html.indexOf('function aeNormalizarMayorista',inicio);
  assert.ok(inicio>0&&fin>inicio);
  const ctx={};
  runInNewContext(html.slice(inicio,fin),ctx);
  const usados={Stagliano:true,'Mega Electro':true};
  ctx.aeAgregarMayoristasFijos(usados);
  assert.equal(usados['Mayorista KM 44'],true);
  assert.equal(usados['Mega Electro'],true);
  assert.equal(usados.Stagliano,true);
  assert.equal(Object.keys(usados).length,3);
});

test('Disponible para cargar, editar y asignar mayoristas, aun con cero productos',()=>{
  const occurrences=[...html.matchAll(/aeAgregarMayoristasFijos\(usados\);/g)].length;
  assert.ok(occurrences>=4,'Falta uno de los selectores');
  assert.match(html,/AE_MAYORISTAS_FIJOS\.forEach\(function\(m\)\{[\s\S]*?if\(!mapa\[k\]\)mapa\[k\]=\{nombre:m\.nombre,productos:\[\],referencia:m\.referencia\};/);
  assert.match(html,/boton\.disabled=true;boton\.textContent='Sin productos'/);
  assert.match(html,/subt\.textContent='Electro Smart Mayorista · Sin productos asignados'/);
});

test('El nombre KM 44 utiliza logo ElectroSmart existente, sin sustituir logos',()=>{
  const ctx={};
  runInNewContext(logos,ctx);
  const nuevo=ctx.aeMayoristaLogoIdentity('Mayorista KM 44');
  const original=ctx.aeMayoristaLogoIdentity('Electrosmart Mayorista');
  assert.equal(nuevo.key,'electrosmart');
  assert.equal(nuevo.image,'/assets/suppliers/electrosmart.png');
  assert.equal(nuevo.image,original.image);
  assert.equal(ctx.aeMayoristaLogoIdentity('Electro Smart Mayorista').key,'electrosmart');
});

test('JavaScript original de la tienda sigue válido',()=>{
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1])&&!/\btype\s*=\s*["']module/.test(m[1]))
    .map(m=>m[2]).filter(Boolean);
  assert.ok(scripts.length>0);
  scripts.forEach((s,i)=>new Script(s,{filename:'inline-'+i+'.js'}));
  assert.match(html,/function tiendaGuardarLocal\(/);
  assert.match(html,/function tiendaGuardarPrecios\(/);
});
