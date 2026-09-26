"use client";

import type { AcquisitionSource, SourceAttribution } from "./referral-growth-contract";
import { isValidReferralCode, normalizeReferralCode } from "./referral-growth-engine";

const ATTRIBUTION_KEY = "amarango_v16_pending_attribution";
const SHARE_CODE_KEY = "amarango_v16_authorized_referral_share_code";

const validSources = new Set<AcquisitionSource>([
  "DIRECT","WHATSAPP","INSTAGRAM","FACEBOOK","META_ADS","CLIENT_REFERRAL","ADVISOR","ORGANIC","CAMPAIGN","OTHER",
]);

function safeSession() {
  try { return window.sessionStorage; } catch { return null; }
}

export function capturePendingAttributionFromLocation(locationLike: Pick<Location,"href"> = window.location) {
  const storage=safeSession();
  if (!storage) return null;
  const url=new URL(locationLike.href);
  const rawRef=url.searchParams.get("ref");
  const rawSource=(url.searchParams.get("source") ?? "").toUpperCase() as AcquisitionSource;
  const advisorId=url.searchParams.get("advisor");
  const campaignId=url.searchParams.get("campaign");
  const productId=url.searchParams.get("product");
  const referralCode=rawRef && isValidReferralCode(rawRef) ? normalizeReferralCode(rawRef) : null;
  const source=validSources.has(rawSource) ? rawSource : referralCode ? "CLIENT_REFERRAL" : null;
  if (!source && !referralCode && !advisorId && !campaignId) return getPendingAttribution();

  const next: SourceAttribution={
    source: source ?? "OTHER",
    referralCode,
    referrerCustomerId:null,
    advisorId: advisorId || null,
    campaignId: campaignId || null,
    productId: productId || null,
    categoryId:null,
    capturedAt:new Date().toISOString(),
  };
  const first=getPendingAttribution();
  const merged=first ? { ...first, productId:next.productId ?? first.productId ?? null, categoryId:next.categoryId ?? first.categoryId ?? null } : next;
  storage.setItem(ATTRIBUTION_KEY,JSON.stringify(merged));
  return merged;
}

export function getPendingAttribution(): SourceAttribution | null {
  const storage=safeSession();
  if (!storage) return null;
  try {
    const parsed=JSON.parse(storage.getItem(ATTRIBUTION_KEY) ?? "null") as SourceAttribution | null;
    return parsed && typeof parsed==="object" && typeof parsed.capturedAt==="string" ? parsed : null;
  } catch { return null; }
}

export function clearPendingAttribution() {
  safeSession()?.removeItem(ATTRIBUTION_KEY);
}

export function setAuthorizedReferralShareCode(code: string | null) {
  const storage=safeSession();
  if (!storage) return;
  if (!code || !isValidReferralCode(code)) {
    storage.removeItem(SHARE_CODE_KEY);
    return;
  }
  storage.setItem(SHARE_CODE_KEY,normalizeReferralCode(code));
}

export function getAuthorizedReferralShareCode() {
  const code=safeSession()?.getItem(SHARE_CODE_KEY) ?? "";
  return isValidReferralCode(code) ? normalizeReferralCode(code) : null;
}
