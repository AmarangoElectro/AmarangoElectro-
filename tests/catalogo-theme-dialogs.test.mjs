import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

test('Carga catálogo tiene ambos temas sin alterar sus formularios',()=>{
  assert.match(html,/#modal-carga>div\{background:#fff8f1!important/);
  assert.match(html,/body\.oscuro #modal-carga>div\{background:#17110e!important/);
  assert.match(html,/body\.oscuro #modal-carga \.carga-modo-btn\.on/);
  assert.match(html,/id="carga-texto"/);
  assert.match(html,/id="carga-categoria"/);
  assert.match(html,/onclick="tiendaProcesarCarga\(\)"/);
});
test('El selector Amarango funciona en claro y oscuro y conserva onchange nativo',()=>{
  assert.match(html,/modal\.id='ae-brand-select-modal'/);
  assert.match(html,/body\.oscuro #ae-brand-select-modal \.ae-selector-panel/);
  assert.match(html,/sel\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
  assert.match(html,/sel\.value=op\.value/);
  assert.match(html,/aria-modal="true"/);
  assert.match(html,/if\(e\.key==='Escape'/);
  assert.match(html,/exceptos=\{'cajon-orden':1,'tienda-orden':1\}/);
});
test('No cambia el motor comercial ni fuerza conversion de confirmaciones sincrónicas',()=>{
  assert.match(html,/function promoMadreDatos\(/);
  assert.match(html,/function tiendaAbrirCostoInline\(/);
  assert.match(html,/function tiendaGuardarCostoInline\(/);
  assert.doesNotMatch(html,/window\.confirm\s*=|window\.prompt\s*=/);
});
test('La capa de selectores conserva sintaxis JavaScript válida',()=>{
  const m=html.match(/<script id="ae-selectores-marca-20261102">([\s\S]*?)<\/script>/);
  assert.ok(m);
  assert.doesNotThrow(()=>new Function(m[1]));
});
