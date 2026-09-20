"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { consumeCatalogScrollRestore } from "@/lib/ux/navigation-memory";

export function RouteScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    const restoreY = pathname.startsWith("/categoria/") ? consumeCatalogScrollRestore() : null;
    const frame = window.requestAnimationFrame(() => {
      if (restoreY !== null) {
        window.scrollTo({ top: restoreY, left: 0, behavior: "auto" });
        return;
      }
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
      else window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
