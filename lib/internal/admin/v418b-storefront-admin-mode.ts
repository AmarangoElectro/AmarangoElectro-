export const V418B_STOREFRONT_ROLES = ["client", "advisor", "admin", "owner"] as const;
export type V418BStorefrontRole = typeof V418B_STOREFRONT_ROLES[number];

export interface V418BStorefrontContext {
  role: V418BStorefrontRole;
  internalLabContext: boolean;
  adminMode: boolean;
}

export type V418BStorefrontProjection = "client" | "advisor" | "admin-overlay" | "owner-overlay";

/**
 * V4.18B is deliberately fail-closed. This is only an internal LAB/UI contract;
 * it is not business authorization and it must never be used as server-side RBAC.
 */
export function canOfferV418BAdminMode(context: Pick<V418BStorefrontContext, "role" | "internalLabContext">): boolean {
  return (context.role === "admin" || context.role === "owner") && context.internalLabContext === true;
}

export function resolveV418BStorefrontProjection(context: V418BStorefrontContext): V418BStorefrontProjection {
  if (context.role === "advisor") return "advisor";
  if (context.role !== "admin" && context.role !== "owner") return "client";
  if (!canOfferV418BAdminMode(context) || context.adminMode !== true) return "client";
  return context.role === "owner" ? "owner-overlay" : "admin-overlay";
}

export const v418bStorefrontAdminModeContract = Object.freeze({
  gate: "FASE H · V4.18B",
  mode: "INTERNAL_LAB_FAIL_CLOSED",
  publicActivationEnabled: false,
  urlActivationEnabled: false,
  persistedActivationEnabled: false,
  serverSideBusinessAuthorizationImplemented: false,
  adminModeOffProjection: "client",
  quickActionsContract: "V4.18A",
  writeGate: "SIMULADO_BLOQUEADO",
  productV16MutationEnabled: false,
  canonicalCatalogMutationEnabled: false,
  remotePersistenceEnabled: false,
});
