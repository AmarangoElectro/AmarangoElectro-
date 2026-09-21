import Image from "next/image";
import { ArrowLeft, Home, LayoutGrid, MessageCircle, Search, UserRound } from "lucide-react";
import type { CSSProperties } from "react";
import Link from "./store-link";
import { ThemeToggle } from "./theme-toggle";
import { OpenSectorsSheetButton } from "./open-sectors-sheet-button";
import type { CategoryDefinition, SubcategoryDefinition } from "@/lib/catalog/categories";

const sectorTabs = [
  { slug: "celulares", label: "Celulares", icon: "📱" },
  { slug: "smart-tv", label: "Smart TV", icon: "📺" },
  { slug: "audio", label: "Audio", icon: "🎧" },
  { slug: "gaming", label: "Gaming", icon: "🎮" },
] as const;

type Editorial = {
  eyebrow: string;
  title: string;
  copy: string;
  image: string | null;
  imagePosition?: string;
};

const editorial: Record<string, Editorial> = {
  celulares: {
    eyebrow: "SHOWROOM MULTIMARCA",
    title: "Tecnología para acompañar tu día.",
    copy: "Compará marcas y modelos en un espacio claro, moderno y directo al catálogo.",
    image: "/assets/v16-final/main/celulares-multimarca.jpg",
    imagePosition: "center 36%",
  },
  "smart-tv": {
    eyebrow: "IMAGEN & ENTRETENIMIENTO",
    title: "Cine en casa, sin vueltas.",
    copy: "Pantallas y conectividad para transformar cada momento.",
    image: "/assets/v16-final/main/smart-tv.png",
    imagePosition: "center",
  },
  audio: {
    eyebrow: "AUDIO",
    title: "Sentí cada momento.",
    copy: "Sonido, energía y entretenimiento en una atmósfera propia.",
    image: "/assets/v16-final/main/audio.png",
    imagePosition: "center 32%",
  },
  hogar: {
    eyebrow: "HOGAR & ESTILO",
    title: "Tu espacio. Tu estilo.",
    copy: "Muebles, deco y detalles para sentirte en casa.",
    image: "/assets/v16-final/main/hogar.png",
    imagePosition: "center 34%",
  },
  gaming: {
    eyebrow: "GAMING",
    title: "Subí de nivel.",
    copy: "Consolas, juegos y accesorios para entrar directo a la experiencia.",
    image: "/assets/v16-generated/gaming-sector-brandless-v1.webp",
    imagePosition: "center",
  },
  electrodomesticos: {
    eyebrow: "VIDA DIARIA PREMIUM",
    title: "Tu casa funciona mejor.",
    copy: "Frío, lavado, cocción y confort organizados para elegir rápido.",
    image: "/assets/v16-final/main/electrodomesticos.png",
    imagePosition: "center",
  },
  descanso: {
    eyebrow: "DESCANSO & CONFORT",
    title: "Descansá mejor. Viví mejor.",
    copy: "Colchones, sommiers y confort para renovar tu descanso.",
    image: "/assets/v16-final/main/descanso.png",
    imagePosition: "center",
  },
} as const;

const subcategoryEditorial: Record<string, Pick<Editorial, "title" | "image" | "imagePosition">> = {
  climatizacion: { title: "Confort en cada estación.", image: "/assets/v16-final/main/climatizacion.png", imagePosition: "center" },
  refrigeracion: { title: "Frescura para tu día.", image: "/assets/v16-final/main/electrodomesticos.png", imagePosition: "center" },
};

