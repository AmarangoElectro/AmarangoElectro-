"use client";

import { Filter, Gift, Network, ShieldAlert, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createGrowthGateway, type GrowthGatewayResult } from "@/lib/growth/growth-gateway";
import { projectAdvisorGrowth } from "@/lib/growth/referral-growth-engine";
import type {
  AcquisitionFunnelRow,
  AcquisitionSource,
  AdvisorApplication,
  AdvisorGrowthLevelRule,
  AdvisorGrowthState,
  ReferralRecord,
  RewardPolicy,
  RewardReleaseCondition,
  RewardType,
} from "@/lib/growth/referral-growth-contract";

const money=(value:number)=>value.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});
const pct=(value:number|null)=>value===null?"—":`${(value*100).toFixed(1)}%`;

function Status({results}:{results:readonly GrowthGatewayResult<unknown>[]}) {
  if(results.some(result=>result.status==="error")) return <div className="growth-admin-status error"><b>No pudimos cargar Adquisición.</b></div>;
  if(results.some(result=>result.status==="unauthorized")) return <div className="growth-admin-status warn"><b>Esta identidad no tiene acceso a Adquisición.</b></div>;
  if(results.some(result=>result.status==="step_up_required")) return <div className="growth-admin-status warn"><b>Verificación adicional requerida.</b><span>Las escrituras sensibles de Growth requieren AAL2 y no se habilitan sólo con la sesión normal.</span></div>;
  if(results.some(result=>result.status==="not_connected")) return <div className="growth-admin-status"><b>Conexión segura pendiente.</b><span>No se muestran métricas, límites ni recompensas ficticias.</span></div>;
  return null;
}

