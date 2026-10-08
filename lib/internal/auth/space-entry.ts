/** Navigation only. Every destination keeps its own server authorization. */
export type SpaceAccess = {
  role: "owner" | "admin" | "asesor" | "cliente" | null;
  admin: boolean;
  owner: boolean;
  advisor: boolean;
};

export const NO_SPACE_ACCESS: SpaceAccess = { role: null, admin: false, owner: false, advisor: false };

/** Accept explicit grants from the trusted RPC, never infer grants from a role alone. */
export function parseSpaceAccess(value: unknown): SpaceAccess {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...NO_SPACE_ACCESS };
  const data = value as Record<string, unknown>;
  const role = data.role === "owner" || data.role === "admin" || data.role === "asesor" || data.role === "cliente" ? data.role : null;
  const internal = role === "owner" || role === "admin";
  return {
    role,
    owner: role === "owner" && data.owner === true,
    admin: internal && data.admin === true,
    advisor: (internal || role === "asesor") && data.advisor === true,
  };
}

export function spaceEntryDestination(access: SpaceAccess, hasOwnStore: boolean): string {
  if (access.admin) return "/administracion";
  if (access.owner) return "/propietarios";
  if (access.advisor) return "/mi-amarango";
  if (hasOwnStore) return "/mi-tienda";
  return "/mi-cuenta";
}
