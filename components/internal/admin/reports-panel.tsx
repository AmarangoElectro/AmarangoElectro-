"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck } from "lucide-react";
import { createReportsReadOnlyAdapter, type ReportsReadResult } from "@/lib/reports/reports-adapter";
import type { V16ReportsSalesByMonthRow, V16ReportsSalesByResponsibleRow, V16ReportsSalesSummaryRow } from "@/lib/reports/reports-contract";

/**
 * V16 REPORTES — panel aditivo, read-only, dentro de /administracion.
 *
 * Usa exclusivamente `v16_reports_sales_summary`, `v16_reports_sales_by_month`
 * y `v16_reports_sales_by_responsible` — nunca lee `public.ventas`
 * directamente. Sin sesión autenticada real en este entorno, cae siempre
 * en "Conexión requerida" — nunca totales de ejemplo.
 *
 * Deliberadamente NO muestra (el contrato congelado no expone ninguno de
 * estos campos, y el gate los prohíbe explícitamente): ganancia, margen,
 * comisión, cobrado, saldo de caja, saldo de proveedor, ROI/rentabilidad.
 * Tampoco se agregan las tarjetas de Cobranzas/Caja/Productos/Asesores/
 * Proveedores/Entregas que muestra la referencia visual Premium V2 como
 * "Fuente pendiente" — este gate solo cubre Ventas, el único dominio con
 * RPC congelada real; el resto queda fuera para no fabricar un gallery de
 * placeholders no pedido explícitamente por el alcance del gate.
 */

function money(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Monto no disponible";
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function StatusNotice({ result }: { result: ReportsReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="reports-disconnected">
        <b>Conexión requerida</b>
        <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>Esta identidad no tiene permiso para ver reportes.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos conectar con Reportes</b><p>{result.message}</p></div>;
  }
  return null;
}

export function ReportsPanel() {
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  const [summary, setSummary] = useState<ReportsReadResult<V16ReportsSalesSummaryRow | null>>({ status: "not_connected" });
  const [byMonth, setByMonth] = useState<ReportsReadResult<V16ReportsSalesByMonthRow[]>>({ status: "not_connected" });
  const [byResponsible, setByResponsible] = useState<ReportsReadResult<V16ReportsSalesByResponsibleRow[]>>({ status: "not_connected" });

  useEffect(() => {
    let cancelled = false;
    const adapter = createReportsReadOnlyAdapter();
    const params = { period_from: periodFrom || null, period_to: periodTo || null, include_archived: includeArchived };
    adapter.getSalesSummary(params).then((result) => { if (!cancelled) setSummary(result); });
    adapter.getSalesByMonth(params).then((result) => { if (!cancelled) setByMonth(result); });
    adapter.getSalesByResponsible(params).then((result) => { if (!cancelled) setByResponsible(result); });
    return () => { cancelled = true; };
  }, [periodFrom, periodTo, includeArchived]);

  const summaryData = summary.status === "ok" ? summary.data : null;
  const monthRows = byMonth.status === "ok" ? byMonth.data : [];
  const responsibleRows = byResponsible.status === "ok" ? byResponsible.data : [];

  return (
    <section className="reports-panel" aria-labelledby="reports-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="reports-panel-title">Reportes</h2>
          <span>Ventas por período — cantidad, importe y participantes, solo con lo que la fuente conectada respalda.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Solo lectura · vía RPC segura (`v16_reports_sales_summary` / `..._by_month` / `..._by_responsible`) · sin acceso directo a `public.ventas`
      </div>

      <div className="reports-filters" data-guide-target="reports-filters">
        <label>
          <small>DESDE</small>
          <input type="date" value={periodFrom} onChange={(event) => setPeriodFrom(event.target.value)} />
        </label>
        <label>
          <small>HASTA</small>
          <input type="date" value={periodTo} onChange={(event) => setPeriodTo(event.target.value)} />
        </label>
        <label className="reports-toggle">
          <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />
          Incluir archivadas
        </label>
      </div>

      {summaryData && (
        <div className="collections-metrics" data-guide-target="reports-summary">
          <div className="crm-metric crm-metric--blue"><small>VENTAS</small><strong>{summaryData.sales_count}</strong></div>
          <div className="crm-metric"><small>PRODUCTO</small><strong>{summaryData.product_sales}</strong></div>
          <div className="crm-metric"><small>PRÉSTAMO</small><strong>{summaryData.loan_sales}</strong></div>
          <div className="crm-metric"><small>OTROS</small><strong>{summaryData.other_sales}</strong></div>
          <div className="crm-metric crm-metric--green"><small>PRECIO VENTA</small><strong>{money(summaryData.precio_venta_sum)}</strong></div>
          <div className="crm-metric"><small>ENVÍO</small><strong>{money(summaryData.shipping_amount_sum)}</strong></div>
          <div className="crm-metric crm-metric--orange"><small>CLIENTES DISTINTOS</small><strong>{summaryData.distinct_clients}</strong></div>
          <div className="crm-metric"><small>RESPONSABLES DISTINTOS</small><strong>{summaryData.distinct_responsibles}</strong></div>
        </div>
      )}
      {summaryData && (
        <p className="reports-range">
          Rango con datos: {summaryData.first_sale_date ?? "No disponible"} — {summaryData.last_sale_date ?? "No disponible"}
        </p>
      )}
      {!summaryData && <StatusNotice result={summary} />}

      <div className="reports-two">
        <section className="crm-notes" data-guide-target="reports-by-month">
          <div className="reports-section-head"><BarChart3 size={16} aria-hidden="true" /><b>Ventas por mes</b></div>
          {byMonth.status !== "ok" && <StatusNotice result={byMonth} />}
          {byMonth.status === "ok" && monthRows.length === 0 && <p className="crm-empty">Sin datos para este período.</p>}
          {byMonth.status === "ok" && monthRows.length > 0 && (
            <div className="reports-table">
              <div className="reports-table-row reports-table-row--head"><span>Mes</span><span>Ventas</span><span>Precio venta</span></div>
              {monthRows.map((row) => (
                <div className="reports-table-row" key={row.period_month}>
                  <span>{row.period_month}</span>
                  <span>{row.sales_count}</span>
                  <span>{money(row.precio_venta_sum)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="crm-notes" data-guide-target="reports-by-responsible">
          <div className="reports-section-head"><b>Ventas por responsable</b></div>
          {byResponsible.status !== "ok" && <StatusNotice result={byResponsible} />}
          {byResponsible.status === "ok" && responsibleRows.length === 0 && <p className="crm-empty">Sin datos para este período.</p>}
          {byResponsible.status === "ok" && responsibleRows.length > 0 && (
            <div className="reports-table">
              <div className="reports-table-row reports-table-row--head"><span>Responsable</span><span>Ventas</span><span>Precio venta</span></div>
              {responsibleRows.map((row) => (
                <div className="reports-table-row" key={row.responsible ?? "sin-responsable"}>
                  <span>{row.responsible ?? "Sin responsable"}</span>
                  <span>{row.sales_count}</span>
                  <span>{money(row.precio_venta_sum)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
