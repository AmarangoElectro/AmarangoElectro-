import { requireChatGPTUser } from "@/app/chatgpt-auth";
import type { Metadata } from "next";
import { AmarangoOsProductBridge } from "@/app/components/amarango-os-product-bridge";
import { amarangoOsLabProductBridge } from "@/lib/integration/product-bridge-lab";

export const metadata: Metadata = {
  title: "Amarango OS · Integración de catálogo",
  description: "Herramienta interna de integración de catálogo en modo de solo lectura.",
};

export default async function AmarangoOsPage() {
  await requireChatGPTUser("/amarango-os");
  const products = await amarangoOsLabProductBridge.list({ role: "admin" });

  return <AmarangoOsProductBridge initialProducts={products} />;
}
