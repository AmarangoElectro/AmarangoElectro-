"use client";

import { ShieldCheck } from "lucide-react";
import { CatalogClient } from "@/app/components/catalog-client";
import { v16Cellphones90MaterializedProducts, v16Cellphones90MaterializedEvidence } from "@/lib/catalog/v16-cellphones-90-materialized-adapter";

/**
 * V16 — 90 CELLPHONES — PREVIEW ACTIVATION GATE.
 *
 * Panel de QA interno, aislado dentro de `/administracion`. Lee los 90
 * productos DIRECTAMENTE del adapter materializado (no desde
 * `lib/catalog/index.ts`), exactamente como ya hace
 * `V418BStorefrontAdminPreview` con `v411PilotProducts`. El composite
 * activo (`catalog`, usado por Home, `/buscar`, `/categoria/[slug]` y
 * `/producto/[slug]`) permanece sin cambios: este panel es la única
 * superficie de la app que puede alcanzar estos 90 productos.
 *
 * No escribe Supabase, no publica, no altera Home.
 */
export function V16Cellphones90Preview() {
  const products = v16Cellphones90MaterializedProducts;

  return (
    <section className="v16-cellphones-90-preview" aria-labelledby="v16-cellphones-90-preview-title">
      <header className="v16-cellphones-90-preview__chrome">
        <div>
          <p>90 CELULARES · MATRIZ DE REVISIÓN</p>
          <h2 id="v16-cellphones-90-preview-title">Revisión completa de celulares</h2>
          <span>
            {v16Cellphones90MaterializedEvidence.productCount} registros preparados para revisión interna. La visibilidad pública se controla por separado y este panel no publica cambios.
          </span>
        </div>
      </header>

      <div className="v16-cellphones-90-preview__status" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Revisión interna · este panel no modifica la tienda publicada
      </div>

      <CatalogClient products={[...products]} categoryTitle="la cohorte de 90 celulares" showCategoryFilter />
    </section>
  );
}
