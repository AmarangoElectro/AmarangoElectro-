import {getChatGPTUser} from '@/app/chatgpt-auth';
import {backendFetch,privateJson,sameOrigin} from '@/lib/server/backend';
import {resolveSpaceAccess} from '@/lib/internal/auth/server-access';

async function read(request:Request){
 if(!sameOrigin(request))return privateJson({status:'unauthorized'},403);
 const user=await getChatGPTUser();if(!user)return privateJson({status:'unauthenticated'},401);
 const access=await resolveSpaceAccess();if(!access.advisor&&!access.admin&&!access.owner)return privateJson({status:'unauthorized'},403);
 const period=new URL(request.url).searchParams.get('period');if(period&&!/^20\d{2}-(0[1-9]|1[0-2])$/.test(period))return privateJson({status:'invalid'},400);
 try{
  const r=await backendFetch('/rest/v1/rpc/v16_commission_visibility_read',{method:'POST',body:JSON.stringify({p_email:user.email,p_period:period})});
  if(!r.ok)return privateJson({status:'not_connected'},503);
  const data=await r.json();
  if(!access.admin && (data.role!=='asesor'||!data.advisorId||data.operations?.some((row:Record<string,unknown>)=>row.advisorId!==data.advisorId)))return privateJson({status:'not_connected'},503);
  // Even a malformed backend response cannot deliver private fields to an advisor.
  const operations=Array.isArray(data.operations)?data.operations.map((row:Record<string,unknown>)=>{
   const safe=Object.fromEntries(['saleId','advisorId','advisorName','productId','productLabel','finalCashPriceArs','modality','commissionTotalArs','paymentCount','paymentAmounts','commissionCollectedArs','validation','validationReason','saleEquivalent','policyVersion','closedAt'].map(key=>[key,row[key]]));
   return access.admin?{...safe,costArs:row.costArs??null,marginArs:row.marginArs??null}:safe;
  }):[];
  return privateJson({status:'ok',data:{role:access.role,advisorId:data.advisorId,advisorName:data.advisorName,period:data.period,cap:data.cap,revision:data.revision,version:data.version,policyActive:data.policyActive===true,operations,salesCounts:data.salesCounts,updatedAt:data.updatedAt}});
 }catch{return privateJson({status:'not_connected'},503)}
}
export const GET=(request:Request)=>read(request);
export async function POST(request:Request){
 if(!sameOrigin(request))return privateJson({status:'unauthorized'},403);
 const user=await getChatGPTUser();if(!user)return privateJson({status:'unauthenticated'},401);
 const access=await resolveSpaceAccess();if(!access.owner)return privateJson({status:'unauthorized'},403);
 return privateJson({status:'activation_required'},409);
}
