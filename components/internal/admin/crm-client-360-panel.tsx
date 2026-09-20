"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createCrmReadOnlyAdapter, type CrmReadResult } from "@/lib/crm/client-crm-adapter";
import type { V16CrmClient360Row, V16CrmClientSaleRow } from "@/lib/crm/client-crm-contract";
import { PaymentHistoryPanel } from "./payment-history-panel";

function money(value: number | string | null) {
  if (value === null) return "Dato no disponible";
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "Dato no disponible";
  return amount.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function StatusNotice({ result }: { result: CrmReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return <p className="crm-status-notice">Conexión requerida. Esta pantalla necesita una sesión autorizada para mostrar datos reales.</p>;
  }
  if (result.status === "unauthorized") {
    return <p className="crm-status-notice crm-status-notice--warn">Esta identidad no está autorizada a ver este cliente.</p>;
  }
  if (result.status === "error") {
    return <p className="crm-status-notice crm-status-notice--error">No pudimos cargar este cliente ({result.message}).</p>;
  }
  return null;
}

/**
 * Cliente 360 — 3 pestañas respaldadas por evidencia real: Resumen
 * (v16_crm_client_360), Ventas (v16_crm_client_sales) y Pagos
 * (v16_payment_history_list/summary, agregada por
 * V16_PAYMENT_HISTORY_UI_CONTRACT_CORRECTION, siempre acotada al
 * client_id ya cargado acá — nunca a otro cliente). No se agregan
 * pestañas de Cuotas/Entregas/Garantías/Documentos/Historial genérico
 * porque el contrato congelado no expone ninguna fuente de datos para
 * ellas — agregarlas mostraría secciones vacías disfrazadas de
 * funcionalidad real.
 */
export function CrmClient360Panel({ clientId, onBack }: { clientId: string; onBack: () => void }) {
  const [tab, setTab] = useState<"resumen" | "ventas" | "pagos">("resumen");
  const [profile, setProfile] = useState<CrmReadResult<V16CrmClient360Row | null>>({ status: "not_connected" });
  const [sales, setSales] = useState<CrmReadResult<V16CrmClientSaleRow[]>>({ status: "not_connected" });

  useEffect(() => {
    let cancelled = false;
    const adapter = createCrmReadOnlyAdapter();
    adapter.getClient360(clientId).then((result) => { if (!cancelled) setProfile(result); });
    adapter.getClientSales(clientId).then((result) => { if (!cancelled) setSales(result); });
    return () => { cancelled = true; };
  }, [clientId]);

  const client = profile.status === "ok" ? profile.data : null;

  return (
    <section className="crm-360" aria-labelledby="crm-360-title" data-guide-target="crm-client-360">
      <button type="button" className="crm-back" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> Volver a Clientes</button>

      {client
        ? <header className="crm-360-header">
            <div className="crm-avatar" aria-hidden="true">{(client.nombre ?? "?").slice(0, 2).toUpperCase()}</div>
            <div>
              <small>FICHA DE CLIENTE</small>
              <h2 id="crm-360-title">{client.nombre ?? "Nombre no disponible"}</h2>
              <p>{[client.localidad, client.direccion].filter(Boolean).join(" · ") || "Ubicación no disponible"}</p>
            </div>
          </header>
        : <header className="crm-360-header"><h2 id="crm-360-title">Cliente</h2></header>}

      <StatusNotice result={profile} />

      {client && <>
        <div className="crm-tabs" role="tablist" aria-label="Secciones de Cliente 360">
          <button type="button" role="tab" aria-selected={tab === "resumen"} className={tab === "resumen" ? "on" : ""} onClick={() => setTab("resumen")}>Resumen</button>
          <button type="button" role="tab" aria-selected={tab === "ventas"} className={tab === "ventas" ? "on" : ""} onClick={() => setTab("ventas")}>Ventas</button>
          <button type="button" role="tab" aria-selected={tab === "pagos"} className={tab === "pagos" ? "on" : ""} onClick={() => setTab("pagos")}>Pagos</button>
        </div>

        {tab === "resumen" && <div className="crm-metrics" data-guide-target="crm-client-360-resumen">
          <div className="crm-metric crm-metric--blue"><small>VENTAS</small><strong>{client.ventas_total}</strong></div>
          <div className="crm-metric crm-metric--green"><small>CUOTAS PAGADAS</small><strong>{client.cuotas_pagadas}</strong></div>
          <div className="crm-metric crm-metric--orange"><small>CUOTAS PENDIENTES</small><strong>{client.cuotas_pendientes}</strong></div>
          <div className="crm-metric"><small>CUOTAS TOTALES</small><strong>{client.cuotas_total}</strong></div>
        </div>}

        {tab === "resumen" && client.observaciones && <div className="crm-notes"><small>OBSERVACIONES</small><p>{client.observaciones}</p></div>}

        {tab === "ventas" && <div className="crm-sales-table" data-guide-target="crm-client-360-ventas">
          <StatusNotice result={sales} />
          {sales.status === "ok" && sales.data.length === 0 && <p className="crm-empty">Este cliente no tiene ventas registradas.</p>}
          {sales.status === "ok" && sales.data.map((sale) => (
            <div className="crm-sale-row" key={sale.id}>
              <div><b>{sale.producto ?? "Producto no disponible"}</b><small>{sale.fecha ?? "Fecha no disponible"} · {sale.tipo ?? "Tipo no disponible"}</small></div>
              <div className="crm-sale-amounts">
                <span>{money(sale.total)}</span>
                <small>{sale.cuotas !== null ? `${sale.pagadas ?? 0} de ${sale.cuotas} cuotas` : "Sin plan de cuotas"}</small>
              </div>
            </div>
          ))}
        </div>}

        {tab === "pagos" && <PaymentHistoryPanel clientId={clientId} />}
      </>}
    </section>
  );
}
