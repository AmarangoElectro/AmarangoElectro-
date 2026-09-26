"use client";

import { Award, CircleDollarSign, Target, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createAdvisorCompensationAdapter, type AdvisorCompensationResult } from "@/lib/advisors/advisor-compensation-adapter";
import type { AdvisorMonthlyCompensationSnapshot } from "@/lib/advisors/advisor-compensation-contract";
import {
  ADVISOR_MONTHLY_BONUS_AFTER_20_AR,
  ADVISOR_MONTHLY_BONUS_MILESTONES,
  projectAdvisorMonthlyProgress,
} from "@/lib/internal/finance/advisor-compensation";

const money=(value:number)=>value.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});

export function AdvisorCompensationSummary() {
  const [result,setResult]=useState<AdvisorCompensationResult<AdvisorMonthlyCompensationSnapshot>>({status:"not_connected"});

  useEffect(()=>{
    let cancelled=false;
    createAdvisorCompensationAdapter().getCurrentMonth().then(next=>{if(!cancelled)setResult(next)});
    return()=>{cancelled=true};
  },[]);

  const snapshot=result.status==="ok"?result.data:null;
  const progress=useMemo(()=>projectAdvisorMonthlyProgress(snapshot?.equivalentSales??0),[snapshot?.equivalentSales]);

  return (
    <section className="advisor-compensation-summary" aria-labelledby="advisor-comp-title">
      <div className="advisor-compensation-heading">
        <div><small>🏆 TU MES</small><h2 id="advisor-comp-title">Comisiones y premio mensual</h2></div>
        <Award aria-hidden="true"/>
      </div>

      {snapshot ? <>
        <div className="advisor-month-progress">
          <div className="advisor-month-progress__top">
            <strong>{snapshot.equivalentSales.toLocaleString("es-AR")} / {progress.nextTarget ?? 20} ventas equivalentes</strong>
            <span>{progress.progressPercent}%</span>
          </div>
          <div className="advisor-month-progress__bar"><span style={{width:`${progress.progressPercent}%`}}/></div>
          <div className="advisor-month-progress__copy">
            <div><small>PREMIO ALCANZADO</small><b>{money(progress.bonusArs)}</b></div>
            <div><small>{progress.equivalentSales>=20?"PRÓXIMA VENTA ADICIONAL":"PRÓXIMA META"}</small><b>{progress.nextTarget ? `${progress.nextTarget} ventas → ${money(progress.nextBonusArs??0)}` : "—"}</b></div>
            <div><small>TE FALTAN</small><b>{progress.remainingEquivalentSales.toLocaleString("es-AR")} ventas equivalentes</b></div>
          </div>
        </div>

        <div className="advisor-compensation-grid">
          <article><TrendingUp/><small>VENTAS VÁLIDAS</small><strong>{snapshot.validSales}</strong></article>
          <article><CircleDollarSign/><small>COMISIÓN GENERADA</small><strong>{money(snapshot.commissionGeneratedArs)}</strong></article>
          <article><CircleDollarSign/><small>COMISIÓN COBRADA</small><strong>{money(snapshot.commissionPaidArs)}</strong></article>
          <article><Target/><small>COMISIÓN PENDIENTE</small><strong>{money(snapshot.commissionPendingArs)}</strong></article>
        </div>
        {snapshot.pendingValidationCount>0&&<p className="advisor-compensation-pending">{snapshot.pendingValidationCount} operaciones pendientes de validación.</p>}
      </> : (
        <div className="advisor-compensation-not-connected">
          <strong>Progreso real pendiente de conexión segura</strong>
          <p>Las metas ya están definidas. V16 no inventa ventas, comisiones cobradas ni premios mientras el cierre mensual no tenga una fuente de verdad conectada.</p>
        </div>
      )}

      <div className="advisor-bonus-targets" aria-label="Metas del premio mensual">
        {ADVISOR_MONTHLY_BONUS_MILESTONES.map(row=><span key={row.equivalentSales}><b>{row.equivalentSales}</b> ventas → <strong>{money(row.bonusArs)}</strong></span>)}
        <span><b>21+</b> → <strong>+{money(ADVISOR_MONTHLY_BONUS_AFTER_20_AR)}</strong> por cada venta equivalente completa</span>
      </div>
      <p className="advisor-compensation-rule">Productos con contado menor a $50.000 cuentan 0,5 venta equivalente. El premio se liquida a mes vencido y no reemplaza las comisiones por operación.</p>
    </section>
  );
}
