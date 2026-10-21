import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const html=readFileSync('public/index.html','utf8');
const css=readFileSync('public/admin-v16-visual.css','utf8');
const card=html.slice(html.indexOf('function tiendaCardsHtml('),html.indexOf('// aplica clases de vista y avisos'));
const visCode=html.slice(html.indexOf('var _tiendaVisibilidadEnCurso='),html.indexOf('function tiendaSetVisibilidadManual('));
const costCode=html.slice(html.indexOf('function tiendaAbrirCostoInline('),html.indexOf('function tiendaEditarPrecio('));
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('un gesto en Visibilidad no se conecta con Compartir',()=>{
  assert.match(card,/class="ae-admin-visibility/);
  assert.match(card,/onclick="event\.preventDefault\(\);event\.stopPropagation\(\);tiendaToggleVisibilidadDirecta/);
  assert.doesNotMatch(card,/onchange="event\.stopPropagation\(\);tiendaToggleVisibilidadDirecta/);
  assert.match(card,/onclick="event\.stopPropagation\(\);compartirProducto/);
  assert.match(card,/onclick="event\.stopPropagation\(\);compartirInstagram/);
  assert.match(card,/onclick="event\.preventDefault\(\);event\.stopPropagation\(\);tiendaToggleVisibleProd/);
  assert.match(css,/\.ae-admin-visibility > \* \{\s*pointer-events:none/);
  assert.match(css,/touch-action:manipulation/);
});

test('Visibilidad sólo conmuta una vez durante el guardado y no comparte',async()=>{
  const producto={id:'123',visible:true,esCelu:false};
  let resolver;
  const pendiente=new Promise(r=>{resolver=r;});
  let envios=0,compartidos=0,redibujos=0;
  const ctx={
    Promise,Date,Number,String,console,
    tiendaExigirAdmin:()=>true,vistaPreviaCliente:false,
    NUBE_OK:true,sbCalc:{},tiendaProductos:[producto],
    tiendaCapturarPosicionLista:()=>({}),
    tiendaSetVisibilidadManual:(p,visible)=>{p.visible=visible;},
    tiendaEsAutomatico:()=>true,
    tiendaGuardarLocal:()=>{envios++;return pendiente;},
    tiendaGuardarVisibilidadAdminNube:()=>Promise.resolve({error:null}),
    tiendaGuardarRevisionManualNube:()=>Promise.resolve({error:null}),
    tiendaRenderMantenerPosicion:()=>{redibujos++;},
    mostrarToast:()=>{},
    compartirProducto:()=>{compartidos++;}
  };
  runInNewContext(visCode,ctx);
  ctx.tiendaToggleVisibilidadDirecta('123');
  ctx.tiendaToggleVisibilidadDirecta('123');
  assert.equal(producto.visible,false);
  assert.equal(envios,1,'el segundo toque no puede emitir otro guardado');
  assert.equal(redibujos,1);
  assert.equal(compartidos,0);
  resolver({error:null});
  await tick();
  ctx.tiendaToggleVisibilidadDirecta('123');
  assert.equal(producto.visible,true);
  assert.equal(envios,2);
});

test('el editor de costo es local a la tarjeta y nunca abre el editor completo',()=>{
  assert.match(card,/tiendaAbrirCostoInline\('\+pid\+',this\)/);
  assert.doesNotMatch(card,/tiendaEditarPrecio\('\+pid\+'\);requestAnimationFrame/);
  assert.match(costCode,/caja\.appendChild\(label\)/);
  assert.match(costCode,/caja\.appendChild\(acciones\)/);
  assert.match(costCode,/function tiendaCancelarCostoInline/);
  assert.doesNotMatch(costCode,/modal-cuotas|markupVentaCRM|tiendaRecalcVenta/);
  assert.match(css,/\.ae-admin-cost-inline\.is-editing input\.ae-admin-cost-input/);
  assert.match(css,/\.ae-admin-cost-inline\.is-editing \.ae-admin-cost-actions button/);
});

test('Guardar costo verifica la nube, conserva el precio comercial y bloquea dobles clics',async()=>{
  const producto={id:'manual1',costo:120000,venta:210000,estadoManualActualizado:1};
  let resolver;
  const pendiente=new Promise(r=>{resolver=r;});
  let subidas=0,redibujos=0;
  const avisos=[];
  const ctx={
    Promise,Date,Number,String,console,Number,
    tiendaExigirAdmin:()=>true,vistaPreviaCliente:false,
    buscarProd:()=>producto,tiendaEsAutomatico:()=>false,
    NUBE_OK:true,TIENDA_MANUALES_ID:'catalogo_manuales',
    sbCalc:{from:()=>({select:()=>({eq:()=>({maybeSingle:()=>Promise.resolve({data:{datos:[{id:'manual1',costo:133450}]}})})})})},
    tiendaCapturarPosicionLista:()=>({}),
    tiendaGuardarLocal:()=>{subidas++;return pendiente;},
    tiendaRenderMantenerPosicion:()=>{redibujos++;},
    mostrarToast:mensaje=>avisos.push(mensaje),
    fmt:n=>String(n)
  };
  runInNewContext(costCode,ctx);
  const campo={value:'133.450',focus(){}};
  const guardar={disabled:false,textContent:'Guardar'};
  const cancelar={disabled:false};
  ctx.tiendaGuardarCostoInline('manual1',campo,guardar,cancelar,{});
  ctx.tiendaGuardarCostoInline('manual1',campo,guardar,cancelar,{});
  await tick();
  assert.equal(subidas,1);
  assert.equal(producto.costo,133450);
  assert.equal(producto.venta,210000);
  resolver({error:null});
  await tick();
  assert.equal(redibujos,1);
  assert.ok(avisos.some(x=>x.includes('Costo guardado')));
});

test('el costo inválido no modifica nada y el fallo recupera el valor anterior',async()=>{
  const producto={id:'manual1',costo:120000,venta:210000,estadoManualActualizado:1};
  const avisos=[];
  let envios=0;
  const ctx={
    Promise,Date,Number,String,console:{warn(){}},vistaPreviaCliente:false,
    tiendaExigirAdmin:()=>true,buscarProd:()=>producto,tiendaEsAutomatico:()=>false,
    NUBE_OK:true,sbCalc:{},
    tiendaCapturarPosicionLista:()=>({}),
    tiendaGuardarLocal:()=>{envios++;return Promise.reject(new Error('prueba sin red'));},
    localStorage:{setItem(){}},tiendaProductos:[producto],
    tiendaCacheGrandeGuardar:()=>Promise.resolve(),tiendaVersionIncrementalLocal:()=>1,
    mostrarToast:x=>avisos.push(x)
  };
  runInNewContext(costCode,ctx);
  const campo={value:'-500',focus(){}};
  const guardar={disabled:false,textContent:'Guardar'};
  const cancelar={disabled:false};
  ctx.tiendaGuardarCostoInline('manual1',campo,guardar,cancelar,{});
  assert.equal(envios,0);
  assert.equal(producto.costo,120000);
  campo.value='133450';
  ctx.tiendaGuardarCostoInline('manual1',campo,guardar,cancelar,{});
  await tick();
  assert.equal(envios,1);
  assert.equal(producto.costo,120000);
  assert.equal(producto.estadoManualActualizado,1);
  assert.equal(guardar.disabled,false);
  assert.ok(avisos.some(x=>x.includes('No se confirmó')));
});

test('sin rol administrativo, vista cliente y sincronizados no admiten edición directa',()=>{
  assert.match(costCode,/!tiendaExigirAdmin\(\) \|\| vistaPreviaCliente/);
  assert.match(costCode,/p\.esCelu \|\| tiendaEsAutomatico\(p\)/);
  assert.match(card,/if\(tiendaEsAdmin && !vistaPreviaCliente\)/);
  assert.match(card,/if\(tiendaEsAdmin && !p\.esCelu && !vistaPreviaCliente\)/);
});

test('Javascript del documento es válido, sin cambios de funciones de categorías',()=>{
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1]) && !/\btype\s*=\s*["']module/.test(m[1]))
    .map(m=>m[2]).filter(src=>src.trim().length>0);
  for(const [i,src] of scripts.entries())new Script(src,{filename:'inline-'+i+'.js'});
  assert.match(html,/chipsBox\.onscroll=function\(\)\{ _catScrollRestaurar=chipsBox\.scrollLeft; \}/);
});
