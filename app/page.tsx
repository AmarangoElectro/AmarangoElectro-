import { HeroSlider } from "./components/hero-slider";
import { MiBalanceReferralWelcome } from "./components/mi-balance-referral-welcome";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { FeaturedSectorsGrid } from "./components/featured-sectors-grid";
import { AllSectorsSheet } from "./components/all-sectors-sheet";

export default function Home() {
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
      </main>
      <SiteFooter />
      <AllSectorsSheet />
    </>
  );
}
