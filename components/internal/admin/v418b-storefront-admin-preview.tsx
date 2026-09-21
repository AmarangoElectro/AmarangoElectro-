"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { CatalogClient } from "@/app/components/catalog-client";
import { V418AQuickActionsSheet } from "@/components/internal/admin/v418a-quick-actions-sheet";
import { v411PilotProducts } from "@/lib/catalog/audited-pilot-adapter";
import { v411PilotAdminProducts } from "@/components/internal/admin/v411-pilot-products";
import { buildAdminProductCardModel } from "@/lib/internal/admin/product-card-model";
import { resolveV418BStorefrontProjection, type V418BStorefrontRole } from "@/lib/internal/admin/v418b-storefront-admin-mode";

const roleCopy: Record<V418BStorefrontRole, { label: string; detail: string }> = {
  client: { label: "Cliente", detail: "Solo la tienda" },
  advisor: { label: "Asesor", detail: "Venta, cuotas y stock" },
  admin: { label: "Administrador", detail: "Costo, mayorista y operación" },
  owner: { label: "Propietario", detail: "Acceso total y suscripción" },
};

const administrativeById = new Map(v411PilotAdminProducts.map((product) => [product.id, product]));
function toAdminModel(productId: string) {
  const product = administrativeById.get(productId);
  return product ? buildAdminProductCardModel(product) : null;
}

export function V418BStorefrontAdminPreview() {
  const [role, setRole] = useState<V418BStorefrontRole>("client");
  const [adminMode, setAdminMode] = useState(false);
  const [quickProductId, setQuickProductId] = useState<string | null>(null);
  const projection = resolveV418BStorefrontProjection({ role, internalLabContext: true, adminMode });
  const products = v411PilotProducts;
  const selectedProduct = useMemo(() => quickProductId ? toAdminModel(quickProductId) : null, [quickProductId]);
  const privilegedProjection = projection === "admin-overlay" || projection === "owner-overlay";

  function changeMode(next: boolean) {
    setAdminMode(next);
    if (!next) setQuickProductId(null);
  }
  function changeRole(next: V418BStorefrontRole) {
    setRole(next);
    setAdminMode(false);
    setQuickProductId(null);
  }

  return (
    <section className="v418b-storefront-lab" aria-labelledby="v418b-storefront-title">
      <header className="v418b-storefront-lab__chrome">
        <div><p>VISTA DE TIENDA POR ROL</p><h2 id="v418b-storefront-title">Una tienda limpia; herramientas según el perfil.</h2><span>Gate local de preview. No autentica, no persiste y no cambia el storefront público.</span></div>
        {(role === "admin" || role === "owner") && <button type="button" className={adminMode ? "is-on" : ""} aria-pressed={adminMode} onClick={() => changeMode(!adminMode)}>{adminMode ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}<span><small>HERRAMIENTAS INTERNAS</small><strong>{adminMode ? "ON" : "OFF · Vista cliente"}</strong></span></button>}
      </header>

      <div className="v418b-role-selector" role="group" aria-label="Perfil a validar">
        {(Object.keys(roleCopy) as V418BStorefrontRole[]).map((roleKey) => <button key={roleKey} type="button" aria-pressed={role === roleKey} onClick={() => changeRole(roleKey)}>{roleKey === "client" ? <UserRound /> : <UsersRound />}<span><strong>{roleCopy[roleKey].label}</strong><small>{roleCopy[roleKey].detail}</small></span></button>)}
      </div>

      <div className={`v418b-storefront-lab__status status-${projection}`} role="status"><ShieldCheck size={16} aria-hidden="true" />{projection === "client" && "Vista cliente · sin controles ni datos internos"}{projection === "advisor" && "Vista asesor · sin costo ni mayorista"}{projection === "admin-overlay" && "Administrador · herramientas operativas locales"}{projection === "owner-overlay" && "Propietario · operación total y acceso al centro de suscripción"}</div>

      {projection === "advisor" && <aside className="v418b-commercial-strip" aria-label="Datos visibles para asesor"><span><small>PRECIO DE VENTA</small><strong>Visible</strong></span><span><small>CUOTAS</small><strong>Visibles</strong></span><span><small>STOCK</small><strong>Visible</strong></span><span><small>ACTUALIZACIÓN</small><strong>Visible</strong></span><span className="is-hidden"><small>COSTO / MAYORISTA</small><strong>Oculto</strong></span></aside>}
      {privilegedProjection && <aside className="v418b-commercial-strip is-privileged" aria-label="Datos visibles para operación"><span><small>COSTO</small><strong>Visible</strong></span><span><small>VENTA</small><strong>Visible</strong></span><span><small>MAYORISTA</small><strong>Visible</strong></span><span><small>STOCK</small><strong>Visible</strong></span><span><small>ACCIONES</small><strong>Locales</strong></span></aside>}

      <div className="v418b-storefront-lab__projection" data-v418b-projection={projection}><CatalogClient products={[...products]} categoryTitle="el catálogo" showCategoryFilter adminOverlay={privilegedProjection ? { enabled: true, onQuickActions: (product) => setQuickProductId(product.id) } : undefined} /></div>
      <V418AQuickActionsSheet product={selectedProduct} open={quickProductId !== null && privilegedProjection} onOpenChange={(next) => { if (!next) setQuickProductId(null); }} />
    </section>
  );
}
