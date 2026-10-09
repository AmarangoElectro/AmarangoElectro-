import { rawCatalog } from "@/lib/catalog";
import { AMARANGO_CURRENT_POLICY } from "@/lib/internal/finance/amarango-policy";
import { quoteInstallmentPlan } from "@/lib/internal/finance/calculator-engine";
import { backendFetch, privateJson, sameOrigin } from "@/lib/server/backend";
import { getChatGPTUser } from "@/app/chatgpt-auth";

/** Read-only comparison estimates. Never issues a quote or confirms a sale. */
export async function POST(request:Request) {
  if(!sameOrigin(request))return privateJson({status:"unauthorized"},403);
  let ids:string[];
  try{const body=await request.json();if(!Array.isArray(body.ids)||body.ids.length>100||body.ids.some((id:unknown)=>typeof id!=="string"||!id.trim()||id.length>160))throw new Error();ids=[...new Set(body.ids as string[])]}catch{return privateJson({status:"invalid"},400)}
  const user=await getChatGPTUser();
  if(!user)return privateJson({status:"unauthenticated",data:{}},401);
  try{
    // The table and direct RPC are intentionally private. Use the existing identity-aware read bridge.
    const mode=await backendFetch("/rest/v1/rpc/v16_chatgpt_operational_bridge",{method:"POST",body:JSON.stringify({p_email:user.email,p_rpc:"v16_get_active_financing_mode",p_args:{},p_aal:"aal1"})});
    if(!mode.ok||(await mode.json())[0]?.active_financing_mode!=="CLASSIC")return privateJson({status:"unavailable",data:{}});
    const products=await rawCatalog.listProducts({visibleOnly:true});
    const data=Object.fromEntries(products.filter(product=>ids.includes(product.id)).map(product=>[product.id,product.price&&Number.isFinite(product.price.amount)&&product.price.amount>0?[2,4,6].map(count=>{
      const plan=quoteInstallmentPlan(product.price!.amount,count,AMARANGO_CURRENT_POLICY);
      return {installments:count,installmentAmount:{amount:plan.installmentAmount,currency:"ARS"},totalAmount:{amount:plan.total,currency:"ARS"},label:"Clásica · orientativa"};
    }):[]]));
    return privateJson({status:"ok",data});
  }catch{return privateJson({status:"unavailable",data:{}})}
}
