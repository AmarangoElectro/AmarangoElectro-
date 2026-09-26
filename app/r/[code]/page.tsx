import { redirect } from "next/navigation";
import { isValidReferralCode, normalizeReferralCode } from "@/lib/growth/referral-growth-engine";

export default async function ReferralEntryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) redirect("/");
  redirect(`/?ref=${encodeURIComponent(normalized)}&source=CLIENT_REFERRAL`);
}
