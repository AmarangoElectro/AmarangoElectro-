export const V415_REVENUE_EVENT_NAMES = Object.freeze([
  "product_view",
  "product_share",
  "favorite_add",
  "search",
  "search_no_result",
  "category_view",
  "product_contact",
  "financing_open",
] as const);

export type V415RevenueEventName = (typeof V415_REVENUE_EVENT_NAMES)[number];

export interface V415RevenueEventDraft {
  readonly eventName: V415RevenueEventName;
  readonly productId: string | null;
  readonly category: string | null;
  readonly resultCount: number | null;
  readonly queryTokenCount: number | null;
  readonly queryLengthBucket: "0" | "1-5" | "6-15" | "16+" | null;
  readonly occurredAt: null;
  readonly collectionEnabled: false;
  readonly containsPersonalData: false;
}

function queryLengthBucket(length: number): V415RevenueEventDraft["queryLengthBucket"] {
  if (length === 0) return "0";
  if (length <= 5) return "1-5";
  if (length <= 15) return "6-15";
  return "16+";
}

/**
 * Produces a disabled, privacy-minimized design draft. It deliberately drops
 * raw search text, device IDs, contact data, IP addresses and user identity.
 */
export function createV415RevenueEventDraft(input: {
  readonly eventName: V415RevenueEventName;
  readonly productId?: string | null;
  readonly category?: string | null;
  readonly resultCount?: number | null;
  readonly rawQuery?: string | null;
}): V415RevenueEventDraft {
  const normalizedQuery = input.rawQuery?.trim().replace(/\s+/g, " ") ?? "";
  return Object.freeze({
    eventName: input.eventName,
    productId: input.productId ?? null,
    category: input.category ?? null,
    resultCount: Number.isInteger(input.resultCount) ? input.resultCount ?? null : null,
    queryTokenCount: normalizedQuery ? normalizedQuery.split(" ").length : null,
    queryLengthBucket: normalizedQuery ? queryLengthBucket(normalizedQuery.length) : null,
    occurredAt: null,
    collectionEnabled: false,
    containsPersonalData: false,
  });
}

