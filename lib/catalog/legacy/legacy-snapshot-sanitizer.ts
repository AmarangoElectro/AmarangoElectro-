import type { LegacyCatalogSnapshot } from "./legacy-normalizer";

const CATALOG_ALLOWED_FIELDS = [
  "id",
  "nombre",
  "venta",
  "categoria",
  "categoriaManualProveedor",
  "caracteristicas",
  "foto",
  "fotoManualProveedor",
  "visible",
  "eliminado",
  "sinStock",
  "estadoProveedor",
  "ocultoManualProveedor",
  "ocultoManualAdmin",
  "ocultoPorDuplicado",
  "pendienteRevisionManual",
  "proveedorStock",
  "stockProveedor",
  "stock",
  "cantidadStock",
  "cantidadDisponible",
] as const;

const PHONE_ALLOWED_FIELDS = [
  "nombre",
  "precio",
  "foto",
  "colores",
  "caracteristicas",
  "ocultoTienda",
  "sinStock",
] as const;

type UnknownRecord = Record<string, unknown>;

function rows(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object" && "datos" in input) {
    const data = (input as { datos?: unknown }).datos;
    return Array.isArray(data) ? data : [];
  }
  return [];
}

function pick(row: unknown, allowed: readonly string[]) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const source = row as UnknownRecord;
  const output: UnknownRecord = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, field)) output[field] = structuredClone(source[field]);
  }
  return Object.freeze(output);
}

function sanitizeDataset(input: unknown, allowed: readonly string[]) {
  return Object.freeze(rows(input).map((row) => pick(row, allowed)));
}

/**
 * Boundary de ingreso offline para snapshots legacy.
 *
 * - No conoce red, Supabase, credenciales ni Storage.
 * - Elimina todo campo que no esté explícitamente permitido.
 * - Clona la entrada para que la normalización posterior no pueda mutar el archivo recibido.
 */
export function sanitizeLegacySnapshot(snapshot: Readonly<LegacyCatalogSnapshot>): LegacyCatalogSnapshot {
  return Object.freeze({
    tiendaCatalogo: sanitizeDataset(snapshot.tiendaCatalogo, CATALOG_ALLOWED_FIELDS),
    celularesLista: sanitizeDataset(snapshot.celularesLista, PHONE_ALLOWED_FIELDS),
  });
}

export const LEGACY_SNAPSHOT_ALLOWED_FIELDS = Object.freeze({
  tiendaCatalogo: CATALOG_ALLOWED_FIELDS,
  celularesLista: PHONE_ALLOWED_FIELDS,
});
