"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { createCollectionsReadOnlyAdapter, type CollectionsReadResult } from "@/lib/collections/collections-adapter";
import type { V16CollectionsListRow, V16CollectionsSummaryRow, V16CollectionStatus } from "@/lib/collections/collections-contract";
import { PaymentHistoryPanel } from "./payment-history-panel";

/**
 * V16 COBRANZAS — panel aditivo, read-only, dentro de /administracion.
 *
 * Usa exclusivamente `v16_collections_list` y `v16_collections_summary`
 * vía `CollectionsReadOnlyAdapter` — nunca lee `public.ventas` ni
 * `public.clientes` directamente. Sin sesión autenticada real en este
 * entorno, cae siempre en "Conexión requerida" — nunca
 * datos de ejemplo.
 *
 * Deliberadamente NO incluye (por instrucción explícita del gate y por
 * ausencia de fuente en el contrato congelado):
 * - registrar pago / marcar cuota como paga;
 * - aplicar recargo;
 * - movimiento de caja / conciliación (no hay RPC que devuelva eso);
 * - reglas comerciales de tolerancia/recargo (no son datos de la RPC,
 *   son configuración de negocio que no llegó congelada en este gate);
 * - "cobrado este mes" (no existe ese agregado en v16_collections_summary
 *   — la referencia visual lo muestra pero no está respaldado por
 *   evidencia; mostrarlo sería inventar un número).
 */

const STATUS_FILTERS: { label: string; value: V16CollectionStatus | null }[] = [
  { label: "Todas", value: null },
  { label: "Atrasadas", value: "OVERDUE" },
  { label: "Vencen hoy", value: "DUE_TODAY" },
  { label: "Próximas", value: "UPCOMING" },
  { label: "Datos incompletos", value: "DATA_INCOMPLETE" },
];

const STATUS_BADGE_LABEL: Record<V16CollectionStatus, string> = {
  COMPLETE: "Completa",
  OVERDUE: "Atrasada",
  DUE_TODAY: "Vence hoy",
  UPCOMING: "Próxima",
  DATA_INCOMPLETE: "Datos incompletos",
};

