"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
}

export function InstallAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const refresh = () => setVisible(!isStandalone() && Boolean(window.__amarangoInstallPrompt));
    refresh();
    window.addEventListener("amarango:pwa-installable", refresh);
    window.addEventListener("amarango:pwa-installed", refresh);
    return () => {
      window.removeEventListener("amarango:pwa-installable", refresh);
      window.removeEventListener("amarango:pwa-installed", refresh);
    };
  }, []);

  if (!visible) return null;

  async function install() {
    const prompt = window.__amarangoInstallPrompt;
    if (!prompt) return;
    playSonicCue("tap");
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") toast.success("AmarangoElectro quedó lista para instalar");
    window.__amarangoInstallPrompt = undefined;
    setVisible(false);
  }

  return (
    <button type="button" className="install-app-button" onClick={install} aria-label="Instalar AmarangoElectro como aplicación">
      <Download size={18} strokeWidth={1.8} aria-hidden="true" />
      <span>Instalar</span>
    </button>
  );
}
