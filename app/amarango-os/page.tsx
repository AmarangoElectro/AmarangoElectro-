import { requireChatGPTUser } from "@/app/chatgpt-auth";
import type { Metadata } from "next";
import { AmarangoOsProductBridge } from "@/app/components/amarango-os-product-bridge";
import { amarangoOsLabProductBridge } from "@/lib/integration/product-bridge-lab";

export const metadata: Metadata = {
  title: "Amarango Operaciones",
  description: "Herramienta interna de operaciones y revisión de catálogo.",
};

export default async function AmarangoOsPage() {
  await requireChatGPTUser("/amarango-os");
  const products = await amarangoOsLabProductBridge.list({ role: "admin" });

  return <AmarangoOsProductBridge initialProducts={products} />;
}
