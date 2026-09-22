import { HeroSlider } from "./components/hero-slider";
import { MiBalanceReferralWelcome } from "./components/mi-balance-referral-welcome";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { RecentlyViewedRail } from "./components/recently-viewed-rail";
import { BrandLogoRail } from "./components/brand-logo-rail";
import { FeaturedSectorsGrid } from "./components/featured-sectors-grid";
import { HomeProductsPreview } from "./components/home-products-preview";
import { AllSectorsSheet } from "./components/all-sectors-sheet";
import { OffersShowcase } from "./components/offers-showcase";
import { catalog } from "@/lib/catalog";

export default async function Home() {
  const recentCandidates = await catalog.listProducts({ visibleOnly: true });
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSlider />
        <MiBalanceReferralWelcome />

        <section id="experiencia" className="home-quick-trust" aria-label="Beneficios AmarangoElectro">
          <article><span aria-hidden="true">🚚</span><div><strong>Envíos coordinados</strong><small>Consultá disponibilidad y zona</small></div></article>
          <article><span aria-hidden="true">🛡️</span><div><strong>Compra acompañada</strong><small>Atención durante el proceso</small></div></article>
          <article id="financiacion"><span aria-hidden="true">💳</span><div><strong>Financiación clara</strong><small>Opciones según cada producto</small></div></article>
          <article><span aria-hidden="true">✓</span><div><strong>Información clara</strong><small>Precio y disponibilidad al consultar</small></div></article>
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
