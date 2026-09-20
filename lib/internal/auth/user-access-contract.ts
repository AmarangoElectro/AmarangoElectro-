export type V16PlatformRole = "owner" | "admin" | "advisor" | "customer";
export type V16PlatformCapability = "admin.access" | "advisors.access" | "crm.read" | "collections.read" | "reports.read" | "providers.read" | "cash.read" | "deliveries.read";
export type V16UserAccess =
  | { status: "ok"; role: V16PlatformRole; capabilities: readonly V16PlatformCapability[]; advisorId: string | null }
  | { status: "unauthenticated" }
  | { status: "unauthorized" }
  | { status: "not_connected" };
export interface V16UserAccessProvider { resolveCurrentAccess(): Promise<V16UserAccess>; }
export const NOT_CONNECTED_USER_ACCESS_PROVIDER: V16UserAccessProvider = { async resolveCurrentAccess() { return { status: "not_connected" }; } };
export function hasPlatformCapability(access: V16UserAccess, capability: V16PlatformCapability): boolean {
  return access.status === "ok" && access.capabilities.includes(capability);
}
export function canEnterAdministration(access: V16UserAccess): boolean {
  return hasPlatformCapability(access, "admin.access") && access.status === "ok" && (access.role === "owner" || access.role === "admin");
}
export function canEnterAdvisorWorkspace(access: V16UserAccess): boolean {
  return access.status === "ok" && access.role === "advisor" && Boolean(access.advisorId) && hasPlatformCapability(access, "advisors.access");
}
