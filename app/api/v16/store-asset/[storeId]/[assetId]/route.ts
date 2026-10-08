import {backendFetch} from "@/lib/server/backend";
import {storeAction} from "@/lib/subscriptions/server";
export async function GET(_request:Request,{params}:{params:Promise<{storeId:string;assetId:string}>}){
  const {storeId,assetId}=await params;if(!/^[0-9a-f-]{36}$/i.test(storeId)||!/^[0-9a-f-]{36}$/i.test(assetId))return new Response(null,{status:404});
  try{
    const publicAccess=await backendFetch("/rest/v1/rpc/v16_public_store_asset",{method:"POST",body:JSON.stringify({p_store_id:storeId,p_asset_id:assetId})});
    let allowed=publicAccess.ok&&await publicAccess.json()===true;
    if(!allowed){const own=await storeAction("workspace");const s=own.data.store;allowed=own.status===200&&s?.id===storeId&&(s.logo_asset_id===assetId||own.data.products.some((p:{asset_id:string;source_asset_id:string})=>p.asset_id===assetId||p.source_asset_id===assetId))}
    if(!allowed)return new Response(null,{status:404});
    const response=await backendFetch(`/storage/v1/object/v16-store-assets/${storeId}/${assetId}.jpg`,{headers:{Accept:"image/jpeg"}});if(!response.ok)return new Response(null,{status:404});
    return new Response(response.body,{headers:{"Content-Type":"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch{return new Response(null,{status:503})}
}
