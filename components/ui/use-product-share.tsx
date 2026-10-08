"use client";
import {useState} from "react";
import {Dialog} from "radix-ui";
import {toast} from "sonner";
import {shareProductLink,prepareProductShare,downloadSharePhoto,type ShareProductInput} from "@/lib/commerce/share-product";
export function useProductShare(){
 const [pending,setPending]=useState<ShareProductInput|null>(null),[busy,setBusy]=useState(false);
 function prepare(p:ShareProductInput){void prepareProductShare(p)}
 async function share(p:ShareProductInput){
  setBusy(true);
  try{
   const result=await shareProductLink(p);
   if(result==="ready")setPending(p);
   else {setPending(null);if(result==="shared-text"||result==="copied")toast.info(result==="copied"?"Texto, cuotas y enlace copiados. Podés descargar la foto para adjuntarla.":"Texto y enlace compartidos. Este navegador requiere adjuntar la foto por separado.",{action:p.imageUrl?{label:"Descargar foto",onClick:()=>void downloadSharePhoto(p).catch(()=>toast.error("No pudimos descargar la foto."))}:undefined,duration:9000})}
  }catch{toast.error("No pudimos compartir este producto. Volvé a intentarlo.")}
  finally{setBusy(false)}
 }
 const dialog=<Dialog.Root open={!!pending} onOpenChange={open=>{if(!open)setPending(null)}}><Dialog.Portal><Dialog.Overlay className="amarango-dialog-overlay"/><Dialog.Content className="amarango-reason-dialog"><small>COMPARTIR PRODUCTO</small><Dialog.Title>Publicación lista para compartir</Dialog.Title><Dialog.Description>Elegí WhatsApp en el menú del celular. La publicación incluye las cuotas disponibles y el enlace; la foto se adjunta cuando el navegador lo permite. El envío final lo confirmás vos.</Dialog.Description><div className="amarango-reason-actions"><Dialog.Close>Volver</Dialog.Close><button className="primary" disabled={busy} onClick={()=>pending&&void share(pending)}>Compartir ahora</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
 return {prepare,share,dialog,busy};
}
