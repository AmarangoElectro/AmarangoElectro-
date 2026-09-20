"use client";

import type { AnchorHTMLAttributes } from "react";
import { captureCatalogReturnContext } from "@/lib/ux/navigation-memory";

type StoreLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

const prefetchedDocuments = new Set<string>();

function shouldPrefetch(href: string) {
  if (typeof window === "undefined" || !href.startsWith("/")) return false;
  if (document.documentElement.dataset.performanceProfile === "lean") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return false;
  return href.startsWith("/producto/") || href.startsWith("/categoria/");
}

function prefetchDocument(href: string) {
  if (!shouldPrefetch(href)) return;
  if (prefetchedDocuments.has(href)) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = href;
  link.dataset.amarangoPrefetch = href;
  document.head.appendChild(link);
  prefetchedDocuments.add(href);
}

/**
 * Storefront navigation deliberately stays as normal document navigation so
 * local QA remains independent from Vinext's RSC cache hash. Step 7H adds
 * intent-based prefetching and remembers catalog context without changing
 * URL semantics or introducing a router dependency.
 */
export default function StoreLink({ href, onClick, onPointerEnter, onFocus, ...props }: StoreLinkProps) {
  return (
    <a href={href}
      {...props}
      onPointerEnter={(event) => {
        prefetchDocument(href);
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        prefetchDocument(href);
        onFocus?.(event);
      }}
      onClick={(event) => {
        if (href.startsWith("/producto/")) captureCatalogReturnContext();
        onClick?.(event);
      }}
    />
  );
}
