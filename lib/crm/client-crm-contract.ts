/**
 * V16 SECURE CRM RPC CONTRACT — FROZEN.
 *
 * Contract version: V16_SECURE_CRM_RPC_CONTRACT_1
 * Source: real Supabase schema introspection (see
 * AMARANGOELECTRO-V16-CRM-CONTRACT-INTEGRATION-UNBLOCK-PACK.zip,
 * V16-SECURE-CRM-RPC-CONTRACT-FROZEN.md / .json).
 *
 * These types are copied EXACTLY from that frozen contract — no parameter
 * or returned field was guessed. The three RPCs are `SECURITY DEFINER`,
 * `EXECUTE: authenticated` only (no `anon` execute): they enforce the V16
 * identity/capability layer server-side and must never be bypassed by a
 * direct read of `public.clientes` or `public.ventas` from this UI.
 *
 * There is no character-level masking transformation in these RPCs — do
 * NOT invent a `maskedDni`/`maskedPhone` field. The security model is:
 * authorize the identity, scope which client may be read, return only the
 * approved contract fields, omit internal sensitive sales fields entirely.
 */

export const V16_CRM_CONTRACT_VERSION = "V16_SECURE_CRM_RPC_CONTRACT_1" as const;

export interface V16CrmClientListRow {
  id: string;
  nombre: string | null;
  telefono: string | null;
  localidad: string | null;
  direccion: string | null;
  dni: string | null;
  telefono2: string | null;
  responsable: string | null;
  alta: string | null;
}

export interface V16CrmClient360Row {
  id: string;
  nombre: string | null;
  telefono: string | null;
  localidad: string | null;
  direccion: string | null;
  observaciones: string | null;
  alta: string | null;
  dni: string | null;
  telefono2: string | null;
  responsable: string | null;
  ventas_total: number;
  cuotas_total: number;
  cuotas_pagadas: number;
  cuotas_pendientes: number;
}

export interface V16CrmClientSaleRow {
  id: string;
  cliente_id: string;
  producto: string | null;
  precio_venta: number | string | null;
  envio: number | string | null;
  responsable: string | null;
  fecha: string | null;
  cuotas: number | null;
  pagadas: number | null;
  cuotas_pendientes: number;
  tipo: string | null;
  total: number | string | null;
  precio: number | string | null;
  archivada: boolean | null;
  monto_cuota: number | string | null;
  vence_manual: string | null;
}

/**
 * Fields the frozen contract explicitly says are omitted from
 * `v16_crm_client_sales`. This UI/adapter must never attempt to read,
 * derive, or display any of these — listed here only so a future
 * maintainer can grep and see why they don't exist in the row type above.
 *
 * precioCosto, ganancia, mayorista, inversionista, inversionista2,
 * inversores, pagoInv, pagoRev, monto_invertido, montoInvertido,
 * porcentaje, pct1, pct2
 */
export const V16_CRM_SENSITIVE_FIELDS_NEVER_FETCHED = Object.freeze([
  "precioCosto", "ganancia", "mayorista", "inversionista", "inversionista2",
  "inversores", "pagoInv", "pagoRev", "monto_invertido", "montoInvertido",
  "porcentaje", "pct1", "pct2",
] as const);

export interface V16CrmListClientsParams {
  search_text?: string | null;
  row_limit?: number;
  row_offset?: number;
}

export const V16_CRM_LIST_CLIENTS_DEFAULTS = Object.freeze({
  search_text: null,
  row_limit: 100,
  row_offset: 0,
} satisfies Required<V16CrmListClientsParams>);
