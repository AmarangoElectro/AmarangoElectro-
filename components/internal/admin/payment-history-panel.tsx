"use client";

import { useEffect, useState } from "react";
import { createPaymentHistoryAdapter, type PaymentHistoryReadResult } from "@/lib/payments/payment-history-adapter";
import type { V16PaymentHistoryRow, V16PaymentHistorySummaryRow } from "@/lib/payments/payment-history-contract";

/**
 * V16 HISTORIAL DE PAGOS — componente reutilizable y embebido, read-only.
 *
 * Corregido por V16_PAYMENT_HISTORY_UI_CONTRACT_CORRECTION: ya no es una
 * pestaña de nivel superior de /administracion. Ahora se usa siempre con
 * alcance (scope) explícito — `clientId` y/o `saleId` — desde:
 * - Cobranzas: al expandir una venta puntual (client_id + sale_id);
 * - Cliente 360: como pestaña "Pagos" (solo client_id).
 *
 * Usa exclusivamente `v16_payment_history_list` y
 * `v16_payment_history_summary` — nunca lee `public.ventas` ni ninguna
 * tabla legacy directamente. No hay ninguna acción de registrar/anular
 * pago acá (esos RPC de escritura pertenecen a un contrato certificado
 * por separado, no tocado en esta corrección).
 *
 * Cobranzas responde "qué debería cobrarse" (proyección). Historial de
 * Pagos responde "qué pago/reversa quedó realmente registrado" (ledger
 * canónico). Nunca se fusionan ni se infiere uno desde el otro.
 */

function money(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Monto no disponible";
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function StatusNotice({ result }: { result: PaymentHistoryReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="payments-disconnected">
        <b>Conexión requerida</b>
        <p>Este historial necesita una sesión autorizada para mostrar datos reales.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>No tenés permiso para ver este historial.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos actualizar el historial</b><p>Intentá nuevamente.</p></div>;
  }
  return null;
}

export function PaymentHistoryPanel({ clientId = null, saleId = null }: { clientId?: string | null; saleId?: string | null }) {
  const [eventType, setEventType] = useState<"all" | "payment" | "reversal">("all");
  const [summary, setSummary] = useState<PaymentHistoryReadResult<V16PaymentHistorySummaryRow | null>>({ status: "not_connected" });
  const [list, setList] = useState<PaymentHistoryReadResult<V16PaymentHistoryRow[]>>({ status: "not_connected" });

  useEffect(() => {
    let cancelled = false;
    const adapter = createPaymentHistoryAdapter();
    adapter.getSummary({ clientId, saleId }).then((result) => { if (!cancelled) setSummary(result); });
    adapter.listPayments({ clientId, saleId }).then((result) => { if (!cancelled) setList(result); });
    return () => { cancelled = true; };
  }, [clientId, saleId]);

  const summaryData = summary.status === "ok" ? summary.data : null;
  const allRows = list.status === "ok" ? list.data : [];
  const rows = allRows.filter((row) => {
    if (eventType === "payment") return !row.reverses_payment_id;
    if (eventType === "reversal") return Boolean(row.reverses_payment_id);
    return true;
  });

  return (
    <section className="payment-history" aria-labelledby="payment-history-title" data-guide-target="payment-history">
      <div className="crm-notes">
        <small>HISTORIAL DE PAGOS</small>
        <h3 id="payment-history-title" style={{ margin: "6px 0" }}>Pagos y reversas registrados</h3>
      </div>

      {summaryData && (
        <div className="collections-metrics">
          <div className="crm-metric crm-metric--blue"><small>PAGOS REGISTRADOS</small><strong>{summaryData.payment_count}</strong></div>
          <div className="crm-metric crm-metric--orange"><small>REVERSAS</small><strong>{summaryData.reversal_count}</strong></div>
          <div className="crm-metric crm-metric--green"><small>TOTAL COBRADO</small><strong>{money(summaryData.payment_amount)}</strong></div>
          <div className="crm-metric"><small>TOTAL REVERTIDO</small><strong>{money(summaryData.reversed_amount)}</strong></div>
          <div className="crm-metric"><small>NETO REGISTRADO</small><strong>{money(summaryData.net_amount)}</strong></div>
        </div>
      )}
      {!summaryData && <StatusNotice result={summary} />}

      {summaryData && (
        <div className="collections-filters" style={{ marginTop: 10 }}>
          <button type="button" className={eventType === "all" ? "on" : ""} onClick={() => setEventType("all")}>Todos</button>
          <button type="button" className={eventType === "payment" ? "on" : ""} onClick={() => setEventType("payment")}>Pago</button>
          <button type="button" className={eventType === "reversal" ? "on" : ""} onClick={() => setEventType("reversal")}>Reversa</button>
        </div>
      )}

      {list.status !== "ok" && summaryData && <StatusNotice result={list} />}

      {list.status === "ok" && rows.length === 0 && (
        <div className="crm-empty-state" data-guide-target="payments-empty">
          <b>Todavía no hay pagos registrados en el historial.</b>
          <p>Los próximos pagos confirmados aparecerán acá automáticamente. Las cuotas anteriores que no fueron registradas en este sistema no se reconstruyen de forma automática.</p>
        </div>
      )}

      {list.status === "ok" && rows.length > 0 && (
        <div className="collections-list">
          {rows.map((payment) => {
            const isReversal = Boolean(payment.reverses_payment_id);
            return (
              <article className="collections-row" key={payment.payment_id}>
                <div className="collections-row-top">
                  <div>
                    <small>{payment.client_name ?? "Cliente no disponible"} · {payment.product_label ?? "Producto no disponible"}{payment.installment_number !== null ? ` · Cuota ${payment.installment_number}` : ""}</small>
                    <b>{isReversal ? "Pago revertido" : "Pago registrado"}</b>
                  </div>
                  <span className={isReversal ? "badge badge--overdue" : "badge badge--complete"}>{isReversal ? "Reversa" : "Pago"}</span>
                </div>
                <div className="collections-row-grid">
                  <div className="box"><small>MONTO</small><b>{money(payment.amount_received)}</b></div>
                  <div className="box"><small>FECHA</small><b>{payment.paid_at ?? "No disponible"}</b></div>
                  <div className="box"><small>MÉTODO</small><b>{payment.payment_method ?? "Método no informado"}</b></div>
                  <div className="box"><small>{isReversal ? "REVIERTE A" : "CUOTA BASE"}</small><b>{isReversal ? (payment.reverses_payment_id ?? "—") : money(payment.contractual_amount)}</b></div>
                </div>
                {payment.adjustment_amount !== null && payment.adjustment_amount !== 0 && (
                  <div className="crm-notes">
                    <small>AJUSTE</small>
                    <p>{money(payment.adjustment_amount)}{payment.adjustment_reason ? ` — ${payment.adjustment_reason}` : ""}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
