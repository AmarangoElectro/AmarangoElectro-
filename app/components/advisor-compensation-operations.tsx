"use client";

import { CircleDollarSign, ReceiptText, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { createAdvisorCompensationAdapter, type AdvisorCompensationResult } from "@/lib/advisors/advisor-compensation-adapter";
import type { AdvisorMonthlyCompensationOperation } from "@/lib/advisors/advisor-compensation-contract";

const money=(value:number)=>value.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});

function statusLabel(status:AdvisorMonthlyCompensationOperation["validationStatus"]) {
  if(status==="VALID") return "Cuenta para el premio";
  if(status==="PENDING_VALID_PAYMENT") return "Pendiente de pago válido";
  if(status==="PENDING_DELIVERY") return "Pendiente de entrega";
  if(status==="FINANCED_ARREARS") return "Cuotas no verificadas al día";
  return "Cancelada";
}

export function AdvisorCompensationOperations() {
  const [result,setResult]=useState<AdvisorCompensationResult<readonly AdvisorMonthlyCompensationOperation[]>>({status:"not_connected"});

  useEffect(()=>{
    let cancelled=false;
    createAdvisorCompensationAdapter().listCurrentMonthOperations().then(next=>{if(!cancelled)setResult(next)});
    return()=>{cancelled=true};
  },[]);

  if(result.status!=="ok" || result.data.length===0) return null;

  return (
    <section className="advisor-comp-ops" aria-labelledby="advisor-comp-ops-title">
      <div className="growth-section-heading"><ReceiptText/><div><small>OPERACIONES DEL MES</small><strong id="advisor-comp-ops-title">Comisión y validación por venta</strong></div></div>
      <div className="advisor-comp-ops__list">
        {result.data.map(row=><article key={row.saleId}>
          <div className="advisor-comp-ops__head">
            <div><small>{row.paymentMode==="FINANCED"?"FINANCIADO":"CONTADO"}</small><strong>{row.productName}</strong><span>Contado {money(row.cashPriceArs)}</span></div>
            <span className={row.countsForBonus?"is-valid":"is-pending"}>{statusLabel(row.validationStatus)}</span>
          </div>
          <div className="advisor-comp-ops__grid">
            <div><CircleDollarSign/><small>COMISIÓN</small><b>{money(row.commissionTotalArs)}</b></div>
            <div><small>PAGOS DE COMISIÓN</small><b>{row.commissionPaymentCount===2 ? "2 × "+money(row.commissionPaymentsArs[0]??0) : "Pago único"}</b></div>
            <div><small>COBRADO</small><b>{money(row.commissionPaidArs)}</b></div>
            <div><small>PENDIENTE</small><b>{money(row.commissionPendingArs)}</b></div>
            <div><small>VENTA EQUIVALENTE</small><b>{row.countsForBonus?row.equivalentSales.toLocaleString("es-AR"):"0"}</b></div>
          </div>
          <p><ShieldCheck size={14}/>{row.validationReason}</p>
        </article>)}
      </div>
    </section>
  );
}