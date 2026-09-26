"use client";

import { useEffect } from "react";
import { capturePendingAttributionFromLocation } from "@/lib/growth/referral-attribution-client";

export function GrowthAttributionCapture() {
  useEffect(() => {
    capturePendingAttributionFromLocation();
  }, []);
  return null;
}
