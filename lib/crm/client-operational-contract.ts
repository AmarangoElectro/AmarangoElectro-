export const V16_CLIENT_CREATE_CONTRACT_VERSION = "V16_CLIENT_CREATE_CONTRACT_1" as const;

export interface V16CreateClientParams {
  nombre: string;
  dni?: string | null;
  telefono: string;
  telefonoAlternativo?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  ocupacionActividad?: string | null;
  observaciones?: string | null;
  source: "advisor_sale" | "administration" | "crm";
  idempotencyKey: string;
}

export interface V16CreateClientResult {
  client_id: string;
  created: boolean;
  duplicate_reason: "dni" | "phone" | null;
  created_at: string;
}
