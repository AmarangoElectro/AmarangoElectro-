import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync('public/index.html','utf8');
const css=readFileSync('public/v16-typography.css','utf8');
const safe=css.replace(/\/\*[\s\S]*?\*\//g,'');

test('tipografía Inter de V16 disponible en Cliente, Mi Amarango y Administración',()=>{
  assert.match(html,/href="\/v16-typography\.css\?v=1"/);
  assert.match(html,/fonts\.googleapis\.com\/css2\?family=Inter/);
  assert.match(safe,/body,\s*body button,\s*body input,\s*body select,\s*body textarea/);
  assert.match(safe,/font-family:\s*Inter,\s*ui-sans-serif,\s*system-ui/);
  assert.match(safe,/body #tienda-grid \.prod-nombre/);
  assert.match(safe,/body #tienda-grid\.ae-admin-v16-visual \.prod-card \.ae-admin-cost-inline/);
  assert.match(safe,/body \.cat-tile\.on/);
});

test('hoja adicional modifica exclusivamente atributos tipográficos',()=>{
  const allowed=new Set(['font-family','font-weight','font-variant-numeric','letter-spacing','-webkit-font-smoothing','-moz-osx-font-smoothing']);
  for(const block of safe.split('{').slice(1)){
    const declarations=block.split('}')[0];
    for(const match of declarations.matchAll(/(?:^|;)\s*([a-z-]+)\s*:/g)){
      assert.ok(allowed.has(match[1]),'Cambio no tipográfico no autorizado: '+match[1]);
    }
  }
  assert.doesNotMatch(safe,/(?:^|[;\n])\s*(?:display|visibility|opacity|pointer-events|width|height|padding|margin|color|background|border|transform|position|content)\s*:/mi);
  assert.doesNotMatch(safe,/@font-face|@import|url\(/);
});

test('precios, editor y herramientas se mantienen operativos en el HTML original',()=>{
  for(const name of ['tiendaEditarPrecio','tiendaGuardarPrecios','tiendaEditarFoto','tiendaToggleVisibleProd','tiendaToggleVisibilidadDirecta','compartirProducto','compartirInstagram','tiendaFiltrarCat','tiendaVerDetalle']) {
    assert.ok(html.includes(name+'('),'Falta función anterior: '+name);
  }
  assert.match(html,/aria-label="Editar costo"/);
  assert.match(html,/aria-label="Opciones del producto"/);
  assert.doesNotMatch(css,/Crear imagen con IA|AI_IMAGES_ENABLED|OPENAI_API_KEY/);
  assert.match(html,/chipsBox\.onscroll=function\(\)\{ _catScrollRestaurar=chipsBox\.scrollLeft; \}/);
  assert.doesNotMatch(html,/tiendaFiltrarCat\(nueva,true\)/);
});
