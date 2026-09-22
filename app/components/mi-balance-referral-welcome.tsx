"use client";

import { useEffect, useState } from "react";

const SOURCE = "mi_balance";
const DISMISS_KEY = "amarango.mi_balance_welcome.dismissed";

export function MiBalanceReferralWelcome() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromMiBalance = params.get("utm_source") === SOURCE;
      if (!fromMiBalance) return;

      sessionStorage.setItem("amarango.referral.source", SOURCE);
      sessionStorage.setItem("amarango.referral.campaign", params.get("utm_campaign") || "regalo_mi_balance");

      if (sessionStorage.getItem(DISMISS_KEY) !== "1") {
        setVisible(true);
      }
    } catch {}
  }, []);

  if (!visible) return null;

  function dismiss() {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setVisible(false);
  }

  return (
    <section aria-label="Bienvenida desde Mi Balance" style={{maxWidth:1180,margin:"18px auto 4px",padding:"0 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,padding:"16px 18px",borderRadius:20,border:"1px solid var(--border)",background:"linear-gradient(135deg, color-mix(in srgb, var(--blue) 7%, var(--card)), color-mix(in srgb, var(--orange) 7%, var(--card)))",color:"var(--foreground)",boxShadow:"0 12px 30px rgba(5, 18, 38, .07)"}}>
        <div style={{minWidth:0}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,marginBottom:5,color:"var(--orange)",fontSize:11,fontWeight:900,letterSpacing:".08em",textTransform:"uppercase"}}>💙 Llegaste desde Mi Balance</div>
          <strong style={{display:"block",fontSize:18,lineHeight:1.15}}>Qué bueno tenerte por acá.</strong>
          <p style={{margin:"6px 0 0",maxWidth:720,color:"var(--muted)",fontSize:13,lineHeight:1.5}}>Si venís ordenando tus números, seguí con la misma idea: mirá lo que te gusta y elegí siempre con tu presupuesto y tus metas a la vista.</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Cerrar bienvenida" style={{flex:"0 0 auto",width:38,height:38,borderRadius:999,border:"1px solid var(--border)",background:"var(--card)",color:"var(--foreground)",fontSize:20,lineHeight:1,cursor:"pointer"}}>×</button>
      </div>
    </section>
  );
}
