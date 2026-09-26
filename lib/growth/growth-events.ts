"use client";

import type { GrowthDomainEvent } from "./referral-growth-contract";

export const GROWTH_DOMAIN_EVENT = "amarango:growth-domain-event";

export function emitGrowthDomainEvent(event: GrowthDomainEvent) {
  window.dispatchEvent(new CustomEvent<GrowthDomainEvent>(GROWTH_DOMAIN_EVENT,{detail:event}));
}

export function subscribeGrowthDomainEvents(listener:(event:GrowthDomainEvent)=>void) {
  const handler=(event:Event)=>listener((event as CustomEvent<GrowthDomainEvent>).detail);
  window.addEventListener(GROWTH_DOMAIN_EVENT,handler);
  return()=>window.removeEventListener(GROWTH_DOMAIN_EVENT,handler);
}
