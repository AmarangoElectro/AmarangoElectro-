"use client";

import { useState } from "react";
import { ProvidersPanel } from "./providers-panel";
import { ProviderInboxPanel } from "./provider-inbox-panel";

/**
 * V16 PROVEEDORES — área principal dentro de /administracion.
 * Sub-navegación interna: Proveedores / Bandeja (sección 17 del contrato
 * congelado). No es una pestaña nueva de nivel superior por cada una para
 * mantener el nav principal compacto.
 */
export function ProvidersAreaPanel() {
  const [subTab, setSubTab] = useState<"providers" | "inbox">("providers");

  return (
    <div className="providers-area">
      <nav className="crm-tabs" role="tablist" aria-label="Área de Proveedores" data-guide-target="providers-area-nav">
        <button type="button" role="tab" aria-selected={subTab === "providers"} className={subTab === "providers" ? "on" : ""} onClick={() => setSubTab("providers")}>Proveedores</button>
        <button type="button" role="tab" aria-selected={subTab === "inbox"} className={subTab === "inbox" ? "on" : ""} onClick={() => setSubTab("inbox")}>Bandeja</button>
      </nav>
      {subTab === "providers" ? <ProvidersPanel /> : <ProviderInboxPanel />}
    </div>
  );
}
