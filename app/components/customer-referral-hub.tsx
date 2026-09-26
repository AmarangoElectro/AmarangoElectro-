"use client";

import { Gift, Link2, Share2, TrendingUp, UserRoundPlus, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createGrowthGateway, type GrowthGatewayResult } from "@/lib/growth/growth-gateway";
import type { CustomerGrowthSnapshot } from "@/lib/growth/referral-growth-contract";
import { setAuthorizedReferralShareCode } from "@/lib/growth/referral-attribution-client";

function benefitStatusLabel(status: CustomerGrowthSnapshot["benefits"][number]["status"]) {
  if (status==="AVAILABLE") return "Disponible";
  if (status==="USED") return "Usado";
  if (status==="EXPIRED") return "Vencido";
  if (status==="CANCELLED") return "Cancelado";
  return "Pendiente";
}

export function CustomerReferralHub() {
  const [result,setResult]=useState<GrowthGatewayResult<CustomerGrowthSnapshot>>({status:"not_connected"});
  const [applying,setApplying]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    createGrowthGateway().getCurrentCustomerGrowth().then(next=>{
      if(cancelled) return;
      setResult(next);
      if(next.status==="ok") setAuthorizedReferralShareCode(next.data.identity.referralCode);
    });
    return()=>{cancelled=true;};
  },[]);

  const snapshot=result.status==="ok" ? result.data : null;
  const referralUrl=useMemo(()=>snapshot && typeof window!=="undefined"
    ? new URL(snapshot.identity.referralPath,window.location.origin).toString()
    : snapshot?.identity.referralPath ?? "",[snapshot]);

  async function shareStore() {
    if(!snapshot) return;
    const data={title:"AmarangoElectro",text:"Te comparto AmarangoElectro. Si comprás desde este enlace, queda registrada mi recomendación.",url:referralUrl};
    try {
      if(navigator.share){ await navigator.share(data); return; }
      await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
      toast.success("Enlace de recomendación copiado");
    } catch(error) {
      if(!(error instanceof DOMException && error.name==="AbortError")) toast.error("No pudimos compartir el enlace.");
    }
  }

  async function applyAdvisor() {
    setApplying(true);
    const response=await createGrowthGateway().requestAdvisorApplication();
    setApplying(false);
    if(response.status==="ok") toast.success("Solicitud enviada para revisión");
    else if(response.status==="not_connected") toast.info("La solicitud necesita conexión segura con V16.");
    else toast.error("No pudimos registrar la solicitud.");
  }

  return (
    <section className="customer-referral-hub" aria-labelledby="customer-referral-title">
      <header>
        <div><p className="eyebrow orange">RECOMENDÁ Y GANÁ</p><h2 id="customer-referral-title">Compartí Amarango. Tus recomendaciones quedan trazadas.</h2></div>
        <Gift aria-hidden="true" />
      </header>

      {result.status!=="ok" && (
        <div className="growth-connection-state">
          <strong>Conexión segura pendiente</strong>
          <p>V16 no fabrica códigos, ventas ni beneficios de ejemplo. Cuando la identidad de cliente quede vinculada al backend autorizado, acá aparecerán tu código, tus recomendaciones y tu wallet real.</p>
        </div>
      )}

      {snapshot && <>
        <div className="customer-referral-share">
          <div><small>TU CÓDIGO</small><strong>{snapshot.identity.referralCode}</strong><span>{snapshot.identity.referralPath}</span></div>
          <button type="button" onClick={shareStore}><Share2 size={17}/> Compartir Amarango</button>
        </div>

        <div className="growth-metric-grid">
          <article><Link2/><small>RECOMENDACIONES</small><strong>{snapshot.summary.sentCount}</strong></article>
          <article><TrendingUp/><small>COMPRAS GENERADAS</small><strong>{snapshot.summary.generatedSalesCount}</strong></article>
          <article><Gift/><small>BENEFICIOS PENDIENTES</small><strong>{snapshot.summary.pendingBenefitsCount}</strong></article>
          <article><WalletCards/><small>DISPONIBLES</small><strong>{snapshot.summary.availableBenefitsCount}</strong></article>
        </div>

        <section className="customer-benefit-wallet">
          <div className="growth-section-heading"><WalletCards/><div><small>MIS BENEFICIOS</small><strong>Saldo, promociones y vencimientos</strong></div></div>
          {snapshot.benefits.length===0
            ? <p className="growth-empty">Todavía no tenés beneficios disponibles.</p>
            : <div className="growth-benefit-list">{snapshot.benefits.map(benefit=><article key={benefit.benefitId}>
                <div><strong>{benefit.label}</strong><small>{benefit.expiresAt ? `Vence ${benefit.expiresAt}` : "Sin vencimiento informado"}</small></div>
                <span>{benefitStatusLabel(benefit.status)}</span>
              </article>)}</div>}
        </section>
      </>}

      <section className="advisor-application-card">
        <UserRoundPlus/>
        <div><small>¿QUERÉS VENDER CON AMARANGO?</small><strong>Pasá de recomendar a trabajar como asesor.</strong><p>No es automático: requiere solicitud, revisión y aprobación de Amarango.</p></div>
        <button type="button" onClick={applyAdvisor} disabled={applying}>{applying?"Enviando…":"Solicitar evaluación"}</button>
      </section>
    </section>
  );
}
