"use client";

import { useEffect } from "react";
import { productViewedEvent, rememberRecentlyViewed } from "@/lib/commerce/recently-viewed-store";

export function RecentlyViewedRecorder({ productId }: { productId: string }) {
  useEffect(() => {
    let recorded = false;
    const recordVisibleView = () => {
      if (recorded || document.visibilityState !== "visible") return;
      recorded = true;
      document.dispatchEvent(new CustomEvent(productViewedEvent, { detail: { productId } }));
      rememberRecentlyViewed(productId);
    };

    recordVisibleView();
    if (!recorded) document.addEventListener("visibilitychange", recordVisibleView);
    return () => document.removeEventListener("visibilitychange", recordVisibleView);
  }, [productId]);
  return null;
}
