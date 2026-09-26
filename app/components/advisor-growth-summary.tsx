"use client";

import { BadgeCheck, Gauge, Gift, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createGrowthGateway, type GrowthGatewayResult } from "@/lib/growth/growth-gateway";
import { projectAdvisorGrowth } from "@/lib/growth/referral-growth-engine";
import type { AdvisorGrowthLevelRule, AdvisorGrowthState } from "@/lib/growth/referral-growth-contract";

const money=(value:number)=>value.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});

export function AdvisorGrowthSummary() {
  const [state,setState]=useState<GrowthGatewayResult<AdvisorGrowthState>>({status:"not_connected"});
  const [levels,setLevels]=useState<GrowthGatewayResult<readonly AdvisorGrowthLevelRule[]>>({status:"not_connected"});

  useEffect(()=>{
    let cancelled=false;
    const gateway=createGrowthGateway();
    Promise.all([gateway.getCurrentAdvisorGrowth(),gateway.listAdvisorLevels()]).then(([a,b])=>{
      if(!cancelled){setState(a);setLevels(b);}
    });
    return()=>{cancelled=true;};
  },[]);

  const projection=useMemo(()=>{
    if(state.status!=="ok"||levels.status!=="ok") return null;
    try{return projectAdvisorGrowth(state.data,levels.data);}catch{return null;}
  },[state,levels]);

  if(!projection) return (
    <section className="advisor-growth-summary">
      <div className="growth-section-heading"><Gauge/><div><small>ESCALAMIENTO</small><strong>Nivel y capacidad</strong></div></div>
      <p>Conexión segura pendiente. V16 no muestra niveles, montos ni beneficios de ejemplo.</p>
    </section>
  );

  return (
    <section className="advisor-growth-summary">
      <div className="growth-section-heading"><Gauge/><div><small>ESCALAMIENTO</small><strong>{projection.currentLevel.label}</strong></div></div>
      <div className="advisor-growth-grid">
        <article><BadgeCheck/><small>NIVEL ACTUAL</small><strong>{projection.currentLevel.label}</strong></article>
        <article><TrendingUp/><small>PROGRESO</small><strong>{projection.progressPercent}%</strong></article>
        <article><Gauge/><small>CAPACIDAD DISPONIBLE</small><strong>{money(projection.availableOpenExposureArs)}</strong></article>
        <article><BadgeCheck/><small>PRÓXIMO NIVEL</small><strong>{projection.nextLevel?.label??"Nivel máximo"}</strong></article>
      </div>
      <div className="advisor-growth-benefits"><Gift/><div><small>BENEFICIOS DEL NIVEL</small><p>{projection.currentLevel.benefits.length?projection.currentLevel.benefits.join(" · "):"Sin beneficios configurados."}</p></div></div>
      {projection.blockers.length>0&&<p className="advisor-growth-blockers">Para el próximo nivel: {projection.blockers.join(" · ")}.</p>}
    </section>
  );
}
