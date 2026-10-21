/* AmarangoElectro V30: integración no destructiva sobre el catálogo de Administración.
 * Los manejadores originales de la tienda siguen siendo la autoridad.
 */
(function(){
  "use strict";
  if(window.__aeV30AdminCompacto) return;
  window.__aeV30AdminCompacto=true;
  const whatsappIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5l-4.4 1.2 1.2-4.3a8.5 8.5 0 1 1 15.8-4.4Z"/><path d="M8 8.4c-.5.9-.1 2.3 1.7 4.3 1.8 2 3.5 2.4 4.4 1.9l.9-1.3-2.1-1-1 1c-.8-.4-1.5-1.1-2-2l.7-1.1-1.1-2Z"/></svg>';
  const instagramIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.6" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg>';

  function producto(id){
    return typeof window.buscarProd==="function" ? window.buscarProd(id) : null;
  }
  function esAdmin(){
    return window.vistaPreviaCliente!==true
      && typeof window.tiendaEsAdmin!=="undefined" && window.tiendaEsAdmin===true
      && typeof window.tiendaExigirAdmin==="function";
  }
  function fmtCosto(n){
    n=Number(n);
    return Number.isFinite(n) && n>0 ? "$"+Math.round(n).toLocaleString("es-AR") : "A confirmar";
  }
  function focoCosto(id){
    if(!esAdmin() || typeof window.tiendaEditarPrecio!=="function") return;
    // Usa el guardado ya existente: editar costo NO recalcula venta salvo acción explícita.
    window.tiendaEditarPrecio(id);
    requestAnimationFrame(function(){
      const campo=document.getElementById("edit-costo");
      if(campo){campo.focus();campo.select();}
    });
  }
  window.aeV30EditarCosto=focoCosto;

  function botonIcono(original,clase,icono,etiqueta){
    original.classList.add(clase);
    original.setAttribute("title",etiqueta);
    original.setAttribute("aria-label",etiqueta);
    original.innerHTML=icono;
    original.type="button";
    return original;
  }
  function transformar(card){
    if(card.dataset.aeV30Procesado==="1")return;
    const id=card.id.slice(5);
    const p=producto(id);
    if(!p)return;
    // Marcar antes de mover nodos para evitar bucles de observadores.
    card.dataset.aeV30Procesado="1";
    card.classList.add("ae-v30-card");
    const menu=card.querySelector('details[id^="opts-"]');
    if(!menu)return;
    let cost=card.querySelector(".ae-v30-costo");
    if(!cost){
      cost=document.createElement("div");
      cost.className="ae-v30-costo";
      const span=document.createElement("span");
      span.textContent="Costo: ";
      const strong=document.createElement("b");
      strong.textContent=fmtCosto(p.costo);
      span.appendChild(strong);
      const edit=document.createElement("button");
      edit.type="button";edit.title="Editar costo";edit.setAttribute("aria-label","Editar costo");
      edit.textContent="✎";
      edit.addEventListener("click",function(event){event.stopPropagation();focoCosto(id);});
      cost.append(span,edit);
      menu.parentNode.insertBefore(cost,menu);
    }
    const buttons=Array.from(card.querySelectorAll("button[onclick]"));
    const wa=buttons.find(function(el){
      return (el.getAttribute("onclick")||"").includes("compartirProducto(") &&
        !el.closest('details[id^="opts-"]');
    });
    const ig=buttons.find(function(el){
      return (el.getAttribute("onclick")||"").includes("compartirInstagram(") &&
        !el.closest('details[id^="opts-"]');
    });
    const toolbar=document.createElement("div");
    toolbar.className="ae-v30-tools";
    menu.parentNode.insertBefore(toolbar,menu);
    if(wa)toolbar.appendChild(botonIcono(wa,"ae-v30-whatsapp",whatsappIcon,"Compartir por WhatsApp"));
    if(ig)toolbar.appendChild(botonIcono(ig,"ae-v30-instagram",instagramIcon,"Compartir en Instagram"));
    const ai=document.createElement("button");
    ai.className="ae-v30-ia";ai.type="button";
    ai.title="Crear imagen con IA";ai.setAttribute("aria-label","Crear imagen con IA");
    ai.textContent="✦";
    ai.addEventListener("click",function(event){event.stopPropagation();abrirIA(id);});
    toolbar.appendChild(ai);
    const summary=menu.querySelector("summary");
    if(summary){
      summary.removeAttribute("style");
      summary.classList.add("ae-opciones-prof","ae-v30-more");
      summary.textContent="⋯";
      summary.title="Opciones del producto";
      summary.setAttribute("aria-label","Opciones del producto");
      summary.setAttribute("role","button");
      summary.tabIndex=0;
    }
    toolbar.appendChild(menu);
    const acciones=Array.from(card.children).find(function(el){
      return el.tagName==="DIV" && el.querySelector('button[onclick*="tiendaEditarPrecio"]')
        && el.querySelector('button[onclick*="tiendaEditarFoto"]');
    });
    if(acciones)acciones.classList.add("ae-v30-actions-row");
  }
  let observador=null,raf=0;
  function aplicar(){
    const grid=document.getElementById("tienda-grid");
    if(!grid)return;
    if(!esAdmin()){
      grid.classList.remove("ae-v30-admin");
      return;
    }
    grid.classList.add("ae-v30-admin");
    grid.querySelectorAll('.prod-card[id^="card-"]').forEach(transformar);
    if(grid===window.__aeV30GridObservado)return;
    if(observador)observador.disconnect();
    window.__aeV30GridObservado=grid;
    observador=new MutationObserver(programar);
    observador.observe(grid,{childList:true,subtree:true});
  }
  function programar(){
    if(raf)return;
    raf=requestAnimationFrame(function(){raf=0;aplicar();});
  }
  function inicializar(){
    aplicar();
    // Reutilizamos la grilla existente. Al cambiar de sector se renderiza de nuevo.
    const root=document.getElementById("tienda-cont");
    if(root){
      const observer=new MutationObserver(programar);
      observer.observe(root,{childList:true,subtree:false});
    }
    // La variable del rol puede cambiar sin cambio de nodo.
    document.addEventListener("click",function(){setTimeout(programar,0);},true);
    document.addEventListener("visibilitychange",programar);
  }

  let modal,previewURL=null,archivoGenerado=null;
  function cerrarIA(){
    if(modal)modal.hidden=true;
    if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}
    archivoGenerado=null;
  }
  function construirModal(){
    if(modal)return;
    modal=document.createElement("div");
    modal.className="ae-v30-modal";modal.hidden=true;
    const panel=document.createElement("section");panel.className="ae-v30-panel";
    panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");
    const titulo=document.createElement("h2");titulo.textContent="Crear imagen con IA";
    const descripcion=document.createElement("p");descripcion.id="ae-v30-descripcion";
    const foto=document.createElement("img");foto.id="ae-v30-foto";foto.alt="Fotografía original del producto";
    const instruccion=document.createElement("p");
    instruccion.textContent="La foto original no se reemplaza. La imagen generada se revisa antes de descargar o compartir.";
    const subirLabel=document.createElement("label");subirLabel.textContent="Fotografía del producto (opcional si la original carga bien)";
    const subir=document.createElement("input");
    subir.type="file";subir.accept="image/png,image/jpeg,image/webp";subir.id="ae-v30-file";
    const tokenLabel=document.createElement("label");
    tokenLabel.textContent="Código privado de Administración (sólo si el servicio está habilitado)";
    const token=document.createElement("input");
    token.type="password";token.autocomplete="off";token.id="ae-v30-token";
    const mensaje=document.createElement("p");mensaje.id="ae-v30-message";
    mensaje.setAttribute("role","status");
    const resultado=document.createElement("img");resultado.id="ae-v30-output";
    resultado.alt="Vista previa generada";resultado.hidden=true;
    const acciones=document.createElement("div");acciones.className="ae-v30-modal-buttons";
    const generar=document.createElement("button");generar.id="ae-v30-generar";
    generar.textContent="Generar imagen";generar.disabled=true;
    const descargar=document.createElement("button");descargar.className="secondary";
    descargar.textContent="Descargar";descargar.hidden=true;
    const compartir=document.createElement("button");compartir.className="secondary";
    compartir.textContent="Compartir";compartir.hidden=true;
    const cancelar=document.createElement("button");cancelar.className="secondary";
    cancelar.textContent="Cerrar";
    cancelar.addEventListener("click",cerrarIA);
    descargar.addEventListener("click",function(){
      if(!archivoGenerado)return;
      const a=document.createElement("a");
      a.href=previewURL;a.download="AmarangoElectro-publicacion.png";a.click();
    });
    compartir.addEventListener("click",async function(){
      if(!archivoGenerado)return;
      if(!navigator.share||!navigator.canShare||!navigator.canShare({files:[archivoGenerado]})){
        mensaje.textContent="Este navegador no permite compartir archivos. Usá Descargar.";
        return;
      }
      try{await navigator.share({files:[archivoGenerado],title:"AmarangoElectro"});}
      catch(err){if(err.name!=="AbortError")mensaje.textContent="No se pudo compartir la imagen.";}
    });
    generar.addEventListener("click",async function(){
      if(!esAdmin())return;
      const id=modal.dataset.productId;
      const p=producto(id);
      if(!p)return;
      const original=String(p.foto||"");
      let file=subir.files&&subir.files[0];
      if(!file && original){
        try{
          const respuesta=await fetch(original,{mode:"cors"});
          if(respuesta.ok){
            const blob=await respuesta.blob();
            file=new File([blob],"producto-original.png",{type:blob.type||"image/png"});
          }
        }catch{}
      }
      if(!file){mensaje.textContent="Seleccioná una fotografía original para continuar.";return;}
      if(file.size>5*1024*1024){mensaje.textContent="La foto supera 5 MB.";return;}
      const form=new FormData();
      form.append("image",file);
      form.append("nombre",String(p.nombre||"").slice(0,160));
      form.append("detalle",String(p.caracteristicas||"").slice(0,1100));
      generar.disabled=true;
      mensaje.textContent="Preparando una imagen. No cierres esta pantalla.";
      try{
        const response=await fetch("/api/crear-imagen-producto",{
          method:"POST",headers:{"x-ai-admin-token":token.value},body:form
        });
        const data=await response.json();
        if(!response.ok || !data.ok || !data.image_base64)throw new Error(data.error||"No se pudo generar.");
        const chars=atob(data.image_base64);
        const bytes=new Uint8Array(chars.length);
        for(let i=0;i<chars.length;i++)bytes[i]=chars.charCodeAt(i);
        const blob=new Blob([bytes],{type:"image/png"});
        archivoGenerado=new File([blob],"AmarangoElectro-publicacion.png",{type:"image/png"});
        if(previewURL)URL.revokeObjectURL(previewURL);
        previewURL=URL.createObjectURL(blob);
        resultado.src=previewURL;resultado.hidden=false;
        descargar.hidden=false;compartir.hidden=false;
        mensaje.textContent="Imagen lista para revisar; verificá el producto y los textos antes de publicar.";
      }catch(err){mensaje.textContent=String(err.message||err);}
      finally{generar.disabled=false;}
    });
    acciones.append(generar,descargar,compartir,cancelar);
    panel.append(titulo,descripcion,foto,instruccion,subirLabel,subir,tokenLabel,token,mensaje,resultado,acciones);
    modal.appendChild(panel);
    modal.addEventListener("click",function(event){if(event.target===modal)cerrarIA();});
    document.body.appendChild(modal);
  }
  async function abrirIA(id){
    if(!esAdmin())return;
    const p=producto(id);if(!p)return;
    construirModal();
    modal.hidden=false;modal.dataset.productId=id;
    modal.querySelector("#ae-v30-descripcion").textContent=p.nombre||"Producto";
    const photo=modal.querySelector("#ae-v30-foto");
    photo.src=p.foto||"";photo.hidden=!p.foto;
    modal.querySelector("#ae-v30-file").value="";
    modal.querySelector("#ae-v30-token").value="";
    modal.querySelector("#ae-v30-output").hidden=true;
    modal.querySelector("#ae-v30-output").removeAttribute("src");
    modal.querySelectorAll(".ae-v30-modal-buttons .secondary").forEach(function(btn){
      if(btn.textContent!=="Cerrar")btn.hidden=true;
    });
    const generate=modal.querySelector("#ae-v30-generar");
    const message=modal.querySelector("#ae-v30-message");
    generate.disabled=true;
    message.textContent="Comprobando la disponibilidad del generador…";
    try{
      const res=await fetch("/api/crear-imagen-producto",{cache:"no-store"});
      const data=await res.json();
      const enabled=Boolean(data.enabled);
      generate.disabled=!enabled;
      message.textContent=enabled
        ?"Servicio disponible. La generación requiere el código privado y puede tener costo."
        :"La herramienta está preparada pero desactivada. No genera imágenes ni gastos.";
    }catch{
      message.textContent="Generación aún no habilitada. No se realizó ningún cargo.";
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inicializar,{once:true});
  else inicializar();
})();
