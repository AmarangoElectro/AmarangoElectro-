import { getChatGPTUser } from "@/app/chatgpt-auth";
import { backendFetch } from "@/lib/server/backend";

export async function storeAction(action:string,payload:unknown={}) {
  const user=await getChatGPTUser();
  if(!user?.id) return {status:401,data:{error:"unauthenticated"}};
  try {
    const response=await backendFetch("/rest/v1/rpc/v16_store_action",{method:"POST",body:JSON.stringify({p_user_id:user.id,p_email:user.email,p_action:action,p_payload:payload})});
    if(!response.ok) return {status:503,data:{error:"backend_unavailable"}};
    const data=await response.json();
    return {status:data.error ? ({forbidden:403,inactive:403,locked:403,limit:409,slug_taken:409,exists:409,not_found:404}[data.error as string]??400):200,data};
  }catch{return {status:503,data:{error:"backend_unavailable"}}}
}
export async function publicStore(slug:string){
  if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(slug))return null;
  try{const response=await backendFetch("/rest/v1/rpc/v16_public_store",{method:"POST",body:JSON.stringify({p_slug:slug})});return response.ok?await response.json():null}catch{return null}
}
