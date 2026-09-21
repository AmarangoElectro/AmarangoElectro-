"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { createDeliveriesAdapter, type DeliveriesReadResult } from "@/lib/deliveries/deliveries-adapter";
import {
  V16_DELIVERY_LEGAL_TRANSITIONS,
  V16_DELIVERY_STATUS_LABEL,
  V16_DELIVERY_TERMINAL_STATUSES,
  type V16DeliveryRow,
  type V16DeliveryStatus,
} from "@/lib/deliveries/deliveries-contract";

/**
 * V16 ENTREGAS — panel aditivo dentro de /administracion.
 *
 * Usa exclusivamente v16_deliveries_list / v16_delivery_detail (lectura) y
 * v16_create_delivery / v16_transition_delivery (escritura) vía
 * `DeliveriesAdapter` — nunca lee/escribe la tabla `v16_deliveries`
 * directamente, y nunca usa ni infiere `ventas.estado` como autoridad de
 * estado de entrega.
 *
 * Fail-closed real: sin sesión, cada llamada resuelve "not_connected" y la
 * UI lo muestra explícitamente. Ninguna escritura se marca como completada
 * localmente antes de que el servidor la confirme. Las transiciones envían
 * el estado actual esperado (`expectedCurrentStatus`) cuando se conoce; si
 * el backend rechaza por estado obsoleto, la UI nunca sobrescribe ni
 * reintenta automáticamente — solo refetch + mensaje humano.
 */

const STATUS_FILTERS: { label: string; value: V16DeliveryStatus | null }[] = [
  { label: "Todas", value: null },
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Coordinadas", value: "COORDINADA" },
  { label: "En camino", value: "EN_CAMINO" },
  { label: "Entregadas", value: "ENTREGADA" },
  { label: "Canceladas", value: "CANCELADA" },
];

function isTerminal(status: string) {
  return V16_DELIVERY_TERMINAL_STATUSES.includes(status as V16DeliveryStatus);
}

function statusLabel(status: string) {
  return V16_DELIVERY_STATUS_LABEL[status as V16DeliveryStatus] ?? status;
}

/** Maps the Spanish delivery status enum to the app's existing (English-suffixed) badge CSS classes — no new CSS added. */
const STATUS_BADGE_CLASS: Record<V16DeliveryStatus, string> = {
  PENDIENTE: "badge--upcoming",
  COORDINADA: "badge--waiting_us",
  EN_CAMINO: "badge--due_today",
  ENTREGADA: "badge--complete",
  CANCELADA: "badge--cancelled",
};

function statusBadgeClass(status: string) {
  return STATUS_BADGE_CLASS[status as V16DeliveryStatus] ?? "badge--data_incomplete";
}

function StatusNotice({ result }: { result: DeliveriesReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="deliveries-disconnected">
        <b>Conexión requerida</b>
        <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>Esta identidad no tiene permiso para ver Entregas.</p></div>;
  }
  if (result.status === "step_up_required") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Verificación adicional requerida</b><p>Por seguridad, necesitás verificar nuevamente tu identidad para continuar.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos completar la operación</b><p>{result.message}</p></div>;
  }
  return null;
}

