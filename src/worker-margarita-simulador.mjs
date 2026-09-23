import base from "./worker-asesores-coach.mjs";

const SCRIPT=`<script src="/margarita-simulador-admin.js?v=20260823-1" defer></script><script src="/margarita-simulador-key.js?v=20260823-1" defer></script>`;
const COACH=`\n\n[INSTRUCCIÓN INTERNA — SIMULACIÓN DE ASESOR DE VENTAS]\nEstás atendiendo a un ASESOR DE VENTAS dentro del simulador administrativo. Tu función principal es ayudarlo a VENDER mejor. Respondé en español argentino, breve, concreto y accionable.\n- Si pide productos: elegí primero la opción que mejor encaja y como máximo 2 alternativas reales.\n- Si cuenta una objeción o pregunta qué responder: empezá por un MENSAJE LISTO PARA COPIAR Y ENVIAR al cliente.\n- Después, si aporta valor, agregá una línea corta de estrategia o próximo paso.\n- No inventes productos, stock, precios, cuotas, características ni promociones.\n- Nunca expongas costos, proveedor, mayorista ni datos administrativos.\n- No cobres ni envíes links de pago. Los pagos se coordinan con Maxi o Angie.\n- No presiones de forma agresiva. Facilitá el cierre con claridad y alternativas.\n[FIN INSTRUCCIÓN INTERNA]\n`;

function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
function adminOk(request,env){const k=String(env.ADMIN_PANEL_PASSWORD||"").trim();return !!k&&request.headers.get("x-admin-key")===k;}
function clean(v,n=80){return String(v||"").trim().slice(0,n);}

async function simulador(request,env,ctx){
  const u=new URL(request.url);
  if(u.pathname!=="/api/margarita/simulador")return null;
  if(request.method!=="POST")return json({ok:false,error:"Método no permitido"},405);
  if(!String(env.ADMIN_PANEL_PASSWORD||"").trim())return json({ok:false,error:"Falta configurar ADMIN_PANEL_PASSWORD"},503);
  if(!adminOk(request,env))return json({ok:false,error:"Clave de Administración incorrecta"},401);

  let body={};try{body=await request.json();}catch{return json({ok:false,error:"Datos inválidos"},400);}
  const rol=["cliente","asesor","admin"].includes(body.rol)?body.rol:"cliente";
  body.rol=rol;
  body.nombre=clean(body.nombre,80)|| (rol==="asesor"?"Asesor de prueba":rol==="admin"?"Admin de prueba":"Cliente de prueba");
  body.modoSimulador=true;
  body.modoPrueba=true;
  body.saludoEspecialPendiente=false;

  if(rol==="asesor"&&Array.isArray(body.mensajes)&&body.mensajes.length){
    for(let i=body.mensajes.length-1;i>=0;i--){
      const m=body.mensajes[i];
      if(m&&m.rol!=="margarita"){m.texto=String(m.texto||"")+COACH;break;}
    }
  }

  const h=new Headers(request.headers);
  h.set("content-type","application/json");
  h.delete("content-length");
  h.delete("authorization");
  h.delete("x-admin-key");
  const dest=new URL(request.url);dest.pathname="/api/margarita";dest.search="";
  const req=new Request(dest.toString(),{method:"POST",headers:h,body:JSON.stringify(body)});
  return base.fetch(req,env,ctx);
}

function inject(r){
  const t=String(r.headers.get("content-type")||"").toLowerCase();
  if(!t.includes("text/html"))return r;
  return new HTMLRewriter().on("body",{element(el){el.append(SCRIPT,{html:true});}}).transform(r);
}

export default{
  async fetch(request,env,ctx){
    const sim=await simulador(request,env,ctx);if(sim)return sim;
    const r=await base.fetch(request,env,ctx);
    return request.method==="GET"?inject(r):r;
  },
  async scheduled(c,env,ctx){if(base&&typeof base.scheduled==="function")return base.scheduled(c,env,ctx);}
};
