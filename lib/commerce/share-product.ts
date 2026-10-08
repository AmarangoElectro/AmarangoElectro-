import { addReferralToUrl } from "@/lib/growth/referral-growth-engine";
export interface ShareProductInput {
 name:string;url:string;cashPriceArs?:number|null;
 installments?:readonly {installments:number;amountArs:number|null;totalArs?:number|null;lastAmountArs?:number|null}[];
 imageUrl?:string|null;referralCode?:string|null;productId?:string|null;brandName?:string;
}
export type ShareProductResult="shared"|"shared-text"|"copied"|"cancelled"|"ready";
export interface ShareCapabilities {
 share?:(data:ShareData)=>Promise<void>;canShare?:(data:ShareData)=>boolean;
 clipboard?:{writeText:(text:string)=>Promise<void>};
 userActivation?:{isActive:boolean};
}
const money=(value:number)=>`$${value.toLocaleString("es-AR",{maximumFractionDigits:2})}`;
const inactive=(capabilities:ShareCapabilities)=>capabilities.userActivation?.isActive===false;
const validAmount=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value)&&value>0;
export function buildShareProductText(product:ShareProductInput){
 const lines=[product.name];
 for(const plan of product.installments??[]){
  if(![2,3,4,6,9,12].includes(plan.installments)||!validAmount(plan.amountArs))continue;
  const last=plan.lastAmountArs??(validAmount(plan.totalArs)?Math.round((plan.totalArs-plan.amountArs*(plan.installments-1))*100)/100:null);
  const detail=validAmount(last)&&Math.abs(last-plan.amountArs)>=.01?`${plan.installments} cuotas: ${plan.installments-1} cuota${plan.installments>2?"s":""} de ${money(plan.amountArs)} + última de ${money(last)}`:`${plan.installments} cuotas de ${money(plan.amountArs)}`;
  lines.push(detail+(validAmount(plan.totalArs)?` · Total ${money(plan.totalArs)}`:""));
 }
 if(validAmount(product.cashPriceArs))lines.push(`Contado ${money(product.cashPriceArs)}`);
 if(product.productId&&!product.brandName&&!product.installments?.some(p=>validAmount(p.amountArs)))lines.push("Cuotas: consultá las opciones disponibles");
 lines.push(product.brandName??"AmarangoElectro");return lines.join("\n");
}
const photos=new Map<string,Promise<File|null>>(),readyPhotos=new Map<string,File>();
const financing=new Map<string,Promise<ShareProductInput["installments"]>>();
export function prepareSharePhoto(product:ShareProductInput):Promise<File|null>{
 const src=product.imageUrl;if(!src)return Promise.resolve(null);
 const cached=photos.get(src);if(cached)return cached;
 const pending=(async()=>{
  try{
   const response=await fetch(src,{signal:AbortSignal.timeout(12000)});if(!response.ok)return null;
   const blob=await response.blob();if(!/^image\/(jpeg|png|webp)$/.test(blob.type)||blob.size>8388608||!blob.size)return null;
   const extension=blob.type==="image/jpeg"?"jpg":blob.type.split("/")[1];
   const file=new File([blob],`producto-${(product.productId??product.name).replace(/[^a-z0-9-]/gi,"-").slice(0,70)}.${extension}`,{type:blob.type});
   readyPhotos.set(src,file);return file;
  }catch{return null}
 })();photos.set(src,pending);
 if(photos.size>40){const first=photos.keys().next().value!;photos.delete(first);readyPhotos.delete(first)}
 pending.then(file=>{if(!file)photos.delete(src)});return pending;
}
async function prepareFinancing(product:ShareProductInput){
 if(product.installments?.some(p=>validAmount(p.amountArs))||!product.productId||product.brandName)return product.installments;
 const key=`${product.productId}:${product.cashPriceArs??""}`;
 if(!financing.has(key))financing.set(key,(async()=>{
  try{
   const response=await fetch("/api/v16/comparison-financing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:[product.productId]}),signal:AbortSignal.timeout(12000)});
   if(!response.ok)return [];
   const body=await response.json();return body.status==="ok"&&Array.isArray(body.data?.[product.productId!])?body.data[product.productId!].filter((p:{installments:number;installmentAmount?:{amount:number}})=>[2,4,6].includes(p.installments)&&validAmount(p.installmentAmount?.amount)).map((p:{installments:number;installmentAmount:{amount:number}})=>({installments:p.installments,amountArs:p.installmentAmount.amount,totalArs:(p as {totalAmount?:{amount:number}}).totalAmount?.amount})):[];
  }catch{return []}
 })());
 return financing.get(key)!;
}
export async function prepareProductShare(product:ShareProductInput){await Promise.all([prepareSharePhoto(product),prepareFinancing(product)])}
export function shareProductUrl(product:ShareProductInput){return product.referralCode?addReferralToUrl(product.url,product.referralCode,product.productId):product.url}
export async function shareProductLink(product:ShareProductInput,capabilities:ShareCapabilities=navigator):Promise<ShareProductResult>{
 // Requests made here are read-only; financing is supplied by the current server policy.
 const plans=await prepareFinancing(product);
 const text=buildShareProductText({...product,installments:plans})+(plans?.some(p=>validAmount(p.amountArs))?"\nCuotas orientativas; confirmá la cotización.":"");const url=shareProductUrl(product);
 const file=product.imageUrl?readyPhotos.get(product.imageUrl)??await prepareSharePhoto(product):null;
 const canAttach=!!file&&!!capabilities.canShare?.({files:[file]});
 const data:ShareData=canAttach?{title:product.name,text:`${text}\n${url}`,files:[file!]}:{title:product.name,text,url};
 if(capabilities.share){
  if(inactive(capabilities))return "ready";
  try{await capabilities.share(data);return product.imageUrl&&!canAttach?"shared-text":"shared"}
  catch(error){if(error&&typeof error==="object"&&"name"in error){if(error.name==="AbortError")return "cancelled";if(error.name==="NotAllowedError"&&inactive(capabilities))return "ready"}}
 }
 if(!capabilities.clipboard?.writeText)throw new Error("Share unavailable");
 await capabilities.clipboard.writeText(`${text}\n${url}`);return "copied";
}
export async function downloadSharePhoto(product:ShareProductInput){
 const file=await prepareSharePhoto(product);if(!file)throw new Error("Photo unavailable");
 const url=URL.createObjectURL(file),anchor=document.createElement("a");anchor.href=url;anchor.download=file.name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
