"use client";
import { useEffect,useRef,useState } from "react";
import type { AdminCardProductInput } from "@/lib/internal/admin/product-card-model";
import { createPhoto,readFlyer } from "@/lib/photo-intelligence/browser-flyer";
import { parseSpecificationLines } from "@/lib/photo-intelligence/flyer-text";
import {factsForProduct} from "@/lib/photo-intelligence/product-facts";
import { Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle } from "@/components/ui/sheet";

type Draft={product:AdminCardProductInput;source:string;image:string;style:"original"|"amarango";features:string;specifications:string;sourceText:string;reviewed:boolean;saved:boolean};
export function ProductPhotoEditor({products,branded,onClose,onSaved}:{products:AdminCardProductInput[];branded:boolean;onClose:()=>void;onSaved:(id:string,image:string,features:string[],specifications:Record<string,string>,supplierImage:string)=>void}) {
  const [drafts,setDrafts]=useState<Draft[]>(()=>products.map(product=>({product,source:product.supplierImageUrl??product.imageUrl??"",image:"",style:branded?"amarango":"original",features:(product.features??[]).join("\n"),specifications:Object.entries(product.specifications??{}).map(([key,value])=>`${key}: ${value}`).join("\n"),sourceText:"",reviewed:false,saved:false})));
  const [index,setIndex]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
  const draft=drafts[index];
  function patch(i:number,next:Partial<Draft>){if(active.current)setDrafts(current=>current.map((row,n)=>n===i?{...row,...next}:row))}

  async function prepare(i:number,source:string,style:"original"|"amarango") {
    setBusy(true);setError("");setMessage("Preparando foto…");
    try {
      const original=await createPhoto(source,drafts[i].product.name,"original");
      const image=style==="original"?original:await createPhoto(source,drafts[i].product.name,"amarango");
      patch(i,{source:original,image,style,features:"",specifications:"",sourceText:"",reviewed:false,saved:false});
      try {
        const raw=await readFlyer(original,text=>{if(active.current)setMessage(text)});
        const facts={...raw,...factsForProduct({name:drafts[i].product.name,features:[],specifications:{}},raw)};
        patch(i,{sourceText:facts.text,features:facts.features.join("\n"),specifications:Object.entries(facts.specifications).map(([key,value])=>`${key}: ${value}`).join("\n")});
        if(active.current)setMessage(facts.features.length?"Texto leído. Revisá las características y especificaciones.":"No encontramos características legibles. Podés escribirlas desde el flyer.");
      }catch{if(active.current)setError("No pudimos leer el texto automáticamente. Revisá la foto y completá los campos antes de guardar.")}
    }catch{if(active.current)setError("No pudimos abrir esta imagen. Elegí una foto de tu dispositivo.")}
    finally{if(active.current)setBusy(false)}
  }
  useEffect(()=>{if(draft?.source)void prepare(0,draft.source,draft.style)},[]);

  async function choose(file:File|undefined){if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>12000000){setError("Elegí una imagen JPG, PNG o WebP de hasta 12 MB.");return}const reader=new FileReader();reader.onload=()=>void prepare(index,String(reader.result),draft.style);reader.readAsDataURL(file)}
  async function save(){setBusy(true);setError("");try{
    const image=await(await fetch(draft.image)).blob();
    if(image.size>2097152)throw new Error("La imagen es demasiado grande. Elegí una foto más pequeña.");
    const features=draft.features.split("\n").map(line=>line.trim()).filter(Boolean),specifications=parseSpecificationLines(draft.specifications);
    const form=new FormData();form.set("image",image,"photo.jpg");form.set("sourceImage",await(await fetch(draft.source)).blob(),"source.jpg");form.set("metadata",JSON.stringify({productId:draft.product.id,features,specifications,sourceText:draft.sourceText,style:draft.style,reviewed:draft.reviewed}));
    const response=await fetch("/api/v16/product-media",{method:"POST",body:form});const body=await response.json();
    if(!response.ok||body.status!=="ok")throw new Error(body.message??"No se guardó la foto. Volvé a intentarlo.");
    onSaved(draft.product.id,body.imageUrl,features,specifications,body.supplierImageUrl);patch(index,{saved:true});setMessage("Foto y características guardadas en V16. La foto original se conserva.");
  }catch(error){setError(error instanceof Error?error.message:"No se guardó el cambio.")}finally{setBusy(false)}}
  function go(next:number){setIndex(next);setMessage("");setError("");if(!drafts[next].image&&drafts[next].source)void prepare(next,drafts[next].source,drafts[next].style)}

  return <Sheet open onOpenChange={open=>{if(!open&&!busy)onClose()}}><SheetContent className="v418a-sheet product-photo-editor">
    <SheetHeader><SheetTitle>{products.length>1?"Fotos del lote":"Cambiar foto"}</SheetTitle><SheetDescription>{draft.product.name} · {index+1} de {drafts.length}</SheetDescription></SheetHeader>
    <div className="photo-editor-body">
      {draft.image&&<img className="photo-editor-preview" src={draft.image} alt={`Vista previa de ${draft.product.name}`}/>}
      <label>1. Elegí la foto de este producto<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event=>void choose(event.target.files?.[0])}/></label>
      <div className="photo-style-actions"><button disabled={busy||!draft.source} aria-pressed={draft.style==="original"} onClick={()=>void prepare(index,draft.source,"original")}>Foto original</button><button disabled={busy||!draft.source} aria-pressed={draft.style==="amarango"} onClick={()=>void prepare(index,draft.source,"amarango")}>Estilo Amarango</button></div>
      <label>2. Características leídas del flyer<textarea rows={5} placeholder="Una característica por línea" disabled={busy} value={draft.features} onChange={event=>patch(index,{features:event.target.value,reviewed:false,saved:false})}/></label>
      <label>Especificaciones<textarea rows={5} placeholder="Potencia: 1800 W" disabled={busy} value={draft.specifications} onChange={event=>patch(index,{specifications:event.target.value,reviewed:false,saved:false})}/><small>Un dato por línea: nombre del dato, dos puntos y valor.</small></label>
      {draft.sourceText&&<details><summary>Ver todo el texto leído</summary><p className="photo-ocr-text">{draft.sourceText}</p></details>}
      <label className="photo-review"><input type="checkbox" disabled={busy} checked={draft.reviewed} onChange={event=>patch(index,{reviewed:event.target.checked})}/> Revisé que la foto y los datos corresponden a este producto.</label>
      {message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
      <button disabled={busy||!draft.image||!draft.reviewed||draft.saved} onClick={()=>void save()}>{busy?"Procesando…":draft.saved?"Guardado":"3. Guardar foto y características"}</button>
      {drafts.length>1&&<nav className="photo-style-actions" aria-label="Productos del lote"><button disabled={busy||index===0} onClick={()=>go(index-1)}>Anterior</button><button disabled={busy||index===drafts.length-1} onClick={()=>go(index+1)}>Siguiente producto</button></nav>}
      <button disabled={busy} onClick={onClose}>Cerrar</button>
    </div>
  </SheetContent></Sheet>;
}
