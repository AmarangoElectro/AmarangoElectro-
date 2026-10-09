import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./growth.css";
import "./professional-app-ux.css";
import "./smart-navigation.css";
import "./internal-compact.css";
import "./subscriptions.css";
import "./sector-banners.css";
import "./brand-drawers.css";
import "./app-dialogs.css";
import "./interaction-motion.css";
import "./storefront-quotes.css";
import "./dark-surfaces.css";
import "./catalog-simplification.css";
import { AmarangoMotion } from "./components/amarango-motion";
import { Toaster } from "@/components/ui/sonner";
import { RouteScrollReset } from "./components/route-scroll-reset";
import { FloatingScrollTop } from "./components/floating-scroll-top";
import { PerformanceBudget } from "./components/performance-budget";
import { PwaManager } from "./components/pwa-manager";
import { ScrollQualityManager } from "./components/scroll-quality-manager";
import { GrowthAttributionCapture } from "./components/growth-attribution-capture";
import { themeInitScript } from "@/lib/ux/theme-preference";

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#09090a",
};

export const metadata: Metadata = {
  title: "AmarangoElectro",
  description: "Tecnología para tu vida. Personas para acompañarte.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AmarangoElectro", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/app-192.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className="antialiased">
        <PerformanceBudget />
        <ScrollQualityManager />
        <AmarangoMotion />
        <PwaManager />
        <RouteScrollReset />
        <FloatingScrollTop />
        <GrowthAttributionCapture />
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
