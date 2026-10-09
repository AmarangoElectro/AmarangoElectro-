import type { FinancingOption, Product } from "@/lib/catalog/types";

export function numericPlans(plans: readonly FinancingOption[] = []): FinancingOption[] {
  return plans.filter(plan => plan && Number.isInteger(plan.installments) && plan.installments > 0 && Number.isFinite(plan.installmentAmount?.amount) && plan.installmentAmount!.amount > 0);
}

/** Customer-facing detail, including the real final installment when rounding differs. */
export function formatStorefrontPlan(plan: FinancingOption): string {
  if(!numericPlans([plan]).length)return "Consultá las opciones de cuotas";
  const money=(value:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:2}).format(value);
  const amount=plan.installmentAmount!.amount,total=plan.totalAmount?.amount;
  const hasTotal=typeof total==="number"&&Number.isFinite(total)&&total>0;
  const last=hasTotal?Math.round((total-amount*(plan.installments-1))*100)/100:null;
  return `${plan.installments} cuotas de ${money(amount)}${last!==null&&last>0&&Math.abs(last-amount)>=.01?` · Última ${money(last)}`:""}${hasTotal?` · Total ${money(total)}`:""}`;
}

type PricingProduct = Pick<Product, "id" | "price" | "financing">;
const cached = new Map<string, { plans: FinancingOption[]; expires: number }>();
const pending = new Map<string, Promise<FinancingOption[]>>();
const queue = new Map<string, { id: string; resolve: (plans: FinancingOption[]) => void }>();
let scheduled = false;

/** One bounded batch for mounted cards. Only ids cross the read-only transport. */
async function flush() {
  scheduled = false;
  const batch = [...queue.entries()]; queue.clear();
  for(let offset=0;offset<batch.length;offset+=100) {
    const group=batch.slice(offset,offset+100);
    let data: Record<string, FinancingOption[]> = {};
    try {
      const response=await fetch("/api/v16/comparison-financing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:[...new Set(group.map(([, item])=>item.id))]}),signal:AbortSignal.timeout(15000)});
      if(response.ok) { const body=await response.json(); if(body.status==="ok" && body.data && typeof body.data==="object") data=body.data; }
    } catch { /* Leave missing quotes empty; never invent a rate. */ }
    for(const [key,item] of group) {
      const plans=Array.isArray(data[item.id])?numericPlans(data[item.id]):[];
      cached.set(key,{plans,expires:Date.now()+(plans.length?60000:5000)});
      pending.delete(key);item.resolve(plans);
    }
    while(cached.size>400) cached.delete(cached.keys().next().value!);
  }
}

export function loadStorefrontFinancing(product: PricingProduct): Promise<FinancingOption[]> {
  if(!product.price || !Number.isFinite(product.price.amount) || product.price.amount<=0) return Promise.resolve([]);
  return loadStorefrontFinancingById(product.id,product.price.amount);
}

/** Sharing and cards use the same bounded cache and server-authorized values. */
export function loadStorefrontFinancingById(id:string, cashPriceArs:number|null=null): Promise<FinancingOption[]> {
  if(!id.trim() || id.length>160) return Promise.resolve([]);
  const key=`${id}:${typeof cashPriceArs==="number"&&Number.isFinite(cashPriceArs)&&cashPriceArs>0?cashPriceArs:""}`;
  const hit=cached.get(key);if(hit && hit.expires>Date.now()) return Promise.resolve(hit.plans);
  const inFlight=pending.get(key);if(inFlight) return inFlight;
  const request=new Promise<FinancingOption[]>(resolve=>queue.set(key,{id,resolve}));pending.set(key,request);
  if(!scheduled) {scheduled=true;queueMicrotask(()=>void flush());}
  return request;
}
