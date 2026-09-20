"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
import { useEffect, useState } from "react";
import { getThemeMode, setThemeMode, subscribeThemePreference, type ThemeMode } from "@/lib/ux/theme-preference";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "auto", label: "Auto", icon: SunMoon },
  { mode: "dark", label: "Oscuro", icon: Moon },
];

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const sync = () => setMode(getThemeMode());
    sync();
    return subscribeThemePreference(sync);
  }, []);

  function choose(next: ThemeMode) {
    setThemeMode(next);
    setMode(next);
    playSonicCue("tap");
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Modo de color">
      {options.map(({ mode: optionMode, label, icon: Icon }) => (
        <button
          key={optionMode}
          type="button"
          className={mode === optionMode ? "active" : ""}
          aria-pressed={mode === optionMode}
          title={label}
          onClick={() => choose(optionMode)}
        >
          <Icon size={15} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
