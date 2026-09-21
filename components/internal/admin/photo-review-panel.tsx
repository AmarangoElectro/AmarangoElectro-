"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, Pencil, ScanText, Sparkles } from "lucide-react";
import type { AdminCardProductInput } from "../../../lib/internal/admin/product-card-model";

interface Props {
  products: readonly (AdminCardProductInput & { stockState: "in_stock" | "low_stock" | "out_of_stock" })[];
}

type Draft = {
  imageUrl: string | null;
  mode: "supplier" | "economic" | "manual";
  features: string[];
  approved: boolean;
};

function fiveFeatures(product: AdminCardProductInput) {
  const source = [...(product.features ?? [])].filter(Boolean).slice(0, 5);
  while (source.length < 5) source.push("");
  return source;
}

export function PhotoReviewPanel({ products }: Props) {
  const queue = useMemo(() => products.filter((product) => product.imageUrl || product.supplierImageUrl), [products]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notice, setNotice] = useState<string | null>(null);

  function draftFor(product: AdminCardProductInput): Draft {
    return drafts[product.id] ?? {
      imageUrl: product.imageUrl ?? product.supplierImageUrl ?? null,
      mode: product.supplierImageUrl ? "supplier" : "manual",
      features: fiveFeatures(product),
      approved: false,
    };
  }

  function update(product: AdminCardProductInput, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [product.id]: { ...draftFor(product), ...current[product.id], ...patch } }));
  }

  function prepareSelected() {
    const targets = queue.filter((product) => selected.has(product.id));
    if (targets.length === 0) return;
    setDrafts((current) => Object.fromEntries([
      ...Object.entries(current),
      ...targets.map((product) => [product.id, { ...draftFor(product), mode: "economic" as const, approved: false }]),
    ]));
    setNotice(`${targets.length} flyer${targets.length === 1 ? "" : "s"} económico${targets.length === 1 ? "" : "s"} preparado${targets.length === 1 ? "" : "s"} para revisión.`);
  }

  return (
    <section className="photo-review" aria-labelledby="photo-review-title">
      <header className="photo-review__header">
        <div><p className="eyebrow orange">FOTOS · CONTROL DE CALIDAD</p><h2 id="photo-review-title">{queue.length} fotos para revisar</h2><p>Identificá el origen, encuadrá, prepará flyers y aprobá las cinco características antes de publicar.</p></div>
        <div className="photo-review__bulk">
          <button type="button" onClick={() => setSelected(selected.size === queue.length ? new Set() : new Set(queue.map((product) => product.id)))}>{selected.size === queue.length && queue.length > 0 ? "Quitar selección" : "Seleccionar todas"}</button>
          <button type="button" className="primary" disabled={selected.size === 0} onClick={prepareSelected}><Sparkles /> Flyer económico ({selected.size})</button>
        </div>
      </header>
      {notice ? <p className="photo-review__notice" role="status">{notice} Nada se envía a producción.</p> : null}
      <div className="photo-review__grid">
        {queue.map((product) => {
          const draft = draftFor(product);
          const fromSupplier = Boolean(product.supplierImageUrl && (draft.mode === "supplier" || draft.imageUrl === product.supplierImageUrl));
          return (
            <article key={product.id} className="photo-review-card">
              <label className="photo-review-card__select"><input type="checkbox" checked={selected.has(product.id)} onChange={() => setSelected((current) => current.has(product.id) ? new Set([...current].filter((id) => id !== product.id)) : new Set(current).add(product.id))} /> Seleccionar</label>
              <div className={`photo-review-card__media is-${draft.mode}`}>
                {draft.imageUrl ? <img src={draft.imageUrl} alt={`Revisión de ${product.name}`} /> : <span>Sin imagen</span>}
                <b>{fromSupplier ? "FOTO DEL MAYORISTA" : draft.mode === "economic" ? "FLYER ECONÓMICO · BORRADOR" : "EDICIÓN MANUAL"}</b>
              </div>
              <div className="photo-review-card__copy"><small>{product.category ?? "Sin categoría"} · {product.supplier ?? "Sin mayorista"}</small><h3>{product.name}</h3></div>
              <div className="photo-review-card__actions">
                <button type="button" onClick={() => update(product, { mode: "economic", approved: false })}><Sparkles /> Flyer económico</button>
                <label><ImagePlus /> Reemplazar<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; update(product, { imageUrl: URL.createObjectURL(file), mode: "manual", approved: false }); }} /></label>
              </div>
              <details className="photo-review-card__editor">
                <summary><Pencil /> Edición y 5 características</summary>
                <p><ScanText /> Propuesta basada en la ficha disponible. Verificá siempre contra la foto antes de aprobar.</p>
                <div>
                  {draft.features.map((feature, index) => <label key={index}><span>{index + 1}</span><input value={feature} placeholder={`Característica ${index + 1}`} onChange={(event) => update(product, { features: draft.features.map((item, itemIndex) => itemIndex === index ? event.target.value : item), approved: false })} /></label>)}
                </div>
                <button type="button" className={draft.approved ? "approved" : ""} onClick={() => update(product, { approved: !draft.approved })}><CheckCircle2 /> {draft.approved ? "Características aprobadas" : "Aprobar características"}</button>
              </details>
            </article>
          );
        })}
      </div>
      <p className="internal-privacy-note">Flujo local y reversible: no reemplaza fotos reales, no escribe en Supabase y no publica automáticamente. La lectura automática de texto de una foto nueva requiere un servicio OCR/IA autorizado; hasta entonces la aprobación es humana.</p>
    </section>
  );
}
