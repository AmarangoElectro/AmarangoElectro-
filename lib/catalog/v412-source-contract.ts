import type { Availability } from "./types";

export interface V412MasterProductInput {
  id?: unknown;
  nombre?: unknown;
  categoria?: unknown;
  venta?: unknown;
  visible?: unknown;
  eliminado?: unknown;
  sinStock?: unknown;
  estadoProveedor?: unknown;
  proveedorStock?: unknown;
  ocultoManualAdmin?: unknown;
  ocultoManualProveedor?: unknown;
  ocultoPorDuplicado?: unknown;
}

export interface V412IncrementalEnvelopeInput {
  producto_id?: unknown;
  eliminado?: unknown;
  actualizado?: unknown;
}

export interface V412VisibilityOverlayInput {
  visible?: unknown;
  eliminado?: unknown;
  ocultoManualAdmin?: unknown;
  ocultoManualProveedor?: unknown;
  ocultoPorDuplicado?: unknown;
}

export interface V412PublicationInput {
  stableId: unknown;
  master: V412MasterProductInput;
  incremental: V412IncrementalEnvelopeInput | null;
  overlays?: readonly V412VisibilityOverlayInput[];
}

export interface V412PublicationDecision {
  readonly publish: boolean;
  readonly stableId: string | null;
  readonly availability: Availability;
  readonly updatedAt: string | null;
  readonly reasons: readonly string[];
}

const stableIdPattern = /^-?\d+$/;

function asStableId(value: unknown): string | null {
  const candidate = typeof value === "number" && Number.isInteger(value) ? String(value) : typeof value === "string" ? value.trim() : "";
  return stableIdPattern.test(candidate) ? candidate : null;
}

function hasExplicitHide(value: V412MasterProductInput | V412VisibilityOverlayInput) {
  return value.eliminado === true
    || value.visible === false
    || value.ocultoManualAdmin === true
    || value.ocultoManualProveedor === true
    || value.ocultoPorDuplicado === true;
}

function stockAvailability(master: V412MasterProductInput): Availability {
  if (master.sinStock === true || master.estadoProveedor === "sin_stock" || master.proveedorStock === 0) return "unavailable";
  if (master.estadoProveedor === "disponible" || (typeof master.proveedorStock === "number" && master.proveedorStock > 0)) return "available";
  return "unknown";
}

function freezeDecision(decision: Omit<V412PublicationDecision, "reasons"> & { reasons: string[] }): V412PublicationDecision {
  return Object.freeze({ ...decision, reasons: Object.freeze(decision.reasons) });
}

/**
 * Evalúa el contrato canónico V4.12 sin mutar el registro ni realizar I/O.
 * La ausencia o ambigüedad de cualquier condición de publicación falla cerrado.
 */
export function evaluateV412Publication(input: V412PublicationInput): V412PublicationDecision {
  const reasons: string[] = [];
  const stableId = asStableId(input.stableId);
  const masterId = asStableId(input.master.id);
  const incrementalId = asStableId(input.incremental?.producto_id);
  const availability = stockAvailability(input.master);

  if (!stableId) reasons.push("stable_id_missing_or_invalid");
  if (!input.incremental) reasons.push("incremental_envelope_missing");
  if (stableId && masterId !== stableId) reasons.push("master_id_mismatch");
  if (stableId && incrementalId !== stableId) reasons.push("incremental_id_mismatch");
  if (input.incremental?.eliminado === true) reasons.push("incremental_tombstone");
  if (input.master.visible !== true) reasons.push("master_not_explicitly_visible");
  if (hasExplicitHide(input.master)) reasons.push("master_explicitly_hidden");
  if (typeof input.master.nombre !== "string" || input.master.nombre.trim() === "") reasons.push("name_missing");
  if (typeof input.master.categoria !== "string" || input.master.categoria.trim() === "") reasons.push("category_missing");
  if (typeof input.master.venta !== "number" || !Number.isFinite(input.master.venta) || input.master.venta <= 0) reasons.push("cash_price_invalid");
  if (availability === "unavailable") reasons.push("explicitly_out_of_stock");
  if ((input.overlays ?? []).some(hasExplicitHide)) reasons.push("visibility_overlay_blocks");

  const updatedAt = typeof input.incremental?.actualizado === "string" && input.incremental.actualizado.trim()
    ? input.incremental.actualizado
    : null;

  return freezeDecision({
    publish: reasons.length === 0,
    stableId,
    availability,
    updatedAt,
    reasons,
  });
}

/** El slug depende sólo del ID persistente; el nombre nunca participa. */
export function v412StableSlug(value: string | number) {
  const stableId = asStableId(value);
  if (!stableId) throw new Error("V4.12 stableId inválido");
  return stableId.startsWith("-") ? `product-n${stableId.slice(1)}` : `product-p${stableId}`;
}
