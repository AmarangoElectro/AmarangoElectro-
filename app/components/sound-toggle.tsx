"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { isSonicEnabled, playSonicCue, setSonicEnabled, subscribeSonicPreference } from "@/lib/ux/sonic-feedback";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const sync = () => setEnabled(isSonicEnabled());
    sync();
    return subscribeSonicPreference(sync);
  }, []);

  function toggle() {
    const next = !enabled;
    setSonicEnabled(next);
    setEnabled(next);
    if (next) playSonicCue("success");
  }

  return (
    <button
      className={`sound-toggle ${enabled ? "active" : ""}`}
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Silenciar sonidos de interfaz" : "Activar sonidos de interfaz"}
      title={enabled ? "Sonido de interfaz activado" : "Sonido de interfaz desactivado"}
      onClick={toggle}
    >
      {enabled ? <Volume2 size={19} strokeWidth={1.8} /> : <VolumeX size={19} strokeWidth={1.8} />}
    </button>
  );
}
