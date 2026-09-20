"use client";

import { useEffect } from "react";

const SCROLL_SETTLE_MS = 150;

/**
 * Keeps touch scrolling on the browser compositor path as much as possible.
 * No custom scroll physics, wheel interception or preventDefault: the browser
 * owns the gesture. We only expose a short-lived CSS state so expensive visual
 * polish can step aside while the page is actually moving.
 */
export function ScrollQualityManager() {
  useEffect(() => {
    const root = document.documentElement;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let active = false;

    const finish = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = undefined;
      if (!active) return;
      active = false;
      delete root.dataset.scrollActivity;
    };

    const markActive = () => {
      if (!active) {
        active = true;
        root.dataset.scrollActivity = "active";
      }

      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(finish, SCROLL_SETTLE_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") finish();
    };

    window.addEventListener("scroll", markActive, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("scroll", markActive);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      finish();
    };
  }, []);

  return null;
}
