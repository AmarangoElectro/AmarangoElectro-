"use client";
import {useState} from "react";
import {Dialog} from "radix-ui";
import {toast} from "sonner";
import {shareProductLink,prepareProductShare,downloadSharePhoto,copyProductShareText,type ShareProductInput} from "@/lib/commerce/share-product";
export function useProductShare(){
 const [pending,setPending]=useState<ShareProductInput|null>(null),[busy,setBusy]=useState(false);
 const [outcome,setOutcome]=useState<"ready"|"shared-text"|"copied">("ready");
 function prepare(p:ShareProductInput){void prepareProductShare(p)}
 async function share(p:ShareProductInput){
  setBusy(true);
  try{
   const result=await shareProductLink(p);
   if(result==="ready"||result==="shared-text"||result==="copied"){setOutcome(result);setPending(p)}
   else setPending(null);
  }catch{toast.error("No pudimos compartir este producto. Volvé a intentarlo.")}
  finally{setBusy(false)}
 }
 async function copy(){
  if(!pending)return;setBusy(true);
  try{await copyProductShareText(pending);toast.success("Texto, cuotas y enlace copiados.")}
  catch{toast.error("No pudimos copiar. Probá Compartir ahora.")}
  finally{setBusy(false)}
 }
 async function download(){
  if(!pending)return;setBusy(true);
  try{await downloadSharePhoto(pending);toast.success("Foto descargada. Ya podés adjuntarla en WhatsApp.")}
  catch{toast.error("No pudimos descargar la foto. Volvé a intentarlo.")}
  finally{setBusy(false)}
 }
 const dialog=<Dialog.Root open={!!pending} onOpenChange={open=>{if(!open)setPending(null)}}><Dialog.Portal><Dialog.Overlay className="amarango-dialog-overlay"/><Dialog.Content className="amarango-reason-dialog"><small>COMPARTIR PRODUCTO</small><Dialog.Title>{outcome==="copied"?"Texto y enlace copiados":outcome==="shared-text"?"Agregá la foto a tu publicación":"Publicación lista para compartir"}</Dialog.Title><Dialog.Description>{outcome==="ready"?"Elegí WhatsApp en el menú del celular. Incluimos las cuotas disponibles, el enlace y la foto cuando el navegador lo permite.":outcome==="shared-text"?"Compartiste el texto y el enlace. Este navegador pide adjuntar la foto por separado: descargala y agregala al mismo chat de WhatsApp.":pending?.imageUrl?"Pegá el texto en WhatsApp. Descargá la foto y adjuntala en el mismo chat.":"Pegá el texto en WhatsApp. Incluye las cuotas disponibles y el enlace al producto."} El envío final lo confirmás vos.</Dialog.Description><p className="product-share-name">{pending?.name}</p><div className="amarango-reason-actions product-share-tools"><button type="button" disabled={busy} onClick={()=>void copy()}>Copiar texto y enlace</button>{pending?.imageUrl&&<button type="button" disabled={busy} onClick={()=>void download()}>Descargar foto</button>}</div><div className="amarango-reason-actions"><Dialog.Close>Volver</Dialog.Close><button type="button" className="primary" disabled={busy} onClick={()=>pending&&void share(pending)}>{busy?"Preparando…":outcome==="ready"?"Compartir ahora":"Volver a compartir"}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
 return {prepare,share,dialog,busy};
}
