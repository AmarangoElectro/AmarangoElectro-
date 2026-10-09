"use client";

import { useEffect } from "react";
import { installInteractionMotion } from "@/lib/ux/interaction-motion";

export function AmarangoMotion() {
  useEffect(() => installInteractionMotion(document, window), []);
  return null;
}
