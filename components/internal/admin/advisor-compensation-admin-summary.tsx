"use client";

import { Award, CircleDollarSign, ShieldCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { createAdvisorCompensationAdapter } from "@/lib/advisors/advisor-compensation-adapter";
import type { AdvisorCompensationResult, AdvisorMonthlyCompensationAdminRow } from "@/lib/advisors/advisor-compensation-contract";
import {
  ADVISOR_FINANCED_COMMISSION_TIERS,
  ADVISOR_MONTHLY_BONUS_AFTER_20_AR,
  ADVISOR_MONTHLY_BONUS_MILESTONES,
} from "@/lib/internal/finance/advisor-compensation";

const money=(value:number)=>value.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});

export function AdvisorCompensationAdminSummary() {
  const [result,setResult]=useState<AdvisorCompensationResult<readonly AdvisorMonthlyCompensationAdminRow[]>>({status:"not_connected"});

  useEffect(()=>{
    let cancelled=false;
    createAdvisorCompensationAdapter().listCurrentMonthAdmin().then(next=>{if(!cancelled)setResult(next)});
    return()=>{cancelled=true};
  },[]);

  const rows=result.status==="ok"?result.data:[];

  return (
    <section className="advisor-comp-admin" aria-labelledby="advisor-comp-admin-title">
      <div className="advisor-comp-admin__heading">
        <div><small>COMISIONES + PREMIO MENSUAL</small><h3 id="advisor-comp-admin-title">Política vigente de asesores</h3></div>
        <Award aria-hidden="true"/>
      </div>

      <div className="advisor-comp-admin__policy">
        <div><CircleDollarSign/><span><small>FINANCIADO</small><strong>Comisión fija según contado</strong><p>2 pagos iguales. No usa costo, inicial, cuota ni total financiado.</p></span></div>
        <div><Target/><span><small>PREMIO MENSUAL</small><strong>5 / 10 / 15 / 20 ventas equivalentes</strong><p>Desde la 21: +{money(ADVISOR_MONTHLY_BONUS_AFTER_20_AR)} por venta equivalente completa.</p></span></div>
        <div><ShieldCheck/><span><small>VALIDACIÓN</small><strong>Pago + entrega + no cancelada</strong><p>Financiadas: cuotas al día al cierre mensual.</p></span></div>
      </div>

      <details className="advisor-comp-admin__details">
        <summary>Ver tabla de comisiones y premios</summary>
        <div className="advisor-comp-admin__tables">
          <div>
            <small>COMISIONES FINANCIADAS</small>
            {ADVISOR_FINANCED_COMMISSION_TIERS.map(tier=><span key={tier.minCashPriceArs}>
              <b>{money(tier.minCashPriceArs)}{tier.maxCashPriceArs===null?" en adelante":` – ${money(tier.maxCashPriceArs)}`}</b>
              <strong>{money(tier.commissionArs)}</strong>
            </span>)}
          </div>
          <div>
            <small>PREMIO MENSUAL</small>
            {ADVISOR_MONTHLY_BONUS_MILESTONES.map(row=><span key={row.equivalentSales}><b>{row.equivalentSales} ventas equivalentes</b><strong>{money(row.bonusArs)}</strong></span>)}
            <span><b>Desde 21</b><strong>+{money(ADVISOR_MONTHLY_BONUS_AFTER_20_AR)} c/u</strong></span>
          </div>
        </div>
      </details>

      {result.status!=="ok" && <div className="advisor-comp-admin__pending"><b>Resumen mensual real pendiente de conexión segura.</b><p>La política queda visible, pero V16 no inventa ventas, pagos, mora, cierres ni premios por asesor.</p></div>}

      {rows.length>0&&<div className="advisor-comp-admin__rows">{rows.map(row=><article key={row.advisorId}>
        <div><strong>{row.advisorName}</strong><small>{row.equivalentSales.toLocaleString("es-AR")} ventas equivalentes</small></div>
        <div><small>COMISIÓN</small><b>{money(row.commissionGeneratedArs)}</b></div>
        <div><small>PENDIENTE</small><b>{money(row.commissionPendingArs)}</b></div>
        <div><small>PREMIO</small><b>{money(row.bonusArs)}</b></div>
        <div><small>VALIDACIÓN</small><b>{row.pendingValidationCount} pendientes · {row.excludedCount} excluidas</b></div>
      </article>)}</div>}
    </section>
  );
}
