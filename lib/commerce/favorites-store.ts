export const favoritesStorageKey = "amarango-v15-favorites";

const favoritesChangeEvent = "amarango:favorites-change";
const emptySnapshot = "[]";

function normalizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))].sort();
}

export function getFavoritesSnapshot(): string {
  if (typeof window === "undefined") return emptySnapshot;
  try {
    return JSON.stringify(normalizeFavoriteIds(JSON.parse(window.localStorage.getItem(favoritesStorageKey) ?? emptySnapshot)));
  } catch {
    return emptySnapshot;
  }
}

export function getFavoritesServerSnapshot() {
  return emptySnapshot;
}

export function parseFavoritesSnapshot(snapshot: string): ReadonlySet<string> {
  try {
    return new Set(normalizeFavoriteIds(JSON.parse(snapshot)));
  } catch {
    return new Set<string>();
  }
}

export function subscribeFavorites(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === favoritesStorageKey) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(favoritesChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(favoritesChangeEvent, onStoreChange);
  };
}

export function toggleFavoriteId(productId: string): boolean {
  const favorites = new Set(parseFavoritesSnapshot(getFavoritesSnapshot()));
  if (favorites.has(productId)) favorites.delete(productId); else favorites.add(productId);
  window.localStorage.setItem(favoritesStorageKey, JSON.stringify([...favorites].sort()));
  window.dispatchEvent(new Event(favoritesChangeEvent));
  return favorites.has(productId);
}
