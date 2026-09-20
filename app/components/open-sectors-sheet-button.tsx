"use client";

import type { ReactNode } from "react";
import { openSectorsSheet } from "@/lib/ux/sectors-sheet";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

export function OpenSectorsSheetButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => { playSonicCue("tap"); openSectorsSheet(); }}>
      {children}
    </button>
  );
}
