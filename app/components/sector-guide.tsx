"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isSectorGuideSeen, markSectorGuideSeen } from "@/lib/onboarding/guide-progress-store";
import type { SectorGuideDefinition } from "@/lib/onboarding/sector-guide-types";

/**
 * V16 FIRST-TIME SECTOR GUIDES — single reusable onboarding engine.
 *
 * Additive UX layer only: reads/writes nothing but its own localStorage
 * completion key (see `lib/onboarding/guide-progress-store.ts`), never an
 * authorization signal. Highlights the real control it explains via
 * `[data-guide-target="<step.target>"]` already present in the host
 * section — it never invents a UI element that doesn't exist.
 *
 * Built entirely on the app's existing, already-themed Dialog primitive
 * (Radix under the hood): native focus trap, Escape-to-close, no
 * browser-native gray popup, respects dark/light via the same CSS tokens
 * as the rest of V16.
 */
export function SectorGuide({ guide }: { guide: SectorGuideDefinition }) {
  // Starts closed (matches SSR, no hydration flash); the localStorage check
  // only exists client-side, so it's deferred to a macrotask — setTimeout,
  // not requestAnimationFrame: rAF can be paused indefinitely for a
  // background/inactive tab, which would silently prevent the guide from
  // ever showing on a real first visit opened in a background tab.
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isSectorGuideSeen(guide.role, guide.sectorId, guide.guideVersion)) setOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [guide.role, guide.sectorId, guide.guideVersion]);

  useEffect(() => {
    if (!open) return;
    const step = guide.steps[stepIndex];
    const el = step?.target ? document.querySelector<HTMLElement>(`[data-guide-target="${step.target}"]`) : null;
    el?.classList.add("sector-guide-highlight");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => {
      el?.classList.remove("sector-guide-highlight");
    };
  }, [open, stepIndex, guide.steps]);

  function finish(reason: "completed" | "skipped") {
    markSectorGuideSeen(guide.role, guide.sectorId, guide.guideVersion);
    setOpen(false);
    if (reason === "skipped") { /* same completion key: never auto-shown again for this guideVersion */ }
  }

  function reopen() {
    setStepIndex(0);
    setOpen(true);
  }

  const step = guide.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === guide.steps.length - 1;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="sector-guide-help-trigger"
        onClick={reopen}
        aria-label={`Ayuda de este sector: ${guide.title}`}
      >
        <HelpCircle size={16} aria-hidden="true" /> Ayuda de este sector
      </Button>

      <Dialog open={open} onOpenChange={(next) => { if (!next) finish("skipped"); }}>
        <DialogContent className="sector-guide-dialog" onKeyDown={(event) => {
          if (event.key === "ArrowRight" && !isLast) setStepIndex((index) => index + 1);
          if (event.key === "ArrowLeft" && !isFirst) setStepIndex((index) => index - 1);
        }}>
          <DialogHeader>
            {isFirst && <p className="sector-guide-intro">{guide.intro}</p>}
            <DialogTitle>{step.title}</DialogTitle>
            <DialogDescription>{step.description}</DialogDescription>
          </DialogHeader>
          <p className="sector-guide-step-count" aria-live="polite">Paso {stepIndex + 1} de {guide.steps.length}</p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => finish("skipped")}>Omitir</Button>
            <div className="sector-guide-nav">
              {!isFirst && <Button type="button" variant="outline" onClick={() => setStepIndex((index) => index - 1)}>Atrás</Button>}
              {isLast
                ? <Button type="button" onClick={() => finish("completed")}>Entendido</Button>
                : <Button type="button" onClick={() => setStepIndex((index) => index + 1)}>Siguiente</Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
