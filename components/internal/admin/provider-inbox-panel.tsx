"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { createProviderInboxAdapter, isTerminalStatus, type ProviderInboxReadResult } from "@/lib/providers/provider-inbox-adapter";
import {
  V16_PROVIDER_INBOX_MESSAGE_KIND_LABEL,
  V16_PROVIDER_INBOX_PRIORITY_LABEL,
  V16_PROVIDER_INBOX_STATUS_LABEL,
  type V16ProviderInboxMessageKind,
  type V16ProviderInboxMessageRow,
  type V16ProviderInboxPriority,
  type V16ProviderInboxStatus,
  type V16ProviderInboxThreadDetailRow,
  type V16ProviderInboxThreadListRow,
  type V16ProviderListRow,
} from "@/lib/providers/provider-inbox-contract";

/**
 * V16 BANDEJA (Provider Inbox) — panel aditivo dentro de /administracion.
 *
 * Usa exclusivamente v16_provider_inbox_threads_list/thread_detail/
 * thread_messages (lectura) y v16_provider_inbox_create_thread/
 * append_message/transition_thread (escritura) — nunca lee/escribe
 * public.ventas ni tablas legacy directamente, nunca la tabla genérica
 * `mensajes`. Es seguimiento operativo con proveedores, NO contabilidad
 * de proveedores: nunca se muestra saldo, deuda, cuenta corriente, orden
 * de compra ni estado de envío/pago.
 *
 * Fail-closed real: sin sesión, cada llamada resuelve "not_connected" y
 * la UI lo muestra explícitamente. Ninguna acción de escritura se marca
 * como completada localmente antes de que el servidor la confirme.
 */

const STATUS_OPTIONS: V16ProviderInboxStatus[] = ["OPEN", "WAITING_PROVIDER", "WAITING_US", "RESOLVED", "CANCELLED"];
const PRIORITY_OPTIONS: V16ProviderInboxPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const MESSAGE_KIND_OPTIONS: V16ProviderInboxMessageKind[] = ["OUTBOUND_NOTE", "INBOUND_NOTE", "INTERNAL_NOTE"];

function StatusNotice({ result }: { result: ProviderInboxReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="inbox-disconnected">
        <b>Conexión requerida</b>
        <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>Esta identidad no tiene permiso para ver la Bandeja de proveedores.</p></div>;
  }
  if (result.status === "step_up_required") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Verificación adicional requerida</b><p>Necesitás confirmar tu identidad (verificación adicional) para esta acción.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos completar la operación</b><p>{result.message}</p></div>;
  }
  return null;
}

