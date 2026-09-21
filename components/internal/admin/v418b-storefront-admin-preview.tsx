"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { CatalogClient } from "@/app/components/catalog-client";
import { V418AQuickActionsSheet } from "@/components/internal/admin/v418a-quick-actions-sheet";
import { v411PilotProducts } from "@/lib/catalog/audited-pilot-adapter";
import type { Product } from "@/lib/catalog";
import { buildAdminProductCardModel } from "@/lib/internal/admin/product-card-model";
import { resolveV418BStorefrontProjection } from "@/lib/internal/admin/v418b-storefront-admin-mode";

function toAdminModel(product: Product) {
  return buildAdminProductCardModel({
    id: product.id,
    name: product.name,
    imageUrl: product.image?.src ?? null,
    supplier: null,
    category: product.subcategory ?? product.category,
    costArs: null,
    salePrice: product.price?.amount ?? null,
    visible: product.visible,
    stockState: product.stock.status === "out_of_stock" ? "out_of_stock" : product.stock.status === "unknown" ? "low_stock" : "in_stock",
    priceUpdatedAt: null,
  });
}

export function V418BStorefrontAdminPreview() {
  const [adminMode, setAdminMode] = useState(false);
  const [quickProductId, setQuickProductId] = useState<string | null>(null);
  const projection = resolveV418BStorefrontProjection({ role: "admin", internalLabContext: true, adminMode });
  const products = v411PilotProducts;
  const selectedProduct = useMemo(() => products.find((product) => product.id === quickProductId) ?? null, [products, quickProductId]);

  function changeMode(next: boolean) {
    setAdminMode(next);
    if (!next) setQuickProductId(null);
  }

  return (
    <section className="v418b-storefront-lab" aria-labelledby="v418b-storefront-title">
      <header className="v418b-storefront-lab__chrome">
        <div>
          <p>VISTA DE TIENDA PARA ADMINISTRACIÓN</p>
          <h2 id="v418b-storefront-title">Vista de cliente con herramientas administrativas</h2>
          <span>Las herramientas administrativas se muestran separadas de la experiencia del cliente.</span>
        </div>
        <button
          type="button"
          className={adminMode ? "is-on" : ""}
          aria-pressed={adminMode}
          onClick={() => changeMode(!adminMode)}
        >
          {adminMode ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          <span><small>HERRAMIENTAS ADMIN</small><strong>{adminMode ? "ACTIVAS" : "OCULTAS · Vista cliente"}</strong></span>
        </button>
      </header>

      <div className={`v418b-storefront-lab__status status-${projection}`} role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        {projection === "admin-overlay"
          ? "Herramientas administrativas activas · edición real bloqueada en esta vista"
          : "Herramientas administrativas ocultas · vista cliente"}
      </div>

      <div className="v418b-storefront-lab__projection" data-v418b-projection={projection}>
        <CatalogClient
          products={[...products]}
          categoryTitle="el catálogo"
          showCategoryFilter
          adminOverlay={projection === "admin-overlay" ? { enabled: true, onQuickActions: (product) => setQuickProductId(product.id) } : undefined}
        />
      </div>

      <V418AQuickActionsSheet
        product={selectedProduct ? toAdminModel(selectedProduct) : null}
        open={quickProductId !== null && projection === "admin-overlay"}
        onOpenChange={(next) => { if (!next) setQuickProductId(null); }}
      />
    </section>
  );
}