const sectorVisuals: Record<string, { accent: string; secondary: string; deep: string; soft: string; mark: string }> = {
  celulares: { accent: "#1677ff", secondary: "#ff7a1a", deep: "#071a36", soft: "#dceaff", mark: "MOBILE" },
  electrodomesticos: { accent: "#ef6c22", secondary: "#0f5ec7", deep: "#301407", soft: "#ffeadc", mark: "HOME" },
  "smart-tv": { accent: "#6474ff", secondary: "#ff7a1a", deep: "#101838", soft: "#e2e5ff", mark: "VISION" },
  audio: { accent: "#ff6a24", secondary: "#14b8a6", deep: "#24100a", soft: "#ffe2d4", mark: "SOUND" },
  herramientas: { accent: "#d89011", secondary: "#263b55", deep: "#211707", soft: "#fff0c7", mark: "PRO" },
  gaming: { accent: "#176cf0", secondary: "#ff6a1a", deep: "#041733", soft: "#dceaff", mark: "PLAY" },
  hogar: { accent: "#bb6741", secondary: "#d5a34c", deep: "#2b1912", soft: "#f3e1d6", mark: "DECO" },
  "tecnologia-accesorios": { accent: "#155e75", secondary: "#ff7a00", deep: "#082f49", soft: "#d9f0f4", mark: "TECH" },
  descanso: { accent: "#7c3f2c", secondary: "#d97706", deep: "#3f231a", soft: "#f4e4dc", mark: "REST" },
  "cuidado-personal-salud": { accent: "#2563eb", secondary: "#14b8a6", deep: "#0f2942", soft: "#deebff", mark: "CARE" },
  "bebes-juguetes": { accent: "#7c3aed", secondary: "#f59e0b", deep: "#2e1065", soft: "#eee5ff", mark: "PLAY" },
  "auto-motos-energia": { accent: "#d94832", secondary: "#f2a51a", deep: "#32100b", soft: "#ffe3dc", mark: "DRIVE" },
  "camping-aire-libre-mascotas": { accent: "#2f7b55", secondary: "#d58a28", deep: "#102a20", soft: "#dff1e8", mark: "OUT" },
  otros: { accent: "#315f9e", secondary: "#ef6c22", deep: "#0c2445", soft: "#e0eaf6", mark: "MORE" },
};

interface SectorShowroomProps {
  category: CategoryDefinition;
  activeSector?: SubcategoryDefinition;
  activeBrand?: string;
  availableBrands: string[];
  compactBrandView?: boolean;
}

