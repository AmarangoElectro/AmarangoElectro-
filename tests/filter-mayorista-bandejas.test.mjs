import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync('public/index.html','utf8');
const render=html.indexOf('function tiendaRender(){');
const start=html.indexOf('  var universo=tiendaProductos.filter(',render);
const end=html.indexOf('  // 🌟 traer los CELULARES',start);
assert.ok(render>=0&&start>render&&end>start,'Debe existir el filtro real en tiendaRender');
const filterCode=html.slice(start,end);
const makeList=new Function('tiendaProductos','tiendaEsAdmin','tiendaBandejaAdmin','aeFiltroMayoristaActual',
  'tiendaEstaVisibleYConStock','tiendaEsPendienteImagenAdmin','tiendaEsPendienteRevisionManual',
  'tiendaEstaOcultoAdmin','tiendaEstaSinStockAdmin','aeNormalizarMayorista','aeNombreMayorista',
  filterCode+'return universo;');
const products=[
  {id:'sof-visible',mayorista:'SofJDistribuidora',visible:true},
  {id:'mega-visible',mayorista:'Mega Electro',visible:true},
  {id:'sof-hidden',mayorista:'SofJ',visible:false,hidden:true},
  {id:'mega-hidden',mayorista:'Mega',visible:false,hidden:true},
  {id:'sof-stock',mayorista:'SofJDistribuidora',visible:false,sinStock:true},
  {id:'mega-stock',mayorista:'Mega',visible:false,sinStock:true},
  {id:'sof-review',mayorista:'SofJ',visible:true,review:true},
  {id:'mega-review',mayorista:'Mega',visible:true,review:true},
  {id:'sof-new',mayorista:'SofJ',visible:true,pending:true},
  {id:'mega-new',mayorista:'Mega',visible:true,pending:true},
];
function normalized(value){
 const n=String(value||'').trim().toLocaleLowerCase('es');
 if(n==='mega'||n==='mega electro')return 'mega electro';
 if(n==='sofj'||n==='sofjdistribuidora'||n==='sofj distribuidora')return 'sofjdistribuidora';
 return n;
}
function ids(supplier,folder){
 return makeList(products,true,folder,supplier,p=>p.visible&&!p.sinStock,p=>!!p.pending,
   p=>!!p.review,p=>!!p.hidden,p=>!!p.sinStock,normalized,p=>p.mayorista||p.proveedor||'')
   .map(p=>p.id);
}
test('Al elegir SofJ o Mega se ven solo sus propios productos, incluso ocultos',()=>{
 assert.deepEqual(ids('sofjdistribuidora',''),['sof-visible','sof-hidden','sof-stock','sof-review','sof-new']);
 assert.deepEqual(ids('mega electro',''),['mega-visible','mega-hidden','mega-stock','mega-review','mega-new']);
});
test('La bandeja Ocultos respeta el mayorista sin mostrar los de otros',()=>{
 assert.deepEqual(ids('sofjdistribuidora','ocultos'),['sof-hidden']);
 assert.deepEqual(ids('mega electro','ocultos'),['mega-hidden']);
 assert.deepEqual(ids('','ocultos'),['sof-hidden','mega-hidden']);
});
test('Sin stock, Revisión y Sin fotos nunca saltan el filtro',()=>{
 for(const [folder,label] of [['sinstock','stock'],['revision','review'],['nuevos','new']]){
  assert.deepEqual(ids('sofjdistribuidora',folder),['sof-'+label],folder+' SofJ');
  assert.deepEqual(ids('mega electro',folder),['mega-'+label],folder+' Mega');
 }
});
test('Al elegir mayorista sale de la bandeja previa y mantiene Ver todos',()=>{
 const click=html.match(/ver\.onclick=function\(\)\{aeFiltroMayoristaActual=k;[^\n]*\};/);
 assert.ok(click,'No aparece selección de mayorista');
 assert.match(click[0],/tiendaBandejaAdmin=''/);
 assert.match(click[0],/tiendaModoPortada=false/);
 assert.match(click[0],/tiendaRender\(\)/);
 assert.match(html,/function aeQuitarFiltroMayorista\(\)\{aeFiltroMayoristaActual='';tiendaRender\(\);\}/);
});
test('No toca la lógica de precios o permisos',()=>{
 assert.match(html,/function tiendaDatosPrecio\(/);
 assert.match(html,/function tiendaCardsHtml\(/);
 assert.match(html,/if\(!tiendaEsAdmin\|\|vistaPreviaCliente\)return;/);
});
