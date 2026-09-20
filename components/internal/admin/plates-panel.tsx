"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, FileText, Percent, ShieldCheck, Sparkles } from "lucide-react";
import { buildPlate, type PlateInputMode } from "../../../lib/internal/finance/plates-engine";

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;

export function PlatesPanel() {
  const [mode, setMode] = useState<PlateInputMode>("cost");
  const [fxRate, setFxRate] = useState(1500);
  const [discount, setDiscount] = useState<0|10|15>(0);
  const [text, setText] = useState("Samsung Galaxy A17 128GB\n$208.000");
  const result = useMemo(() => { try { return buildPlate({ text, mode, fxRate, discountPercent:discount, installmentPlans:[2,4,6] }); } catch { return null; } }, [text, mode, fxRate, discount]);

  return (
    <section className="admin-plates-panel admin-finance-tool">
      <header className="admin-finance-tool-header">
        <div className="admin-finance-tool-title"><span><Sparkles /></span><div><small>SISTEMA PLACAS · SOLO ADMIN</small><h2>Preparar placa comercial</h2><p>Pegá el producto, revisá el cálculo y copiá una salida ordenada.</p></div></div>
        <span className="admin-policy-badge"><ShieldCheck /> Vista privada</span>
      </header>
      <div className="admin-finance-tool-grid admin-plates-grid">
        <div className="admin-finance-controls">
          <div className="admin-finance-section-label"><FileText /><span>Datos de entrada</span></div>
          <div className="admin-calculator-modes" role="group" aria-label="Tipo de precio de entrada">
            <button type="button" onClick={() => setMode("cost")} aria-pressed={mode === "cost"}>Costo</button>
            <button type="button" onClick={() => setMode("sale")} aria-pressed={mode === "sale"}>Venta</button>
            <button type="button" onClick={() => setMode("usd")} aria-pressed={mode === "usd"}>Dólar</button>
          </div>
          {mode === "usd" && <label className="admin-finance-field"><span>Cotización USD</span><div><b>$</b><input type="number" value={fxRate} onChange={(event) => setFxRate(Number(event.target.value))} /></div></label>}
          <label className="admin-plates-input"><span>Producto y valor</span><textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
          <div className="admin-discount-control"><span><Percent /> Descuento opcional</span><div><button type="button" aria-pressed={discount === 10} onClick={() => setDiscount(discount === 10 ? 0 : 10)}>10% OFF</button><button type="button" aria-pressed={discount === 15} onClick={() => setDiscount(discount === 15 ? 0 : 15)}>15% OFF</button></div></div>
          <p className="admin-finance-helper">La placa se prepara localmente y no publica cambios.</p>
        </div>
        {result && <div className="admin-plate-result admin-finance-result">
          <div className="admin-plate-preview-label">PREVIEW COMERCIAL</div>
          <div className="admin-plate-brand">AMARANGO<span>ELECTRO</span></div>
          <h3>{result.name}</h3><strong className="admin-plate-price">{money(result.publicSalePrice)}</strong>
          <div className="admin-plate-installments">{result.installmentLines.map((line) => <p key={line.installments}><b>{line.installments} cuotas</b><span>{money(line.amount)}</span></p>)}</div>
          <details><summary>Datos privados Admin</summary><p>Costo {money(result.privateAdmin.costArs)} · Markup {result.privateAdmin.markupPercent}%</p></details>
          <button className="admin-plate-copy" type="button" onClick={() => navigator.clipboard?.writeText(result.shareText)}><ClipboardCopy /> Copiar placa</button>
        </div>}
      </div>
    </section>
  );
}
