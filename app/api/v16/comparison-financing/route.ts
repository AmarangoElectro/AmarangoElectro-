import { rawCatalog } from "@/lib/catalog";
import { AMARANGO_CURRENT_POLICY } from "@/lib/internal/finance/amarango-policy";
import { quoteInstallmentPlan } from "@/lib/internal/finance/calculator-engine";
import { backendFetch, privateJson, sameOrigin } from "@/lib/server/backend";

/** Read-only comparison estimates. Never issues a quote or confirms a sale. */
export async function POST(request:Request) {
  if(!sameOrigin(request))return privateJson({status:"unauthorized"},403);
  let ids:string[];
  try{const body=await request.json();if(!Array.isArray(body.ids)||body.ids.length>3||body.ids.some((id:unknown)=>typeof id!=="string"))throw new Error();ids=body.ids}catch{return privateJson({status:"invalid"},400)}
  try{
    const mode=await backendFetch("/rest/v1/v16_financing_mode_history?select=active_financing_mode&order=effective_from.desc,financing_mode_id.desc&limit=1");
    if(!mode.ok||(await mode.json())[0]?.active_financing_mode!=="CLASSIC")return privateJson({status:"unavailable",data:{}});
    const products=await rawCatalog.listProducts({visibleOnly:true});
    const data=Object.fromEntries(products.filter(product=>ids.includes(product.id)).map(product=>[product.id,product.price?[2,4,6].map(count=>{
      const plan=quoteInstallmentPlan(product.price!.amount,count,AMARANGO_CURRENT_POLICY);
      return {installments:count,installmentAmount:{amount:plan.installmentAmount,currency:"ARS"},totalAmount:{amount:plan.total,currency:"ARS"},label:"Clásica · orientativa"};
    }):[]]));
    return privateJson({status:"ok",data});
  }catch{return privateJson({status:"unavailable",data:{}})}
}