function ThreadDetailView({ threadId, onBack }: { threadId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<ProviderInboxReadResult<V16ProviderInboxThreadDetailRow | null>>({ status: "not_connected" });
  const [messages, setMessages] = useState<ProviderInboxReadResult<V16ProviderInboxMessageRow[]>>({ status: "not_connected" });
  const [noteBody, setNoteBody] = useState("");
  const [noteKind, setNoteKind] = useState<V16ProviderInboxMessageKind>("INTERNAL_NOTE");
  const [actionNotice, setActionNotice] = useState<ProviderInboxReadResult<unknown> | null>(null);

  function refetch() {
    const adapter = createProviderInboxAdapter();
    adapter.getThreadDetail(threadId).then(setDetail);
    adapter.getThreadMessages(threadId).then(setMessages);
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const thread = detail.status === "ok" ? detail.data : null;
  const rows = messages.status === "ok" ? messages.data : [];

  async function submitNote() {
    if (!noteBody.trim()) return;
    const adapter = createProviderInboxAdapter();
    const result = await adapter.appendMessage({
      thread_id: threadId,
      message_kind: noteKind,
      body: noteBody.trim(),
      idempotency_key: crypto.randomUUID(),
    });
    setActionNotice(result);
    if (result.status === "ok") {
      setNoteBody("");
      refetch();
    }
  }

  async function transition(status: V16ProviderInboxStatus, reason: string | null = null) {
    const adapter = createProviderInboxAdapter();
    const result = await adapter.transitionThread({
      thread_id: threadId,
      status,
      reason,
      expected_current_status: thread?.status ?? null,
    });
    setActionNotice(result);
    if (result.status === "ok") refetch();
  }

  return (
    <section className="crm-360" aria-labelledby="thread-detail-title" data-guide-target="inbox-thread-detail">
      <button type="button" className="crm-back" onClick={onBack}>← Volver a la Bandeja</button>
      <StatusNotice result={detail} />
      {thread && <>
        <header className="crm-360-header">
          <div>
            <small>{thread.provider_name}</small>
            <h2 id="thread-detail-title">{thread.subject}</h2>
            <p>
              <span className={`badge badge--${thread.status.toLowerCase()}`}>{V16_PROVIDER_INBOX_STATUS_LABEL[thread.status]}</span>{" "}
              <span className="badge badge--upcoming">{V16_PROVIDER_INBOX_PRIORITY_LABEL[thread.priority]}</span>
            </p>
          </div>
        </header>

        <div className="crm-notes">
          <small>CONTEXTO</small>
          <p>Abierto: {thread.opened_at ?? "No disponible"} · Última actividad: {thread.last_message_at ?? "Sin mensajes"}{thread.reference_text ? ` · Referencia: ${thread.reference_text}` : ""}</p>
        </div>

        {actionNotice && actionNotice.status !== "ok" && <StatusNotice result={actionNotice} />}

        <div className="crm-sales-table" data-guide-target="inbox-message-timeline">
          {messages.status !== "ok" && <StatusNotice result={messages} />}
          {messages.status === "ok" && rows.length === 0 && <p className="crm-empty">Todavía no hay mensajes en este seguimiento.</p>}
          {messages.status === "ok" && rows.map((message) => (
            <div className="crm-sale-row" key={message.message_id}>
              <div>
                <b>{V16_PROVIDER_INBOX_MESSAGE_KIND_LABEL[message.message_kind]}</b>
                <small>{message.body}</small>
              </div>
              <div className="crm-sale-amounts"><small>{message.occurred_at ?? message.created_at ?? "Fecha no disponible"}</small></div>
            </div>
          ))}
        </div>

        {!isTerminalStatus(thread.status) && <>
          <div className="reports-filters" data-guide-target="inbox-composer">
            <label>
              <small>TIPO DE NOTA</small>
              <select value={noteKind} onChange={(event) => setNoteKind(event.target.value as V16ProviderInboxMessageKind)}>
                {MESSAGE_KIND_OPTIONS.map((kind) => <option key={kind} value={kind}>{V16_PROVIDER_INBOX_MESSAGE_KIND_LABEL[kind]}</option>)}
              </select>
            </label>
          </div>
          <label className="crm-search">
            <textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Escribí la nota operativa…"
              rows={3}
              style={{ width: "100%", border: 0, background: "transparent", color: "inherit", font: "inherit", resize: "vertical" }}
            />
          </label>
          <div className="collections-actions">
            <button type="button" className="crm-open" onClick={submitNote}>Agregar nota</button>
          </div>

          <div className="collections-actions" data-guide-target="inbox-transitions">
            {STATUS_OPTIONS.filter((status) => status !== thread.status).map((status) => (
              <button
                key={status}
                type="button"
                className="crm-open"
                style={{ marginRight: 8, marginTop: 8 }}
                onClick={() => {
                  if (status === "CANCELLED") {
                    const reason = window.prompt("Motivo de cancelación:");
                    if (!reason) return;
                    transition(status, reason);
                    return;
                  }
                  transition(status);
                }}
              >
                Pasar a: {V16_PROVIDER_INBOX_STATUS_LABEL[status]}
              </button>
            ))}
          </div>
        </>}
        {isTerminalStatus(thread.status) && <p className="crm-empty">Este seguimiento ya está cerrado y no puede reabrirse desde esta versión.</p>}
      </>}
    </section>
  );
}

function CreateThreadForm({ providers, onCreated, onCancel }: { providers: V16ProviderListRow[]; onCreated: (threadId: string) => void; onCancel: () => void }) {
  const [providerId, setProviderId] = useState(providers[0]?.provider_id ?? "");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<V16ProviderInboxPriority>("NORMAL");
  const [referenceText, setReferenceText] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<ProviderInboxReadResult<unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!providerId || !subject.trim()) return;
    setSubmitting(true);
    const adapter = createProviderInboxAdapter();
    const created = await adapter.createThread({
      provider_id: providerId,
      subject: subject.trim(),
      priority,
      reference_text: referenceText.trim() || null,
      idempotency_key: idempotencyKey,
    });
    setSubmitting(false);
    setResult(created);
    if (created.status === "ok" && created.data) onCreated(created.data.thread_id);
  }

  return (
    <section className="crm-360" data-guide-target="inbox-create-thread">
      <button type="button" className="crm-back" onClick={onCancel}>← Cancelar</button>
      <h2>Nuevo hilo</h2>
      <div className="reports-filters">
        <label>
          <small>PROVEEDOR</small>
          <select value={providerId} onChange={(event) => setProviderId(event.target.value)}>
            {providers.map((provider) => <option key={provider.provider_id} value={provider.provider_id}>{provider.canonical_name}</option>)}
          </select>
        </label>
        <label>
          <small>PRIORIDAD</small>
          <select value={priority} onChange={(event) => setPriority(event.target.value as V16ProviderInboxPriority)}>
            {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{V16_PROVIDER_INBOX_PRIORITY_LABEL[option]}</option>)}
          </select>
        </label>
      </div>
      <label className="crm-search">
        <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Asunto" />
      </label>
      <label className="crm-search">
        <input value={referenceText} onChange={(event) => setReferenceText(event.target.value)} placeholder="Referencia (opcional)" />
      </label>
      {result && result.status !== "ok" && <StatusNotice result={result} />}
      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={submit} disabled={submitting || !providerId || !subject.trim()}>
          {submitting ? "Creando…" : "Crear hilo"}
        </button>
      </div>
    </section>
  );
}

