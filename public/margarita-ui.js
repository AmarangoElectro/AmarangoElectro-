export const MARGARITA_AVATAR = "/margarita-avatar.webp";

const MARGARITA_SIDEBAR_VERSION = "sidebar-2026-08-23-1";

function instalarMargaritaSidebar(){
  const overlay = document.getElementById("margarita-overlay");
  const fab = document.getElementById("margarita-fab");
  const mensajes = document.getElementById("margarita-msgs");
  const input = document.getElementById("margarita-input");
  if(!overlay || !fab || !mensajes || !input) return;

  const panel = overlay.firstElementChild;
  if(!panel) return;

  panel.id = "margarita-panel";
  if(panel.children[0]) panel.children[0].classList.add("mg-header");
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
      #margarita-overlay.abierto{
        opacity:1!important;
        pointer-events:auto!important;
      }
      #margarita-panel{
        position:fixed!important;
        top:0!important;
        right:0!important;
        left:auto!important;
        bottom:auto!important;
        width:min(420px,92vw)!important;
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
        transition:transform .30s cubic-bezier(.4,0,.2,1)!important;
        will-change:transform!important;
      }
      #margarita-overlay.abierto #margarita-panel{
        transform:translateX(0)!important;
      }
      #margarita-panel .mg-header{flex:0 0 auto!important}
      #margarita-panel .mg-mensajes{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow-y:auto!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch!important;
      }
      #margarita-panel .mg-input{
        flex:0 0 auto!important;
        position:relative!important;
      }
      #margarita-fab{
        z-index:10000!important;
      }
      @media(max-width:480px){
        #margarita-panel{width:min(420px,92vw)!important}
      }
      @media(min-width:481px){
        #margarita-panel{width:min(420px,38vw)!important;min-width:360px!important}
      }
    `;
    document.head.appendChild(style);
  }

  // Elimina la bienvenida duplicada si una versión anterior la pintó dos veces.
  let saludoVisto = false;
  Array.from(mensajes.querySelectorAll(".margarita-bot")).forEach((burbuja)=>{
    const txt = String(burbuja.textContent || "").trim();
    if(!txt.startsWith("¡Hola! Soy Margarita")) return;
    if(saludoVisto) burbuja.remove();
    else saludoVisto = true;
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

    // Android puede intentar desplazar la página para centrar el input.
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
      ajustarViewport();
      mensajes.scrollTop = mensajes.scrollHeight;
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

  // La misma carita abre y vuelve a guardar el cajón.
  fab.onclick = function(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    if(abierto()) window.margaritaCerrar();
    else window.margaritaAbrir();
    return false;
  };

  // El fondo difuminado cierra; tocar dentro del panel no.
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

  document.documentElement.dataset.margaritaSidebar = MARGARITA_SIDEBAR_VERSION;
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded",instalarMargaritaSidebar,{once:true});
}else{
  instalarMargaritaSidebar();
}
