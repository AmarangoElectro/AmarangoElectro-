import {z} from "zod";
import {storeAction} from "@/lib/subscriptions/server";
import {privateJson,sameOrigin} from "@/lib/server/backend";
const plan=z.enum(["tienda","cuotas","gestion","premium"]);
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const specs=z.record(z.string().min(1).max(60),z.string().max(220)).refine(v=>Object.keys(v).length<=30);
const amount=z.number().nonnegative().max(10000000).nullable();
const diagnosis=z.object({need:z.enum(["sales","order","financing","support"]),tools:z.array(z.enum(["store","installments","crm","brand","administration"])).min(1).max(5).refine(v=>new Set(v).size===v.length),monthly_sales:z.enum(["starting","up_to_30","up_to_100","over_100"]),installments:z.enum(["yes","want","no"]),budget:amount,value:z.enum(["simplicity","automation","control","support"])}).strict();
const toolValue=z.object({name:z.string().trim().min(1).max(120),reference_price:amount,promo_price:amount}).strict().refine(t=>t.promo_price==null||t.reference_price!=null&&t.promo_price<t.reference_price);
const ownerPrice=z.object({id:z.enum(["cuotas","gestion","premium"]),monthly_price:amount,setup_price:amount,price_currency:z.enum(["USD","ARS"]).optional(),tool_values:z.array(toolValue).max(16).optional(),previous_price:amount.optional(),promo_price:amount.optional(),promo_text:z.string().trim().max(220).optional(),promo_expires_at:z.string().datetime({offset:true}).nullable().optional()}).strict().refine(v=>v.promo_price==null||v.monthly_price!=null&&v.promo_price<v.monthly_price).refine(v=>v.previous_price==null||(v.promo_price??v.monthly_price)!=null&&v.previous_price>(v.promo_price??v.monthly_price)!).refine(v=>!v.promo_expires_at||v.promo_price!=null||v.tool_values?.some(t=>t.promo_price!=null));
const contact={contact_phone:z.string().regex(/^\+?[0-9 ()-]{0,30}$/).optional(),message:z.string().trim().max(1000).optional()};
const schemas={
  create:z.object({name:z.string().trim().min(2).max(80),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{2,49}$/),requested_plan:plan,consent:z.literal(true),...contact,diagnosis:diagnosis.optional()}).strict(),
  brand:z.object({name:z.string().trim().min(2).max(80),primary_color:color,accent_color:color,whatsapp:z.string().regex(/^\d{0,18}$/),published:z.boolean()}).strict(),
  product:z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(150),cash_price:z.number().positive().max(100000000),visible:z.boolean(),features:z.array(z.string().trim().min(1).max(220)).max(12),specifications:specs}).strict(),
  financing:z.object({financing:z.object({"2":z.number().min(0).max(300),"4":z.number().min(0).max(300),"6":z.number().min(0).max(300)}).strict()}).strict(),
  customer:z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(120),phone:z.string().regex(/^\d{0,18}$/),notes:z.string().max(1500)}).strict(),
  sale:z.object({id:z.string().uuid(),customer_id:z.string().uuid(),product_id:z.string().uuid()}).strict(),
  request_plan:z.object({requested_plan:plan,...contact,offer_updated_at:z.string().datetime({offset:true}).optional(),fx_updated_at:z.string().datetime({offset:true}).nullable().optional()}).strict(),
  owner_store:z.object({store_id:z.string().uuid(),plan,status:z.enum(["pending","active","paused"])}).strict(),
  owner_price:ownerPrice,
  owner_fx:z.object({usd_to_ars:z.number().positive().max(10000000).nullable()}).strict(),
  diagnosis:z.object({diagnosis}).strict(),
  growth_interest:z.object({need:z.enum(["financing","management","support"])}).strict(),
  dismiss_suggestion:z.object({key:z.enum(["financing","management","support","volume"])}).strict(),
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
