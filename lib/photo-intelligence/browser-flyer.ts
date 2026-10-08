import { extractFlyerFacts } from "./flyer-text";

export async function readFlyer(image:string,onProgress:(message:string)=>void) {
  const {createWorker,PSM}=await import("tesseract.js");
  const worker=await createWorker("spa",1,{workerPath:"/vendor/ocr/worker.min.js",corePath:"/vendor/ocr/core",langPath:"/vendor/ocr/spa/4.0.0_best_int",logger:message=>{if(message.status==="recognizing text")onProgress(`Leyendo flyer… ${Math.round(message.progress*100)}%`)}});
  try { await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT}); const {data}=await worker.recognize(image); return {text:data.text,...extractFlyerFacts(data.text)}; }
  finally { await worker.terminate(); }
}

async function loadImage(src:string){const image=new Image();image.crossOrigin="anonymous";image.src=src;await image.decode();return image}
export async function createPhoto(src:string,name:string,style:"original"|"amarango",brand?:{name:string;primary:string;accent:string;logo?:string}) {
  const image=await loadImage(src);
  const scale=Math.min(1,1600/Math.max(image.width,image.height));
  const width=Math.round(image.width*scale),height=Math.round(image.height*scale);
  const canvas=document.createElement("canvas");
  canvas.width=style==="amarango"?Math.max(width,800):width;
  const header=style==="amarango"?125:0,footer=style==="amarango"?95:0;
  canvas.height=height+header+footer;
  const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(image,(canvas.width-width)/2,header,width,height);
  if(style==="amarango"){
    ctx.fillStyle=brand?.primary??"#071a39";ctx.fillRect(0,0,canvas.width,header);ctx.fillRect(0,canvas.height-footer,canvas.width,footer);
    const logoSrc=brand?brand.logo:"/brand/amarango-logo-official.png";
    if(logoSrc){const logo=await loadImage(logoSrc);const logoScale=Math.min(95/logo.width,95/logo.height);ctx.drawImage(logo,canvas.width-115,15,logo.width*logoScale,logo.height*logoScale)}
    ctx.fillStyle=brand?.accent??"#ff7920";ctx.fillRect(0,header-7,canvas.width,7);
    ctx.font="bold 27px Arial";ctx.fillText(brand?.name??"AMARANGOELECTRO",22,40,canvas.width-150);
    const rgb=(brand?.primary??"#071a39").slice(1).match(/.{2}/g)!.map(v=>{const n=parseInt(v,16)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});
    const textColor=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?"#081426":"#fff";
    ctx.fillStyle=textColor;ctx.font="bold 22px Arial";
    const words=name.split(" ");let line="",y=76;
    for(const word of words){if(ctx.measureText(`${line} ${word}`).width>canvas.width-160&&line){ctx.fillText(line,22,y);line=word;y+=26;if(y>105)break}else line=`${line} ${word}`.trim()}
    if(y<=105)ctx.fillText(line,22,y);
    ctx.font="bold 24px Arial";ctx.fillText("Consultá opciones de pago",22,canvas.height-53);
    ctx.font="20px Arial";ctx.fillText(brand?"Precio y disponibilidad sujetos a confirmación":"Envío gratis según la zona",22,canvas.height-22,canvas.width-44);
  }
  return canvas.toDataURL("image/jpeg",.88);
}
