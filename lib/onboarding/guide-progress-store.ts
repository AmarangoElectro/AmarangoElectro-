/**
 * V16 FIRST-TIME SECTOR GUIDES — completion-state store.
 *
 * This is the "local preview/lab" fallback explicitly allowed by the gate:
 * "For local preview/lab only, localStorage may be used as a UX simulation
 * fallback, clearly isolated from authorization/security." This app has no
 * real authenticated-user session in this checkpoint (same reason every
 * other lab store in this repo — favorites, compare, offers, admin-lab —
 * already persists to localStorage instead of a backend). Keyed by
 * `role:sectorId` only (no `userId`, since none exists yet); `guideVersion`
 * is compared against the stored value, not baked into the key, so an
 * updated guide can be detected and re-shown per the gate's requirement.
 *
 * This store NEVER gates access to a control — it only remembers whether a
 * guide was seen. It must never be read as an authorization signal.
 */

export interface GuideProgress {
  completedVersion: number | null;
}

const STORAGE_PREFIX = "amarango_v16_sector_guide_v1";

function storageKey(role: string, sectorId: string) {
  return `${STORAGE_PREFIX}:${role}:${sectorId}`;
}

function parseProgress(raw: string | null): GuideProgress {
  if (!raw) return { completedVersion: null };
  try {
    const value = JSON.parse(raw) as Partial<GuideProgress>;
    return { completedVersion: Number.isFinite(value.completedVersion) ? Number(value.completedVersion) : null };
  } catch {
    return { completedVersion: null };
  }
}

export function getGuideProgress(role: string, sectorId: string): GuideProgress {
  if (typeof window === "undefined") return { completedVersion: null };
  return parseProgress(window.localStorage.getItem(storageKey(role, sectorId)));
}

export function getGuideProgressSnapshot(role: string, sectorId: string) {
  if (typeof window === "undefined") return "null";
  return window.localStorage.getItem(storageKey(role, sectorId)) ?? "null";
}

export function getGuideProgressServerSnapshot() {
  return "null";
}

export function subscribeGuideProgress(role: string, sectorId: string, listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const key = storageKey(role, sectorId);
  const eventName = `amarango:sector-guide-change:${key}`;
  const receive = (event: Event) => {
    if (event instanceof StorageEvent && event.key !== key) return;
    listener();
  };
  window.addEventListener("storage", receive);
  window.addEventListener(eventName, receive);
  return () => {
    window.removeEventListener("storage", receive);
    window.removeEventListener(eventName, receive);
  };
}

function persist(role: string, sectorId: string, progress: GuideProgress) {
  const key = storageKey(role, sectorId);
  window.localStorage.setItem(key, JSON.stringify(progress));
  window.dispatchEvent(new Event(`amarango:sector-guide-change:${key}`));
}

/** Marks the guide as seen (via "Entendido" or "Omitir") for this exact version. */
export function markSectorGuideSeen(role: string, sectorId: string, guideVersion: number) {
  persist(role, sectorId, { completedVersion: guideVersion });
}

/** QA/testing utility: forces the guide to show again ("guideVersion reset works"). */
export function resetSectorGuideProgress(role: string, sectorId: string) {
  persist(role, sectorId, { completedVersion: null });
}

export function isSectorGuideSeen(role: string, sectorId: string, guideVersion: number) {
  return getGuideProgress(role, sectorId).completedVersion === guideVersion;
}
