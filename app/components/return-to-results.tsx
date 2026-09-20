"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { readCatalogReturnContext, requestCatalogScrollRestore, type CatalogReturnContext } from "@/lib/ux/navigation-memory";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

export function ReturnToResults({ fallbackHref }: { fallbackHref: string }) {
  const [context, setContext] = useState<CatalogReturnContext | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setContext(readCatalogReturnContext()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function goBack() {
    playSonicCue("navigate");
    if (context) {
      requestCatalogScrollRestore(context);
      window.location.assign(context.url);
      return;
    }
    window.location.assign(fallbackHref);
  }

  return (
    <button type="button" className="return-to-results" onClick={goBack}>
      <ArrowLeft size={15} aria-hidden="true" />
      {context ? "Volver a tus resultados" : "Volver al catálogo"}
    </button>
  );
}
