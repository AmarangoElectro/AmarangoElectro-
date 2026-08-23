export const MARGARITA_AVATAR = "/margarita-avatar.webp";

const MARGARITA_SIDEBAR_VERSION = "sidebar-2026-08-23-4";
const MARGARITA_UI_DEFAULT = { formato:"mitad" };

function instalarMargaritaSidebar(){
  const overlay = document.getElementById("margarita-overlay");
  const fab = document.getElementById("margarita-fab");
  const mensajes = document.getElementById("margarita-msgs");
  const input = document.getElementById("margarita-input");
  if(!overlay || !fab || !mensajes || !input) return;

  const panel = overlay.firstElementChild;
  if(!panel) return;

  panel.id = "margarita-panel";
  const header = panel.children[0] || null;
  if(header) header.classList.add("mg-header");
  mensajes.classList.add("mg-mensajes");
  if(panel.children[2]) panel.children[2].classList.add("mg-input");

  if(!document.getElementById("margarita-sidebar-estilos")){
    const style = document.createElement("style");
    style.id = "margarita-sidebar-estilos";
    style.textContent = `
      #margarita-overlay{
        position:fixed!important;
        inset:0!important;
        z-index:9998!important;
        background:rgba(2,8,20,.42)!important;
        backdrop-filter:blur(7px)!important;
        -webkit-backdrop-filter:blur(7px)!important;
        opacity:0!important;
        pointer-events:none!important;
        align-items:initial!important;
        justify-content:initial!important;
        transition:opacity .24s ease!important;
      }
      #margarita-overlay.abierto{opacity:1!important;pointer-events:auto!important}

      #margarita-panel{
        position:fixed!important;
        top:0!important;
        right:0!important;
        left:auto!important;
        bottom:auto!important;
        min-height:0!important;
        background:#ECE5DD!important;
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
        border:1px solid rgba(255,255,255,.34)!important;
        box-shadow:-18px 0 46px rgba(0,0,0,.28)!important;
        transition:transform .30s cubic-bezier(.4,0,.2,1),width .22s ease,height .22s ease,bottom .22s ease!important;
        will-change:transform,width,height,bottom!important;
      }

      html[data-margarita-formato="mitad"] #margarita-panel{
        width:clamp(210px,58vw,300px)!important;
        height:100dvh!important;
        border-radius:26px 0 0 26px!important;
        transform:translateX(100%)!important;
      }
      html[data-margarita-formato="mitad"] #margarita-overlay.abierto #margarita-panel{
        transform:translateX(0)!important;
      }

      html[data-margarita-formato="globo"] #margarita-overlay{
        background:rgba(2,8,20,.24)!important;
        backdrop-filter:blur(4px)!important;
        -webkit-backdrop-filter:blur(4px)!important;
      }
      html[data-margarita-formato="globo"] #margarita-panel{
        width:min(340px,88vw)!important;
        height:min(66dvh,560px)!important;
        top:auto!important;
        right:12px!important;
        bottom:18px!important;
        border-radius:26px!important;
        box-shadow:0 22px 55px rgba(0,0,0,.34)!important;
        transform:translateY(22px) scale(.985)!important;
      }
      html[data-margarita-formato="globo"] #margarita-overlay.abierto #margarita-panel{
        transform:translateY(0) scale(1)!important;
      }

      #margarita-panel .mg-header{
        flex:0 0 auto!important;
        box-shadow:0 1px 0 rgba(255,255,255,.16)!important;
      }
      #margarita-panel .mg-mensajes{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow-y:auto!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch!important;
        padding-left:10px!important;
        padding-right:10px!important;
      }
      #margarita-panel .mg-input{
        flex:0 0 auto!important;
        position:relative!important;
        box-shadow:0 -8px 24px rgba(38,50,56,.05)!important;
      }

      #margarita-fab{
        z-index:10000!important;
        width:54px!important;
        height:54px!important;
        overflow:hidden!important;
        border-radius:50%!important;
        box-shadow:0 8px 24px rgba(11,45,107,.26)!important;
      }
      #margarita-fab img{
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        border-radius:50%!important;
      }

      .mg-bot-row{
        align-self:flex-start!important;
        display:flex!important;
        align-items:flex-end!important;
        gap:7px!important;
        max-width:96%!important;
        width:auto!important;
      }
      .mg-bot-avatar{
        width:29px!important;
        height:29px!important;
        flex:0 0 29px!important;
        border-radius:50%!important;
        object-fit:cover!important;
        border:2px solid #fff!important;
        box-shadow:0 2px 8px rgba(11,45,107,.18)!important;
        background:#fff!important;
      }
      .mg-bot-row .margarita-bot{
        align-self:auto!important;
        max-width:100%!important;
        border-radius:16px 16px 16px 5px!important;
        box-shadow:0 3px 12px rgba(0,0,0,.08)!important;
      }

      .mg-admin-config-btn{
        width:36px;height:36px;border-radius:10px;
        border:1px solid rgba(255,255,255,.34);
        background:rgba(255,255,255,.14);color:#fff;
        display:none;align-items:center;justify-content:center;
        font-size:1rem;cursor:pointer;margin-left:4px;flex:0 0 auto;
      }
      .mg-admin-config-btn:active{transform:scale(.94)}

      #mg-admin-modal{
        position:fixed;inset:0;z-index:10020;
        background:rgba(2,8,20,.58);
        backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);
        display:none;align-items:center;justify-content:center;padding:18px;
      }
      #mg-admin-modal.on{display:flex}
      .mg-admin-card{
        width:min(390px,94vw);
        background:linear-gradient(180deg,#fff 0%,#f8fbff 100%);
        border:1px solid rgba(11,45,107,.10);
        border-radius:24px;padding:20px;
        box-shadow:0 24px 70px rgba(0,0,0,.34);
        font-family:inherit;
      }
      .mg-admin-title{font-size:1.08rem;font-weight:900;color:#0B2D6B;margin-bottom:5px}
      .mg-admin-sub{font-size:.73rem;color:#64748b;margin-bottom:17px;line-height:1.45}
      .mg-admin-label{font-size:.74rem;font-weight:900;color:#1f2937;margin:12px 0 8px}
      .mg-admin-opciones{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .mg-admin-opcion{
        border:1.5px solid #dbe4ef;background:#fff;border-radius:14px;
        padding:13px 9px;font-weight:900;color:#334155;cursor:pointer;font-family:inherit;
        box-shadow:0 3px 12px rgba(15,23,42,.04);
      }
      .mg-admin-opcion.on{
        border-color:#0B2D6B;background:linear-gradient(180deg,#eef5ff,#fff);
        color:#0B2D6B;box-shadow:inset 0 0 0 1px #0B2D6B,0 5px 16px rgba(11,45,107,.10);
      }
      .mg-admin-cerrar{
        margin-top:17px;width:100%;border:0;border-radius:13px;
        background:linear-gradient(135deg,#0B2D6B,#1e5bc8);
        color:#fff;padding:12px;font-weight:900;cursor:pointer;font-family:inherit;
      }
      .mg-admin-ok{font-size:.67rem;color:#059669;font-weight:800;margin-top:10px;min-height:16px;text-align:center}

      @media(max-width:360px){
        html[data-margarita-formato="mitad"] #margarita-panel{width:62vw!important}
        html[data-margarita-formato="globo"] #margarita-panel{width:90vw!important;right:8px!important}
      }
      @media(min-width:700px){
        html[data-margarita-formato="mitad"] #margarita-panel{width:360px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function esAdminActual(){
    try{
      if(typeof window.esAdmin === "function") return !!window.esAdmin();
    }catch(e){}
    try{
      for(let i=0;i<localStorage.length;i++){
        const k = String(localStorage.key(i)||"");
        if(!/ae_rol/i.test(k)) continue;
        if(String(localStorage.getItem(k)||"").toLowerCase()==="admin") return true;
      }
    }catch(e){}
    return false;
  }

  function preferenciasActuales(){
    const cfg = window.CONFIG && window.CONFIG.margaritaUI ? window.CONFIG.margaritaUI : null;
    return {
      formato: cfg && cfg.formato === "globo" ? "globo" : "mitad"
    };
  }

  let preferenciasAplicadas = "";
  function aplicarPreferencias(){
    const pref = preferenciasActuales();
    if(pref.formato === preferenciasAplicadas) return;
    preferenciasAplicadas = pref.formato;
    document.documentElement.dataset.margaritaFormato = pref.formato;
    const modal = document.getElementById("mg-admin-modal");
    if(modal){
      modal.querySelectorAll("[data-mg-formato]").forEach((b)=>
        b.classList.toggle("on",b.dataset.mgFormato===pref.formato)
      );
    }
  }

  function guardarFormato(valor){
    if(!esAdminActual() || !window.CONFIG) return;
    if(!window.CONFIG.margaritaUI || typeof window.CONFIG.margaritaUI !== "object"){
      window.CONFIG.margaritaUI = {...MARGARITA_UI_DEFAULT};
    }
    window.CONFIG.margaritaUI.formato = valor;
    preferenciasAplicadas = "";
    aplicarPreferencias();
    try{
      if(typeof window.guardarConfig === "function") window.guardarConfig();
    }catch(e){}
    const ok = document.querySelector("#mg-admin-modal .mg-admin-ok");
    if(ok){
      ok.textContent = "✓ Guardado para toda la tienda";
      setTimeout(()=>{ if(ok) ok.textContent=""; },1700);
    }
    setTimeout(ajustarViewport,40);
  }

  function crearModalAdmin(){
    if(document.getElementById("mg-admin-modal")) return;
    const modal = document.createElement("div");
    modal.id = "mg-admin-modal";
    modal.innerHTML = `
      <div class="mg-admin-card" role="dialog" aria-modal="true" aria-label="Configurar Margarita">
        <div class="mg-admin-title">⚙️ Apariencia de Margarita</div>
        <div class="mg-admin-sub">Dos estilos premium. El formato que elijas queda aplicado para toda la tienda.</div>
        <div class="mg-admin-label">Formato</div>
        <div class="mg-admin-opciones">
          <button class="mg-admin-opcion" data-mg-formato="mitad">◧ Panel Mitad</button>
          <button class="mg-admin-opcion" data-mg-formato="globo">💬 Globo Premium</button>
        </div>
        <div class="mg-admin-ok"></div>
        <button class="mg-admin-cerrar" type="button">Listo</button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click",(ev)=>{ if(ev.target===modal) modal.classList.remove("on"); });
    modal.querySelector(".mg-admin-cerrar").addEventListener("click",()=>modal.classList.remove("on"));
    modal.querySelectorAll("[data-mg-formato]").forEach((b)=>
      b.addEventListener("click",()=>guardarFormato(b.dataset.mgFormato))
    );
  }

  function abrirConfigAdmin(){
    if(!esAdminActual()) return;
    crearModalAdmin();
    aplicarPreferencias();
    document.getElementById("mg-admin-modal").classList.add("on");
  }

  function asegurarControlesAdmin(){
    if(!header) return;
    const admin = esAdminActual();
    let btn = header.querySelector(".mg-admin-config-btn");
    if(admin && !btn){
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mg-admin-config-btn";
      btn.title = "Configurar Margarita";
      btn.setAttribute("aria-label","Configurar Margarita");
      btn.textContent = "⚙️";
      const cerrar = Array.from(header.querySelectorAll("button")).find((b)=>
        /cerrar/i.test(b.getAttribute("aria-label")||"") || String(b.textContent||"").trim()==="×"
      );
      if(cerrar) header.insertBefore(btn,cerrar); else header.appendChild(btn);
      btn.addEventListener("click",(ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        abrirConfigAdmin();
      });
    }
    if(btn) btn.style.display = admin ? "flex" : "none";
  }

  function decorarBurbujaBot(burbuja){
    if(!burbuja || !burbuja.classList || !burbuja.classList.contains("margarita-bot")) return;
    if(burbuja.parentElement && burbuja.parentElement.classList.contains("mg-bot-row")) return;
    const fila = document.createElement("div");
    fila.className = "mg-bot-row";
    const avatar = document.createElement("img");
    avatar.className = "mg-bot-avatar";
    avatar.src = MARGARITA_AVATAR;
    avatar.alt = "Margarita";
    burbuja.parentNode.insertBefore(fila,burbuja);
    fila.appendChild(avatar);
    fila.appendChild(burbuja);
  }

  function decorarMensajes(){
    mensajes.querySelectorAll(".margarita-bot").forEach(decorarBurbujaBot);
  }

  const observadorMensajes = new MutationObserver((cambios)=>{
    cambios.forEach((cambio)=>{
      cambio.addedNodes.forEach((nodo)=>{
        if(nodo.nodeType!==1) return;
        if(nodo.classList && nodo.classList.contains("margarita-bot")) decorarBurbujaBot(nodo);
        nodo.querySelectorAll && nodo.querySelectorAll(".margarita-bot").forEach(decorarBurbujaBot);
      });
    });
  });
  observadorMensajes.observe(mensajes,{childList:true,subtree:false});

  let saludoVisto = false;
  Array.from(mensajes.querySelectorAll(".margarita-bot")).forEach((burbuja)=>{
    const txt = String(burbuja.textContent || "").trim();
    if(!txt.startsWith("¡Hola! Soy Margarita")) return;
    if(saludoVisto) burbuja.remove(); else saludoVisto = true;
  });
  decorarMensajes();

  let cierreTimer = null;
  let scrollBase = window.scrollY || 0;
  const vv = window.visualViewport || null;

  function abierto(){
    return overlay.classList.contains("abierto");
  }

  function ajustarViewport(){
    if(!abierto()) return;
    const top = vv ? vv.offsetTop : 0;
    const alto = vv ? vv.height : window.innerHeight;
    const pref = preferenciasActuales();

    if(pref.formato === "globo"){
      const margen = 10;
      const teclado = Math.max(0,window.innerHeight-(top+alto));
      panel.style.setProperty("top","auto","important");
      panel.style.setProperty("bottom",(teclado+margen)+"px","important");
      panel.style.setProperty("height",Math.max(300,Math.min(560,Math.round(alto*.72)))+"px","important");
    }else{
      panel.style.setProperty("top",Math.max(0,Math.round(top))+"px","important");
      panel.style.setProperty("bottom","auto","important");
      panel.style.setProperty("height",Math.max(220,Math.round(alto))+"px","important");
    }

    if(document.activeElement === input && Math.abs((window.scrollY||0)-scrollBase) > 1){
      try{ window.scrollTo(0,scrollBase); }catch(e){}
    }
  }

  window.margaritaAbrir = function(){
    clearTimeout(cierreTimer);
    overlay.style.display = "block";
    scrollBase = window.scrollY || 0;

    const yaHaySaludo = Array.from(mensajes.querySelectorAll(".margarita-bot")).some((b)=>
      String(b.textContent||"").trim().startsWith("¡Hola! Soy Margarita")
    );
    if(!yaHaySaludo && typeof window.margaritaPintar === "function"){
      window.margaritaPintar("margarita","¡Hola! Soy Margarita 🐝 ¿Qué estás buscando? Te hago unas preguntas cortitas y te ayudo a elegir la mejor opción.");
    }

    requestAnimationFrame(()=>{
      overlay.classList.add("abierto");
      decorarMensajes();
      ajustarViewport();
      mensajes.scrollTop = mensajes.scrollHeight;
      asegurarControlesAdmin();
    });
  };

  window.margaritaCerrar = function(){
    overlay.classList.remove("abierto");
    clearTimeout(cierreTimer);
    cierreTimer = setTimeout(()=>{
      if(!abierto()){
        overlay.style.display = "none";
        panel.style.removeProperty("top");
        panel.style.removeProperty("bottom");
        panel.style.removeProperty("height");
      }
    },320);
  };

  fab.onclick = function(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    if(abierto()) window.margaritaCerrar(); else window.margaritaAbrir();
    return false;
  };

  overlay.addEventListener("click",(ev)=>{
    if(ev.target === overlay) window.margaritaCerrar();
  });

  input.addEventListener("focus",()=>{
    scrollBase = window.scrollY || 0;
    setTimeout(()=>{
      ajustarViewport();
      mensajes.scrollTop = mensajes.scrollHeight;
    },60);
  });
  input.addEventListener("blur",()=>setTimeout(ajustarViewport,80));

  if(vv){
    vv.addEventListener("resize",()=>requestAnimationFrame(ajustarViewport));
    vv.addEventListener("scroll",()=>requestAnimationFrame(ajustarViewport));
  }
  window.addEventListener("resize",()=>requestAnimationFrame(ajustarViewport));
  window.addEventListener("orientationchange",()=>setTimeout(ajustarViewport,250));

  document.documentElement.dataset.margaritaFormato = MARGARITA_UI_DEFAULT.formato;
  aplicarPreferencias();
  asegurarControlesAdmin();

  setInterval(()=>{
    aplicarPreferencias();
    asegurarControlesAdmin();
  },1200);

  document.documentElement.dataset.margaritaSidebar = MARGARITA_SIDEBAR_VERSION;
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded",instalarMargaritaSidebar,{once:true});
}else{
  instalarMargaritaSidebar();
}
