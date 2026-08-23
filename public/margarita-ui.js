export const MARGARITA_AVATAR = "/margarita-avatar.webp";

const MARGARITA_SIDEBAR_VERSION = "sidebar-2026-08-23-3";
const MARGARITA_UI_DEFAULT = { formato:"angosto", logo:"pequeno" };

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
        background:rgba(0,0,0,.35)!important;
        backdrop-filter:blur(6px)!important;
        -webkit-backdrop-filter:blur(6px)!important;
        opacity:0!important;
        pointer-events:none!important;
        align-items:initial!important;
        justify-content:initial!important;
        transition:opacity .25s ease!important;
      }
      #margarita-overlay.abierto{opacity:1!important;pointer-events:auto!important}
      #margarita-panel{
        position:fixed!important;
        top:0!important;
        right:0!important;
        left:auto!important;
        bottom:auto!important;
        max-width:none!important;
        height:100dvh!important;
        min-height:0!important;
        border-radius:22px 0 0 22px!important;
        background:#ECE5DD!important;
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
        box-shadow:-8px 0 30px -10px rgba(0,0,0,.5)!important;
        transform:translateX(100%)!important;
        transition:transform .30s cubic-bezier(.4,0,.2,1),width .2s ease!important;
        will-change:transform,width!important;
      }
      html[data-margarita-formato="angosto"] #margarita-panel{width:min(350px,82vw)!important;min-width:0!important}
      html[data-margarita-formato="normal"] #margarita-panel{width:min(390px,90vw)!important;min-width:0!important}
      #margarita-overlay.abierto #margarita-panel{transform:translateX(0)!important}
      #margarita-panel .mg-header{flex:0 0 auto!important}
      #margarita-panel .mg-mensajes{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
      #margarita-panel .mg-input{flex:0 0 auto!important;position:relative!important}
      #margarita-fab{z-index:10000!important;transition:width .18s ease,height .18s ease!important;overflow:hidden!important;border-radius:50%!important}
      #margarita-fab img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important}
      html[data-margarita-logo="pequeno"] #margarita-fab{width:54px!important;height:54px!important}
      html[data-margarita-logo="mediano"] #margarita-fab{width:68px!important;height:68px!important}
      .mg-admin-config-btn{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.32);background:rgba(255,255,255,.14);color:#fff;display:none;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;margin-left:4px;flex:0 0 auto}
      .mg-admin-config-btn:active{transform:scale(.94)}
      #mg-admin-modal{position:fixed;inset:0;z-index:10020;background:rgba(2,8,20,.52);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:18px}
      #mg-admin-modal.on{display:flex}
      .mg-admin-card{width:min(380px,94vw);background:#fff;border-radius:20px;padding:18px;box-shadow:0 18px 50px rgba(0,0,0,.34);font-family:inherit}
      .mg-admin-title{font-size:1.02rem;font-weight:900;color:#0B2D6B;margin-bottom:4px}
      .mg-admin-sub{font-size:.72rem;color:#6B7280;margin-bottom:16px;line-height:1.4}
      .mg-admin-label{font-size:.74rem;font-weight:800;color:#1f2937;margin:12px 0 7px}
      .mg-admin-opciones{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .mg-admin-opcion{border:1.5px solid #dbe2ec;background:#fff;border-radius:12px;padding:11px 8px;font-weight:800;color:#334155;cursor:pointer;font-family:inherit}
      .mg-admin-opcion.on{border-color:#0B2D6B;background:#eef5ff;color:#0B2D6B;box-shadow:inset 0 0 0 1px #0B2D6B}
      .mg-admin-cerrar{margin-top:16px;width:100%;border:0;border-radius:12px;background:#0B2D6B;color:#fff;padding:12px;font-weight:900;cursor:pointer;font-family:inherit}
      .mg-admin-ok{font-size:.67rem;color:#059669;font-weight:800;margin-top:10px;min-height:16px;text-align:center}
      @media(max-width:360px){
        html[data-margarita-formato="angosto"] #margarita-panel{width:84vw!important}
        html[data-margarita-formato="normal"] #margarita-panel{width:92vw!important}
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
      formato: cfg && cfg.formato === "normal" ? "normal" : "angosto",
      logo: cfg && cfg.logo === "mediano" ? "mediano" : "pequeno"
    };
  }

  let preferenciasAplicadas = "";
  function aplicarPreferencias(){
    const pref = preferenciasActuales();
    const firma = pref.formato+"|"+pref.logo;
    if(firma === preferenciasAplicadas) return;
    preferenciasAplicadas = firma;
    document.documentElement.dataset.margaritaFormato = pref.formato;
    document.documentElement.dataset.margaritaLogo = pref.logo;
    const modal = document.getElementById("mg-admin-modal");
    if(modal){
      modal.querySelectorAll("[data-mg-formato]").forEach((b)=>b.classList.toggle("on",b.dataset.mgFormato===pref.formato));
      modal.querySelectorAll("[data-mg-logo]").forEach((b)=>b.classList.toggle("on",b.dataset.mgLogo===pref.logo));
    }
  }

  function guardarPreferencia(tipo,valor){
    if(!esAdminActual() || !window.CONFIG) return;
    if(!window.CONFIG.margaritaUI || typeof window.CONFIG.margaritaUI !== "object"){
      window.CONFIG.margaritaUI = {...MARGARITA_UI_DEFAULT};
    }
    window.CONFIG.margaritaUI[tipo] = valor;
    preferenciasAplicadas = "";
    aplicarPreferencias();
    try{
      if(typeof window.guardarConfig === "function") window.guardarConfig();
    }catch(e){}
    const ok = document.querySelector("#mg-admin-modal .mg-admin-ok");
    if(ok){
      ok.textContent = "✓ Guardado para la tienda";
      setTimeout(()=>{ if(ok) ok.textContent=""; },1600);
    }
  }

  function crearModalAdmin(){
    if(document.getElementById("mg-admin-modal")) return;
    const modal = document.createElement("div");
    modal.id = "mg-admin-modal";
    modal.innerHTML = `
      <div class="mg-admin-card" role="dialog" aria-modal="true" aria-label="Configurar Margarita">
        <div class="mg-admin-title">⚙️ Configurar Margarita</div>
        <div class="mg-admin-sub">Elegí cómo querés que se vea en la tienda. Los cambios se guardan en la configuración general.</div>
        <div class="mg-admin-label">Ancho del cajón</div>
        <div class="mg-admin-opciones">
          <button class="mg-admin-opcion" data-mg-formato="angosto">Angosto</button>
          <button class="mg-admin-opcion" data-mg-formato="normal">Normal</button>
        </div>
        <div class="mg-admin-label">Tamaño del logo</div>
        <div class="mg-admin-opciones">
          <button class="mg-admin-opcion" data-mg-logo="pequeno">Logo pequeño</button>
          <button class="mg-admin-opcion" data-mg-logo="mediano">Logo mediano</button>
        </div>
        <div class="mg-admin-ok"></div>
        <button class="mg-admin-cerrar" type="button">Listo</button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click",(ev)=>{ if(ev.target===modal) modal.classList.remove("on"); });
    modal.querySelector(".mg-admin-cerrar").addEventListener("click",()=>modal.classList.remove("on"));
    modal.querySelectorAll("[data-mg-formato]").forEach((b)=>b.addEventListener("click",()=>guardarPreferencia("formato",b.dataset.mgFormato)));
    modal.querySelectorAll("[data-mg-logo]").forEach((b)=>b.addEventListener("click",()=>guardarPreferencia("logo",b.dataset.mgLogo)));
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
      const cerrar = Array.from(header.querySelectorAll("button")).find((b)=>/cerrar/i.test(b.getAttribute("aria-label")||"") || String(b.textContent||"").trim()==="×");
      if(cerrar) header.insertBefore(btn,cerrar); else header.appendChild(btn);
      btn.addEventListener("click",(ev)=>{ ev.preventDefault(); ev.stopPropagation(); abrirConfigAdmin(); });
    }
    if(btn) btn.style.display = admin ? "flex" : "none";
  }

  // Elimina bienvenida duplicada de versiones anteriores.
  let saludoVisto = false;
  Array.from(mensajes.querySelectorAll(".margarita-bot")).forEach((burbuja)=>{
    const txt = String(burbuja.textContent || "").trim();
    if(!txt.startsWith("¡Hola! Soy Margarita")) return;
    if(saludoVisto) burbuja.remove(); else saludoVisto = true;
  });

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
    panel.style.setProperty("top", Math.max(0,Math.round(top))+"px", "important");
    panel.style.setProperty("height", Math.max(220,Math.round(alto))+"px", "important");
    if(document.activeElement === input && Math.abs((window.scrollY||0)-scrollBase) > 1){
      try{ window.scrollTo(0,scrollBase); }catch(e){}
    }
  }

  window.margaritaAbrir = function(){
    clearTimeout(cierreTimer);
    overlay.style.display = "block";
    scrollBase = window.scrollY || 0;
    const yaHaySaludo = Array.from(mensajes.querySelectorAll(".margarita-bot")).some((b)=>String(b.textContent||"").trim().startsWith("¡Hola! Soy Margarita"));
    if(!yaHaySaludo && typeof window.margaritaPintar === "function"){
      window.margaritaPintar("margarita","¡Hola! Soy Margarita 🐝 ¿Qué estás buscando? Te hago unas preguntas cortitas y te ayudo a elegir la mejor opción.");
    }
    requestAnimationFrame(()=>{
      overlay.classList.add("abierto");
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
        panel.style.removeProperty("height");
      }
    },320);
  };

  fab.onclick = function(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    if(abierto()) window.margaritaCerrar(); else window.margaritaAbrir();
    return false;
  };

  overlay.addEventListener("click",(ev)=>{ if(ev.target === overlay) window.margaritaCerrar(); });
  input.addEventListener("focus",()=>{
    scrollBase = window.scrollY || 0;
    setTimeout(()=>{ ajustarViewport(); mensajes.scrollTop = mensajes.scrollHeight; },60);
  });
  input.addEventListener("blur",()=>setTimeout(ajustarViewport,80));
  if(vv){
    vv.addEventListener("resize",()=>requestAnimationFrame(ajustarViewport));
    vv.addEventListener("scroll",()=>requestAnimationFrame(ajustarViewport));
  }
  window.addEventListener("resize",()=>requestAnimationFrame(ajustarViewport));
  window.addEventListener("orientationchange",()=>setTimeout(ajustarViewport,250));

  document.documentElement.dataset.margaritaFormato = MARGARITA_UI_DEFAULT.formato;
  document.documentElement.dataset.margaritaLogo = MARGARITA_UI_DEFAULT.logo;
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
