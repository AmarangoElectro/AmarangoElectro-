export const catalogReturnKey = "amarango:v16:catalog-return";
export const catalogRestoreKey = "amarango:v16:catalog-restore";

export type CatalogReturnContext = {
  url: string;
  scrollY: number;
  capturedAt: number;
};

function isFresh(context: CatalogReturnContext, now = Date.now()) {
  return now - context.capturedAt < 1000 * 60 * 60 * 6;
}

export function readCatalogReturnContext(storage: Pick<Storage, "getItem"> = window.sessionStorage): CatalogReturnContext | null {
  try {
    const raw = storage.getItem(catalogReturnKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CatalogReturnContext>;
    if (typeof parsed.url !== "string" || typeof parsed.scrollY !== "number" || typeof parsed.capturedAt !== "number") return null;
    const context = parsed as CatalogReturnContext;
    return isFresh(context) ? context : null;
  } catch {
    return null;
  }
}

export function captureCatalogReturnContext(locationLike: Pick<Location, "pathname" | "search" | "hash"> = window.location, scrollY = window.scrollY) {
  if (typeof window === "undefined") return;
  if (!locationLike.pathname.startsWith("/categoria/")) return;
  const context: CatalogReturnContext = {
    url: `${locationLike.pathname}${locationLike.search}${locationLike.hash || "#catalogo"}`,
    scrollY: Math.max(0, Math.round(scrollY)),
    capturedAt: Date.now(),
  };
  try {
    window.sessionStorage.setItem(catalogReturnKey, JSON.stringify(context));
  } catch {
    // Storage may be unavailable in private/restricted browser contexts.
  }
}

export function requestCatalogScrollRestore(context: CatalogReturnContext) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(catalogRestoreKey, JSON.stringify({ scrollY: context.scrollY, capturedAt: Date.now() }));
  } catch {
    // Returning to the catalog still works even when scroll persistence is blocked.
  }
}

export function consumeCatalogScrollRestore(storage: Pick<Storage, "getItem" | "removeItem"> = window.sessionStorage) {
  try {
    const raw = storage.getItem(catalogRestoreKey);
    storage.removeItem(catalogRestoreKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { scrollY?: unknown; capturedAt?: unknown };
    if (typeof parsed.scrollY !== "number" || typeof parsed.capturedAt !== "number") return null;
    if (Date.now() - parsed.capturedAt > 1000 * 60 * 2) return null;
    return Math.max(0, parsed.scrollY);
  } catch {
    return null;
  }
}
