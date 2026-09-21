import { HeroSlider } from "./components/hero-slider";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { RecentlyViewedRail } from "./components/recently-viewed-rail";
import { BrandLogoRail } from "./components/brand-logo-rail";
import { FeaturedSectorsGrid } from "./components/featured-sectors-grid";
import { HomeProductsPreview } from "./components/home-products-preview";
import { AllSectorsSheet } from "./components/all-sectors-sheet";
import { OffersShowcase } from "./components/offers-showcase";
import { catalog } from "@/lib/catalog";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export default async function Home() {
  const [recentCandidates, internalUser] = await Promise.all([
    catalog.listProducts({ visibleOnly: true }),
    getChatGPTUser(),
  ]);
  const internalUserName = internalUser?.fullName?.split(/\s+/)[0] ?? internalUser?.email.split("@")[0] ?? null;
  return (
    <>
      <SiteHeader internalUserName={internalUserName} />
      <main>
        <HeroSlider />

        <section className="home-quick-trust" aria-label="Beneficios AmarangoElectro">
          <article><span aria-hidden="true">🚚</span><div><strong>Envíos coordinados</strong><small>Consultá disponibilidad y zona</small></div></article>
          <article><span aria-hidden="true">🛡️</span><div><strong>Compra acompañada</strong><small>Atención durante el proceso</small></div></article>
          <article><span aria-hidden="true">💳</span><div><strong>Financiación clara</strong><small>Cuotas solo con datos validados</small></div></article>
          <article><span aria-hidden="true">✓</span><div><strong>Información honesta</strong><small>Sin inventar stock ni precios</small></div></article>
        </section>

        <FeaturedSectorsGrid />
        <HomeProductsPreview products={recentCandidates} />
        <BrandLogoRail />
        <OffersShowcase />
        <RecentlyViewedRail products={recentCandidates} />
      </main>
      <SiteFooter />
      <AllSectorsSheet />
    </>
  );
}
