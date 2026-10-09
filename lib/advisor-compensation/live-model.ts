import {quoteAdvisorMonthlyBonus} from '@/lib/internal/finance/advisor-compensation-engine';
import type {AdvisorMonthReadModel} from './advisor-compensation-read-model';
export interface CommissionOperation {
 saleId:string;advisorId:string;advisorName:string;productId:string;productLabel:string;finalCashPriceArs:number;modality:'cash'|'financed';commissionTotalArs:number;paymentCount:number;paymentAmounts:number[];commissionCollectedArs:number;validation:'ACCEPTED'|'PENDING'|'EXCLUDED';validationReason:string;saleEquivalent:number;policyVersion:string;closedAt:string|null;costArs?:number|null;marginArs?:number|null;
}
export interface CommissionWorkspace {role:'owner'|'admin'|'asesor';advisorId:string|null;advisorName:string;period:string;cap:number|null;revision:number;version:string;policyActive:boolean;operations:CommissionOperation[];salesCounts:Record<string,number>;updatedAt:string;}
export function liveAdvisorMonth(data:CommissionWorkspace,advisorId:string|null=data.advisorId):AdvisorMonthReadModel {
 const operations=data.operations.filter(row=>advisorId===null||row.advisorId===advisorId);
 const accepted=operations.filter(row=>row.validation==='ACCEPTED');
 const equivalentSales=accepted.reduce((sum,row)=>sum+row.saleEquivalent,0),bonus=quoteAdvisorMonthlyBonus(equivalentSales);
 const mapped=operations.map(row=>{
  const generated=row.validation==='EXCLUDED'?0:Number(row.commissionTotalArs);
  const collected=Number(row.commissionCollectedArs);
  let rest=collected;
  const amounts=Array.isArray(row.paymentAmounts)?row.paymentAmounts.map(Number):[];
  return {saleId:row.saleId,productLabel:row.productLabel,finalCashPriceArs:Number(row.finalCashPriceArs),modality:row.modality,commissionTotalArs:generated,commissionCollectedArs:collected,commissionPendingArs:Math.max(0,generated-collected),countsForBonus:row.validation==='ACCEPTED',validation:row.validation.toLowerCase() as 'accepted'|'pending'|'excluded',validationReason:row.validationReason,commissionPayments:amounts.map((amountArs,i)=>{const status=rest>=amountArs?'collected' as const:'pending' as const;rest=Math.max(0,rest-amountArs);return {part:i+1,amountArs,status}})};
 });
 return {policyVersion:[...new Set(operations.map(row=>row.policyVersion))].join(', ')||'Sin operaciones',advisorId:advisorId??'',advisorName:operations[0]?.advisorName??data.advisorName,period:data.period,closedAt:operations[0]?.closedAt??null,validSales:accepted.length,...bonus,operations:mapped,acceptedOperations:accepted.length,pendingOperations:operations.filter(row=>row.validation==='PENDING').length,excludedOperations:operations.filter(row=>row.validation==='EXCLUDED').length,commissionGeneratedArs:mapped.reduce((sum,row)=>sum+row.commissionTotalArs,0),commissionCollectedArs:mapped.reduce((sum,row)=>sum+row.commissionCollectedArs,0),commissionPendingArs:mapped.reduce((sum,row)=>sum+row.commissionPendingArs,0)};
}
