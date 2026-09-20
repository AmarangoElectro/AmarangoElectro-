import { quoteSaleFromCost, type CommercePolicy } from "../finance/calculator-engine";
import { usdCostToArs, type FxRateDraft } from "./fx-rate";
import type {
  AdminCatalogProduct,
  AdminImportContext,
  AdminImportPreview,
  AdminProductDraft,
  ImportProposal,
  ParsedPriceLine,
  ProductFieldChange,
} from "./types";

function normalizedName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function safeHttpsImage(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function syntheticDraftId(line: ParsedPriceLine): string {
  return `pending-create:${line.lineNumber}`;
}

function fieldChanges(existing: AdminCatalogProduct, draft: AdminProductDraft): ProductFieldChange[] {
  const fields: ProductFieldChange["field"][] = [
    "salePrice", "costArs", "costUsd", "fxRate", "supplier", "category", "imageUrl", "priceUpdatedAt",
  ];
  return fields.flatMap((field) => existing[field] === draft[field] ? [] : [{ field, before: existing[field], after: draft[field] }]);
}

function buildDraft(
  line: ParsedPriceLine,
  existing: AdminCatalogProduct | null,
  context: AdminImportContext,
  policy: CommercePolicy,
): { draft: AdminProductDraft | null; issues: string[] } {
  const issues = [...line.issues];
  if (line.status !== "ready" || !line.name || !line.rawAmount || !line.currency || !line.priceKind) {
    return { draft: null, issues };
  }

  let costArs = existing?.costArs ?? null;
  let costUsd = existing?.costUsd ?? null;
  let fxRate = existing?.fxRate ?? null;
  let salePrice = existing?.salePrice ?? null;

  if (line.priceKind === "sale") {
    salePrice = line.rawAmount;
  } else if (line.currency === "ARS") {
    costArs = line.rawAmount;
    costUsd = null;
    fxRate = null;
    salePrice = quoteSaleFromCost(costArs, policy).salePrice;
  } else {
    if (!context.fxRate) return { draft: null, issues: [...issues, "fx_rate_required"] };
    const fx: FxRateDraft = { currency: "USD", arsPerUnit: context.fxRate, effectiveAt: context.now };
    costUsd = line.rawAmount;
    fxRate = context.fxRate;
    costArs = usdCostToArs(costUsd, fx);
    salePrice = quoteSaleFromCost(costArs, policy).salePrice;
  }

  const inheritedImage = existing?.imageUrl ?? null;
  const requestedImage = safeHttpsImage(context.imageUrl);
  if (context.imageUrl && !requestedImage) issues.push("non_https_image_ignored");

  return {
    draft: {
      id: existing?.id ?? syntheticDraftId(line),
      name: line.name,
      salePrice,
      costArs,
      costUsd,
      fxRate,
      supplier: context.supplier ?? existing?.supplier ?? null,
      category: context.category ?? existing?.category ?? null,
      imageUrl: requestedImage ?? inheritedImage,
      visible: existing?.visible ?? false,
      priceUpdatedAt: context.now,
      priceConfirmedAt: existing?.priceConfirmedAt ?? null,
      sourceLineNumber: line.lineNumber,
    },
    issues,
  };
}

export function buildAdminImportPreview(
  lines: readonly ParsedPriceLine[],
  existingProducts: readonly AdminCatalogProduct[],
  context: AdminImportContext,
  policy: CommercePolicy,
): AdminImportPreview {
  const byName = new Map<string, AdminCatalogProduct[]>();
  for (const product of existingProducts) {
    const key = normalizedName(product.name);
    byName.set(key, [...(byName.get(key) ?? []), product]);
  }

  const proposals: ImportProposal[] = lines.map((line) => {
    if (line.status === "rejected") {
      return { line, action: "rejected", matchedProductId: null, draft: null, changes: [], issues: line.issues };
    }
    if (line.status === "review" || !line.name) {
      return { line, action: "review_required", matchedProductId: null, draft: null, changes: [], issues: line.issues };
    }

    const matches = byName.get(normalizedName(line.name)) ?? [];
    if (matches.length > 1) {
      return { line, action: "review_required", matchedProductId: null, draft: null, changes: [], issues: ["duplicate_existing_name"] };
    }

    const existing = matches[0] ?? null;
    const built = buildDraft(line, existing, context, policy);
    if (!built.draft) {
      return { line, action: "review_required", matchedProductId: existing?.id ?? null, draft: null, changes: [], issues: built.issues };
    }

    if (!existing) {
      return { line, action: "create", matchedProductId: null, draft: built.draft, changes: [], issues: built.issues };
    }

    const changes = fieldChanges(existing, built.draft);
    return {
      line,
      action: changes.length ? "update" : "no_change",
      matchedProductId: existing.id,
      draft: built.draft,
      changes,
      issues: built.issues,
    };
  });

  const summary = {
    totalLines: proposals.length,
    create: proposals.filter((p) => p.action === "create").length,
    update: proposals.filter((p) => p.action === "update").length,
    noChange: proposals.filter((p) => p.action === "no_change").length,
    reviewRequired: proposals.filter((p) => p.action === "review_required").length,
    rejected: proposals.filter((p) => p.action === "rejected").length,
  };

  return {
    proposals,
    summary,
    writeAllowed: false,
    requiresAuthenticatedAdmin: true,
    requiresMfa: true,
    requiresServerSideAuthorization: true,
  };
}

export function buildPriceConfirmationPreview(product: AdminCatalogProduct, now: number): AdminProductDraft {
  if (!Number.isFinite(now) || now <= 0) throw new RangeError("now must be valid");
  return { ...product, priceConfirmedAt: now, sourceLineNumber: 0 };
}
