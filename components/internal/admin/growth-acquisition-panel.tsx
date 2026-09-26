"use client";

import { Filter, Gift, Network, ShieldAlert, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createGrowthGateway, type GrowthGatewayResult } from "@/lib/growth/growth-gateway";
import { projectAdvisorGrowth } from "@/lib/growth/referral-growth-engine";
import type {
  AcquisitionFunnelRow,
  AdvisorGrowthLevelRule,
  AdvisorGrowthState,
  RewardPolicy,
} from "@/lib/growth/referral-growth-contract";

const money=(value:number)=>value.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});
const pct=(value:number|null)=>value===null?"—":`${(value*100).toFixed(1)}%`;

function Status({results}:{results:readonly GrowthGatewayResult<unknown>[]}) {
  if(results.some(result=>result.status==="error")) return <div className="growth-admin-status error"><b>No pudimos cargar Adquisición.</b></div>;
  if(results.some(result=>result.status==="unauthorized")) return <div className="growth-admin-status warn"><b>Esta identidad no tiene acceso a Adquisición.</b></div>;
  if(results.some(result=>result.status==="not_connected")) return <div className="growth-admin-status"><b>Conexión segura pendiente.</b><span>No se muestran métricas, límites ni recompensas ficticias.</span></div>;
  return null;
}

