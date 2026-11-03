import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
const styles=readFileSync('public/buscador-predictivo.css','utf8');
const start=html.indexOf('function aeEstadoBuscadoProducto(p){');
const end=html.indexOf('function aeNombreEstadoBusqueda(n){',start);
assert.ok(start>0&&end>start);
const classify=new Function('tiendaTieneSinStock','tiendaEstaVisibleYConStock','tiendaEsPendienteImagenAdmin',
  html.slice(start,end)+'return aeEstadoBuscadoProducto;')(
  p=>p.sinStock===true||p.estadoProveedor==='sin_stock'||p.stock===0,
  p=>p.visible===true&&!p.sinStock&&p.stock!==0,
  p=>p.pendienteFoto===true
);

test('Prioridad en admin: visibles, luego ocultos, finalmente sin stock',()=>{
  assert.equal(classify({nombre:'Licuadora',visible:true,stock:2}),0);
  assert.equal(classify({nombre:'Licuadora',visible:false,stock:2}),1);
  assert.equal(classify({nombre:'Licuadora',visible:true,pendienteFoto:true,stock:2}),1);
  assert.equal(classify({nombre:'Licuadora',visible:true,stock:0}),2);
  assert.equal(classify({nombre:'Licuadora',visible:false,sinStock:true}),2);
  assert.equal(classify({esCelu:true,visible:true,sinStock:false}),0);
  assert.equal(classify({esCelu:true,visible:false,sinStock:false}),1);
  assert.equal(classify({esCelu:true,visible:false,sinStock:true}),2);
  assert.match(html,/if\(_aeBusquedaSeccionActiva\)lista\.sort\(function\(a,b\)\{/);
  assert.match(html,/return \(Number\(a\._aeEstadoBusq\)\|\|0\)-\(Number\(b\._aeEstadoBusq\)\|\|0\)/);
  assert.match(html,/tiendaEsAdmin&&!vistaPreviaCliente/);
});

test('Separadores en grilla y paginación no repiten grupos por lote',()=>{
  const a=html.indexOf('function tiendaCardsBusquedaPorEstado(items,desde){');
  const b=html.indexOf('function tiendaVerMas(){',a);
  assert.ok(a>0&&b>a);
  const originals=[
    {id:'a',_aeEstadoBusq:0},{id:'b',_aeEstadoBusq:0},
    {id:'c',_aeEstadoBusq:1},{id:'d',_aeEstadoBusq:1},
    {id:'e',_aeEstadoBusq:2},{id:'f',_aeEstadoBusq:2}
  ];
  const render=new Function('_tiendaListaFull','_aeBusquedaSeccionActiva','tiendaCardsHtml','aeTituloEstadoBusqueda',
    html.slice(a,b)+'return tiendaCardsBusquedaPorEstado;')(
      originals,true,
      products=>products.map(p=>'<card>'+p.id+'</card>').join(''),
      x=>['Visibles','Ocultos','Sin stock'][x]
    );
  assert.match(render(originals.slice(0,2),0),/Visibles · 2 productos/);
  assert.doesNotMatch(render(originals.slice(1,2),1),/Visibles ·/);
  assert.match(render(originals.slice(2,5),2),/Ocultos · 2 productos[\s\S]*Sin stock · 2 productos/);
  assert.doesNotMatch(render(originals.slice(5),5),/Sin stock ·/);
  assert.match(html,/tiendaCardsBusquedaPorEstado\(_tiendaListaFull\.slice\(desde, hasta\),desde\)/);
  assert.match(html,/tiendaCardsBusquedaPorEstado\(lista\.slice\(0, _tiendaMostrados\),0\)/);
});

test('Clientes, asesores y vista previa de cliente nunca consultan ocultos ni agotados',()=>{
  assert.match(html,/var admin=tiendaEsAdmin&&!vistaPreviaCliente;/);
  assert.match(html,/if\(!admin&&\(!tiendaEstaVisibleYConStock\(p\)\|\|tiendaEsPendienteImagenAdmin\(p\)\)\)return;/);
  assert.match(html,/if\(!admin&&\(c\.ocultoTienda\|\|c\.sinStock\)\)return;/);
  assert.match(html,/if\(!admin&&estado!==0\)return;/);
  assert.match(html,/if\(vistaPreviaCliente\)universo=universo\.filter\(function\(p\)\{/);
  assert.match(html,/p\.esCelu\|\|!tiendaEsPendienteImagenAdmin\(p\)/);
  assert.match(html,/sinStock:c\.sinStock===true/);
});

test('Predictivo permanece mientras se desplaza y sólo se cierra por selección, fuera, Escape o limpiar',()=>{
  assert.doesNotMatch(html,/onblur="setTimeout\(hdrCerrarSugerencias/);
  assert.doesNotMatch(html,/window\.addEventListener\('scroll',hdrCerrarSugerencias/);
  assert.doesNotMatch(html,/_cerrarSugTimer=setTimeout\(hdrCerrarSugerencias/);
  assert.match(html,/window\.addEventListener\('scroll',hdrPosicionarSugerencias/);
  assert.match(html,/if\(box&&box\.contains\(e\.target\)\)return;/);
  assert.match(html,/if\(!wrap\)hdrCerrarSugerencias\(\);/);
  assert.match(html,/if\(event\.key==='Escape'\)/);
  assert.match(html,/if\(event\.key==='ArrowDown'\|\|event\.key==='ArrowUp'\)/);
  assert.match(html,/if\(event\.key==='Enter'\)/);
  assert.match(styles,/overscroll-behavior-y:contain!important/);
  assert.match(styles,/touch-action:pan-y!important/);
  assert.match(styles,/--ae-pred-width/);
  assert.match(styles,/max-height:var\(--ae-pred-max-height/);
});

test('Sugerencias seleccionables con teclado y tacto, grupos diferenciados',()=>{
  assert.match(html,/role="combobox" aria-autocomplete="list"/);
  assert.match(html,/role="listbox" aria-label="Sugerencias de búsqueda"/);
  assert.match(html,/role="option" aria-selected="false" tabindex="-1"/);
  assert.match(html,/h\.setAttribute\('aria-expanded','true'\)/);
  assert.match(html,/h\.setAttribute\('aria-expanded','false'\)/);
  assert.match(html,/h\.setAttribute\('aria-activedescendant',opciones\[_aePredIndice\]\.id\)/);
  assert.match(html,/event\.preventDefault\(\);seleccionado\.click\(\)/);
  assert.match(html,/box\.onclick=function\(e\)/);
  assert.match(html,/hdrElegirSug\(item\.getAttribute\('data-ae-id'\)\)/);
  assert.match(html,/var limites=admin\?\[7,4,3\]:\[9,0,0\]/);
  assert.match(html,/aeTituloEstadoBusqueda\(estado\)\+' · '\+grupo\.length/);
  assert.match(html,/💡 Quizás quisiste decir:/);
});

test('Mantiene motor de búsqueda previo y sintaxis de scripts',()=>{
  assert.match(html,/busqueda-inteligente\.js\?v=20261103-global1/);
  assert.match(html,/buscador-predictivo\.css\?v=20261103-persistente/);
  assert.match(html,/function tiendaGuardarPrecios\(/);
  assert.match(html,/function tiendaGuardarLocal\(/);
  assert.match(html,/function tiendaToggleVisibilidadDirecta\(/);
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1]))
    .map(m=>m[2]).filter(Boolean);
  scripts.forEach((script,i)=>assert.doesNotThrow(()=>new Script(script,{filename:'script-'+i})));
});
