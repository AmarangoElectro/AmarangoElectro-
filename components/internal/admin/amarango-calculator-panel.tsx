"use client";

import { useMemo, useState } from "react";
import { Calculator, Check, CircleDollarSign, Copy, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { quoteAmarangoCalculator } from "../../../lib/internal/finance/amarango-calculator";
import { AMARANGO_POLICY_VERSION } from "../../../lib/internal/finance/amarango-policy";
import {
  buildPlanProtegidoCommercialMessage,
  PLAN_PROTEGIDO_VERSION,
  quotePlanProtegido,
  type ProtectedCommissionSchedule,
  type ProtectedPaymentSchedule,
} from "../../../lib/internal/finance/plan-protegido";

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;

function paymentSummary(schedule: ProtectedPaymentSchedule) {
  const payments = [...schedule.laterPesos];
  const first = payments[0];
  if (payments.every((value) => value === first)) return `${payments.length} × ${money(first)}`;
  return `${payments.slice(0, -1).length} × ${money(first)} + última ${money(payments[payments.length - 1])}`;
}

function commissionSummary(commission: ProtectedCommissionSchedule) {
  if (commission.paymentCount === 1) return money(commission.totalPesos);
  const payments = [...commission.paymentPesos];
  const first = payments[0];
  if (payments.every((value) => value === first)) return `${commission.paymentCount} pagos de ${money(first)}`;
  return `${commission.paymentCount - 1} × ${money(first)} + último ${money(payments[payments.length - 1])}`;
}

export function AmarangoCalculatorPanel() {
  const [formula, setFormula] = useState<"current" | "protected">("current");

  // Formula actual: preserved as-is.
  const [mode, setMode] = useState<"cost_ars" | "sale_ars" | "cost_usd">("cost_ars");
  const [amount, setAmount] = useState(150000);
  const [fxRate, setFxRate] = useState(1500);
  const quote = useMemo(() => {
    try { return quoteAmarangoCalculator({ mode, amount, fxRate, installmentPlans:[2,4,6] }); } catch { return null; }
  }, [mode, amount, fxRate]);

  // Plan Protegido: independent cost-only source of truth.
  const [protectedCost, setProtectedCost] = useState(150000);
  const [productName, setProductName] = useState("");
  const [copied, setCopied] = useState(false);
  const protectedQuote = useMemo(() => {
    try { return quotePlanProtegido(protectedCost); } catch { return null; }
  }, [protectedCost]);
  const commercialMessage = useMemo(
    () => protectedQuote ? buildPlanProtegidoCommercialMessage(productName, protectedQuote) : "",
    [productName, protectedQuote],
  );

  async function copyCommercialMessage() {
    if (!commercialMessage || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(commercialMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="admin-calculator-panel admin-finance-tool">
      <header className="admin-finance-tool-header">
        <div className="admin-finance-tool-title"><span><Calculator /></span><div><small>HERRAMIENTA PRIVADA · SOLO ADMIN</small><h2>Calculadora AmarangoElectro</h2><p>Dos fórmulas independientes. La fórmula actual permanece intacta.</p></div></div>
        <span className="admin-policy-badge"><ShieldCheck /> {formula === "current" ? `Política ${AMARANGO_POLICY_VERSION}` : `Protegido ${PLAN_PROTEGIDO_VERSION}`}</span>
      </header>

      <div className="admin-calculator-formula-tabs" role="group" aria-label="Fórmula de financiación">
        <button type="button" onClick={() => setFormula("current")} aria-pressed={formula === "current"}>Fórmula actual</button>
        <button type="button" onClick={() => setFormula("protected")} aria-pressed={formula === "protected"}>Plan Protegido</button>
      </div>

      {formula === "current" ? (
        <div className="admin-finance-tool-grid" data-calculator-formula="current">
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
      ) : (
        <div className="admin-finance-tool-grid admin-protected-grid" data-calculator-formula="protected">
          <div className="admin-finance-controls">
            <div className="admin-finance-section-label"><ShieldCheck /><span>Plan Protegido · costo como fuente de verdad</span></div>
            <label className="admin-finance-field"><span>Nombre del producto</span><div><input type="text" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Ej. Smart TV Samsung 55&quot;" /></div></label>
            <label className="admin-finance-field"><span>Precio de costo real</span><div><b>$</b><input type="number" min="1" step="1" value={protectedCost} onChange={(event) => setProtectedCost(Number(event.target.value))} /></div></label>
            <p className="admin-finance-helper">Esta fórmula no deduce costos ni usa el precio de venta como origen. El costo cargado es la fuente de verdad.</p>
            {protectedQuote && (
              <div className="admin-protected-commercial">
                <div className="admin-finance-section-label"><WalletCards /><span>Mensaje comercial</span></div>
                <pre>{commercialMessage}</pre>
                <button type="button" onClick={copyCommercialMessage}>{copied ? <Check /> : <Copy />}{copied ? "Copiado" : "Copiar mensaje"}</button>
              </div>
            )}
          </div>

          {protectedQuote && (
            <div className="admin-calculator-result admin-finance-result">
              <div className="admin-result-primary admin-protected-primary">
                <span><ShieldCheck /></span>
                <small>🐝 LLEVÁTELO HOY POR</small>
                <strong>{money(protectedQuote.initialPesos)}</strong>
                <p>Contado {money(protectedQuote.cashPriceExact)} · Markup interno {protectedQuote.markupPercent}%</p>
              </div>

              <div className="admin-result-metrics admin-protected-base-metrics">
                <div><small>Costo real</small><strong>{money(protectedQuote.costExact)}</strong></div>
                <div><small>Precio contado</small><strong>{money(protectedQuote.cashPriceExact)}</strong></div>
                <div><small>Markup aplicado</small><strong>{protectedQuote.markupPercent}%</strong></div>
                <div><small>Base inicial 75%</small><strong>{money(protectedQuote.baseInitialExact)}</strong></div>
                <div><small>Inicial protegida aplicada</small><strong>{money(protectedQuote.initialPesos)}</strong></div>
              </div>

              <div className="admin-protected-plan-grid">
                <article>
                  <small>CONTADO</small>
                  <strong>{money(protectedQuote.cashPriceExact)}</strong>
                  <span>Comisión 10%: {money(protectedQuote.cashCommission.totalExact)} · 1 pago</span>
                  <span>Ganancia neta Amarango: {money(protectedQuote.cashAmarangoNetExact)}</span>
                </article>
                <article>
                  <small>🚀 PLAN 3 CUOTAS</small>
                  <strong>Total financiado {money(protectedQuote.plan3.totalExact)}</strong>
                  <span>Inicial: {money(protectedQuote.plan3.schedule.initialPesos)}</span>
                  <span>Posteriores: {paymentSummary(protectedQuote.plan3.schedule)}</span>
                  <span>Comisión total 15%: {money(protectedQuote.plan3.commission.totalExact)}</span>
                  <span>{commissionSummary(protectedQuote.plan3.commission)}</span>
                  <span>Ganancia neta Amarango: {money(protectedQuote.plan3.amarangoNetExact)}</span>
                </article>
                <article>
                  <small>⚡ PLAN 6 CUOTAS</small>
                  <strong>Total financiado {money(protectedQuote.plan6.totalExact)}</strong>
                  <span>Recargo vigente Fórmula 1: {protectedQuote.plan6.surchargePercent}%</span>
                  <span>Inicial: {money(protectedQuote.plan6.schedule.initialPesos)}</span>
                  <span>Posteriores: {paymentSummary(protectedQuote.plan6.schedule)}</span>
                  <span>Comisión total 15%: {money(protectedQuote.plan6.commission.totalExact)}</span>
                  <span>{commissionSummary(protectedQuote.plan6.commission)}</span>
                  <span>Ganancia neta Amarango: {money(protectedQuote.plan6.amarangoNetExact)}</span>
                </article>
              </div>
              <p className="admin-finance-helper">La inicial toma 75% del costo como piso y sube automáticamente cuando haga falta para quedar siempre por encima de todas las cuotas posteriores. Ajuste aplicado: {money(protectedQuote.initialAdjustmentPesos)}. Los importes mostrados se cierran a pesos y cualquier diferencia queda únicamente en el último pago.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
