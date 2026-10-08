import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { CustomerReferralHub } from "@/app/components/customer-referral-hub";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  await requireChatGPTUser("/mi-cuenta");
  return <><InternalSpaceHeader eyebrow="TU CUENTA" title="Mi espacio" badge="Vista Cliente" /><CustomerReferralHub /></>;
}
