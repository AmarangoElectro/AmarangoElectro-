// Generador de publicaciones: apagado por defecto y sin cargo hasta configuración explícita.
// Requiere AI_IMAGES_ENABLED=true, OPENAI_API_KEY, AI_ADMIN_TOKEN (secrets)
// y un binding Cloudflare Rate Limiting llamado AI_IMAGE_LIMITER.
const json = (obj,status=200) => new Response(JSON.stringify(obj),{status,headers:{
  "content-type":"application/json; charset=utf-8","cache-control":"no-store",
  "x-content-type-options":"nosniff"
}});

async function tokenIgual(a,b) {
  if (!a || !b || b.length<32) return false;
  const encoder = new TextEncoder();
  const [x,y] = await Promise.all([
    crypto.subtle.digest("SHA-256",encoder.encode(a)),
    crypto.subtle.digest("SHA-256",encoder.encode(b))
  ]);
  const u = new Uint8Array(x),v = new Uint8Array(y);
  let diff=0;
  for(let i=0;i<u.length;i++) diff|=u[i]^v[i];
  return diff===0;
}

export async function imagenProducto(request,env){
  const enabled=String(env.AI_IMAGES_ENABLED||"")==="true"
    && Boolean(env.OPENAI_API_KEY && env.AI_ADMIN_TOKEN);
  if(request.method==="GET") return json({ok:true,enabled:false,configured:enabled,
    message:"La generación se habilita únicamente con autorización administrativa y control de consumo."});
  if(request.method!=="POST") return json({ok:false,error:"Método no permitido"},405);
  if(!enabled) return json({ok:false,error:"Generador desactivado. No se generaron imágenes ni cargos."},503);
  // Si no está disponible el límite global, cerramos antes de consumir la API.
  if(!env.AI_IMAGE_LIMITER || typeof env.AI_IMAGE_LIMITER.limit!=="function")
    return json({ok:false,error:"Falta configurar el control de consumo del generador."},503);
  const origin=request.headers.get("origin")||"";
  if(origin!==new URL(request.url).origin)
    return json({ok:false,error:"Origen no autorizado"},403);
  if(!(request.headers.get("content-type")||"").includes("multipart/form-data"))
    return json({ok:false,error:"Formato no permitido"},415);
  const token=request.headers.get("x-ai-admin-token")||"";
  if(!(await tokenIgual(token,String(env.AI_ADMIN_TOKEN))))
    return json({ok:false,error:"Acceso no autorizado"},403);
  const ip=request.headers.get("cf-connecting-ip")||"unknown";
  const limit=await env.AI_IMAGE_LIMITER.limit({key:ip});
  if(!limit || limit.success!==true)
    return json({ok:false,error:"Límite de generaciones alcanzado"},429);

  let form;
  try{form=await request.formData();}catch{return json({ok:false,error:"Formulario inválido"},400);}
  const image=form.get("image");
  if(!image || typeof image.arrayBuffer!=="function" || !image.size || image.size>5*1024*1024)
    return json({ok:false,error:"Adjuntá una fotografía de hasta 5 MB"},400);
  const type=String(image.type||"").toLowerCase();
  if(!["image/jpeg","image/png","image/webp"].includes(type))
    return json({ok:false,error:"Formato de imagen no admitido"},415);
  const nombre=String(form.get("nombre")||"").trim().slice(0,160);
  const detalle=String(form.get("detalle")||"").trim().slice(0,1100);
  if(!nombre) return json({ok:false,error:"Falta identificar el producto"},400);
  const payload=new FormData();
  payload.append("model",String(env.AI_IMAGE_MODEL||"gpt-image-1"));
  payload.append("quality","medium");
  payload.append("size","1024x1536");
  payload.append("image",image,"producto-original.jpg");
  payload.append("prompt",
    "Crear una pieza publicitaria vertical y premium de AmarangoElectro basada en la foto provista. "+
    "Conservar producto, marca, modelo, forma, color y detalles físicos sin inventar características. "+
    "No copiar logos incorrectos ni generar un logo AmarangoElectro nuevo: reservar un pequeño espacio "+
    "libre en la esquina superior derecha para insertar el logo oficial después. "+
    "Texto publicitario discreto y sólo basado en la información verificada, sin inventar precios ni cuotas. "+
    "Estética elegante, azul profundo y acentos naranjas, tipografía sans serif profesional. "+
    "Producto: "+nombre+". Datos autorizados: "+detalle);
  let upstream;
  try {
    upstream=await fetch("https://api.openai.com/v1/images/edits",{
      method:"POST",
      headers:{Authorization:"Bearer "+env.OPENAI_API_KEY},
      body:payload,
      signal:AbortSignal.timeout(110000)
    });
  }catch{return json({ok:false,error:"No se pudo contactar al generador"},502);}
  let result;
  try{result=await upstream.json();}catch{return json({ok:false,error:"Respuesta inválida del generador"},502);}
  if(!upstream.ok) return json({ok:false,error:"El proveedor rechazó la generación",provider_status:upstream.status},502);
  const base64=result && result.data && result.data[0] && result.data[0].b64_json;
  if(!base64) return json({ok:false,error:"La generación no devolvió una imagen"},502);
  return json({ok:true,image_base64:base64,mime_type:"image/png",note:"Revisar producto y datos antes de compartir."});
}