export function ProviderInboxPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<V16ProviderInboxStatus | null>(null);
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<V16ProviderInboxPriority | null>(null);
  const [threads, setThreads] = useState<ProviderInboxReadResult<V16ProviderInboxThreadListRow[]>>({ status: "not_connected" });
  const [providers, setProviders] = useState<ProviderInboxReadResult<V16ProviderListRow[]>>({ status: "not_connected" });
  const [view, setView] = useState<{ mode: "list" } | { mode: "detail"; threadId: string } | { mode: "create" }>({ mode: "list" });

  useEffect(() => {
    let cancelled = false;
    const adapter = createProviderInboxAdapter();
    adapter.listThreads({ search_text: search.trim() || null, status: statusFilter, provider_id: providerFilter, priority: priorityFilter }).then((next) => { if (!cancelled) setThreads(next); });
    return () => { cancelled = true; };
  }, [search, statusFilter, providerFilter, priorityFilter, view.mode]);

  useEffect(() => {
    let cancelled = false;
    const adapter = createProviderInboxAdapter();
    adapter.listProviders().then((next) => { if (!cancelled) setProviders(next); });
    return () => { cancelled = true; };
  }, []);

  if (view.mode === "detail") return <ThreadDetailView threadId={view.threadId} onBack={() => setView({ mode: "list" })} />;
  if (view.mode === "create") {
    const providerRows = providers.status === "ok" ? providers.data : [];
    return <CreateThreadForm providers={providerRows} onCreated={(threadId) => setView({ mode: "detail", threadId })} onCancel={() => setView({ mode: "list" })} />;
  }

  const rows = threads.status === "ok" ? threads.data : [];
  const providerRowsForFilter = providers.status === "ok" ? providers.data : [];

  return (
    <section className="collections-panel" aria-labelledby="inbox-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="inbox-panel-title">Bandeja</h2>
          <span>Seguimiento operativo con proveedores — consultas, pedidos de información y seguimiento.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Solo lectura/escritura vía RPC segura · sin acceso directo a tablas legacy · notas operativas registradas manualmente
      </div>

      <div className="collections-actions">
        <button type="button" className="crm-open" onClick={() => setView({ mode: "create" })}><Plus size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} /> Nuevo hilo</button>
      </div>

      <div className="collections-filters" data-guide-target="inbox-filters">
        {([null, ...STATUS_OPTIONS] as (V16ProviderInboxStatus | null)[]).map((status) => (
          <button
            key={status ?? "all"}
            type="button"
            className={statusFilter === status ? "on" : ""}
            onClick={() => setStatusFilter(status)}
          >
            {status ? V16_PROVIDER_INBOX_STATUS_LABEL[status] : "Todos"}
          </button>
        ))}
      </div>

      <label className="crm-search" data-guide-target="inbox-search">
        <Search size={16} aria-hidden="true" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por asunto o referencia" />
      </label>

      <div className="reports-filters" data-guide-target="inbox-provider-filter">
        <label>
          <small>PROVEEDOR</small>
          <select value={providerFilter ?? ""} onChange={(event) => setProviderFilter(event.target.value || null)}>
            <option value="">Todos los proveedores</option>
            {providerRowsForFilter.map((provider) => <option key={provider.provider_id} value={provider.provider_id}>{provider.canonical_name}</option>)}
          </select>
        </label>
        <label>
          <small>PRIORIDAD</small>
          <select value={priorityFilter ?? ""} onChange={(event) => setPriorityFilter((event.target.value || null) as V16ProviderInboxPriority | null)}>
            <option value="">Todas</option>
            {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{V16_PROVIDER_INBOX_PRIORITY_LABEL[option]}</option>)}
          </select>
        </label>
      </div>

      {threads.status !== "ok" && <StatusNotice result={threads} />}
      {threads.status === "ok" && rows.length === 0 && (
        <div className="crm-empty-state" data-guide-target="inbox-empty">
          <b>Todavía no hay seguimientos abiertos con proveedores.</b>
          <p>Creá un hilo cuando necesites registrar una consulta, pedido de información o seguimiento.</p>
        </div>
      )}
      {threads.status === "ok" && rows.length > 0 && (
        <div className="collections-list" data-guide-target="inbox-thread-list">
          {rows.map((thread) => (
            <article className="collections-row" key={thread.thread_id}>
              <div className="collections-row-top">
                <div><small>{thread.provider_name}</small><b>{thread.subject}</b></div>
                <span className={`badge badge--${thread.status.toLowerCase()}`}>{V16_PROVIDER_INBOX_STATUS_LABEL[thread.status]}</span>
              </div>
              <div className="collections-row-grid">
                <div className="box"><small>PRIORIDAD</small><b>{V16_PROVIDER_INBOX_PRIORITY_LABEL[thread.priority]}</b></div>
                <div className="box"><small>MENSAJES</small><b>{thread.message_count}</b></div>
                <div className="box"><small>ÚLTIMA ACTIVIDAD</small><b>{thread.last_message_at ?? "Sin mensajes"}</b></div>
                <div className="box"><small>ABIERTO</small><b>{thread.opened_at ?? "No disponible"}</b></div>
              </div>
              <div className="collections-actions">
                <button type="button" className="crm-open" onClick={() => setView({ mode: "detail", threadId: thread.thread_id })}>Abrir hilo →</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
