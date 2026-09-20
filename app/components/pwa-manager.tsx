"use client";

import { useEffect } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __amarangoInstallPrompt?: InstallPromptEvent;
  }
}

export function PwaManager() {
  useEffect(() => {
    const secureRuntime = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if ("serviceWorker" in navigator && secureRuntime) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    const installable = (event: Event) => {
      event.preventDefault();
      window.__amarangoInstallPrompt = event as InstallPromptEvent;
      window.dispatchEvent(new Event("amarango:pwa-installable"));
    };
    const installed = () => {
      window.__amarangoInstallPrompt = undefined;
      window.dispatchEvent(new Event("amarango:pwa-installed"));
    };
    window.addEventListener("beforeinstallprompt", installable);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", installable);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  return null;
}