export function SectorShowroom({ category, activeSector, activeBrand, availableBrands, compactBrandView = false }: SectorShowroomProps) {
  const categoryEditorial = editorial[category.slug];
  const sectorEditorial = activeSector ? subcategoryEditorial[activeSector.slug] : undefined;
  const hero: Editorial = sectorEditorial
    ? {
        eyebrow: activeSector?.title.toUpperCase() ?? category.eyebrow,
        title: sectorEditorial.title,
        copy: activeSector?.description ?? category.description,
        image: sectorEditorial.image,
        imagePosition: sectorEditorial.imagePosition,
      }
    : activeSector
      ? {
          eyebrow: activeSector.title.toUpperCase(),
          title: activeSector.title,
          copy: activeSector.description,
          image: null,
        }
      : categoryEditorial ?? {
          eyebrow: category.eyebrow,
          title: category.title,
          copy: category.heroTagline ?? category.description,
          image: null,
        };
  const visual = sectorVisuals[category.slug] ?? sectorVisuals.otros;
  const knownCategoryBrands = category.subcategories.flatMap((item) => item.brand ? [item.brand] : []);
  const brandFilters = category.slug === "celulares" || compactBrandView
    ? [
        { value: "", label: "Ver todo" },
        ...[...new Set([...availableBrands, ...knownCategoryBrands])].map((brand) => ({ value: brand, label: brand === "Apple" ? "iPhone" : brand })),
      ]
    : [];

  return (
    <section
      className={`sector-showroom${compactBrandView ? " is-brand-view" : ""}`}
      aria-labelledby="sector-showroom-title"
      data-sector={category.slug}
      style={{
        "--sector-accent": visual.accent,
        "--sector-secondary": visual.secondary,
        "--sector-deep": visual.deep,
        "--sector-soft": visual.soft,
      } as CSSProperties}
    >
      <div className="sector-showroom-topline">
        <Link href={compactBrandView ? `/categoria/${category.slug}` : "/"} className="sector-showroom-back" aria-label={compactBrandView ? `Volver a ${category.title}` : "Volver a la tienda"}><ArrowLeft size={18} /></Link>
        <h1 id="sector-showroom-title">{activeBrand ?? activeSector?.title ?? category.title}</h1>
        <ThemeToggle />
      </div>

      {compactBrandView ? (
        <div className="sector-showroom-brand-tools">
          <OpenSectorsSheetButton className="sector-switcher-button"><LayoutGrid size={17} /><span>Todos los sectores</span></OpenSectorsSheetButton>
          <Link className="sector-brand-exit" href={`/categoria/${category.slug}`}><span>Ver todo {category.title}</span><span aria-hidden="true">→</span></Link>
        </div>
      ) : <form className="sector-showroom-search" action={`/categoria/${category.slug}`} role="search">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="sector-search">Buscar en este sector</label>
        <input id="sector-search" type="search" name="q" placeholder="Buscar en este sector" autoComplete="off" />
        {activeBrand ? <input type="hidden" name="marca" value={activeBrand} /> : null}
        {activeSector && !activeSector.brand ? <input type="hidden" name="sector" value={activeSector.slug} /> : null}
      </form>}

      {!compactBrandView ? <nav className="sector-showroom-tabs" aria-label="Cambiar de sector">
        {sectorTabs.map((item) => (
          <Link key={item.slug} href={`/categoria/${item.slug}`} className={category.slug === item.slug ? "active" : ""} aria-current={category.slug === item.slug ? "page" : undefined}>
            <span aria-hidden="true">{item.icon}</span><strong>{item.label}</strong>
          </Link>
        ))}
      </nav> : null}

      {brandFilters.length > 0 ? (
        <nav className="sector-showroom-brands" aria-label={`Explorar marcas de ${category.title}`}>
          {brandFilters.map((item) => (
            <Link
              key={item.label}
              href={item.value ? `/categoria/${category.slug}?marca=${encodeURIComponent(item.value)}#catalogo` : `/categoria/${category.slug}#catalogo`}
              className={(activeBrand ?? "") === item.value ? "active" : ""}
              aria-current={(activeBrand ?? "") === item.value ? "page" : undefined}
            >{item.label}</Link>
          ))}
        </nav>
      ) : null}

      {!compactBrandView ? <div
        className={`sector-editorial sector-editorial-${category.slug}${hero.image ? " has-image" : ""}`}
        style={hero.image ? { "--sector-editorial-image": `url(${hero.image})` } as CSSProperties : undefined}
      >
        {hero.image ? <Image src={hero.image} alt="" fill priority sizes="(max-width: 760px) 100vw, 1200px" unoptimized style={hero.imagePosition ? { objectPosition: hero.imagePosition } : undefined} /> : <span className="sector-editorial-mark" aria-hidden="true">{visual.mark}</span>}
        <span className="sector-editorial-shade" aria-hidden="true" />
        <div className="sector-editorial-copy">
          <small>{hero.eyebrow}</small>
          <h2>{hero.title}</h2>
          <p>{hero.copy}</p>
          {category.slug === "audio" && !activeSector ? <span className="sector-equalizer" aria-hidden="true"><i /><i /><i /><i /><i /></span> : null}
        </div>
        <Link href="#catalogo" className="sector-editorial-cta">Ver productos <span aria-hidden="true">→</span></Link>
      </div> : null}
    </section>
  );
}

export function SectorBottomNavigation() {
  return (
    <nav className="sector-bottom-navigation" aria-label="Navegación principal móvil">
      <Link href="/"><Home size={20} /><span>Inicio</span></Link>
      <OpenSectorsSheetButton className="active"><LayoutGrid size={20} /><span>Sectores</span></OpenSectorsSheetButton>
      <Link href="/mi-amarango"><UserRound size={20} /><span>Mi Amarango</span></Link>
      <span aria-disabled="true" title="El canal de WhatsApp se habilitará cuando exista un destino validado"><MessageCircle size={20} /><span>WhatsApp</span></span>
    </nav>
  );
}
