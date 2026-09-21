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
  const flaggedIds = new Set(v16Cellphones90MaterializedEvidence.flaggedCanonicalProductIds);
  const flaggedProducts = products.filter((product) => flaggedIds.has(Number(product.id.split(":")[1])));

  return (
    <section className="v16-cellphones-90-preview" aria-labelledby="v16-cellphones-90-preview-title">
      <header className="v16-cellphones-90-preview__chrome">
        <div>
          <p>90 CELULARES · CATÁLOGO EN REVISIÓN</p>
          <h2 id="v16-cellphones-90-preview-title">Revisión de la cohorte de celulares</h2>
          <span>
            {v16Cellphones90MaterializedEvidence.productCount} productos con canonicalProductId real
            (v16-cell:1 .. v16-cell:{Math.max(...v16Cellphones90MaterializedEvidence.canonicalProductIds)}).
            No visible en Storefront, no publicado.
          </span>
        </div>
      </header>

      <div className="v16-cellphones-90-preview__status" role="status">
        <ShieldCheck size={16} aria-hidden="true" />
        Solo lectura · sin impacto en la tienda publicada
      </div>

      <div className="photo-review-summary">
        <strong>{v16Cellphones90MaterializedEvidence.sourceMappingVerifiedCount} fotos</strong>
        <span>mapeadas contra la fuente exacta</span>
        <strong>{v16Cellphones90MaterializedEvidence.needsHumanVisualReviewCount} fotos</strong>
        <span>bloqueadas para revisión visual antes de cualquier publicación</span>
      </div>

      {flaggedProducts.length > 0 ? (
        <section className="photo-review-queue" aria-label="Fotos que requieren revisión humana">
          <div>
            <p>REVISIÓN HUMANA OBLIGATORIA</p>
            <h3>Posible foto reutilizada entre dos modelos distintos</h3>
            <span>No se publicará ninguno de estos productos hasta confirmar visualmente la foto correcta.</span>
          </div>
          <ul>
            {flaggedProducts.map((product) => <li key={product.id}><strong>{product.name}</strong><span>{product.model ?? "Modelo sin dato"}</span></li>)}
          </ul>
        </section>
      ) : null}

      <CatalogClient products={[...products]} categoryTitle="la cohorte de 90 celulares" showCategoryFilter />
    </section>
  );
}
