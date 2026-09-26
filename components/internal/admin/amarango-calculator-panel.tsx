"use client";

import { useMemo, useState } from "react";
import { Calculator, Check, CircleDollarSign, Copy, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { quoteAmarangoCalculator } from "../../../lib/internal/finance/amarango-calculator";
import { AMARANGO_POLICY_VERSION } from "../../../lib/internal/finance/amarango-policy";
import { quoteFinancedAdvisorCommission } from "../../../lib/internal/finance/advisor-compensation";
import {
  buildPlanProtegidoCommercialMessage,
  PLAN_PROTEGIDO_VERSION,
  quotePlanProtegido,
  type ProtectedCommissionSchedule,
  type ProtectedPaymentSchedule,
} from "../../../lib/internal/finance/plan-protegido";

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;
const money2 = (value: number) => `$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  // Calculadora clásica: la financiación permanece intacta, pero la base sale siempre de costo real.
  const [mode, setMode] = useState<"cost_ars" | "cost_usd">("cost_ars");
  const [amount, setAmount] = useState(150000);
  const [fxRate, setFxRate] = useState(1500);
  const quote = useMemo(() => {
    try { return quoteAmarangoCalculator({ mode, amount, fxRate, installmentPlans:[2,4,6] }); } catch { return null; }
  }, [mode, amount, fxRate]);

  // Plan Protegido: comparte exactamente el mismo precio contado definitivo.
  const [protectedCost, setProtectedCost] = useState(150000);
  const [productName, setProductName] = useState("");
  const [copied, setCopied] = useState(false);
  const protectedState = useMemo(() => {
    try { return { quote: quotePlanProtegido(protectedCost), error: null as string | null }; }
    catch (error) { return { quote: null, error: error instanceof Error ? error.message : "Configuración inválida del Plan Protegido" }; }
  }, [protectedCost]);
  const protectedQuote = protectedState.quote;
  const classicFinancedCommission = useMemo(() => quote ? quoteFinancedAdvisorCommission(quote.salePrice) : null, [quote]);
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
        <div className="admin-finance-tool-title"><span><Calculator /></span><div><small>HERRAMIENTA PRIVADA · SOLO ADMIN</small><h2>Calculadora AmarangoElectro</h2><p>Clásica y Plan Protegido comparten costo real, piso de coherencia y precio contado definitivo.</p></div></div>
        <span className="admin-policy-badge"><ShieldCheck /> {formula === "current" ? `Política ${AMARANGO_POLICY_VERSION}` : `Protegido ${PLAN_PROTEGIDO_VERSION}`}</span>
      </header>

      <div className="admin-calculator-formula-tabs" role="group" aria-label="Fórmula de financiación">
        <button type="button" onClick={() => setFormula("current")} aria-pressed={formula === "current"}>Calculadora clásica</button>
        <button type="button" onClick={() => setFormula("protected")} aria-pressed={formula === "protected"}>Plan Protegido</button>
      </div>

      {formula === "current" ? (
        <div className="admin-finance-tool-grid" data-calculator-formula="current">
          <div className="admin-finance-controls">
            <div className="admin-finance-section-label"><CircleDollarSign /><span>Costo real · fuente de verdad</span></div>
            <div className="admin-calculator-modes" role="group" aria-label="Moneda del costo real">
              <button type="button" onClick={() => setMode("cost_ars")} aria-pressed={mode === "cost_ars"}>Costo ARS</button>
              <button type="button" onClick={() => setMode("cost_usd")} aria-pressed={mode === "cost_usd"}>Costo USD</button>
            </div>
            <label className="admin-finance-field"><span>Precio de costo real</span><div><b>$</b><input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div></label>
            {mode === "cost_usd" && <label className="admin-finance-field"><span>Cotización USD</span><div><b>$</b><input type="number" value={fxRate} onChange={(event) => setFxRate(Number(event.target.value))} /></div></label>}
            <p className="admin-finance-helper">No se infiere el costo desde el precio de venta. La financiación 2/4/6 conserva sus porcentajes actuales.</p>
          </div>
          {quote && <div className="admin-calculator-result admin-finance-result">
            <div className="admin-result-primary"><span><WalletCards /></span><small>PRECIO CONTADO DEFINITIVO</small><strong>{money(quote.salePrice)}</strong><p>Costo {money(quote.costArs)} · Markup {quote.markupPercent}%</p></div>
            <div className="admin-result-metrics admin-protected-base-metrics">
              <div><small>Precio antes de coherencia</small><strong>{quote.markupPrice === null ? "—" : money2(quote.markupPrice)}</strong></div>
              <div><small>Piso de coherencia</small><strong>{quote.coherenceApplied ? "SÍ" : "NO"}</strong></div>
              <div><small>Precio coherente</small><strong>{quote.coherentPrice === null ? "—" : money2(quote.coherentPrice)}</strong></div>
              <div><small>Terminación comercial</small><strong>{quote.commercialTermination === null ? "—" : `.${String(quote.commercialTermination).padStart(3,"0")}`}</strong></div>
              <div><small>Ajuste comercial</small><strong>{quote.commercialAdjustmentArs === null ? "—" : money2(quote.commercialAdjustmentArs)}</strong></div>
              <div><small>Comisión contado 10%</small><strong>{money(quote.salePrice * .10)}</strong></div>
              <div><small>Ganancia neta contado</small><strong>{money(quote.salePrice - quote.costArs - quote.salePrice * .10)}</strong></div>
              <div><small>Política financiera</small><strong>{AMARANGO_POLICY_VERSION}</strong></div>
            </div>
            <div className="admin-installment-grid"><div className="admin-finance-section-label"><TrendingUp /><span>Opciones clásicas</span></div>{quote.installments.map((plan) => <article key={plan.installments}><small>{plan.installments} CUOTAS</small><strong>{money(plan.installmentAmount)}</strong><span>Total {money(plan.total)}</span><span>Comisión financiada fija: {classicFinancedCommission ? money(classicFinancedCommission.commissionArs) : "—"}</span><span>{classicFinancedCommission ? `2 pagos de ${money(classicFinancedCommission.paymentArs[0])}` : ""}</span><span>Ganancia Amarango: {classicFinancedCommission ? money(plan.total - quote.costArs - classicFinancedCommission.commissionArs) : "—"}</span></article>)}</div>
          </div>}
        </div>
      ) : (
        <div className="admin-finance-tool-grid admin-protected-grid" data-calculator-formula="protected">
          <div className="admin-finance-controls">
            <div className="admin-finance-section-label"><ShieldCheck /><span>Plan Protegido · costo real</span></div>
            <label className="admin-finance-field"><span>Nombre del producto</span><div><input type="text" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Ej. Smart TV Samsung 55&quot;" /></div></label>
            <label className="admin-finance-field"><span>Precio de costo real</span><div><b>$</b><input type="number" min="1" step="1" value={protectedCost} onChange={(event) => setProtectedCost(Number(event.target.value))} /></div></label>
            <p className="admin-finance-helper">Comparte el mismo contado definitivo que la Calculadora Clásica. La inicial busca 75% del costo, respeta el tope de 55% del contado y sube sólo lo mínimo necesario para que todas las cuotas posteriores sean menores.</p>
            {protectedState.error && <p className="admin-finance-helper"><strong>CONFIGURACIÓN INVÁLIDA:</strong> {protectedState.error}</p>}
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
                <p>Contado {money(protectedQuote.cashPriceExact)} · Markup {protectedQuote.markupPercent}%</p>
              </div>

              <div className="admin-result-metrics admin-protected-base-metrics">
                <div><small>Costo real</small><strong>{money(protectedQuote.costExact)}</strong></div>
                <div><small>Precio antes de coherencia</small><strong>{money2(protectedQuote.pricing.markupPrice)}</strong></div>
                <div><small>Piso aplicado</small><strong>{protectedQuote.pricing.coherenceApplied ? "SÍ" : "NO"}</strong></div>
                <div><small>Precio coherente</small><strong>{money2(protectedQuote.pricing.coherentPrice)}</strong></div>
                <div><small>Terminación comercial</small><strong>{`.${String(protectedQuote.pricing.commercialTermination).padStart(3,"0")}`}</strong></div>
                <div><small>Precio contado definitivo</small><strong>{money(protectedQuote.cashPriceExact)}</strong></div>
                <div><small>Objetivo inicial · 75% costo</small><strong>{money2(protectedQuote.initialObjectiveExact)}</strong></div>
                <div><small>Tope inicial · 55% contado</small><strong>{money2(protectedQuote.initialCapExact)}</strong></div>
                <div><small>Inicial base</small><strong>{money2(protectedQuote.initialBaseExact)}</strong></div>
                <div><small>Mínimo Plan 3</small><strong>{money2(protectedQuote.minInitial3Exact)}</strong></div>
                <div><small>Mínimo Plan 6</small><strong>{money2(protectedQuote.minInitial6Exact)}</strong></div>
                <div><small>Inicial protegida</small><strong>{money(protectedQuote.initialPesos)}</strong></div>
                <div><small>Ajuste vs. inicial base</small><strong>{money(protectedQuote.initialAdjustmentPesos)}</strong></div>
                <div><small>Regla decisiva</small><strong>{
                  protectedQuote.initialReason === "plan3_balance_floor" ? "Equilibrio Plan 3" :
                  protectedQuote.initialReason === "plan6_balance_floor" ? "Equilibrio Plan 6" :
                  protectedQuote.initialReason === "strict_relief_adjustment" ? "Alivio estricto posterior" :
                  protectedQuote.initialReason === "55_percent_cash_cap" ? "Tope 55% contado" : "75% costo"
                }</strong></div>
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
                  <span>Comisión financiada fija: {money(protectedQuote.plan3.commission.totalExact)}</span>
                  <span>{commissionSummary(protectedQuote.plan3.commission)}</span>
                  <span>Ganancia neta Amarango: {money(protectedQuote.plan3.amarangoNetExact)}</span>
                </article>
                <article>
                  <small>⚡ PLAN 6 CUOTAS</small>
                  <strong>Total financiado {money(protectedQuote.plan6.totalExact)}</strong>
                  <span>Recargo vigente Fórmula 1: {protectedQuote.plan6.surchargePercent}%</span>
                  <span>Inicial: {money(protectedQuote.plan6.schedule.initialPesos)}</span>
                  <span>Posteriores: {paymentSummary(protectedQuote.plan6.schedule)}</span>
                  <span>Comisión financiada fija: {money(protectedQuote.plan6.commission.totalExact)}</span>
                  <span>{commissionSummary(protectedQuote.plan6.commission)}</span>
                  <span>Ganancia neta Amarango: {money(protectedQuote.plan6.amarangoNetExact)}</span>
                </article>
              </div>
              <p className="admin-finance-helper">La inicial nunca supera 55% del contado y debe ser mayor que cada cuota posterior. Los importes internos se conservan en centavos; si una división deja diferencia al mostrar pesos, sólo se ajusta la última cuota para cerrar el total exacto mostrado.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
