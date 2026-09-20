const EVENT = "amarango:v16:sectors-sheet";

let open = false;

export function isSectorsSheetOpen() {
  return open;
}

export function openSectorsSheet() {
  open = true;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT));
}

export function closeSectorsSheet() {
  open = false;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeSectorsSheet(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
