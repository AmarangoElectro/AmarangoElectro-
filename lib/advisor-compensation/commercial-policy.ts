export const COMMISSION_DISPLAY_VERSION="2026-10-09";
export type CommissionModality="cash"|"financed";
/** Independent commission-only policy. Does not change the price or financing engines. */
export function commercialCommission(price:number,modality:CommissionModality,installments=6,cap:number|null=null){
 if(!Number.isFinite(price)||price<0||!['cash','financed'].includes(modality))throw new Error('invalid_commission_input');
 if(cap!==null&&(!Number.isFinite(cap)||cap<0||cap>100000000))throw new Error('invalid_cap');
 const rate=price<200000?10:7;
 const amount=Math.round((modality==='cash'?price*rate/100:price<50000?7500:price<100000?12000:price<200000?20000:price<300000?28000:Math.min(price*.1,cap??Infinity))*100)/100;
 const count=modality==='cash'?1:installments===6?3:2;
 const base=Math.floor(amount*100/count)/100;
 return {amount,rate:modality==='cash'?rate:price>=300000?10:null,payments:Array.from({length:count},(_,i)=>i===count-1?Math.round((amount-base*(count-1))*100)/100:base)};
}

export type CommissionSort='commission'|'sales'|'price'|'installments';
export function sortCommissionProducts<T extends {id:string;price:{amount:number}|null}>(products:readonly T[],sort:CommissionSort,modality:CommissionModality,cap:number|null,sales:Record<string,number>){
 return [...products].sort((a,b)=>{
  const priceA=a.price?.amount??Infinity,priceB=b.price?.amount??Infinity;
  const earn=(p:T)=>p.price&&p.price.amount>0?commercialCommission(p.price.amount,modality,6,cap).amount:-1;
  if(sort==='commission')return earn(b)-earn(a)||a.id.localeCompare(b.id);
  if(sort==='sales')return (sales[b.id]??0)-(sales[a.id]??0)||a.id.localeCompare(b.id);
  return priceA-priceB||a.id.localeCompare(b.id);
 });
}
