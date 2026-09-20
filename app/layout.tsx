import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RouteScrollReset } from "./components/route-scroll-reset";
import { PerformanceBudget } from "./components/performance-budget";
import { PwaManager } from "./components/pwa-manager";
import { ScrollQualityManager } from "./components/scroll-quality-manager";
import { themeInitScript } from "@/lib/ux/theme-preference";

export const metadata: Metadata = {
  title: "AmarangoElectro V16 · Amarango OS V3 Product Bridge",
  description: "Tecnología para tu vida. Personas para acompañarte.",
  manifest: "/manifest.webmanifest",
  themeColor: "#071426",
  appleWebApp: { capable: true, title: "AmarangoElectro", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/app-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <PerformanceBudget />
        <ScrollQualityManager />
        <PwaManager />
        <RouteScrollReset />
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
