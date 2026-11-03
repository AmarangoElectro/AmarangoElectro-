import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext,runInContext} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
const logos=readFileSync('public/supplier-logos.js','utf8');
const js=readFileSync('public/supplier-percentages.js','utf8');
const css=readFileSync('public/supplier-percentages.css','utf8');
function fixture(saved='{}'){
  const calls=[];
  const storage={getItem:()=>saved,setItem:(k,value)=>calls.push({k,value})};
  const sandbox={localStorage:storage,document:{addEventListener:()=>{}}};
  sandbox.window=sandbox;
  const ctx=createContext(sandbox);
  runInContext(logos,ctx);
  runInContext(js,ctx);
  return {ctx,calls};
}
test('La etiqueta del mayorista conserva nombre/logo y es admin solamente',()=>{
  const start=html.indexOf('    if(tiendaEsAdmin && !vistaPreviaCliente && mayoristaUnico){');
  const end=html.indexOf('    if(tiendaEsAdmin && !vistaPreviaCliente && p.esCelu){',start);
  assert.ok(start>0&&end>start);
  const block=html.slice(start,end);
  assert.match(block,/aeMayoristaEtiquetaHtml\(mayoristaUnico\)/);
  assert.match(block,/ae-supplier-percent/);
  assert.match(block,/aria-label="Editar porcentaje/);
  assert.match(block,/escapeHtml\(mayoristaUnico\)/);
  assert.match(block,/tiendaEsAdmin && !vistaPreviaCliente/);
});
test('5% inicial y porcentajes propios por cada mayorista con aliases estables',()=>{
  const a=fixture();
  assert.equal(a.ctx.aeMayoristaPctTexto('Electro Impacto'),'5%');
  assert.equal(a.ctx.aeMayoristaPctTexto('Mega Electro'),'5%');
  const b=fixture(JSON.stringify({'electro-impacto':7.5,'mega-electro':3,'sof-j':0}));
  assert.equal(b.ctx.aeMayoristaPctTexto('Electro Impacto'),'7,5%');
  assert.equal(b.ctx.aeMayoristaPctTexto('ElectroImpacto'),'7,5%');
  assert.equal(b.ctx.aeMayoristaPctTexto('Mega'),'3%');
  assert.equal(b.ctx.aeMayoristaPctTexto('Sofj'),'0%');
});
test('Datos corruptos no crean porcentajes inválidos',()=>{
  const a=fixture(JSON.stringify({'mega-electro':-3,'electro-impacto':120,'sof-j':'no'}));
  assert.equal(a.ctx.aeMayoristaPctTexto('Mega Electro'),'5%');
  assert.equal(a.ctx.aeMayoristaPctTexto('Electro Impacto'),'5%');
  assert.equal(a.ctx.aeMayoristaPctTexto('Sofj'),'5%');
});
test('Código aislado, sin escrituras remotas ni cálculos de precios',()=>{
  assert.doesNotThrow(()=>new Script(js));
  assert.match(js,/root\.tiendaEsAdmin!==true\|\|root\.vistaPreviaCliente===true/);
  assert.match(js,/number>100/);
  assert.match(js,/localStorage\.setItem/);
  assert.doesNotMatch(js,/sbCalc|\.from\(|fetch\(|tiendaGuardarLocal|p\.venta\s*=|p\.costo\s*=/);
  assert.match(html,/supplier-percentages\.js\?v=20261103/);
  assert.match(html,/supplier-percentages\.css\?v=20261103/);
  assert.match(css,/body\.oscuro #tienda-grid/);
  assert.match(css,/body\.oscuro #ae-supplier-pct-dialog/);
});


test('Porcentaje usa el mismo color del mayorista en temas claro y oscuro',()=>{
  const start=html.indexOf('    if(tiendaEsAdmin && !vistaPreviaCliente && mayoristaUnico){');
  const end=html.indexOf('    if(tiendaEsAdmin && !vistaPreviaCliente && p.esCelu){',start);
  const block=html.slice(start,end);
  assert.match(block,/--ae-pct-accent-light:'\+colorMayoristaCard\.txt/);
  assert.match(block,/--ae-pct-accent-dark:'\+\(identidadColorMayorista\?identidadColorMayorista\.dark:colorMayoristaCard\.txt\)/);
  assert.match(css,/color:var\(--ae-pct-accent-light,inherit\)/);
  assert.match(css,/border-color:var\(--ae-pct-accent-light,currentColor\)/);
  assert.match(css,/background:color-mix\(in srgb,var\(--ae-pct-accent-light,currentColor\) 9%,var\(--wh\)\)/);
  assert.match(css,/body\.oscuro[\s\S]*?\.ae-supplier-percent\{\s*color:var\(--ae-pct-accent-dark,/);
  assert.match(html,/supplier-percentages\.css\?v=20261103-mayorista-color/);
  assert.match(js,/root\.aeMayoristaPctTexto=label/);
  assert.match(js,/root\.aeEditarPorcentajeMayorista=edit/);
  const sandbox={};
  runInContext(logos,createContext(sandbox));
  assert.equal(sandbox.aeMayoristaLogoIdentity('Electro Impacto').light,'#15803d');
  assert.equal(sandbox.aeMayoristaLogoIdentity('Electro Impacto').dark,'#4ade80');
});
