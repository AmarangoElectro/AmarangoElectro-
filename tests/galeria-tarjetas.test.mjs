import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const galeria=readFileSync('public/tienda-galeria.js','utf8');
const html=readFileSync('public/index.html','utf8');

test('El carrusel de tarjetas conserva la sintaxis y se activa para todos los roles',()=>{
  assert.doesNotThrow(()=>new Function(galeria));
  assert.match(html,/tienda-galeria\.js\?v=20261103-carrusel/);
  assert.match(galeria,/function iniciarCarruselTarjetas\(/);
  assert.match(galeria,/getElementById\('tienda-grid'\)/);
  assert.match(galeria,/new MutationObserver\(/);
  assert.match(galeria,/new IntersectionObserver\(/);
  assert.doesNotMatch(galeria.slice(galeria.indexOf('function aeTarjetaPintar'),galeria.indexOf('function aeTarjetasCargarCola')),/tiendaEsAdmin|revUnlocked|vistaPreviaCliente/);
});

test('Contador, desplazamiento táctil y ampliación del elemento elegido',()=>{
  assert.match(galeria,/\(i\+1\)\+' de '\+estado\.lista\.length/);
  assert.match(galeria,/addEventListener\('touchstart'/);
  assert.match(galeria,/addEventListener\('touchend'/);
  assert.match(galeria,/Math\.abs\(dx\)>35/);
  assert.match(galeria,/abrirVisor\(estado\.p,estado\.datos,estado\.indice\)/);
  assert.match(galeria,/estado\.play\.hidden=!esVideo/);
});

test('Los medios son de carga diferida, el video no se reproduce desde la tarjeta',()=>{
  const card=galeria.slice(galeria.indexOf('function aeTarjetaPintar'),galeria.indexOf('function aeTarjetasCargarCola'));
  assert.doesNotMatch(card,/createElement\('video'\)|nodo\('video'\)/);
  assert.match(galeria,/\.in\('clave',llaves\)/);
  assert.match(galeria,/rootMargin:'260px 0px'/);
  assert.match(galeria,/if\(lista\.length<2\)/);
  assert.match(galeria,/refrescarTarjetas\(p,confirmado\)/);
});


test('Botón Foto/video al lado derecho de Visible/Oculto, sólo en Administración',()=>{
  const card=html.slice(html.indexOf('function tiendaCardsHtml('),html.indexOf('// aplica clases de vista y avisos'));
  assert.match(card,/class="ae-admin-media-add"/);
  assert.match(card,/tiendaEsAdmin&&!vistaPreviaCliente[\s\S]*?class="ae-admin-media-add"/);
  assert.match(card,/window\.AEGaleria\.abrir\('\+pid\+'\)/);
  assert.match(card,/aria-label="Agregar foto o video al producto"/);
  assert.match(card,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
  assert.match(card,/Galería|Galería: hasta 3 fotos o video/);
  assert.match(card,/Reemplazar foto/);
  assert.match(card,/aria-label="Ampliar imagen"/);
});


test('Compartir el elemento elegido funciona en tarjetas, visor, detalle y edición, para los tres roles',()=>{
  assert.match(galeria,/function compartirMedio\(p,item,btn\)/);
  assert.match(galeria,/navigator\.share\(\{files:\[file\],title:nombre\}\)/);
  assert.match(galeria,/navigator\.share\(\{title:nombre,text:video\?/);
  assert.match(galeria,/copiarMedio\(url\)/);
  assert.match(galeria,/compartirMedio\(p,lista\[indice\],compartir\)/);
  assert.match(galeria,/compartirMedio\(data\.p,data\.lista\[indice\]\|\|data\.lista\[0\],compartir\)/);
  assert.match(galeria,/function aeTarjetaCompartir\(card,p,lista\)/);
  assert.match(galeria,/aeTarjetaCompartir\(card,p,lista\);\s*if\(estado\)estado\.compartir=compartir;\s*if\(lista\.length<2\)/);
  assert.match(galeria,/class="ae-gal-share-detalle"|,'ae-gal-share-detalle'/);
  assert.match(galeria,/compartirFila=boton\('📤 Compartir'/);
  assert.match(galeria,/compartirPortada=boton\('📤 Compartir'/);
  const shareCard=galeria.slice(galeria.indexOf('function aeTarjetaCompartir'),galeria.indexOf('function aeTarjetaPintar'));
  assert.doesNotMatch(shareCard,/tiendaEsAdmin|revUnlocked|vistaPreviaCliente/);
  assert.match(html,/tienda-galeria\.js\?v=20261103-carrusel-compartir/);
  assert.match(html,/📷 Galería: hasta 3 fotos o video/);
  assert.match(html,/📤 Compartir este producto/);
  assert.match(html,/ae-admin-media-add/);
});


test('Fila de administración 50/50 y galería reposicionada fuera de la imagen',()=>{
  const card=html.slice(html.indexOf('function tiendaCardsHtml('),html.indexOf('// aplica clases de vista y avisos'));
  assert.match(card,/card\+='<div class="ae-admin-visibility-media-row">'/);
  assert.match(card,/card\+='<div class="ae-admin-visibility-media-row">'[\s\S]*?class="ae-admin-visibility [\s\S]*?tiendaToggleVisibilidadDirecta\('\+pid\+'\)[\s\S]*?class="ae-admin-media-add"[\s\S]*?window\.AEGaleria\.abrir\('\+pid\+'\)/);
  assert.match(html,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(html,/\.ae-admin-visibility-media-row>.ae-admin-visibility/);
  assert.match(html,/\.ae-admin-visibility-media-row>.ae-admin-media-add/);
  assert.match(html,/body\.oscuro #tienda-grid\.ae-admin-v16-visual .prod-card .ae-admin-visibility-media-row>.ae-admin-media-add/);
  assert.doesNotMatch(card,/bottom:47px;left:8px;max-width:calc/);
  assert.match(card,/ae-admin-media-add-icon/);
  assert.match(card,/window\.AEGaleria\.abrir\('\+pid\+'\)/);
  assert.match(card,/📷 Galería: hasta 3 fotos o video/);
  assert.match(card,/↗ Ampliar imagen/);
});
