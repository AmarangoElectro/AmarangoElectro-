/* AmarangoElectro · USD manual que persiste por producto.
 * No modifica las tarifas generales, stock, cuotas ni otros proveedores.
 * El cambio automático se confirma mediante RPC autenticada antes de mostrarlo.
 */
(function(){
  'use strict';
  window.tiendaConvertirUSD=function(id){
    if(!window.tiendaEsAdmin||window.vistaPreviaCliente)return;
    var p=window.buscarProd(id);
    if(!p)return;
    var antes=Number(p.cotizacionDolarManual)||Number(p.cotizacionDolar)||1590;
    var usd=window.tiendaPrecioOriginalUSD(p,antes);
    if(!(usd>0)){window.mostrarToast('⚠️ El precio USD del proveedor no está disponible');return;}
    var respuesta=window.prompt('💵 DÓLAR POR PRODUCTO\n\n'+p.nombre+'\nPrecio del proveedor: '+usd+' USD\n\nNueva cotización:',antes);
    if(respuesta===null)return;
    var tasa=Number(String(respuesta).trim().replace(/\./g,'').replace(',','.'));
    if(!Number.isFinite(tasa)||tasa<100||tasa>10000){window.alert('Ingresá una cotización válida.');return;}
    tasa=Math.round(tasa*100)/100;
    var costo=Math.round(usd*tasa),venta=window.markupVentaCRM(costo);
    if(!window.confirm('Confirmar cotización de este producto: $'+tasa.toLocaleString('es-AR')+
      '\nCosto: '+window.fmt(costo)+'\nVenta: '+window.fmt(venta)+
      '\n\nSe guarda en Supabase antes de actualizar la tarjeta.'))return;

    if(window.tiendaEsAutomatico(p)){
      var clave=String(p.proveedorClave||''),prodId=String(p.proveedorId||'');
      if(!clave||!prodId||p.monedaProveedor!=='USD'){
        window.mostrarToast('⚠️ No se identificó este producto USD del proveedor');return;
      }
      if(!window.NUBE_OK||!window.sbFotos||!window.sbFotos.auth){
        window.mostrarToast('⚠️ Conectá la sesión segura de Administración');return;
      }
      window.sbFotos.auth.getSession().then(function(res){
        if(!res||!res.data||!res.data.session)throw Error('sin_sesion_segura');
        return window.sbFotos.rpc('ae_tienda_cotizacion_manual_guardar',{
          p_proveedor_clave:clave,p_proveedor_id:prodId,p_tasa:tasa
        });
      }).then(function(res){
        if(res.error)throw res.error;
        var result=res.data,confirmado=result&&result.producto;
        if(!result||result.ok!==true||!confirmado||
          Number(confirmado.cotizacionDolarManual)!==tasa||
          Number(confirmado.costo)!==costo||Number(confirmado.venta)!==venta){
          throw Error('Sin confirmación del precio final en Supabase');
        }
        var current=window.tiendaProductos.find(function(x){
          return x&&String(x.proveedorClave)===clave&&String(x.proveedorId)===prodId;
        });
        if(current)Object.assign(current,confirmado);
        try{localStorage.setItem('ae_tienda_catalogo',JSON.stringify(window.tiendaProductos));}catch(e){}
        window.tiendaRenderMantenerPosicion(window.tiendaCapturarPosicionLista(null));
        window.mostrarToast('✅ Cotización MANUAL guardada: $'+tasa.toLocaleString('es-AR'));
      }).catch(function(err){
        console.warn('Cotización USD: guardado remoto falló',err);
        window.mostrarToast('⚠️ No se guardó el dólar. El precio no se modificó.');
        if(err&&err.message==='sin_sesion_segura'&&window.tiendaAuthFotosAbrir)
          window.tiendaAuthFotosAbrir();
      });
      return;
    }

    // Productos que no son automáticos: guardado manual existente, verificado.
    if(!window.NUBE_OK||!window.sbCalc){
      window.mostrarToast('⚠️ Sin nube. No se cambió el precio.');return;
    }
    var copia=Object.assign({},p);
    Object.assign(p,{precioProveedorOriginal:usd,monedaProveedor:'USD',
      cotizacionDolar:tasa,cotizacionDolarManual:tasa,costo:costo,venta:venta,
      usdConvertido:true,estadoManualActualizado:Date.now()});
    Promise.resolve(window.tiendaGuardarLocal()).then(function(res){
      if(res&&res.error)throw res.error;
      return window.sbCalc.from('tienda_catalogo').select('datos')
        .eq('id',window.TIENDA_MANUALES_ID).maybeSingle();
    }).then(function(res){
      if(res&&res.error)throw res.error;
      var remote=res&&res.data&&res.data.datos;
      var confirmed=Array.isArray(remote)&&remote.find(function(x){return x&&String(x.id)===String(id);});
      if(!confirmed||Number(confirmed.cotizacionDolarManual)!==tasa||
        Number(confirmed.costo)!==costo||Number(confirmed.venta)!==venta)
        throw Error('No confirmado en la nube');
      Object.assign(p,confirmed);
      window.tiendaRenderMantenerPosicion(window.tiendaCapturarPosicionLista(null));
      window.mostrarToast('✅ Dólar guardado: $'+tasa.toLocaleString('es-AR'));
    }).catch(function(err){
      Object.keys(p).forEach(function(k){delete p[k];});Object.assign(p,copia);
      try{localStorage.setItem('ae_tienda_catalogo',JSON.stringify(window.tiendaProductos));}catch(e){}
      console.warn('Dólar manual: guardado falló',err);
      window.mostrarToast('⚠️ El cambio no fue confirmado y se revirtió.');
    });
  };
})();