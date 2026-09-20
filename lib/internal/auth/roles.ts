export type InternalRole = "customer" | "advisor" | "admin";

export type InternalCapability =
  | "catalog.view"
  | "product.compare"
  | "product.share"
  | "consultation.create"
  | "price.cash.view"
  | "financing.options.view"
  | "sale.register"
  | "sales.view"
  | "calculator.use"
  | "cost.view"
  | "cost.manage"
  | "fx.view"
  | "fx.manage"
  | "commission.view"
  | "commission.manage"
  | "investment.view"
  | "catalog.manage"
  | "catalog.import"
  | "pricing.manage"
  | "price.review"
  | "financing.manage"
  | "stock.manage"
  | "photos.manage"
  | "categories.manage"
  | "supplier.view"
  | "supplier.manage"
  | "catalog.publish"
  | "reports.view"
  | "backups.manage"
  | "users.manage";

const ROLE_CAPABILITIES: Readonly<Record<InternalRole, readonly InternalCapability[]>> = {
  customer: [
    "catalog.view",
    "product.compare",
    "product.share",
    "consultation.create",
    "price.cash.view",
    "financing.options.view",
  ],
  advisor: [
    "catalog.view",
    "product.compare",
    "product.share",
    "consultation.create",
    "price.cash.view",
    "financing.options.view",
    "sale.register",
  ],
  admin: [
    "catalog.view",
    "product.compare",
    "product.share",
    "consultation.create",
    "price.cash.view",
    "financing.options.view",
    "sale.register",
    "sales.view",
    "calculator.use",
    "cost.view",
    "cost.manage",
    "fx.view",
    "fx.manage",
    "commission.view",
    "commission.manage",
    "investment.view",
    "catalog.manage",
    "catalog.import",
    "pricing.manage",
    "price.review",
    "financing.manage",
    "stock.manage",
    "photos.manage",
    "categories.manage",
    "supplier.view",
    "supplier.manage",
    "catalog.publish",
    "reports.view",
    "backups.manage",
    "users.manage",
  ],
};

export function capabilitiesForRole(role: InternalRole): readonly InternalCapability[] {
  return ROLE_CAPABILITIES[role];
}

export function roleHasCapability(role: InternalRole, capability: InternalCapability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export const internalAccessRequirements = Object.freeze({
  authRequired: true,
  authorizationRequired: true,
  adminMfaRequired: true,
  serverSideEnforcementRequired: true,
  auditLogRequiredForMutations: true,
  clientSidePasswordAccepted: false,
  localStorageSessionAccepted: false,
});
