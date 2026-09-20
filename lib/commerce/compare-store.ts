export const compareStorageKey = "amarango-v16-compare";
export const compareLimit = 3;

const compareChangeEvent = "amarango:compare-change";
const emptySnapshot = "[]";

function normalizeCompareIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))].slice(0, compareLimit);
}

export function getCompareSnapshot(): string {
  if (typeof window === "undefined") return emptySnapshot;
  try {
    return JSON.stringify(normalizeCompareIds(JSON.parse(window.localStorage.getItem(compareStorageKey) ?? emptySnapshot)));
  } catch {
    return emptySnapshot;
  }
}

export function getCompareServerSnapshot() {
  return emptySnapshot;
}

export function parseCompareSnapshot(snapshot: string): readonly string[] {
  try {
    return normalizeCompareIds(JSON.parse(snapshot));
  } catch {
    return [];
  }
}

export function subscribeCompare(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === compareStorageKey) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(compareChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(compareChangeEvent, onStoreChange);
  };
}

export function setCompareIds(productIds: readonly string[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeCompareIds(productIds);
  window.localStorage.setItem(compareStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new Event(compareChangeEvent));
}

export function clearCompareIds() {
  setCompareIds([]);
}
