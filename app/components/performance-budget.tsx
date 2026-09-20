"use client";

import { useEffect } from "react";

type NetworkInformationLike = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithPerformanceSignals = Navigator & {
  connection?: NetworkInformationLike;
  cpuPerformance?: number;
};

function shouldUseLeanProfile(connection: NetworkInformationLike | undefined, cpuTier: number | undefined) {
  const networkConstrained = Boolean(connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g");
  const cpuConstrained = typeof cpuTier === "number" && cpuTier > 0 && cpuTier <= 2;
  return networkConstrained || cpuConstrained;
}

/**
 * Tiny client-side performance budget. It does not collect or transmit data.
 * It only lets CSS reduce nonessential polish when the browser reports Data
 * Saver, a very slow connection, or (progressively in Chrome 152+) a low CPU
 * performance tier.
 */
export function PerformanceBudget() {
  useEffect(() => {
    const runtime = navigator as NavigatorWithPerformanceSignals;
    const connection = runtime.connection;
    const root = document.documentElement;

    function applyProfile() {
      root.dataset.performanceProfile = shouldUseLeanProfile(connection, runtime.cpuPerformance) ? "lean" : "full";
    }

    applyProfile();
    connection?.addEventListener?.("change", applyProfile);
    return () => connection?.removeEventListener?.("change", applyProfile);
  }, []);

  return null;
}
