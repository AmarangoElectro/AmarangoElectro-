"use client";

import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Plus, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { createCashAdapter, type CashReadResult } from "@/lib/cash/cash-adapter";
import {
  V16_CASH_MANUAL_POST_TYPES,
  V16_CASH_MOVEMENT_TYPE_LABEL,
  type V16CashMovementRow,
  type V16CashMovementType,
  type V16CashSummaryRow,
} from "@/lib/cash/cash-contract";

/**
 * V16 CAJA / MOVIMIENTOS — panel aditivo dentro de /administracion.
 *
 * Usa exclusivamente v16_cash_movements_list / v16_cash_summary (lectura) y
 * v16_post_cash_movement / v16_reverse_cash_movement (escritura) vía
 * `CashAdapter` — nunca lee/escribe la tabla `v16_cash_movements`
 * directamente. Caja es el ledger operativo V16: nunca se presenta como
 * saldo bancario, efectivo disponible, ganancia, margen o balance contable
 * completo — `net_balance` siempre se muestra como "Neto registrado".
 *
 * Fail-closed real: sin sesión, cada llamada resuelve "not_connected" y la
 * UI lo muestra explícitamente. Ninguna escritura se marca como completada
 * localmente antes de que el servidor la confirme. No se crean movimientos
 * de prueba: con 0 movimientos canónicos, el primer movimiento real debe
 * surgir de una operación autorizada real, nunca de este checkpoint.
 */

const DIRECTION_FILTERS: { label: string; value: string | null }[] = [
  { label: "Todos", value: null },
  { label: "Entradas", value: "IN" },
  { label: "Salidas", value: "OUT" },
];

function money(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Monto no disponible";
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function movementTypeLabel(type: string) {
  return V16_CASH_MOVEMENT_TYPE_LABEL[type as V16CashMovementType] ?? type;
}

function DirectionBadge({ direction }: { direction: string }) {
  const isIn = direction === "IN";
  const isOut = direction === "OUT";
  const className = isIn ? "badge badge--complete" : isOut ? "badge badge--overdue" : "badge badge--data_incomplete";
  const Icon = isIn ? ArrowDownCircle : isOut ? ArrowUpCircle : RotateCcw;
  const label = isIn ? "Entrada" : isOut ? "Salida" : direction;
  return (
    <span className={className}>
      <Icon size={12} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
      {label}
    </span>
  );
}

function StatusNotice({ result }: { result: CashReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="cash-disconnected">
        <b>Conexión requerida</b>
        <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>Esta identidad no tiene permiso para ver Caja.</p></div>;
  }
  if (result.status === "step_up_required") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Verificación adicional requerida</b><p>Por seguridad, necesitás verificar nuevamente tu identidad para continuar.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos completar la operación</b><p>{result.message}</p></div>;
  }
  return null;
}

function SummaryCards({ summary }: { summary: CashReadResult<V16CashSummaryRow | null> }) {
  if (summary.status !== "ok" || !summary.data) return <StatusNotice result={summary} />;
  const data = summary.data;
  return (
    <div className="collections-metrics" data-guide-target="cash-summary">
      <div className="crm-metric crm-metric--green"><small>ENTRADAS REGISTRADAS</small><strong>{money(data.total_in)}</strong></div>
      <div className="crm-metric crm-metric--orange"><small>SALIDAS REGISTRADAS</small><strong>{money(data.total_out)}</strong></div>
      <div className="crm-metric crm-metric--blue"><small>NETO REGISTRADO</small><strong title="Entradas menos salidas registradas en el ledger V16 para el período.">{money(data.net_balance)}</strong></div>
      <div className="crm-metric"><small>MOVIMIENTOS</small><strong>{data.movement_count}</strong></div>
    </div>
  );
}

