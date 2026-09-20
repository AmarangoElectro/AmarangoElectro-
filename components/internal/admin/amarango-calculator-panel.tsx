"use client";

import { useMemo, useState } from "react";
import { Calculator, CircleDollarSign, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { quoteAmarangoCalculator } from "../../../lib/internal/finance/amarango-calculator";
import { AMARANGO_POLICY_VERSION } from "../../../lib/internal/finance/amarango-policy";

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;

export function AmarangoCalculatorPanel() {
  const [mode, setMode] = useState<"cost_ars" | "sale_ars" | "cost_usd">("cost_ars");
  const [amount, setAmount] = useState(150000);
  const [fxRate, setFxRate] = useState(1500);
  const quote = useMemo(() => {
    try { return quoteAmarangoCalculator({ mode, amount, fxRate, installmentPlans:[2,4,6] }); } catch { return null; }
  }, [mode, amount, fxRate]);

  return (
    <section className="admin-calculator-panel admin-finance-tool">
      <header className="admin-finance-tool-header">
        <div className="admin-finance-tool-title"><span><Calculator /></span><div><small>HERRAMIENTA PRIVADA · SOLO ADMIN</small><h2>Calculadora AmarangoElectro</h2><p>Costo, contado y cuotas reunidos en una sola lectura.</p></div></div>
        <span className="admin-policy-badge"><ShieldCheck /> Política {AMARANGO_POLICY_VERSION}</span>
      </header>
      <div className="admin-finance-tool-grid">
        <div className="admin-finance-controls">
          <div className="admin-finance-section-label"><CircleDollarSign /><span>Punto de partida</span></div>
          <div className="admin-calculator-modes" role="group" aria-label="Tipo de cálculo">
            <button type="button" onClick={() => setMode("cost_ars")} aria-pressed={mode === "cost_ars"}>Costo ARS</button>
            <button type="button" onClick={() => setMode("sale_ars")} aria-pressed={mode === "sale_ars"}>Venta ARS</button>
            <button type="button" onClick={() => setMode("cost_usd")} aria-pressed={mode === "cost_usd"}>Costo USD</button>
          </div>
          <label className="admin-finance-field"><span>Monto de referencia</span><div><b>$</b><input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div></label>
          {mode === "cost_usd" && <label className="admin-finance-field"><span>Cotización USD</span><div><b>$</b><input type="number" value={fxRate} onChange={(event) => setFxRate(Number(event.target.value))} /></div></label>}
          <p className="admin-finance-helper">El cálculo es una proyección local. No guarda ni modifica productos.</p>
        </div>
        {quote && <div className="admin-calculator-result admin-finance-result">
          <div className="admin-result-primary"><span><WalletCards /></span><small>CONTADO SUGERIDO</small><strong>{money(quote.salePrice)}</strong><p>Costo {money(quote.costArs)} · Markup {quote.markupPercent}%</p></div>
          <div className="admin-result-metrics"><div><small>Ganancia bruta</small><strong>{money(quote.grossMarginArs)}</strong></div><div><small>Política aplicada</small><strong>{AMARANGO_POLICY_VERSION}</strong></div></div>
          <div className="admin-installment-grid"><div className="admin-finance-section-label"><TrendingUp /><span>Opciones de cuotas</span></div>{quote.installments.map((plan) => <article key={plan.installments}><small>{plan.installments} CUOTAS</small><strong>{money(plan.installmentAmount)}</strong><span>cada cuota</span></article>)}</div>
        </div>}
      </div>
    </section>
  );
}
