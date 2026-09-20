"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { createProviderInboxAdapter, type ProviderInboxReadResult } from "@/lib/providers/provider-inbox-adapter";
import type { V16ProviderListRow, V16ProviderUnmappedLegacyLabelRow } from "@/lib/providers/provider-inbox-contract";

/**
 * V16 PROVEEDORES — panel aditivo, read-only, dentro de /administracion.
 *
 * Usa exclusivamente `v16_providers_list` y `v16_provider_unmapped_legacy_labels`
 * — nunca lee tablas legacy directamente. Muestra "Ventas atribuidas"
 * (nunca "Compras", "Saldo proveedor", "Deuda" ni "Cuenta corriente" —
 * `ventas.mayorista` es atribución legacy dispersa, no un libro mayor de
 * proveedor certificado). Sin sesión real en este entorno, cae en "Datos
 * no conectados en este entorno" — nunca proveedores de ejemplo.
 */

function StatusNotice({ result }: { result: ProviderInboxReadResult<unknown> }) {
  if (result.status === "not_connected") {
    return (
      <div className="crm-empty-state" data-guide-target="providers-disconnected">
        <b>Conexión requerida</b>
        <p>Este módulo necesita una sesión autorizada para mostrar datos reales. No se muestran datos de ejemplo.</p>
      </div>
    );
  }
  if (result.status === "unauthorized") {
    return <div className="crm-empty-state crm-empty-state--warn"><b>Sin autorización</b><p>Esta identidad no tiene permiso para ver proveedores.</p></div>;
  }
  if (result.status === "error") {
    return <div className="crm-empty-state crm-empty-state--error"><b>No pudimos conectar con Proveedores</b><p>{result.status === "error" ? result.message : ""}</p></div>;
  }
  return null;
}

export function ProvidersPanel() {
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [result, setResult] = useState<ProviderInboxReadResult<V16ProviderListRow[]>>({ status: "not_connected" });
  const [unmapped, setUnmapped] = useState<ProviderInboxReadResult<V16ProviderUnmappedLegacyLabelRow[]>>({ status: "not_connected" });

  useEffect(() => {
    let cancelled = false;
    const adapter = createProviderInboxAdapter();
    adapter.listProviders({ search_text: search.trim() || null, include_inactive: includeInactive }).then((next) => { if (!cancelled) setResult(next); });
    return () => { cancelled = true; };
  }, [search, includeInactive]);

  useEffect(() => {
    let cancelled = false;
    const adapter = createProviderInboxAdapter();
    adapter.getUnmappedLegacyLabels(null).then((next) => { if (!cancelled) setUnmapped(next); });
    return () => { cancelled = true; };
  }, []);

  const providers = result.status === "ok" ? result.data : [];

  return (
    <section className="crm-panel" aria-labelledby="providers-panel-title">
      <header className="crm-panel-header">
        <div>
          <p className="eyebrow orange">ADMINISTRACIÓN</p>
          <h2 id="providers-panel-title">Proveedores</h2>
          <span>Registro canónico de proveedores y su mapeo de datos.</span>
        </div>
      </header>

      <div className="crm-status-banner" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Solo lectura · vía RPC segura (`v16_providers_list`) · sin acceso directo a tablas legacy
      </div>

      {unmapped.status === "ok" && (
        <div className={unmapped.data.length === 0 ? "crm-status-banner" : "crm-empty-state crm-empty-state--warn"} data-guide-target="providers-data-quality">
          {unmapped.data.length === 0 ? "Mapeo de proveedores: completo" : <><b>Labels sin mapear</b><p>{unmapped.data.length} etiqueta{unmapped.data.length === 1 ? "" : "s"} legacy sin alias aprobado.</p></>}
        </div>
      )}

      <label className="crm-search" data-guide-target="providers-search">
        <Search size={16} aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar proveedor"
        />
      </label>
      <label className="reports-toggle">
        <input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} />
        Incluir inactivos
      </label>

      {result.status !== "ok" && <StatusNotice result={result} />}
      {result.status === "ok" && providers.length === 0 && (
        <div className="crm-empty-state"><b>Sin resultados</b><p>No encontramos proveedores para esta búsqueda.</p></div>
      )}

      {result.status === "ok" && providers.length > 0 && (
        <div className="crm-client-list" data-guide-target="providers-list">
          {providers.map((provider) => (
            <article className="crm-client-row" key={provider.provider_id}>
              <div className="crm-avatar" aria-hidden="true">{provider.canonical_name.slice(0, 2).toUpperCase()}</div>
              <div className="crm-client-info">
                <b>{provider.canonical_name}</b>
                <small>{provider.product_count} productos · {provider.alias_count} alias · Ventas atribuidas: {provider.sales_attribution_count}</small>
              </div>
              {!provider.active && <span className="badge badge--data_incomplete">Inactivo</span>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
