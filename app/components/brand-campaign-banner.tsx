import Image from "next/image";

export type BrandCampaignArtwork = {
  label: string;
  light: string;
  dark: string;
};

const artworkByBrand: Record<string, BrandCampaignArtwork> = {
  aiwa: { label: "AIWA", light: "/assets/v16-final/brands/aiwa-light.png", dark: "/assets/v16-final/brands/aiwa-dark.png" },
  lg: { label: "LG", light: "/assets/v16-final/brands/lg-light.png", dark: "/assets/v16-final/brands/lg-dark.png" },
  tcl: { label: "TCL", light: "/assets/v16-final/brands/tcl-light.jpg", dark: "/assets/v16-final/brands/tcl-dark.jpg" },
  lenovo: { label: "Lenovo", light: "/assets/v16-final/brands/lenovo-light.png", dark: "/assets/v16-final/brands/lenovo-dark.png" },
  jbl: { label: "JBL", light: "/assets/v16-final/brands/jbl-light.png", dark: "/assets/v16-final/brands/jbl-dark.png" },
  "ken brown": { label: "Ken Brown", light: "/assets/v16-final/brands/ken-brown-light.jpg", dark: "/assets/v16-final/brands/ken-brown-dark.jpg" },
  sony: { label: "Sony", light: "/assets/v16-final/brands/sony-light.png", dark: "/assets/v16-final/brands/sony-dark.png" },
  philips: { label: "Philips", light: "/assets/v16-final/brands/philips-light.png", dark: "/assets/v16-final/brands/philips-dark.png" },
  infinix: { label: "Infinix", light: "/assets/v16-final/brands/infinix-light.png", dark: "/assets/v16-final/brands/infinix-dark.png" },
  apple: { label: "iPhone", light: "/assets/v16-final/brands/apple-light.png", dark: "/assets/v16-final/brands/apple-dark.png" },
  iphone: { label: "iPhone", light: "/assets/v16-final/brands/apple-light.png", dark: "/assets/v16-final/brands/apple-dark.png" },
  samsung: { label: "Samsung", light: "/assets/v16-final/brands/samsung-light.png", dark: "/assets/v16-final/brands/samsung-dark.png" },
  xiaomi: { label: "Xiaomi", light: "/assets/v16-final/brands/xiaomi-light.png", dark: "/assets/v16-final/brands/xiaomi-dark.png" },
  redmi: { label: "Redmi", light: "/assets/v16-final/brands/redmi-light.png", dark: "/assets/v16-final/brands/redmi-dark.png" },
  motorola: { label: "Motorola", light: "/assets/v16-final/brands/motorola-light.png", dark: "/assets/v16-final/brands/motorola-dark.png" },
  poco: { label: "POCO", light: "/assets/v16-final/brands/poco-light.jpg", dark: "/assets/v16-final/brands/poco-dark.jpg" },
  playstation: { label: "PlayStation", light: "/assets/v16-final/brands/playstation-light.png", dark: "/assets/v16-final/brands/playstation-dark.png" },
  telefunken: { label: "Telefunken", light: "/assets/v16-final/brands/telefunken-light.jpg", dark: "/assets/v16-final/brands/telefunken-dark.jpg" },
  kanji: { label: "Kanji", light: "/assets/v16-final/brands/kanji-light.jpg", dark: "/assets/v16-final/brands/kanji-dark.jpg" },
  kanjihome: { label: "Kanjihome", light: "/assets/v16-final/brands/kanjihome-light.jpg", dark: "/assets/v16-final/brands/kanjihome-dark.jpg" },
  "kanji home": { label: "Kanjihome", light: "/assets/v16-final/brands/kanjihome-light.jpg", dark: "/assets/v16-final/brands/kanjihome-dark.jpg" },
  philco: { label: "Philco", light: "/assets/v16-final/brands/philco-light.jpg", dark: "/assets/v16-final/brands/philco-dark.jpg" },
  bgh: { label: "BGH", light: "/assets/v16-final/brands/bgh-light.jpg", dark: "/assets/v16-final/brands/bgh-dark.jpg" },
  rca: { label: "RCA", light: "/assets/v16-final/brands/rca-light.jpg", dark: "/assets/v16-final/brands/rca-dark.jpg" },
  jvc: { label: "JVC", light: "/assets/v16-final/brands/jvc-light.jpg", dark: "/assets/v16-final/brands/jvc-dark.jpg" },
  noblex: { label: "Noblex", light: "/assets/v16-final/brands/noblex-light.jpg", dark: "/assets/v16-final/brands/noblex-dark.jpg" },
  hp: { label: "HP", light: "/assets/v16-final/brands/hp-light.jpg", dark: "/assets/v16-final/brands/hp-dark.jpg" },
  epson: { label: "Epson", light: "/assets/v16-final/brands/epson-light.jpg", dark: "/assets/v16-final/brands/epson-dark.jpg" },
  delhi: { label: "Delhi", light: "/assets/v16-final/brands/delhi-light.jpg", dark: "/assets/v16-final/brands/delhi-dark.jpg" },
  oster: { label: "Oster", light: "/assets/v16-final/brands/oster-light.jpg", dark: "/assets/v16-final/brands/oster-dark.jpg" },
  ultracomb: { label: "Ultracomb", light: "/assets/v16-final/brands/ultracomb-light.jpg", dark: "/assets/v16-final/brands/ultracomb-dark.jpg" },
};

function brandKey(brand: string) {
  return brand.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR");
}

export function getBrandCampaignArtwork(brand: string) {
  return artworkByBrand[brandKey(brand)] ?? null;
}

export function hasCompleteBrandCampaign(brand: string) {
  return Boolean(getBrandCampaignArtwork(brand));
}

export function BrandCampaignBanner({ brand }: { brand: string }) {
  const artwork = getBrandCampaignArtwork(brand);
  if (!artwork) return null;

  return (
    <section className="brand-campaign-banner" aria-label={`Universo ${artwork.label} en AmarangoElectro`}>
      <Image className="brand-campaign-art brand-campaign-art-light" src={artwork.light} alt={`Banner ${artwork.label}`} fill sizes="(max-width: 760px) 100vw, 1400px" unoptimized />
      <Image className="brand-campaign-art brand-campaign-art-dark" src={artwork.dark} alt={`Banner ${artwork.label} en modo oscuro`} fill sizes="(max-width: 760px) 100vw, 1400px" unoptimized />
    </section>
  );
}
