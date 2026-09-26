"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { createAdvisorsAdapter, type AdvisorsReadResult } from "@/lib/advisors/advisors-adapter";
import type { V16AdvisorPortfolioListRow, V16AdvisorPortfolioSummaryRow } from "@/lib/advisors/advisors-contract";
import { AdvisorCompensationAdminSummary } from "@/components/internal/admin/advisor-compensation-admin-summary";

/**
 * V16 ASESORES — panel aditivo dentro de /administracion.
 *
 * Usa exclusivamente v16_advisor_portfolio_summary / v16_advisor_portfolio_list
 * (lectura) y v16_create_advisor_profile / v16_assign_advisor_client /
 * v16_end_advisor_client_assignment (escritura) vía `AdvisorsAdapter` —
 * nunca lee `v16_advisor_client_portfolio`, `v16_user_access` ni
 * `v16_advisor_auth_enrollments` directamente, y nunca infiere cartera desde
 * `ventas.responsable`, nombre, email o revendedor.
 *
 * No incluye vincular/deshabilitar identidad ni claim de enrollment: el
 * contrato congelado condiciona esas tres RPC a que ya exista una fuente
 * segura de `user_id`/`enrollment_id` en el repo, que no existe — exponerlas
 * significaría inventar un selector inseguro de `auth.users`, algo que el
 * contrato prohíbe explícitamente. Ese hueco es post-launch y no bloquea
 * este gate.
 *
 * Fail-closed real: sin sesión, cada llamada resuelve "not_connected" y la
 * UI lo muestra explícitamente. Crear perfil, asignar cliente y finalizar
 * asignación exigen AAL2 en el backend (confirmado por preflight) — la UI
 * nunca bypassea `step_up_required`, nunca reintenta automáticamente y
 * nunca marca una escritura como completada antes de la respuesta real del
 * servidor.
 */

function StatusNotice({ result }: { result: AdvisorsReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="advisors-disconnected">
        <b>Conexión requerida</b>
        <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>Esta identidad no tiene permiso para ver Asesores.</p></div>;
  }
  if (result.status === "step_up_required") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Verificación adicional requerida</b><p>Por seguridad, necesitás verificar nuevamente tu identidad para continuar.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos completar la operación</b><p>{result.message}</p></div>;
  }
  return null;
}

function activeBadge(active: boolean) {
  return <span className={`badge ${active ? "badge--complete" : "badge--cancelled"}`}>{active ? "Activo" : "Inactivo"}</span>;
}

