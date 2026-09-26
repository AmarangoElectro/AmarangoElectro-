import { getChatGPTUser } from "@/app/chatgpt-auth";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://zctaukyrhsmpjkcddcqq.supabase.co";

const ACTIONS: ReadonlySet<string> = new Set([
  "resolve_access",
  "current_customer_snapshot",
  "reward_policies_list",
  "save_reward_policy",
  "acquisition_funnel",
  "referrals_list",
  "advisor_levels_list",
  "save_advisor_level",
  "advisor_states_list",
  "current_advisor_state",
  "request_advisor_application",
  "advisor_applications_list",
  "review_advisor_application",
] as const);

function response(status:number, body:Record<string,unknown>) {
  return Response.json(body,{
    status,
    headers:{
      "Cache-Control":"no-store, max-age=0",
      "X-Content-Type-Options":"nosniff",
    },
  });
}

function sameOrigin(request:Request) {
  const origin=request.headers.get("origin");
  if(origin && origin!==new URL(request.url).origin) return false;
  const fetchSite=request.headers.get("sec-fetch-site");
  return fetchSite!=="cross-site";
}

export async function POST(request:Request) {
  if(!sameOrigin(request)) return response(403,{status:"unauthorized"});
  if(!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return response(415,{status:"error",message:"application/json required"});
  }

  const user=await getChatGPTUser();
  if(!user) return response(401,{status:"unauthorized"});

  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!secret) return response(503,{status:"not_connected"});

  let payload:{action?:string;args?:Record<string,unknown>};
  try {
    payload=await request.json() as {action?:string;args?:Record<string,unknown>};
  } catch {
    return response(400,{status:"error",message:"Invalid JSON"});
  }

  const action=String(payload.action??"");
  if(!ACTIONS.has(action)) return response(403,{status:"unauthorized"});
  const args=payload.args && typeof payload.args==="object" && !Array.isArray(payload.args) ? payload.args : {};

  let upstream:Response;
  try {
    upstream=await fetch(`${SUPABASE_URL}/rest/v1/rpc/v16_chatgpt_growth_bridge`,{
      method:"POST",
      headers:{
        apikey:secret,
        "Content-Type":"application/json",
        Accept:"application/json",
      },
      body:JSON.stringify({
        p_email:user.email,
        p_action:action,
        p_args:args,
      }),
      cache:"no-store",
    });
  } catch {
    return response(503,{status:"not_connected"});
  }

  if(!upstream.ok) {
    let message=`Growth bridge failed (${upstream.status})`;
    try {
      const body=await upstream.json() as {message?:string;code?:string};
      message=body.message||body.code||message;
    } catch {}

    if(message.includes("step_up_required")) return response(403,{status:"step_up_required"});
    if(
      message.includes("identity_not_mapped") ||
      message.includes("not_authorized") ||
      message.includes("customer_identity_required") ||
      message.includes("advisor_identity_required")
    ) return response(403,{status:"unauthorized"});
    return response(upstream.status>=500?502:400,{status:"error",message});
  }

  try {
    return response(200,{status:"ok",data:await upstream.json()});
  } catch {
    return response(502,{status:"error",message:"Growth bridge returned non-JSON"});
  }
}
