import evidence from "@/fixtures/v16-advisor-freshness-sanitized-20260920.json";
import { z } from "zod";
import type { Product } from "./types";

const rowSchema = z.object({
  sourceProductId: z.string().min(1),
  priceUpdatedAt: z.string().min(1),
  stockSourceUpdatedAt: z.string().nullable(),
  stockVerificationMode: z.enum(["automatic","manual","unknown"]),
}).strict();

const parsed = z.object({
  evidence_status: z.literal("sanitized_advisor_freshness_snapshot"),
  source_reference: z.string().min(1),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  safety: z.object({
    supabase_written: z.literal(false),
    provider_identity_included: z.literal(false),
    costs_included: z.literal(false),
    advisor_safe: z.literal(true),
  }).strict(),
  products: z.array(rowSchema),
}).strict().parse(evidence);

const bySourceId = new Map(parsed.products.map((row) => [row.sourceProductId, row]));

function sourceProductId(product: Product) {
  const index = product.id.indexOf(":");
  return index >= 0 ? product.id.slice(index + 1) : product.id;
}

export type FreshnessTone = "fresh" | "recent" | "aging" | "stale" | "unknown";

export function freshnessDays(iso: string | null, now = new Date()) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

export function freshnessTone(days: number | null): FreshnessTone {
  if (days === null) return "unknown";
  if (days <= 3) return "fresh";
  if (days <= 7) return "recent";
  if (days <= 14) return "aging";
  return "stale";
}

export function humanFreshness(days: number | null) {
  if (days === null) return "sin fecha";
  if (days === 0) return "hoy";
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

export function getAdvisorFreshness(product: Product, now = new Date()) {
  const row = bySourceId.get(sourceProductId(product));
  if (!row) {
    return {
      priceDays: null,
      priceTone: "unknown" as const,
      priceLabel: "Precio sin fecha de actualización",
      stockDays: null,
      stockTone: "unknown" as const,
      stockLabel: "Stock a confirmar",
      verificationMode: "unknown" as const,
    };
  }

  const priceDays = freshnessDays(row.priceUpdatedAt, now);
  const stockDays = freshnessDays(row.stockSourceUpdatedAt, now);

  return {
    priceDays,
    priceTone: freshnessTone(priceDays),
    priceLabel: `Precio actualizado ${humanFreshness(priceDays)}`,
    stockDays,
    stockTone: freshnessTone(stockDays),
    stockLabel: row.stockVerificationMode === "automatic"
      ? `Fuente automática de stock actualizada ${humanFreshness(stockDays)}`
      : "Stock sin confirmación automática",
    verificationMode: row.stockVerificationMode,
  };
}

export const advisorFreshnessEvidence = Object.freeze({
  capturedAt: parsed.captured_at,
  count: parsed.products.length,
});
