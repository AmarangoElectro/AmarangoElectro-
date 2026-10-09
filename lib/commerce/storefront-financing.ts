import type { FinancingOption, Product } from "@/lib/catalog/types";

export function numericPlans(plans: readonly FinancingOption[] = []): FinancingOption[] {
  return plans.filter(plan => plan && Number.isInteger(plan.installments) && plan.installments > 0 && Number.isFinite(plan.installmentAmount?.amount) && plan.installmentAmount!.amount > 0);
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
  const key=`${product.id}:${product.price.amount}`;
  const hit=cached.get(key);if(hit && hit.expires>Date.now()) return Promise.resolve(hit.plans);
  const inFlight=pending.get(key);if(inFlight) return inFlight;
  const request=new Promise<FinancingOption[]>(resolve=>queue.set(key,{id:product.id,resolve}));pending.set(key,request);
  if(!scheduled) {scheduled=true;queueMicrotask(()=>void flush());}
  return request;
}
