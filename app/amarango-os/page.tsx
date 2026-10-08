import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { requireSpaceAccess } from "@/lib/internal/auth/server-access";
import type { Metadata } from "next";
import { AmarangoOsProductBridge } from "@/app/components/amarango-os-product-bridge";
import { amarangoOsLabProductBridge } from "@/lib/integration/product-bridge-lab";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Amarango Operaciones",
  description: "Herramienta interna de operaciones y revisión de catálogo.",
};

export default async function AmarangoOsPage() {
  await requireChatGPTUser("/amarango-os");
  await requireSpaceAccess("admin");
  const products = await amarangoOsLabProductBridge.list({ role: "admin" });

  return <AmarangoOsProductBridge initialProducts={products} />;
}