function CoordinateDialog({ delivery, onClose, onDone }: { delivery: V16DeliveryRow; onClose: () => void; onDone: () => void }) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [addressSnapshot, setAddressSnapshot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DeliveriesReadResult<unknown> | null>(null);

  async function submit() {
    setSubmitting(true);
    const adapter = createDeliveriesAdapter();
    const response = await adapter.transitionDelivery({
      deliveryId: delivery.delivery_id,
      targetStatus: "COORDINADA",
      expectedCurrentStatus: delivery.status as V16DeliveryStatus,
      scheduledAt: scheduledAt || null,
      addressSnapshot: addressSnapshot.trim() || null,
    });
    setSubmitting(false);
    setResult(response);
    if (response.status === "ok") onDone();
  }

  return (
    <div className="crm-notes" data-guide-target="deliveries-coordinate-dialog">
      <small>COORDINAR ENTREGA</small>
      <label className="crm-search">
        <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} placeholder="Fecha/hora programada (opcional)" />
      </label>
      <label className="crm-search">
        <input value={addressSnapshot} onChange={(event) => setAddressSnapshot(event.target.value)} placeholder="Dirección de esta entrega (opcional)" />
      </label>
      {result && result.status !== "ok" && <StatusNotice result={result} />}
      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={submit} disabled={submitting}>{submitting ? "Coordinando…" : "Confirmar coordinación"}</button>
        <button type="button" className="crm-open" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

function DeliveryDetailView({ deliveryId, onBack }: { deliveryId: number; onBack: () => void }) {
  const [detail, setDetail] = useState<DeliveriesReadResult<V16DeliveryRow | null>>({ status: "not_connected" });
  const [actionNotice, setActionNotice] = useState<DeliveriesReadResult<unknown> | null>(null);
  const [coordinating, setCoordinating] = useState(false);

  function refetch() {
    const adapter = createDeliveriesAdapter();
    adapter.getDetail({ deliveryId }).then(setDetail);
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId]);

  const delivery = detail.status === "ok" ? detail.data : null;

  async function transition(targetStatus: V16DeliveryStatus, note: string | null = null) {
    if (!delivery) return;
    const adapter = createDeliveriesAdapter();
    const result = await adapter.transitionDelivery({
      deliveryId: delivery.delivery_id,
      targetStatus,
      expectedCurrentStatus: delivery.status as V16DeliveryStatus,
      note,
    });
    setActionNotice(result);
    // Never overwrite locally on rejection (e.g. stale expected status) — always refetch canonical state.
    refetch();
  }

  return (
    <section className="crm-360" aria-labelledby="delivery-detail-title" data-guide-target="deliveries-detail">
      <button type="button" className="crm-back" onClick={onBack}>← Volver a Entregas</button>
      <StatusNotice result={detail} />
      {delivery && <>
        <header className="crm-360-header">
          <div>
            <small>{delivery.client_name || "Sin cliente asociado"}</small>
            <h2 id="delivery-detail-title">{delivery.product_label || `Entrega #${delivery.delivery_id}`}</h2>
            <p><span className={`badge ${statusBadgeClass(delivery.status)}`}>{statusLabel(delivery.status)}</span></p>
          </div>
        </header>

        <div className="crm-notes">
          <small>CONTEXTO</small>
          <p>
            Programada: {delivery.scheduled_at || "Sin fecha"} · Entregada: {delivery.delivered_at || "Todavía no"}
            {delivery.address_snapshot ? ` · Dirección: ${delivery.address_snapshot}` : ""}
          </p>
        </div>

        {actionNotice && actionNotice.status !== "ok" && <StatusNotice result={actionNotice} />}

        {!isTerminal(delivery.status) && !coordinating && (
          <div className="collections-actions" data-guide-target="deliveries-transitions">
            {V16_DELIVERY_LEGAL_TRANSITIONS[delivery.status as V16DeliveryStatus]?.map((next) => (
              <button
                key={next}
                type="button"
                className="crm-open"
                style={{ marginRight: 8, marginTop: 8 }}
                onClick={() => {
                  if (next === "COORDINADA") { setCoordinating(true); return; }
                  if (next === "CANCELADA") {
                    const note = window.prompt("Nota para la cancelación (opcional):");
                    transition(next, note || null);
                    return;
                  }
                  transition(next);
                }}
              >
                {next === "COORDINADA" ? "Coordinar" : next === "EN_CAMINO" ? "Marcar en camino" : next === "ENTREGADA" ? "Marcar entregada" : `Cancelar`}
              </button>
            ))}
          </div>
        )}
        {coordinating && (
          <CoordinateDialog
            delivery={delivery}
            onClose={() => setCoordinating(false)}
            onDone={() => { setCoordinating(false); refetch(); }}
          />
        )}
        {isTerminal(delivery.status) && <p className="crm-empty">Esta entrega está en un estado terminal y no admite más transiciones.</p>}
      </>}
    </section>
  );
}

