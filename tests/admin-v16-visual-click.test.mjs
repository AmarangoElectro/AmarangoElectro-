import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
const css=readFileSync('public/admin-v16-visual.css','utf8');

test('la tienda carga CSS V16 y lo aplica sólo a Administración',()=>{
  assert.match(html,/href="\/admin-v16-visual\.css\?v=1"/);
  assert.match(html,/classList\.toggle\('ae-admin-v16-visual',!!tiendaEsAdmin&&!vistaPreviaCliente\)/);
  assert.match(css,/#tienda-grid\.ae-admin-v16-visual \.prod-card/);
  assert.match(css,/font-family:Inter/);
  assert.match(css,/scroll-snap-type:none !important/);
});

test('deslizar categorías no cambia productos, tocar sí',()=>{
  const start=html.indexOf('  chipsBox.onscroll=function(){ _catScrollRestaurar=chipsBox.scrollLeft; };');
  const end=html.indexOf('  // PRODUCTO DEL DÍA',start);
  assert.ok(start>0&&end>start);
  const section=html.slice(start,end);
  assert.doesNotMatch(section,/tiendaFiltrarCat\(/);
  assert.doesNotMatch(section,/setTimeout/);
  const context={chipsBox:{scrollLeft:0,scrollWidth:900,clientWidth:340,querySelector:()=>null},
    _catScrollRestaurar:null,tiendaCategoriaActiva:''};
  const assign=section.slice(0,section.indexOf('\n  if('));
  runInNewContext(assign,context);
  context.chipsBox.scrollLeft=230;
  context.chipsBox.onscroll();
  assert.equal(context._catScrollRestaurar,230);
  assert.match(html,/onclick="tiendaFiltrarCat\(/);
  assert.doesNotMatch(html,/tiendaFiltrarCat\(nueva,true\)/);
  assert.match(html,/function tiendaFiltrarCat\(c, desdeDesplazamiento\)/);
});

test('tarjetas admin mantienen operaciones e incluyen el costo ya editable',()=>{
  const region=html.slice(html.indexOf('function tiendaCardsHtml('),html.indexOf('// aplica clases de vista y avisos'));
  for (const name of ['tiendaToggleVisibleProd','tiendaEditarPrecio','tiendaEditarFoto',
    'tiendaEliminar','compartirProducto','compartirInstagram','tiendaToggleDestacado',
    'tiendaSetProductoDia','tiendaTogglePocoStock','tiendaSetSinInteres','tiendaSetOferta',
    'tiendaToggleSinStock','tiendaConfirmarPrecioManual','abrirFotoGrande']) {
    assert.ok(region.includes(name+'('),'Perdió acción existente '+name);
  }
  assert.match(region,/if\(tiendaEsAdmin && !vistaPreviaCliente\)\{/);
  assert.match(region,/class="ae-admin-cost-inline"/);
  assert.match(region,/class="ae-admin-quickbar"/);
  assert.match(region,/class="ae-admin-edit-actions"/);
  assert.match(region,/aria-label="Opciones del producto"/);
  assert.match(css,/object-fit:contain !important/);
  assert.doesNotMatch(region,/api\/crear-imagen-producto/);
  assert.doesNotMatch(region,/AI_IMAGES_ENABLED/);
});

test('sin reemplazo de la interfaz completa ni cambios en los datos',()=>{
  assert.match(html,/function tiendaGuardarPrecios\(\)/);
  assert.match(html,/function tiendaRender\(\)/);
  assert.match(html,/function tiendaCardsHtml\(sublista\)/);
  assert.match(html,/function tiendaVerMas\(\)/);
  assert.match(html,/function tiendaFiltrarCat\(/);
  assert.match(html,/id="tienda-grid"/);
});

test('el Javascript original y el de las categorías siguen sintácticamente válidos',()=>{
  // El script central es el mayor script inline final del documento de la tienda.
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1]) && !/\btype\s*=\s*["']module/.test(m[1]))
    .map(m=>m[2])
    .filter(text=>text.trim().length>0);
  assert.ok(scripts.length>=1,'No hay Javascript embebido que verificar');
  for (const [i,src] of scripts.entries()) new Script(src,{filename:'store-inline-'+i+'.js'});
});


test('acciones principales visibles, imagen más pequeña y costo directo sin nuevas herramientas',()=>{
  const region=html.slice(html.indexOf('function tiendaCardsHtml('),html.indexOf('// aplica clases de vista y avisos'));
  assert.match(region,/var botonAmpliarAdmin=''/);
  assert.match(region,/botonAmpliarAdmin=botonAmpliar/);
  assert.match(region,/ae-admin-reference-toolbar/);
  assert.match(region,/aria-label="Ampliar imagen"/);
  assert.match(region,/aria-label="Editar costo"/);
  assert.match(region,/tiendaAbrirCostoInline\(/);
  assert.match(region,/ae-admin-reference-visibility/);
  assert.match(region,/tiendaSetVisibilidadTarjeta/);
  assert.match(region,/class="ae-admin-edit-actions"/);
  assert.match(region,/tiendaEditarPrecio\('\+pid\+'\)/);
  assert.match(region,/tiendaEditarFoto\('\+pid\+'\)/);
  assert.match(region,/event\.stopPropagation\(\);compartirProducto\(/);
  assert.match(region,/event\.stopPropagation\(\);compartirInstagram\(/);
  assert.match(css,/#tienda-grid\.ae-admin-v16-visual \.prod-card \.prod-foto\s*\{\s*height:clamp\(134px,41vw,160px\)/);
  assert.match(css,/object-fit:contain !important/);
  assert.match(css,/\.ae-admin-reference-toolbar\{/);
  assert.doesNotMatch(region,/Crear imagen con IA/);
});