export function GrowthAcquisitionPanel() {
  const [funnel,setFunnel]=useState<GrowthGatewayResult<AcquisitionFunnelRow>>({status:"not_connected"});
  const [policies,setPolicies]=useState<GrowthGatewayResult<readonly RewardPolicy[]>>({status:"not_connected"});
  const [levels,setLevels]=useState<GrowthGatewayResult<readonly AdvisorGrowthLevelRule[]>>({status:"not_connected"});
  const [advisors,setAdvisors]=useState<GrowthGatewayResult<readonly AdvisorGrowthState[]>>({status:"not_connected"});
  const [referrals,setReferrals]=useState<GrowthGatewayResult<readonly ReferralRecord[]>>({status:"not_connected"});
  const [applications,setApplications]=useState<GrowthGatewayResult<readonly AdvisorApplication[]>>({status:"not_connected"});
  const [source,setSource]=useState("ALL");
  const [period,setPeriod]=useState<"7d"|"30d"|"90d">("30d");
  const [campaignId,setCampaignId]=useState("");
  const [advisorId,setAdvisorId]=useState("");
  const [referrerCustomerId,setReferrerCustomerId]=useState("");
  const [productId,setProductId]=useState("");
  const [categoryId,setCategoryId]=useState("");
  const [actionNotice,setActionNotice]=useState("");
  const [policyDraft,setPolicyDraft]=useState<RewardPolicy>({
    policyId:"draft",name:"",active:true,rewardType:"AMARANGO_BALANCE",
    fixedValueArs:null,percentValue:null,maxValueArs:null,minimumPurchaseArs:null,
    expiresAfterDays:null,allowedProductIds:[],allowedCategoryIds:[],
    releaseCondition:"FIRST_VALID_PAYMENT",minimumPaidAmountArs:null,
  });
  const [levelDraft,setLevelDraft]=useState<AdvisorGrowthLevelRule>({
    levelId:"draft",label:"",order:1,active:false,maxExposurePerSaleArs:0,maxOpenExposureArs:0,
    minimumPaidSales:0,minimumCompletedOperations:0,minimumPortfolioQuality:0,
    maximumDelinquencyRate:1,minimumRecurringClients:0,minimumTenureDays:0,
    requiresCorrectDocumentation:true,requiresAdminApproval:true,benefits:[],
  });

  useEffect(()=>{
    let cancelled=false;
    const gateway=createGrowthGateway();
    const filters={
      source:source==="ALL"?null:source as AcquisitionSource,
      periodPreset:period,
      campaignId:campaignId.trim()||null,
      advisorId:advisorId.trim()||null,
      referrerCustomerId:referrerCustomerId.trim()||null,
      productId:productId.trim()||null,
      categoryId:categoryId.trim()||null,
    };
    Promise.all([
      gateway.getAcquisitionFunnel(filters),
      gateway.listRewardPolicies(),
      gateway.listAdvisorLevels(),
      gateway.getAdvisorGrowthStates(),
      gateway.listReferrals(filters),
      gateway.listAdvisorApplications(),
    ]).then(([a,b,c,d,e,g])=>{if(!cancelled){setFunnel(a);setPolicies(b);setLevels(c);setAdvisors(d);setReferrals(e);setApplications(g);}});
    return()=>{cancelled=true;};
  },[source,period,campaignId,advisorId,referrerCustomerId,productId,categoryId]);

  const funnelData=funnel.status==="ok"?funnel.data:null;
  const policyRows=policies.status==="ok"?policies.data:[];
  const levelRows=levels.status==="ok"?levels.data:[];
  const advisorRows=advisors.status==="ok"?advisors.data:[];
  const referralRows=referrals.status==="ok"?referrals.data:[];
  const applicationRows=applications.status==="ok"?applications.data:[];
  const advisorProjections=useMemo(()=>advisorRows.flatMap(state=>{
    try{return [{state,projection:projectAdvisorGrowth(state,levelRows)}];}catch{return [];}
  }),[advisorRows,levelRows]);

  async function savePolicy(){
    const result=await createGrowthGateway().saveRewardPolicy(policyDraft);
    setActionNotice(result.status==="ok"?"Política guardada.":result.status==="step_up_required"?"Verificación adicional requerida: la política no fue modificada.":result.status==="not_connected"?"Conexión segura pendiente: la política no fue guardada.":"No pudimos guardar la política.");
  }

  async function saveLevel(){
    const result=await createGrowthGateway().saveAdvisorLevel(levelDraft);
    setActionNotice(result.status==="ok"?"Nivel guardado.":result.status==="step_up_required"?"Verificación adicional requerida: el nivel no fue modificado.":result.status==="not_connected"?"Conexión segura pendiente: el nivel no fue guardado.":"No pudimos guardar el nivel.");
  }

  async function reviewApplication(applicationId:string,decision:"APPROVED"|"REJECTED"){
    const result=await createGrowthGateway().reviewAdvisorApplication(applicationId,decision);
    setActionNotice(result.status==="ok"?"Solicitud actualizada.":result.status==="step_up_required"?"Verificación adicional requerida: la solicitud no fue modificada.":result.status==="not_connected"?"Conexión segura pendiente: la solicitud no fue modificada.":"No pudimos revisar la solicitud.");
  }

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
        <select value={period} onChange={event=>setPeriod(event.target.value as "7d"|"30d"|"90d")} aria-label="Período"><option value="7d">7 días</option><option value="30d">30 días</option><option value="90d">90 días</option></select>
        <input value={campaignId} onChange={event=>setCampaignId(event.target.value)} placeholder="Campaña" aria-label="Campaña" />
        <input value={advisorId} onChange={event=>setAdvisorId(event.target.value)} placeholder="Asesor" aria-label="Asesor" />
        <input value={referrerCustomerId} onChange={event=>setReferrerCustomerId(event.target.value)} placeholder="Referidor" aria-label="Referidor" />
        <input value={productId} onChange={event=>setProductId(event.target.value)} placeholder="Producto" aria-label="Producto" />
        <input value={categoryId} onChange={event=>setCategoryId(event.target.value)} placeholder="Categoría" aria-label="Categoría" />
        <small>Fuente · campaña · asesor · referidor · producto · categoría · período</small>
      </div>

      <Status results={[funnel,policies,levels,advisors,referrals,applications]}/>
      {actionNotice&&<div className="growth-admin-status"><b>{actionNotice}</b></div>}

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


      <section className="growth-admin-block">
        <div className="growth-section-heading"><Network/><div><small>REFERIDOS TRAZABLES</small><strong>Estado y origen de cada recomendación.</strong></div></div>
        {referralRows.length===0?<div className="growth-empty">Sin referidos disponibles desde una fuente segura.</div>:<div className="growth-policy-list">{referralRows.map(row=><article key={row.referralId}><div><strong>{row.referrerDisplayName?"Vino recomendado por "+row.referrerDisplayName:"Referidor protegido"}</strong><small>{row.status+" · "+row.referralCode+(row.productId?" · producto "+row.productId:"")}</small></div><span>{row.updatedAt}</span></article>)}</div>}
      </section>

      <section className="growth-admin-block">
        <div className="growth-section-heading"><Gift/><div><small>EDITAR BENEFICIO</small><strong>Política adaptable al margen real.</strong></div></div>
        <div className="growth-config-grid">
          <label>Nombre<input value={policyDraft.name} onChange={e=>setPolicyDraft({...policyDraft,name:e.target.value})}/></label>
          <label className="growth-check"><input type="checkbox" checked={policyDraft.active} onChange={e=>setPolicyDraft({...policyDraft,active:e.target.checked})}/> Política activa</label>
          <label>Tipo<select value={policyDraft.rewardType} onChange={e=>setPolicyDraft({...policyDraft,rewardType:e.target.value as RewardType})}>{["AMARANGO_BALANCE","NEXT_PURCHASE_DISCOUNT","COUPON","GIFT","SPECIAL_BENEFIT","SHIPPING_BENEFIT","OTHER"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Valor fijo<input type="number" value={policyDraft.fixedValueArs??""} onChange={e=>setPolicyDraft({...policyDraft,fixedValueArs:e.target.value?Number(e.target.value):null})}/></label>
          <label>Porcentaje<input type="number" value={policyDraft.percentValue??""} onChange={e=>setPolicyDraft({...policyDraft,percentValue:e.target.value?Number(e.target.value):null})}/></label>
          <label>Tope<input type="number" value={policyDraft.maxValueArs??""} onChange={e=>setPolicyDraft({...policyDraft,maxValueArs:e.target.value?Number(e.target.value):null})}/></label>
          <label>Mínimo compra<input type="number" value={policyDraft.minimumPurchaseArs??""} onChange={e=>setPolicyDraft({...policyDraft,minimumPurchaseArs:e.target.value?Number(e.target.value):null})}/></label>
          <label>Vence en días<input type="number" value={policyDraft.expiresAfterDays??""} onChange={e=>setPolicyDraft({...policyDraft,expiresAfterDays:e.target.value?Number(e.target.value):null})}/></label>
          <label>Condición<select value={policyDraft.releaseCondition} onChange={e=>setPolicyDraft({...policyDraft,releaseCondition:e.target.value as RewardReleaseCondition})}>{["FIRST_VALID_PAYMENT","MINIMUM_PAID_AMOUNT","DELIVERY_AND_VALID_PAYMENT","SALE_PAID_IN_FULL","ADMIN_APPROVAL"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Mínimo cobrado<input type="number" value={policyDraft.minimumPaidAmountArs??""} onChange={e=>setPolicyDraft({...policyDraft,minimumPaidAmountArs:e.target.value?Number(e.target.value):null})}/></label>
          <label>Productos habilitados<input value={(policyDraft.allowedProductIds??[]).join(", ")} onChange={e=>setPolicyDraft({...policyDraft,allowedProductIds:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="IDs separados por coma"/></label>
          <label>Categorías habilitadas<input value={(policyDraft.allowedCategoryIds??[]).join(", ")} onChange={e=>setPolicyDraft({...policyDraft,allowedCategoryIds:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="IDs separados por coma"/></label>
        </div>
        <button className="growth-admin-save" type="button" onClick={savePolicy}>Guardar política segura</button>
      </section>

      <section className="growth-admin-block">
        <div className="growth-section-heading"><UsersRound/><div><small>CONFIGURAR NIVEL</small><strong>Límites y calidad de cartera.</strong></div></div>
        <div className="growth-config-grid">
          <label>Nombre<input value={levelDraft.label} onChange={e=>setLevelDraft({...levelDraft,label:e.target.value})}/></label>
          <label className="growth-check"><input type="checkbox" checked={Boolean(levelDraft.active)} onChange={e=>setLevelDraft({...levelDraft,active:e.target.checked})}/> Nivel activo</label>
          <label>Exposición máx. por venta<input type="number" value={levelDraft.maxExposurePerSaleArs} onChange={e=>setLevelDraft({...levelDraft,maxExposurePerSaleArs:Number(e.target.value)})}/></label>
          <label>Exposición abierta máx.<input type="number" value={levelDraft.maxOpenExposureArs} onChange={e=>setLevelDraft({...levelDraft,maxOpenExposureArs:Number(e.target.value)})}/></label>
          <label>Ventas cobradas mín.<input type="number" value={levelDraft.minimumPaidSales} onChange={e=>setLevelDraft({...levelDraft,minimumPaidSales:Number(e.target.value)})}/></label>
          <label>Operaciones completas mín.<input type="number" value={levelDraft.minimumCompletedOperations} onChange={e=>setLevelDraft({...levelDraft,minimumCompletedOperations:Number(e.target.value)})}/></label>
          <label>Calidad cartera mín.<input type="number" step=".01" value={levelDraft.minimumPortfolioQuality} onChange={e=>setLevelDraft({...levelDraft,minimumPortfolioQuality:Number(e.target.value)})}/></label>
          <label>Mora máxima<input type="number" step=".01" value={levelDraft.maximumDelinquencyRate} onChange={e=>setLevelDraft({...levelDraft,maximumDelinquencyRate:Number(e.target.value)})}/></label>
          <label>Clientes recurrentes mín.<input type="number" value={levelDraft.minimumRecurringClients} onChange={e=>setLevelDraft({...levelDraft,minimumRecurringClients:Number(e.target.value)})}/></label>
          <label>Antigüedad mínima días<input type="number" value={levelDraft.minimumTenureDays} onChange={e=>setLevelDraft({...levelDraft,minimumTenureDays:Number(e.target.value)})}/></label>
          <label className="growth-check"><input type="checkbox" checked={levelDraft.requiresCorrectDocumentation} onChange={e=>setLevelDraft({...levelDraft,requiresCorrectDocumentation:e.target.checked})}/> Documentación correcta</label>
          <label className="growth-check"><input type="checkbox" checked={levelDraft.requiresAdminApproval} onChange={e=>setLevelDraft({...levelDraft,requiresAdminApproval:e.target.checked})}/> Aprobación administrativa</label>
          <label>Beneficios del nivel<input value={(levelDraft.benefits??[]).join(", ")} onChange={e=>setLevelDraft({...levelDraft,benefits:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="Ej. Mayor capacidad, prioridad"/></label>
        </div>
        <button className="growth-admin-save" type="button" onClick={saveLevel}>Guardar nivel seguro</button>
      </section>

      <section className="growth-admin-block">
        <div className="growth-section-heading"><UsersRound/><div><small>SOLICITUDES ASESOR</small><strong>Cliente → asesor sólo con aprobación.</strong></div></div>
        {applicationRows.length===0?<div className="growth-empty">No hay solicitudes disponibles desde una fuente segura.</div>:<div className="growth-policy-list">{applicationRows.map(app=><article key={app.applicationId}><div><strong>{"Solicitud "+app.applicationId}</strong><small>{app.status+" · cliente "+app.customerId}</small></div>{app.status==="PENDING"?<span><button type="button" onClick={()=>reviewApplication(app.applicationId,"APPROVED")}>Aprobar</button> <button type="button" onClick={()=>reviewApplication(app.applicationId,"REJECTED")}>Rechazar</button></span>:<span>{app.status}</span>}</article>)}</div>}
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
