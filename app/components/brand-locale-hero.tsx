import type { CSSProperties } from "react";
import Link from "./store-link";
import { getBrandLocalesForSector, type BrandLocaleDefinition } from "@/lib/theme/brand-locale";

interface Props {
  locale: BrandLocaleDefinition;
  sectorSlug: string;
  sectorTitle: string;
  availableBrands: ReadonlySet<string>;
}

type BrandLocaleStyle = CSSProperties & {
  "--brand-locale-accent": string;
  "--brand-locale-accent-2": string;
  "--brand-locale-bg": string;
  "--brand-locale-dark": string;
  "--brand-locale-font": string;
  "--brand-locale-orb": string;
};

export function BrandLocaleHero({ locale, sectorSlug, sectorTitle, availableBrands }: Props) {
  const sectorLocales = getBrandLocalesForSector(sectorSlug, availableBrands);
  const style: BrandLocaleStyle = {
    "--brand-locale-accent": locale.accent,
    "--brand-locale-accent-2": locale.accent2,
    "--brand-locale-bg": locale.background,
    "--brand-locale-dark": locale.darkBackground,
    "--brand-locale-font": locale.fontFamily,
    "--brand-locale-orb": locale.orb,
  };

  return (
    <section className={`brand-locale-shell brand-locale-${locale.key}`} style={style} data-brand-locale={locale.key} aria-labelledby="brand-locale-title">
      <nav className="brand-locale-breadcrumb" aria-label="Ruta de marca">
        <Link href="/">AmarangoElectro</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/categoria/${sectorSlug}`}>{sectorTitle}</Link>
        <span aria-hidden="true">/</span>
        <strong>{locale.tabLabel}</strong>
      </nav>

      <nav className="brand-locale-tabs" aria-label={`Locales de ${sectorTitle}`}>
        <Link href={`/categoria/${sectorSlug}#catalogo`}>Ver todo</Link>
        {sectorLocales.map((brandLocale) => (
          <Link
            key={brandLocale.key}
            className={brandLocale.key === locale.key ? "is-active" : undefined}
            aria-current={brandLocale.key === locale.key ? "page" : undefined}
            href={`/categoria/${sectorSlug}?marca=${encodeURIComponent(brandLocale.brand)}#catalogo`}
          >
            {brandLocale.tabLabel}
          </Link>
        ))}
      </nav>

      <div className="brand-locale-hero">
        <div className="brand-locale-copy">
          <span className="brand-locale-badge">{locale.badge}</span>
          <p className="brand-locale-kicker">{locale.kicker}</p>
          <h1 id="brand-locale-title">{locale.title}</h1>
          <p className="brand-locale-description">{locale.description}</p>
          <p className="brand-locale-mood">{locale.mood}</p>
        </div>

        <div className="brand-locale-stage" aria-hidden="true">
          <span className="brand-locale-orb" />
          <span className="brand-locale-wordmark">{locale.wordmark}</span>
          <span className="brand-locale-device brand-locale-device-back" />
          <span className="brand-locale-device brand-locale-device-front" />
        </div>
      </div>

      <div className="brand-locale-catalog-intro">
        <div>
          <small>LOCAL DE MARCA · AMARANGOELECTRO</small>
          <strong>Productos de {locale.brand}</strong>
        </div>
        <p>La marca ambienta la experiencia. El catálogo, las condiciones comerciales y las acciones siguen siendo las de AmarangoElectro.</p>
      </div>
    </section>
  );
}