function ReverseDialog({ movement, onClose, onReversed }: { movement: V16CashMovementRow; onClose: () => void; onReversed: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CashReadResult<unknown> | null>(null);

  async function submit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    const adapter = createCashAdapter();
    const response = await adapter.reverseMovement({
      movementId: movement.movement_id,
      reason: reason.trim(),
      idempotencyKey: crypto.randomUUID(),
    });
    setSubmitting(false);
    setResult(response);
    if (response.status === "ok") onReversed();
  }

  return (
    <div className="crm-notes" data-guide-target="cash-reverse-dialog">
      <small>REVERTIR MOVIMIENTO</small>
      <p>{movementTypeLabel(movement.movement_type)} · {money(movement.amount)}</p>
      <label className="crm-search">
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de la reversa (obligatorio)" />
      </label>
      {result && result.status !== "ok" && <StatusNotice result={result} />}
      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={submit} disabled={submitting || !reason.trim()}>
          {submitting ? "Revirtiendo…" : "Revertir movimiento"}
        </button>
        <button type="button" className="crm-open" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

function PostMovementForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [movementType, setMovementType] = useState<V16CashMovementType>(V16_CASH_MANUAL_POST_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [sourceReference, setSourceReference] = useState("");
  const [note, setNote] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<CashReadResult<unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
    setSubmitting(true);
    const adapter = createCashAdapter();
    const created = await adapter.postMovement({
      movementType,
      amount: numericAmount,
      sourceReference: sourceReference.trim() || null,
      note: note.trim() || null,
      idempotencyKey,
    });
    setSubmitting(false);
    setResult(created);
    if (created.status === "ok") onCreated();
  }

  return (
    <section className="crm-360" data-guide-target="cash-post-form">
      <button type="button" className="crm-back" onClick={onCancel}>← Cancelar</button>
      <h2>Registrar movimiento</h2>
      <div className="reports-filters">
        <label>
          <small>TIPO DE MOVIMIENTO</small>
          <select value={movementType} onChange={(event) => setMovementType(event.target.value as V16CashMovementType)}>
            {V16_CASH_MANUAL_POST_TYPES.map((type) => <option key={type} value={type}>{V16_CASH_MOVEMENT_TYPE_LABEL[type]}</option>)}
          </select>
        </label>
        <label>
          <small>MONTO</small>
          <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
        </label>
      </div>
      <label className="crm-search">
        <input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="Referencia (opcional)" />
      </label>
      <label className="crm-search">
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota interna (opcional)" />
      </label>
      {result && result.status !== "ok" && <StatusNotice result={result} />}
      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={submit} disabled={submitting || !amount || Number(amount) <= 0}>
          {submitting ? "Registrando…" : "Registrar movimiento"}
        </button>
      </div>
    </section>
  );
}

export function CashPanel() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string | null>(null);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string | null>(null);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [movements, setMovements] = useState<CashReadResult<V16CashMovementRow[]>>({ status: "not_connected" });
  const [summary, setSummary] = useState<CashReadResult<V16CashSummaryRow | null>>({ status: "not_connected" });
  const [view, setView] = useState<{ mode: "list" } | { mode: "create" }>({ mode: "list" });
  const [reversingMovement, setReversingMovement] = useState<V16CashMovementRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const adapter = createCashAdapter();
    adapter.listMovements({
      directionFilter,
      movementTypeFilter,
      periodFrom: periodFrom || null,
      periodTo: periodTo || null,
      searchText: search.trim() || null,
    }).then((next) => { if (!cancelled) setMovements(next); });
    return () => { cancelled = true; };
  }, [search, directionFilter, movementTypeFilter, periodFrom, periodTo, view.mode, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    const adapter = createCashAdapter();
    adapter.getSummary({ periodFrom: periodFrom || null, periodTo: periodTo || null }).then((next) => { if (!cancelled) setSummary(next); });
    return () => { cancelled = true; };
  }, [periodFrom, periodTo, view.mode, refreshKey]);

  function refetchAll() {
    setRefreshKey((key) => key + 1);
  }

  if (view.mode === "create") {
    return <PostMovementForm onCreated={() => { refetchAll(); setView({ mode: "list" }); }} onCancel={() => setView({ mode: "list" })} />;
  }

  const rows = movements.status === "ok" ? movements.data : [];

  return (
    <section className="collections-panel" aria-labelledby="cash-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="cash-panel-title">Caja / Movimientos</h2>
          <span>Registrá y revisá los movimientos operativos de Caja V16.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Conexión segura · movimientos reales de caja · sólo importes efectivamente registrados
      </div>

      <SummaryCards summary={summary} />

      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={() => setView({ mode: "create" })}><Plus size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} /> Registrar movimiento</button>
      </div>

      <div className="collections-filters" data-guide-target="cash-filters">
        {DIRECTION_FILTERS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={directionFilter === option.value ? "on" : ""}
            onClick={() => setDirectionFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="crm-search" data-guide-target="cash-search">
        <Search size={16} aria-hidden="true" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por referencia" />
      </label>

      <div className="reports-filters" data-guide-target="cash-period">
        <label>
          <small>DESDE</small>
          <input type="date" value={periodFrom} onChange={(event) => setPeriodFrom(event.target.value)} />
        </label>
        <label>
          <small>HASTA</small>
          <input type="date" value={periodTo} onChange={(event) => setPeriodTo(event.target.value)} />
        </label>
        <label>
          <small>TIPO</small>
          <select value={movementTypeFilter ?? ""} onChange={(event) => setMovementTypeFilter(event.target.value || null)}>
            <option value="">Todos los tipos</option>
            {Object.entries(V16_CASH_MOVEMENT_TYPE_LABEL).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
          </select>
        </label>
      </div>

      {movements.status !== "ok" && <StatusNotice result={movements} />}
      {movements.status === "ok" && rows.length === 0 && (
        <div className="crm-empty-state" data-guide-target="cash-empty">
          <b>Todavía no hay movimientos registrados en Caja.</b>
          <p>Los próximos movimientos operativos registrados aparecerán acá automáticamente.</p>
        </div>
      )}
      {movements.status === "ok" && rows.length > 0 && (
        <div className="collections-list" data-guide-target="cash-list">
          {rows.map((movement) => (
            <article className="collections-row" key={movement.movement_id}>
              <div className="collections-row-top">
                <div>
                  <small>{movementTypeLabel(movement.movement_type)}</small>
                  <b>{money(movement.amount)}</b>
                </div>
                <DirectionBadge direction={movement.direction} />
              </div>
              <div className="collections-row-grid">
                <div className="box"><small>FECHA</small><b>{movement.occurred_at || "No disponible"}</b></div>
                <div className="box"><small>CLIENTE</small><b>{movement.client_name || "Sin cliente asociado"}</b></div>
                <div className="box"><small>REFERENCIA</small><b>{movement.source_reference || "Sin referencia"}</b></div>
                <div className="box"><small>ESTADO</small><b>{movement.reverses_movement_id ? `Reversa de #${movement.reverses_movement_id}` : "Registrado"}</b></div>
              </div>
              {reversingMovement?.movement_id === movement.movement_id ? (
                <ReverseDialog
                  movement={movement}
                  onClose={() => setReversingMovement(null)}
                  onReversed={() => { setReversingMovement(null); refetchAll(); }}
                />
              ) : (
                movement.movement_type !== "REVERSAL" && (
                  <div className="collections-actions">
                    <button type="button" className="crm-open" onClick={() => setReversingMovement(movement)}>Revertir movimiento</button>
                  </div>
                )
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