export function GrowthAcquisitionPanel() {
  const [funnel,setFunnel]=useState<GrowthGatewayResult<AcquisitionFunnelRow>>({status:"not_connected"});
  const [policies,setPolicies]=useState<GrowthGatewayResult<readonly RewardPolicy[]>>({status:"not_connected"});
  const [levels,setLevels]=useState<GrowthGatewayResult<readonly AdvisorGrowthLevelRule[]>>({status:"not_connected"});
  const [advisors,setAdvisors]=useState<GrowthGatewayResult<readonly AdvisorGrowthState[]>>({status:"not_connected"});
  const [source,setSource]=useState("ALL");
  const [period,setPeriod]=useState("30d");

  useEffect(()=>{
    let cancelled=false;
    const gateway=createGrowthGateway();
    Promise.all([
      gateway.getAcquisitionFunnel(),
      gateway.listRewardPolicies(),
      gateway.listAdvisorLevels(),
      gateway.getAdvisorGrowthStates(),
    ]).then(([a,b,c,d])=>{if(!cancelled){setFunnel(a);setPolicies(b);setLevels(c);setAdvisors(d);}});
    return()=>{cancelled=true;};
  },[]);

  const funnelData=funnel.status==="ok"?funnel.data:null;
  const policyRows=policies.status==="ok"?policies.data:[];
  const levelRows=levels.status==="ok"?levels.data:[];
  const advisorRows=advisors.status==="ok"?advisors.data:[];
  const advisorProjections=useMemo(()=>advisorRows.flatMap(state=>{
    try{return [{state,projection:projectAdvisorGrowth(state,levelRows)}];}catch{return [];}
  }),[advisorRows,levelRows]);

  const funnelSteps=[
    ["VISITAS",funnelData?.visits],["LEADS",funnelData?.leads],["EVALUACIONES",funnelData?.evaluations],
    ["APROBADOS",funnelData?.approved],["VENTAS",funnelData?.sales],["COBRADO",funnelData?.paid],
    ["RECURRENTES",funnelData?.recurringCustomers],["REFERIDOS",funnelData?.referralsGenerated],
  ] as const;

  return (
    <section className="growth-admin-panel" aria-labelledby="growth-admin-title">
      <header className="crm-panel-header">
        <div><p className="eyebrow orange">CRECIMIENTO CONTROLADO</p><h2 id="growth-admin-title">Adquisición, referidos y exposición.</h2><span>Más leads sin abrir indiscriminadamente el riesgo financiero.</span></div>
      </header>
      <div className="crm-status-banner"><Network size={16}/> V16 es la fuente de verdad · canales externos sólo consumen eventos autorizados</div>

      <div className="growth-admin-filters">
        <Filter size={16}/>
        <select value={source} onChange={event=>setSource(event.target.value)} aria-label="Fuente">
          <option value="ALL">Todas las fuentes</option><option>DIRECT</option><option>WHATSAPP</option><option>INSTAGRAM</option><option>FACEBOOK</option><option>META_ADS</option><option>CLIENT_REFERRAL</option><option>ADVISOR</option><option>ORGANIC</option><option>CAMPAIGN</option><option>OTHER</option>
        </select>
        <select value={period} onChange={event=>setPeriod(event.target.value)} aria-label="Período"><option value="7d">7 días</option><option value="30d">30 días</option><option value="90d">90 días</option></select>
        <small>Filtros preparados: fuente · campaña · asesor · referidor · producto · categoría · período</small>
      </div>

      <Status results={[funnel,policies,levels,advisors]}/>

      <div className="growth-funnel" data-source-filter={source} data-period-filter={period}>
        {funnelSteps.map(([label,value],index)=><article key={label}><small>{label}</small><strong>{value??"—"}</strong>{index<funnelSteps.length-1&&<span>↓</span>}</article>)}
      </div>

      <div className="growth-primary-kpi">
        <TrendingUp/><div><small>MÉTRICA PRINCIPAL</small><strong>{funnelData?.collectedMarginOnExposure==null?"Margen cobrado / Capital expuesto":pct(funnelData.collectedMarginOnExposure)}</strong><span>{funnelData ? `${money(funnelData.marginCollectedArs)} cobrados sobre ${money(funnelData.exposedCapitalArs)} expuestos` : "Esperando fuente segura"}</span></div>
      </div>

      {funnelData&&<div className="growth-metric-grid admin">
        <article><small>COSTO / LEAD</small><strong>{funnelData.costPerLeadArs==null?"—":money(funnelData.costPerLeadArs)}</strong></article>
        <article><small>COSTO / CLIENTE</small><strong>{funnelData.costPerCustomerArs==null?"—":money(funnelData.costPerCustomerArs)}</strong></article>
        <article><small>APROBACIÓN</small><strong>{pct(funnelData.approvalRate)}</strong></article>
        <article><small>CONVERSIÓN</small><strong>{pct(funnelData.conversionRate)}</strong></article>
        <article><small>MORA</small><strong>{pct(funnelData.delinquencyRate)}</strong></article>
        <article><small>VENTAS / REFERIDO</small><strong>{funnelData.salesPerReferral?.toFixed(2)??"—"}</strong></article>
      </div>}

      <section className="growth-admin-block">
        <div className="growth-section-heading"><Gift/><div><small>BENEFICIOS</small><strong>Políticas configurables, nunca hardcodeadas.</strong></div></div>
        <p>Tipo · valor · porcentaje · tope · mínimo de compra · vencimiento · productos/categorías · condición de liberación.</p>
        {policyRows.length===0?<div className="growth-empty">No hay políticas disponibles desde una fuente segura.</div>:<div className="growth-policy-list">{policyRows.map(policy=><article key={policy.policyId}><div><strong>{policy.name}</strong><small>{policy.rewardType} · {policy.releaseCondition}</small></div><span>{policy.active?"Activa":"Pausada"}</span></article>)}</div>}
      </section>

      <section className="growth-admin-block">
        <div className="growth-section-heading"><UsersRound/><div><small>ESCALAMIENTO DE ASESORES</small><strong>Capacidad basada en riesgo, no en reclutamiento.</strong></div></div>
        <p>Capital expuesto = costo real + costos directos + comisiones comprometidas − dinero efectivamente cobrado.</p>
        {advisorProjections.length===0?<div className="growth-empty">Sin niveles/estados reales conectados. No se inventan límites monetarios.</div>:<div className="growth-advisor-list">{advisorProjections.map(({state,projection})=><article key={state.advisorId}>
          <div><strong>{projection.currentLevel.label}</strong><small>Próximo: {projection.nextLevel?.label??"Nivel máximo"}</small></div>
          <div><small>PROGRESO</small><b>{projection.progressPercent}%</b></div>
          <div><small>CAPACIDAD DISPONIBLE</small><b>{money(projection.availableOpenExposureArs)}</b></div>
          <div><small>BLOQUEOS</small><b>{projection.blockers.join(" · ")||"Ninguno"}</b></div>
        </article>)}</div>}
      </section>

      <section className="growth-admin-block growth-antifraud">
        <ShieldAlert/><div><small>ANTIFRAUDE</small><strong>Sin autorreferidos evidentes.</strong><p>Mismo cliente, DNI o teléfono son señales de rechazo. Dispositivo/IP compartidos sólo generan revisión; nunca bloqueo automático por sí solos.</p></div>
      </section>

      <section className="growth-admin-block">
        <div className="growth-section-heading"><WalletCards/><div><small>REGLA DE NEGOCIO</small><strong>No es multinivel.</strong></div></div>
        <p>No se paga por reclutar, no se recompensa un registro y una venta creada no libera sola el beneficio. Debe existir un cobro válido definido por Administración.</p>
      </section>
    </section>
  );
}
