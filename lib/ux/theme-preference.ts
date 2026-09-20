export type ThemeMode = "light" | "dark" | "auto";
export type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "amarango:v16:theme";
const PREFERENCE_EVENT = "amarango:v16:theme-preference";

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "auto";
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isThemeMode(stored) ? stored : "auto";
}

export function resolveEffectiveTheme(mode: ThemeMode): EffectiveTheme {
  if (mode === "auto") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolveEffectiveTheme(mode));
  document.documentElement.setAttribute("data-theme-mode", mode);
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
  applyThemeToDocument(mode);
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT, { detail: { mode } }));
}

export function subscribeThemePreference(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (getThemeMode() === "auto") applyThemeToDocument("auto");
    listener();
  };
  window.addEventListener(PREFERENCE_EVENT, listener);
  window.addEventListener("storage", listener);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(PREFERENCE_EVENT, listener);
    window.removeEventListener("storage", listener);
    media.removeEventListener("change", onSystemChange);
  };
}

export const themeInitScript = `(function(){try{var m=localStorage.getItem("${STORAGE_KEY}");if(m!=="light"&&m!=="dark"&&m!=="auto")m="auto";var e=m==="auto"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;document.documentElement.setAttribute("data-theme",e);document.documentElement.setAttribute("data-theme-mode",m);}catch(err){}})();`;
