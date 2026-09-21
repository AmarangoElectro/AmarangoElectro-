"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, Users } from "lucide-react";
import { createCrmReadOnlyAdapter, type CrmReadResult } from "@/lib/crm/client-crm-adapter";
import type { V16CrmClientListRow } from "@/lib/crm/client-crm-contract";
import { CrmClient360Panel } from "./crm-client-360-panel";

/**
 * V16 CLIENTES / CRM — panel aditivo dentro de /administracion.
 *
 * Usa exclusivamente `v16_crm_list_clients` a través de
 * `CrmReadOnlyAdapter` (lib/crm/client-crm-adapter.ts) — nunca lee
 * `public.clientes` directamente. En este entorno no existe sesión
 * autenticada real, así que el estado por defecto (y el único alcanzable
 * hoy) es "Conexión requerida" — no se sustituye por
 * clientes de demostración en runtime, tal como exige el gate.
 */
/**
 * `initialClientId`: when set, opens straight into Cliente 360 for that
 * client (used by the Cobranzas panel's "Ver Cliente 360" link). The
 * caller must remount this component when the value changes (e.g. via a
 * `key` prop) — this reads it only as the lazy initial state, it does not
 * react to later prop changes on its own.
 */
export function CrmClientsPanel({ initialClientId = null }: { initialClientId?: string | null } = {}) {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<CrmReadResult<V16CrmClientListRow[]>>({ status: "not_connected" });
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId);

  useEffect(() => {
    let cancelled = false;
    const adapter = createCrmReadOnlyAdapter();
    adapter.listClients({ search_text: search.trim() || null }).then((next) => { if (!cancelled) setResult(next); });
    return () => { cancelled = true; };
  }, [search]);

  if (selectedClientId) {
    return <CrmClient360Panel clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />;
  }

  const clients = result.status === "ok" ? result.data : [];

  return (
    <section className="crm-panel" aria-labelledby="crm-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="crm-panel-title">Clientes / CRM</h2>
          <span>Seguimiento de cada cliente, sus compras y sus cuotas.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Conexión segura · datos reales de clientes · sin información de prueba
      </div>

      <label className="crm-search" data-guide-target="crm-search">
        <Search size={16} aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cliente por nombre, DNI o teléfono"
        />
      </label>

      {result.status === "not_connected" && (
        <div className="crm-empty-state">
          <Users size={22} aria-hidden="true" />
          <b>Conexión requerida</b>
          <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
        </div>
      )}
      {result.status === "unauthorized" && (
        <div className="crm-empty-state crm-empty-state--warn">
          <b>Sin autorización</b>
          <p>Esta identidad no tiene permiso para listar clientes.</p>
        </div>
      )}
      {result.status === "error" && (
        <div className="crm-empty-state crm-empty-state--error">
          <b>No pudimos conectar con el CRM</b>
          <p>{result.message}</p>
        </div>
      )}
      {result.status === "ok" && clients.length === 0 && (
        <div className="crm-empty-state">
          <b>Sin resultados</b>
          <p>No encontramos clientes para esta búsqueda.</p>
        </div>
      )}

      {result.status === "ok" && clients.length > 0 && (
        <div className="crm-client-list" data-guide-target="crm-client-list">
          {clients.map((client) => (
            <article className="crm-client-row" key={client.id}>
              <div className="crm-avatar" aria-hidden="true">{(client.nombre ?? "?").slice(0, 2).toUpperCase()}</div>
              <div className="crm-client-info">
                <b>{client.nombre ?? "Nombre no disponible"}</b>
                <small>{[client.localidad, client.responsable].filter(Boolean).join(" · ") || "Sin datos adicionales"}</small>
              </div>
              <button type="button" className="crm-open" onClick={() => setSelectedClientId(client.id)}>Abrir →</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