function AssignClientForm({ advisorId, onDone, onCancel }: { advisorId: string; onDone: () => void; onCancel: () => void }) {
  const [clientId, setClientId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AdvisorsReadResult<unknown> | null>(null);

  async function submit() {
    if (!clientId.trim()) return;
    setSubmitting(true);
    const adapter = createAdvisorsAdapter();
    const response = await adapter.assignClient({ advisorId, clientId: clientId.trim(), note: note.trim() || null });
    setSubmitting(false);
    setResult(response);
    if (response.status === "ok") onDone();
  }

  return (
    <div className="crm-notes" data-guide-target="advisors-assign-form">
      <small>ASIGNAR CLIENTE</small>
      <label className="crm-search">
        <input value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="ID de cliente" />
      </label>
      <label className="crm-search">
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota interna (opcional)" />
      </label>
      {result && result.status !== "ok" && <StatusNotice result={result} />}
      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={submit} disabled={submitting || !clientId.trim()}>{submitting ? "Asignando…" : "Confirmar asignación"}</button>
        <button type="button" className="crm-open" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function AdvisorDetailView({ advisorId, advisorName, onBack }: { advisorId: string; advisorName: string; onBack: () => void }) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [portfolio, setPortfolio] = useState<AdvisorsReadResult<V16AdvisorPortfolioListRow[]>>({ status: "not_connected" });
  const [actionNotice, setActionNotice] = useState<AdvisorsReadResult<unknown> | null>(null);
  const [assigning, setAssigning] = useState(false);

  function refetch() {
    const adapter = createAdvisorsAdapter();
    adapter.listPortfolio({ advisorId, activeOnly: !showAllHistory }).then(setPortfolio);
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId, showAllHistory]);

  const rows = portfolio.status === "ok" ? portfolio.data : [];

  async function endAssignment(assignmentId: number) {
    const reason = window.prompt("Motivo para finalizar la asignación (obligatorio):");
    if (!reason || !reason.trim()) return;
    const adapter = createAdvisorsAdapter();
    const result = await adapter.endAssignment({ assignmentId, reason: reason.trim() });
    setActionNotice(result);
    refetch();
  }

  return (
    <section className="crm-360" aria-labelledby="advisor-detail-title" data-guide-target="advisors-detail">
      <button type="button" className="crm-back" onClick={onBack}>← Volver a Asesores</button>
      <header className="crm-360-header">
        <div>
          <small>PERFIL</small>
          <h2 id="advisor-detail-title">{advisorName}</h2>
        </div>
      </header>

      {actionNotice && actionNotice.status !== "ok" && <StatusNotice result={actionNotice} />}

      {!assigning && (
        <div className="collections-actions" data-guide-target="advisors-assign-action">
          <button type="button" className="crm-open" onClick={() => setAssigning(true)}><Plus size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} /> Asignar cliente</button>
        </div>
      )}
      {assigning && (
        <AssignClientForm
          advisorId={advisorId}
          onCancel={() => setAssigning(false)}
          onDone={() => { setAssigning(false); refetch(); }}
        />
      )}

      <div className="collections-filters" data-guide-target="advisors-history-toggle">
        <button type="button" className={!showAllHistory ? "on" : ""} onClick={() => setShowAllHistory(false)}>Cartera activa</button>
        <button type="button" className={showAllHistory ? "on" : ""} onClick={() => setShowAllHistory(true)}>Historial de asignaciones</button>
      </div>

      {portfolio.status !== "ok" && <StatusNotice result={portfolio} />}
      {portfolio.status === "ok" && rows.length === 0 && (
        <div className="crm-empty-state" data-guide-target="advisors-portfolio-empty">
          <b>Todavía no hay clientes asignados a este asesor.</b>
        </div>
      )}
      {portfolio.status === "ok" && rows.length > 0 && (
        <div className="collections-list" data-guide-target="advisors-portfolio-list">
          {rows.map((row) => (
            <article className="collections-row" key={row.assignment_id}>
              <div className="collections-row-top">
                <div><small>{row.client_locality || "Localidad no disponible"}</small><b>{row.client_name || "Sin nombre"}</b></div>
                {activeBadge(row.assignment_active)}
              </div>
              <div className="collections-row-grid">
                <div className="box"><small>ASIGNADA</small><b>{row.assigned_at || "No disponible"}</b></div>
                <div className="box"><small>FINALIZADA</small><b>{row.ended_at || "Todavía activa"}</b></div>
              </div>
              {row.assignment_active && (
                <div className="collections-actions">
                  <button type="button" className="crm-open" onClick={() => endAssignment(row.assignment_id)}>Finalizar asignación</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CreateProfileForm({ onCreated, onCancel }: { onCreated: (advisorId: string, advisorName: string) => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [result, setResult] = useState<AdvisorsReadResult<unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!nombre.trim() || !telefono.trim()) return;
    setSubmitting(true);
    const adapter = createAdvisorsAdapter();
    const created = await adapter.createProfile({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim() || null,
      localidad: localidad.trim() || null,
    });
    setSubmitting(false);
    setResult(created);
    if (created.status === "ok" && created.data) onCreated(created.data.advisor_id, created.data.nombre);
  }

  return (
    <section className="crm-360" data-guide-target="advisors-create-form">
      <button type="button" className="crm-back" onClick={onCancel}>← Cancelar</button>
      <h2>Nuevo asesor</h2>
      <label className="crm-search">
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Nombre" />
      </label>
      <label className="crm-search">
        <input value={telefono} onChange={(event) => setTelefono(event.target.value)} placeholder="Teléfono" />
      </label>
      <label className="crm-search">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email (opcional)" />
      </label>
      <label className="crm-search">
        <input value={localidad} onChange={(event) => setLocalidad(event.target.value)} placeholder="Localidad (opcional)" />
      </label>
      {result && result.status !== "ok" && <StatusNotice result={result} />}
      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={submit} disabled={submitting || !nombre.trim() || !telefono.trim()}>
          {submitting ? "Creando…" : "Crear perfil"}
        </button>
      </div>
    </section>
  );
}

export function AdvisorsPanel() {
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<AdvisorsReadResult<V16AdvisorPortfolioSummaryRow[]>>({ status: "not_connected" });
  const [view, setView] = useState<{ mode: "list" } | { mode: "detail"; advisorId: string; advisorName: string } | { mode: "create" }>({ mode: "list" });

  useEffect(() => {
    let cancelled = false;
    const adapter = createAdvisorsAdapter();
    adapter.getPortfolioSummary().then((next) => { if (!cancelled) setSummary(next); });
    return () => { cancelled = true; };
  }, [view.mode]);

  if (view.mode === "detail") {
    return <AdvisorDetailView advisorId={view.advisorId} advisorName={view.advisorName} onBack={() => setView({ mode: "list" })} />;
  }
  if (view.mode === "create") {
    return <CreateProfileForm onCreated={(advisorId, advisorName) => setView({ mode: "detail", advisorId, advisorName })} onCancel={() => setView({ mode: "list" })} />;
  }

  const rows = summary.status === "ok" ? summary.data : [];
  const filteredRows = rows.filter((row) => !search.trim() || row.advisor_name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <section className="collections-panel" aria-labelledby="advisors-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="advisors-panel-title">Asesores</h2>
          <span>Clientes asignados, historial de cartera y seguimiento de cada asesor.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Conexión segura · cada asesor ve y gestiona únicamente su cartera asignada
      </div>

      <AdvisorCompensationAdminSummary />

      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={() => setView({ mode: "create" })}><Plus size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} /> Nuevo asesor</button>
      </div>

      <label className="crm-search" data-guide-target="advisors-search">
        <Search size={16} aria-hidden="true" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar asesor por nombre" />
      </label>

      {summary.status !== "ok" && <StatusNotice result={summary} />}
      {summary.status === "ok" && filteredRows.length === 0 && (
        <div className="crm-empty-state" data-guide-target="advisors-empty">
          <b>Todavía no hay asesores disponibles.</b>
        </div>
      )}
      {summary.status === "ok" && filteredRows.length > 0 && (
        <div className="collections-list" data-guide-target="advisors-list">
          {filteredRows.map((row) => (
            <article className="collections-row" key={row.advisor_id}>
              <div className="collections-row-top">
                <div><small>Asesor</small><b>{row.advisor_name}</b></div>
                {activeBadge(row.advisor_active)}
              </div>
              <div className="collections-row-grid">
                <div className="box"><small>CLIENTES ACTIVOS</small><b>{row.active_clients}</b></div>
                <div className="box"><small>ASIGNACIONES HISTÓRICAS</small><b>{row.historical_assignments}</b></div>
                <div className="box"><small>ÚLTIMA ASIGNACIÓN</small><b>{row.latest_assignment_at || "No disponible"}</b></div>
              </div>
              <div className="collections-actions">
                <button type="button" className="crm-open" onClick={() => setView({ mode: "detail", advisorId: row.advisor_id, advisorName: row.advisor_name })}>Abrir perfil →</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