function CreateDeliveryForm({ onCreated, onCancel }: { onCreated: (deliveryId: number) => void; onCancel: () => void }) {
  const [saleId, setSaleId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [addressSnapshot, setAddressSnapshot] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<DeliveriesReadResult<unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!saleId.trim()) return;
    setSubmitting(true);
    const adapter = createDeliveriesAdapter();
    const created = await adapter.createDelivery({
      saleId: saleId.trim(),
      scheduledAt: scheduledAt || null,
      addressSnapshot: addressSnapshot.trim() || null,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    setResult(created);
    if (created.status === "ok" && created.data) onCreated(created.data.delivery_id);
  }

  return (
    <section className="crm-360" data-guide-target="deliveries-create-form">
      <button type="button" className="crm-back" onClick={onCancel}>← Cancelar</button>
      <h2>Nueva entrega</h2>
      <label className="crm-search">
        <input value={saleId} onChange={(event) => setSaleId(event.target.value)} placeholder="ID de venta" />
      </label>
      <div className="reports-filters">
        <label>
          <small>FECHA PROGRAMADA</small>
          <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
        </label>
      </div>
      <label className="crm-search">
        <input value={addressSnapshot} onChange={(event) => setAddressSnapshot(event.target.value)} placeholder="Dirección de entrega (opcional)" />
      </label>
      <label className="crm-search">
        <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Nota interna (opcional)" />
      </label>
      {result && result.status !== "ok" && <StatusNotice result={result} />}
      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={submit} disabled={submitting || !saleId.trim()}>
          {submitting ? "Creando…" : "Crear entrega"}
        </button>
      </div>
    </section>
  );
}

export function DeliveriesPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<V16DeliveryStatus | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveriesReadResult<V16DeliveryRow[]>>({ status: "not_connected" });
  const [view, setView] = useState<{ mode: "list" } | { mode: "detail"; deliveryId: number } | { mode: "create" }>({ mode: "list" });

  useEffect(() => {
    let cancelled = false;
    const adapter = createDeliveriesAdapter();
    adapter.listDeliveries({ statusFilter, searchText: search.trim() || null }).then((next) => { if (!cancelled) setDeliveries(next); });
    return () => { cancelled = true; };
  }, [search, statusFilter, view.mode]);

  if (view.mode === "detail") return <DeliveryDetailView deliveryId={view.deliveryId} onBack={() => setView({ mode: "list" })} />;
  if (view.mode === "create") {
    return <CreateDeliveryForm onCreated={(deliveryId) => setView({ mode: "detail", deliveryId })} onCancel={() => setView({ mode: "list" })} />;
  }

  const rows = deliveries.status === "ok" ? deliveries.data : [];

  return (
    <section className="collections-panel" aria-labelledby="deliveries-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="deliveries-panel-title">Entregas</h2>
          <span>Seguimiento de cada entrega desde la coordinación hasta la confirmación final.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Conexión segura · cada entrega conserva su propio estado y seguimiento
      </div>

      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={() => setView({ mode: "create" })}><Plus size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} /> Nueva entrega</button>
      </div>

      <div className="collections-filters" data-guide-target="deliveries-filters">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={statusFilter === option.value ? "on" : ""}
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="crm-search" data-guide-target="deliveries-search">
        <Search size={16} aria-hidden="true" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente o producto" />
      </label>

      {deliveries.status !== "ok" && <StatusNotice result={deliveries} />}
      {deliveries.status === "ok" && rows.length === 0 && (
        <div className="crm-empty-state" data-guide-target="deliveries-empty">
          <b>Todavía no hay entregas registradas.</b>
          <p>Las próximas entregas coordinadas aparecerán acá automáticamente.</p>
        </div>
      )}
      {deliveries.status === "ok" && rows.length > 0 && (
        <div className="collections-list" data-guide-target="deliveries-list">
          {rows.map((delivery) => (
            <article className="collections-row" key={delivery.delivery_id}>
              <div className="collections-row-top">
                <div><small>{delivery.client_name || "Sin cliente asociado"}</small><b>{delivery.product_label || `Entrega #${delivery.delivery_id}`}</b></div>
                <span className={`badge ${statusBadgeClass(delivery.status)}`}>{statusLabel(delivery.status)}</span>
              </div>
              <div className="collections-row-grid">
                <div className="box"><small>PROGRAMADA</small><b>{delivery.scheduled_at || "Sin fecha"}</b></div>
                <div className="box"><small>ENTREGADA</small><b>{delivery.delivered_at || "Todavía no"}</b></div>
                <div className="box"><small>DIRECCIÓN</small><b>{delivery.address_snapshot || "Sin dirección"}</b></div>
                <div className="box"><small>ACTUALIZADA</small><b>{delivery.updated_at || "No disponible"}</b></div>
              </div>
              <div className="collections-actions">
                <button type="button" className="crm-open" onClick={() => setView({ mode: "detail", deliveryId: delivery.delivery_id })}>Abrir entrega →</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
