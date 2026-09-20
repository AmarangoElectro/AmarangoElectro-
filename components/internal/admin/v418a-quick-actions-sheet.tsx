"use client";

import { useMemo, useState } from "react";
import { categories, getActiveSubcategories } from "@/lib/catalog/categories";
import type { AdminProductCardModel } from "@/lib/internal/admin/product-card-model";
import { buildV418ADiff, createV418ADraft, inferAuthorizedTaxonomy, validateV418ADraft, V418A_AVAILABILITY, v418aActions, type V418AAction, type V418AProductSnapshot } from "@/lib/internal/admin/v418a-quick-actions";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props { product: AdminProductCardModel | null; open: boolean; onOpenChange: (open: boolean) => void; }
const stockToAvailability = (stock: AdminProductCardModel["stockState"]): V418AProductSnapshot["availability"] => stock === "out_of_stock" ? "unavailable" : stock === "low_stock" ? "check_availability" : "available";

function snapshotOf(product: AdminProductCardModel): V418AProductSnapshot {
  return { id: product.id, name: product.name, price: product.salePrice, availability: stockToAvailability(product.stockState), imageLabel: product.imageUrl?.split("/").at(-1) ?? "Sin foto", ...inferAuthorizedTaxonomy(product.category), visible: product.visible };
}

export function V418AQuickActionsSheet({ product, open, onOpenChange }: Props) {
  const snapshot = useMemo(() => product ? snapshotOf(product) : null, [product]);
  const [active, setActive] = useState<V418AAction>("price");
  const [draft, setDraft] = useState(() => snapshot ? createV418ADraft(snapshot) : null);
  const [gateMessage, setGateMessage] = useState("");
  const current = draft?.id === snapshot?.id ? draft : snapshot ? createV418ADraft(snapshot) : null;
  const category = current ? categories.find((entry) => entry.slug === current.categorySlug) : null;
  const subcategories = category ? getActiveSubcategories(category) : [];
  const errors = current ? validateV418ADraft(current) : [];
  const diff = snapshot && current ? buildV418ADiff(snapshot, current) : [];

  function patch(next: Partial<NonNullable<typeof current>>) {
    if (!current) return;
    setGateMessage("");
    setDraft({ ...current, ...next });
  }

  function discard() {
    if (snapshot) setDraft(createV418ADraft(snapshot));
    setGateMessage("Borrador descartado. El producto original no cambió.");
  }

  function changeOpen(next: boolean) {
    if (!next) { setDraft(null); setActive("price"); setGateMessage(""); }
    onOpenChange(next);
  }

  return <Sheet open={open} onOpenChange={changeOpen}>
    <SheetContent className="v418a-sheet" aria-label="Acciones rápidas de administración">
      <SheetHeader className="v418a-sheet__header"><p>ADMINISTRACIÓN · ACCIONES RÁPIDAS</p><SheetTitle>Acciones rápidas</SheetTitle><SheetDescription>{snapshot?.name ?? "Producto"} · borrador temporal</SheetDescription></SheetHeader>
      {current && <div className="v418a-sheet__body">
        <nav className="v418a-action-list" aria-label="Acciones rápidas">{v418aActions.map((action) => <button key={action.id} type="button" aria-pressed={active === action.id} onClick={() => { setActive(action.id); setGateMessage(""); }}>{action.icon}<span>{action.label}</span></button>)}</nav>
        <section className="v418a-editor" aria-live="polite">
          {active === "price" && <label>Precio de venta ARS<input type="number" min="1" step="1" value={current.price ?? ""} onChange={(event) => patch({ price: event.target.value === "" ? null : Number(event.target.value) })} /></label>}
          {active === "availability" && <label>Disponibilidad<select value={current.availability} onChange={(event) => patch({ availability: event.target.value as typeof current.availability })}>{V418A_AVAILABILITY.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
          {active === "photo" && <label>Foto local para preview<input type="file" accept="image/*" onChange={(event) => patch({ imageFile: event.target.files?.[0] ?? null })} /><small>No se sube a Storage ni se conserva al cerrar.</small></label>}
          {active === "taxonomy" && <div className="v418a-taxonomy"><label>Categoría<select value={current.categorySlug} onChange={(event) => patch({ categorySlug: event.target.value, subcategorySlug: "" })}>{categories.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.title}</option>)}</select></label><label>Subcategoría<select value={current.subcategorySlug} onChange={(event) => patch({ subcategorySlug: event.target.value })}><option value="">Sin subcategoría</option>{subcategories.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.title}</option>)}</select></label></div>}
          {active === "visibility" && <button type="button" className="v418a-visibility" aria-pressed={!current.visible} onClick={() => patch({ visible: !current.visible })}>{current.visible ? "Ocultar en borrador" : "Mostrar en borrador"}</button>}
          {active === "full-sheet" && <div className="v418a-placeholder"><strong>Salida controlada</strong><p>La ficha completa todavía no está disponible desde esta acción.</p></div>}
        </section>
        <section className="v418a-diff" aria-labelledby="v418a-diff-title"><div><p>VISTA PREVIA</p><h3 id="v418a-diff-title">Antes / Después</h3></div>{diff.length === 0 ? <p className="v418a-empty">Sin cambios en el borrador.</p> : <dl>{diff.map((row) => <div key={row.field}><dt>{row.label}</dt><dd><span>{row.before}</span><strong>{row.after}</strong></dd></div>)}</dl>}</section>
        {errors.length > 0 && <ul className="v418a-errors">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        {gateMessage && <p className="v418a-gate-message" role="status">{gateMessage}</p>}
      </div>}
      <SheetFooter className="v418a-sheet__footer"><div><strong>CAMBIOS PRODUCTIVOS DESHABILITADOS</strong><small>Este entorno no tiene autoridad para aplicar cambios productivos.</small></div><button type="button" className="v418a-apply" disabled={errors.length > 0 || diff.length === 0} onClick={() => setGateMessage("Cambio no aplicado. Este entorno no tiene autorización de escritura.")}>Aplicar</button><button type="button" onClick={discard}>Descartar borrador</button><SheetClose asChild><button type="button">Cerrar</button></SheetClose></SheetFooter>
    </SheetContent>
  </Sheet>;
}
