import type { Product } from "@/lib/catalog";

export const recentlyViewedKey = "amarango:v16:recently-viewed";
export const recentlyViewedVersion = 1 as const;
export const recentlyViewedLimit = 6;
export const productViewedEvent = "amarango:product-viewed";

const changeEvent = "amarango:recently-viewed-change";
const maximumIdLength = 256;
const emptySnapshot = JSON.stringify({ version: recentlyViewedVersion, ids: [] });

type RecentlyViewedPayload = {
  version: typeof recentlyViewedVersion;
  ids: string[];
};

function normalizeIds(value: unknown, limit = recentlyViewedLimit) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return [];
  const ids: string[] = [];
  for (const item of value) {
    const id = item.trim();
    if (!id || id.length > maximumIdLength || ids.includes(id)) continue;
    ids.push(id);
    if (ids.length === limit) break;
  }
  return ids;
}

function serialize(ids: string[]) {
  const payload: RecentlyViewedPayload = { version: recentlyViewedVersion, ids: normalizeIds(ids) };
  return JSON.stringify(payload);
}

function decode(snapshot: string) {
  try {
    const value = JSON.parse(snapshot) as unknown;
    if (Array.isArray(value)) {
      return { ids: normalizeIds(value), repair: true };
    }
    if (!value || typeof value !== "object") return { ids: [], repair: true };
    const payload = value as Record<string, unknown>;
    if (payload.version !== recentlyViewedVersion || !Array.isArray(payload.ids)) return { ids: [], repair: true };
    const ids = normalizeIds(payload.ids);
    const canonical = serialize(ids);
    return { ids, repair: snapshot !== canonical };
  } catch {
    return { ids: [], repair: true };
  }
}

export function parseRecentlyViewedSnapshot(snapshot: string) {
  return decode(snapshot).ids;
}

export function getRecentlyViewedSnapshot() {
  if (typeof window === "undefined") return emptySnapshot;
  try {
    const stored = window.localStorage.getItem(recentlyViewedKey);
    if (stored === null) return emptySnapshot;
    const parsed = decode(stored);
    const canonical = serialize(parsed.ids);
    if (parsed.repair) window.localStorage.setItem(recentlyViewedKey, canonical);
    return canonical;
  } catch {
    return emptySnapshot;
  }
}

export function getRecentlyViewedServerSnapshot() {
  return emptySnapshot;
}

export function subscribeRecentlyViewed(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const localListener = () => callback();
  const storageListener = (event: StorageEvent) => {
    if (event.key === recentlyViewedKey || event.key === null) callback();
  };
  window.addEventListener(changeEvent, localListener);
  window.addEventListener("storage", storageListener);
  return () => {
    window.removeEventListener(changeEvent, localListener);
    window.removeEventListener("storage", storageListener);
  };
}

function write(ids: string[]) {
  const normalized = normalizeIds(ids);
  if (typeof window === "undefined") return normalized;
  try {
    window.localStorage.setItem(recentlyViewedKey, serialize(normalized));
    window.dispatchEvent(new Event(changeEvent));
  } catch {
    // The public storefront remains usable when device storage is blocked.
  }
  return normalized;
}

export function rememberRecentlyViewed(productId: string) {
  const id = typeof productId === "string" ? productId.trim() : "";
  if (typeof window === "undefined" || !id || id.length > maximumIdLength) return [];
  const current = parseRecentlyViewedSnapshot(getRecentlyViewedSnapshot());
  return write([id, ...current.filter((currentId) => currentId !== id)]);
}

export function replaceRecentlyViewed(ids: string[]) {
  return write(ids);
}

export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(recentlyViewedKey);
    window.dispatchEvent(new Event(changeEvent));
  } catch {
    // No-op when browser storage is unavailable.
  }
}

function hasSafePublicIdentity(product: Product) {
  return product.visible === true
    && typeof product.id === "string"
    && product.id.trim().length > 0
    && product.id.length <= maximumIdLength
    && typeof product.slug === "string"
    && product.slug.trim().length > 0
    && typeof product.name === "string"
    && product.name.trim().length > 0
    && typeof product.brand === "string"
    && product.brand.trim().length > 0
    && product.availability !== "unavailable"
    && product.stock.status !== "out_of_stock";
}

export function projectRecentlyViewedProducts(ids: string[], products: Product[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (typeof product.id !== "string") continue;
    counts.set(product.id, (counts.get(product.id) ?? 0) + 1);
  }

  const byId = new Map<string, Product>();
  for (const product of products) {
    if (counts.get(product.id) === 1 && hasSafePublicIdentity(product)) byId.set(product.id, product);
  }

  const projected: Product[] = [];
  const validIds: string[] = [];
  for (const id of normalizeIds(ids, Number.POSITIVE_INFINITY)) {
    const product = byId.get(id);
    if (!product) continue;
    validIds.push(id);
    projected.push(product);
    if (validIds.length === recentlyViewedLimit) break;
  }
  return { ids: validIds, products: projected };
}
