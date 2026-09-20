export type BulkPriceMode = "sale_ars" | "cost_ars" | "cost_usd" | "mixed";

export type ParsedCurrency = "ARS" | "USD";
export type ParsedPriceKind = "sale" | "cost";
export type ImportLineStatus = "ready" | "review" | "rejected";

export interface ParsedPriceLine {
  lineNumber: number;
  sourceLine: string;
  name: string | null;
  rawAmount: number | null;
  currency: ParsedCurrency | null;
  priceKind: ParsedPriceKind | null;
  status: ImportLineStatus;
  issues: readonly string[];
}

export interface BulkPriceParseOptions {
  mode: BulkPriceMode;
}

export interface AdminCatalogProduct {
  id: string;
  name: string;
  salePrice: number | null;
  costArs: number | null;
  costUsd: number | null;
  fxRate: number | null;
  supplier: string | null;
  category: string | null;
  imageUrl: string | null;
  visible: boolean;
  priceUpdatedAt: number | null;
  priceConfirmedAt: number | null;
}

export interface AdminImportContext {
  supplier: string | null;
  category: string | null;
  imageUrl: string | null;
  fxRate: number | null;
  now: number;
}

export interface AdminProductDraft extends AdminCatalogProduct {
  sourceLineNumber: number;
}

export interface ProductFieldChange {
  field: keyof Pick<AdminCatalogProduct,
    "salePrice" | "costArs" | "costUsd" | "fxRate" | "supplier" | "category" | "imageUrl" | "priceUpdatedAt"
  >;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

export type ImportProposalAction = "create" | "update" | "no_change" | "review_required" | "rejected";

export interface ImportProposal {
  line: ParsedPriceLine;
  action: ImportProposalAction;
  matchedProductId: string | null;
  draft: AdminProductDraft | null;
  changes: readonly ProductFieldChange[];
  issues: readonly string[];
}

export interface ImportPreviewSummary {
  totalLines: number;
  create: number;
  update: number;
  noChange: number;
  reviewRequired: number;
  rejected: number;
}

export interface AdminImportPreview {
  proposals: readonly ImportProposal[];
  summary: ImportPreviewSummary;
  writeAllowed: false;
  requiresAuthenticatedAdmin: true;
  requiresMfa: true;
  requiresServerSideAuthorization: true;
}