function money(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Monto no disponible";
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function StatusNotice({ result }: { result: CollectionsReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="collections-disconnected">
        <b>Conexión requerida</b>
        <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>Esta identidad no tiene permiso para ver cobranzas.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos conectar con Cobranzas</b><p>{result.message}</p></div>;
  }
  return null;
}

export function CollectionsPanel({ onOpenClient360 }: { onOpenClient360: (clientId: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<V16CollectionStatus | null>(null);
  const [summary, setSummary] = useState<CollectionsReadResult<V16CollectionsSummaryRow | null>>({ status: "not_connected" });
  const [list, setList] = useState<CollectionsReadResult<V16CollectionsListRow[]>>({ status: "not_connected" });
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const adapter = createCollectionsReadOnlyAdapter();
    adapter.getSummary().then((result) => { if (!cancelled) setSummary(result); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const adapter = createCollectionsReadOnlyAdapter();
    adapter.listCollections({ search_text: search.trim() || null, status_filter: statusFilter }).then((result) => { if (!cancelled) setList(result); });
    return () => { cancelled = true; };
  }, [search, statusFilter]);

  const summaryData = summary.status === "ok" ? summary.data : null;
  const rows = list.status === "ok" ? list.data : [];

  return (
    <section className="collections-panel" aria-labelledby="collections-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="collections-panel-title">Cobranzas</h2>
          <span>Lo que vence, lo que está atrasado y lo que falta confirmar.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Conexión segura · cobranzas reales · sin datos de prueba
      </div>

      {summaryData && (
        <div className="collections-metrics" data-guide-target="collections-summary">
          <div className="crm-metric crm-metric--orange"><small>ATRASADAS</small><strong>{summaryData.overdue_sales}</strong></div>
          <div className="crm-metric crm-metric--blue"><small>VENCEN HOY</small><strong>{summaryData.due_today_sales}</strong></div>
          <div className="crm-metric"><small>PRÓXIMAS</small><strong>{summaryData.upcoming_sales}</strong></div>
          <div className="crm-metric"><small>DATOS INCOMPLETOS</small><strong>{summaryData.data_incomplete_sales}</strong></div>
          <div className="crm-metric"><small>CUOTAS PENDIENTES</small><strong>{summaryData.pending_installments}</strong></div>
          <div className="crm-metric crm-metric--green"><small>MONTO PENDIENTE CONOCIDO</small><strong>{money(summaryData.nominal_pending_amount_known)}</strong></div>
          <div className="crm-metric"><small>VENTAS CON MONTO CONOCIDO</small><strong>{summaryData.known_amount_pending_sales}</strong></div>
          <div className="crm-metric"><small>VENTAS CON MONTO FALTANTE</small><strong>{summaryData.missing_amount_pending_sales}</strong></div>
        </div>
      )}
      {!summaryData && <StatusNotice result={summary} />}

      <div className="collections-filters" role="tablist" aria-label="Filtro de cobranzas" data-guide-target="collections-filters">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.value}
            className={statusFilter === filter.value ? "on" : ""}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="crm-search" data-guide-target="collections-search">
        <Search size={16} aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por cliente, producto o responsable"
        />
      </label>

      {list.status !== "ok" && <StatusNotice result={list} />}
      {list.status === "ok" && rows.length === 0 && (
        <div className="crm-empty-state"><b>Sin resultados</b><p>No encontramos cobranzas para este filtro o búsqueda.</p></div>
      )}

      {list.status === "ok" && rows.length > 0 && (
        <div className="collections-list" data-guide-target="collections-list">
          {rows.map((row) => (
            <article className="collections-row" key={row.sale_id}>
              <div className="collections-row-top">
                <div>
                  <small>{row.product_label ?? "Producto no disponible"} · {row.responsible ?? "Responsable no disponible"}</small>
                  <b>{row.client_name ?? "Cliente no disponible"}</b>
                </div>
                <span className={`badge badge--${row.collection_status.toLowerCase()}`}>{STATUS_BADGE_LABEL[row.collection_status]}</span>
              </div>
              <div className="collections-row-grid">
                <div className="box"><small>CUOTAS PENDIENTES</small><b>{row.installments_pending ?? "—"}{row.installments_total !== null ? ` de ${row.installments_total}` : ""}</b></div>
                <div className="box"><small>MONTO CUOTA</small><b>{money(row.installment_amount)}</b></div>
                <div className="box"><small>PRÓXIMO VENCIMIENTO</small><b>{row.next_due_date ?? "No disponible"}</b></div>
                <div className="box"><small>ORIGEN DE FECHA</small><b>{row.due_source === "PROJECTED_FROM_SALE_DATE" ? "Proyectada" : row.due_source === "NONE" ? "Sin fecha" : "Desconocido"}</b></div>
              </div>
              {row.data_quality_flags.length > 0 && (
                <div className="collections-flags">
                  {row.data_quality_flags.map((flag) => <span className="badge badge--data_incomplete" key={flag}>{flag}</span>)}
                </div>
              )}
              <div className="collections-actions">
                <button type="button" className="crm-open" onClick={() => onOpenClient360(row.client_id)}>Ver Cliente 360 →</button>
                <button
                  type="button"
                  className="crm-open"
                  style={{ marginLeft: 8 }}
                  onClick={() => setExpandedSaleId(expandedSaleId === row.sale_id ? null : row.sale_id)}
                  data-guide-target="collections-payment-history-toggle"
                >
                  {expandedSaleId === row.sale_id ? "Ocultar historial de pagos" : "Historial de pagos"}
                </button>
              </div>
              {expandedSaleId === row.sale_id && (
                <PaymentHistoryPanel clientId={row.client_id} saleId={row.sale_id} />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
