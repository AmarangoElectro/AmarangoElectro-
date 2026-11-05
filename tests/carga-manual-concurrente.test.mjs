import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const codigo=[
  ['function tiendaMarcaTiempoProducto(', '// Fix 2026-08-26: borrar'],
  ['function tiendaFusionarManualesPorVersion(', 'function tiendaGuardarNubeLiviano('],
  ['function tiendaVerificarManualesNube(', 'function tiendaEsPendienteImagenAdmin('],
  ['function tiendaNuevoIdManual(', '// Detección de precio ROBUSTA']
].map(([inicio,fin])=>html.slice(html.indexOf(inicio),html.indexOf(fin,html.indexOf(inicio)))).join('\n');

function nube(filaInicial){
  let fila=structuredClone(filaInicial), conflictos=0, errorSiguiente=null;
  const cliente={
    from(tabla){
      assert.equal(tabla,'tienda_catalogo');
      let payload,modo,version;
      const query={
        eq(campo,valor){
          if(campo==='actualizado')version=valor;
          else assert.equal(valor,'catalogo_manuales');
          return query;
        },
        is(campo,valor){return query.eq(campo,valor);},
        select(columnas){
          if(!modo)return query;
          assert.equal(columnas,'actualizado');
          if(errorSiguiente){
            const error=errorSiguiente;
            errorSiguiente=null;
            return Promise.resolve({error});
          }
          if((modo==='update'&&(!fila||fila.actualizado!==version))||(modo==='insert'&&fila)){
            conflictos++;
            return Promise.resolve({data:[],error:null});
          }
          fila=structuredClone(payload);
          return Promise.resolve({data:[{actualizado:fila.actualizado}],error:null});
        },
        maybeSingle(){return Promise.resolve({data:structuredClone(fila),error:null});},
        update(cambio){payload=cambio;modo='update';return query;},
        upsert(cambio,opciones){
          assert.equal(opciones.ignoreDuplicates,true);
          payload=cambio;modo='insert';return query;
        }
      };
      return query;
    }
  };
  return {cliente,fila:()=>fila,conflictos:()=>conflictos,fallar:()=>{errorSiguiente=new Error('Red interrumpida');}};
}

function dispositivo(servidor,texto,mayorista=''){
  const campos={
    'carga-texto':{value:texto},'carga-dolar':{value:''},
    'carga-mayorista':{value:mayorista},'modal-carga':{style:{display:'block'}}
  };
  const avisos=[];
  const contexto={
    crypto:webcrypto, NUBE_OK:true, sbCalc:servidor.cliente, TIENDA_MANUALES_ID:'catalogo_manuales',
    tiendaProductos:[], window:{_tiendaSincronizacionInicialPromesa:Promise.resolve(false)},
    document:{getElementById:id=>campos[id]}, cargaModo:'costo',
    alert:mensaje=>avisos.push(mensaje), mostrarToast:()=>{},
    tiendaExigirAdmin:()=>true, tiendaEsAutomatico:p=>!!p.automaticoProveedor,
    tiendaTieneSinStock:p=>p.sinStock===true,
    aeNormalizarMayorista:nombre=>String(nombre||'').toLowerCase(),
    markupVentaCRM:costo=>costo*2, tiendaRender:()=>{}, tiendaEnfocarProducto:()=>{},
    tiendaGuardarLocal:productos=>contexto.tiendaSubirManualesNube(productos)
  };
  runInNewContext(codigo,contexto);
  return {contexto,campos,avisos,cargar:()=>contexto.tiendaProcesarCarga()};
}

for(const filaInicial of [null,{actualizado:'2026-11-05T00:00:00.000Z',datos:[{id:1,nombre:'Producto anterior'}]}]){
  test(`dos dispositivos conservan ambos productos cuando ${filaInicial?'ya existe':'todavía no existe'} la fila`,async()=>{
    const servidor=nube(filaInicial);
    const max=dispositivo(servidor,'Ventilador Delhi | 10000');
    const angie=dispositivo(servidor,'Mesa Ratán | 20000');
    await Promise.all([max.cargar(),angie.cargar()]);
    const guardados=servidor.fila().datos;
    assert.equal(servidor.conflictos(),1);
    assert.equal(guardados.length,filaInicial?3:2);
    assert.deepEqual(guardados.filter(p=>p.id!==1).map(p=>p.nombre).sort(),['Mesa Ratán','Ventilador Delhi']);
    assert.equal(new Set(guardados.map(p=>p.id)).size,guardados.length);
    assert(guardados.every(p=>Number.isSafeInteger(p.id)));
    for(const equipo of [max,angie]){
      assert.match(equipo.avisos.at(-1),/1 producto\(s\) nuevo\(s\)/);
      assert.equal(equipo.campos['carga-texto'].value,'');
    }
  });
}

test('una falla conserva el formulario y el reintento no genera otro ID',async()=>{
  const servidor=nube(null);
  const equipo=dispositivo(servidor,'Silla Delhi | 12000');
  servidor.fallar();
  await equipo.cargar();
  const borrador=equipo.contexto.tiendaProductos[0];
  assert.equal(equipo.campos['carga-texto'].value,'Silla Delhi | 12000');
  assert.equal(equipo.campos['modal-carga'].style.display,'block');
  assert.match(equipo.avisos.at(-1),/No se pudo confirmar/);
  await equipo.cargar();
  assert.equal(servidor.fila().datos.length,1);
  assert.equal(servidor.fila().datos[0].id,borrador.id);
});

test('un nombre parecido, un producto eliminado y otro mayorista no se confunden con el nuevo',async()=>{
  const anteriores=[
    {id:1,nombre:'Mesa Ratán',costo:1,venta:2},
    {id:2,nombre:'Mesa Ratán 120 cm',costo:2,venta:4,eliminado:true},
    {id:3,nombre:'Mesa Ratán 120 cm',costo:3,venta:6,mayorista:'Otro'}
  ];
  const servidor=nube({actualizado:null,datos:anteriores});
  const equipo=dispositivo(servidor,'Mesa Ratán 120 cm | 22000','Women');
  await equipo.cargar();
  const guardados=servidor.fila().datos;
  assert.deepEqual(guardados.slice(0,3),anteriores);
  assert.equal(guardados[3].venta,44000);
  assert.equal(guardados[3].mayorista,'Women');
});
