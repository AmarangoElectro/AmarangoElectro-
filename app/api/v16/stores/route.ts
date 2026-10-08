import {z} from "zod";
import {storeAction} from "@/lib/subscriptions/server";
import {privateJson,sameOrigin} from "@/lib/server/backend";
const plan=z.enum(["tienda","cuotas","gestion"]);
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const specs=z.record(z.string().min(1).max(60),z.string().max(220)).refine(v=>Object.keys(v).length<=30);
const schemas={
  create:z.object({name:z.string().trim().min(2).max(80),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{2,49}$/),requested_plan:plan,consent:z.literal(true)}).strict(),
  brand:z.object({name:z.string().trim().min(2).max(80),primary_color:color,accent_color:color,whatsapp:z.string().regex(/^\d{0,18}$/),published:z.boolean()}).strict(),
  product:z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(150),cash_price:z.number().positive().max(100000000),visible:z.boolean(),features:z.array(z.string().trim().min(1).max(220)).max(12),specifications:specs}).strict(),
  financing:z.object({financing:z.object({"2":z.number().min(0).max(300),"4":z.number().min(0).max(300),"6":z.number().min(0).max(300)}).strict()}).strict(),
  customer:z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(120),phone:z.string().regex(/^\d{0,18}$/),notes:z.string().max(1500)}).strict(),
  sale:z.object({id:z.string().uuid(),customer_id:z.string().uuid(),product_id:z.string().uuid()}).strict(),
  request_plan:z.object({requested_plan:plan}).strict(),
  owner_store:z.object({store_id:z.string().uuid(),plan,status:z.enum(["pending","active","paused"])}).strict(),
  owner_price:z.object({id:plan,monthly_price:z.number().nonnegative().max(10000000).nullable(),setup_price:z.number().nonnegative().max(10000000).nullable()}).strict(),
};
export async function GET(request:Request){
  const view=new URL(request.url).searchParams.get("view");
  const result=await storeAction(view==="owner"?"owner_list":"workspace");
  return privateJson(result.data,result.status);
}
export async function POST(request:Request){
  if(!sameOrigin(request))return privateJson({error:"forbidden"},403);
  if(Number(request.headers.get("content-length")??0)>30000)return privateJson({error:"too_large"},413);
  let action:keyof typeof schemas,payload:unknown;
  try{const body=await request.json();action=body.action;if(!Object.hasOwn(schemas,action))throw new Error();payload=schemas[action].parse(body.payload)}catch{return privateJson({error:"invalid"},400)}
  const result=await storeAction(action,payload);return privateJson(result.data,result.status);
}
