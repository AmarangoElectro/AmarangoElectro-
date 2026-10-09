import {backendFetch} from '@/lib/server/backend';
import {commercialCommission,COMMISSION_DISPLAY_VERSION} from './commercial-policy';
import type {V16AuthorizedQuoteDraft} from '@/lib/operations/authorized-sale-quote-engine';

export interface ActiveCommissionPolicy {cap:number|null;revision:number;version:string;policyActive:true}
/** Server-only rollout gate. This activation is authorized exclusively for this staging backend. */
export function commissionPolicyEnabled(){
 if(process.env.V16_COMMISSION_ACTIVATED!=='true')return false;
 try{return new URL(process.env.SUPABASE_URL??'').origin==='https://ugujgbamqmrvxbvzxxou.supabase.co'}catch{return false}
}
export function parseCommissionPolicy(data:Record<string,unknown>):ActiveCommissionPolicy {
 if(data.policyActive!==true||!Number.isSafeInteger(data.revision)||Number(data.revision)<1||data.version!==`${COMMISSION_DISPLAY_VERSION}|${data.revision}`||!(data.cap===null||(typeof data.cap==='number'&&Number.isFinite(data.cap)&&data.cap>=0&&data.cap<=100000000)))throw Error('commission_policy_unavailable');
 return {cap:data.cap as number|null,revision:data.revision as number,version:data.version as string,policyActive:true};
}
export async function readActiveCommissionPolicy(email:string){
 const response=await backendFetch('/rest/v1/rpc/v16_commission_workspace_v2',{method:'POST',body:JSON.stringify({p_email:email,p_action:'policy'})});
 if(!response.ok)throw Error('commission_policy_unavailable');
 return parseCommissionPolicy(await response.json());
}
/** Apply only commission metadata AFTER the existing price and financing engine. */
export function applyCommissionPolicy(quote:V16AuthorizedQuoteDraft,policy:ActiveCommissionPolicy):V16AuthorizedQuoteDraft {
 const commission=commercialCommission(quote.cashPrice,quote.paymentMode==='CASH'?'cash':'financed',quote.installments,policy.cap);
 return Object.freeze({...quote,commission:commission.amount,commissionPolicyVersion:policy.version});
}
