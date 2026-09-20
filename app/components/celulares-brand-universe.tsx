import Link from "./store-link";

const primaryBrands = [
  {
    key: "apple",
    brand: "Apple",
    label: "APPLE / IPHONE",
    title: "iPhone",
    subtitle: "Elegancia, potencia y un ecosistema premium.",
    copy:
      "Una experiencia limpia, refinada y aspiracional. Ideal para quienes valoran diseño, cámara, fluidez y la sensación de producto premium.",
    highlights: ["Diseño icónico", "Cámaras potentes", "Experiencia premium"],
    cta: "Explorar iPhone",
  },
  {
    key: "samsung",
    brand: "Samsung",
    label: "SAMSUNG GALAXY",
    title: "Galaxy",
    subtitle: "Tecnología versátil para el día a día.",
    copy:
      "La línea más equilibrada para quienes buscan variedad, confianza de marca, pantallas de gran nivel y modelos para distintos presupuestos.",
    highlights: ["Pantallas brillantes", "Buen equilibrio", "Familia Galaxy"],
    cta: "Ver Samsung",
  },
  {
    key: "motorola",
    brand: "Motorola",
    label: "MOTOROLA",
    title: "hello moto",
    subtitle: "Simplicidad, practicidad y muy buena relación de uso.",
    copy:
      "Pensado para quienes buscan un celular cómodo, confiable y directo. Una línea fuerte para uso diario, trabajo y comunicación.",
    highlights: ["Uso cotidiano", "Interfaz simple", "Buen rendimiento"],
    cta: "Ver Motorola",
  },
  {
    key: "infinix",
    brand: "Infinix",
    label: "INFINIX",
    title: "Potencia gamer",
    subtitle: "Diseño joven, batería y rendimiento para jugar.",
    copy:
      "Una marca con lenguaje visual más gamer y energético. Ideal para destacar equipos llamativos, buena autonomía y foco en entretenimiento.",
    highlights: ["Perfil gamer", "Batería durable", "Diseño moderno"],
    cta: "Ver Infinix",
  },
] as const;

const secondaryBrands = [
  {
    brand: "Xiaomi",
    title: "Xiaomi / Redmi",
    copy: "Gran variedad para diferentes necesidades.",
  },
  {
    brand: "Apple",
    title: "Ecosistema Apple",
    copy: "Prestigio, simpleza y continuidad entre dispositivos.",
  },
  {
    brand: "Samsung",
    title: "Línea Galaxy",
    copy: "Una de las familias más reconocidas del mercado.",
  },
];

export function CelularesBrandUniverse() {
  return (
    <section className="phone-universe" aria-labelledby="phone-universe-title">
      <div className="section-intro split phone-universe-intro">
        <div>
          <p className="eyebrow orange">UNIVERSO CELULARES</p>
          <h2 id="phone-universe-title">Marcas con identidad propia.</h2>
        </div>
        <p>
          Dentro de Celulares, cada marca se presenta con su personalidad visual y su propuesta.
          Elegí una experiencia y después filtrá el catálogo real sin mezclar todo.
        </p>
      </div>

      <div className="phone-universe-grid">
        {primaryBrands.map((item) => (
          <article key={item.key} className={`phone-brand-card brand-${item.key}`}>
            <div className="phone-brand-topline">
              <small>{item.label}</small>
              <span>{item.brand}</span>
            </div>
            <div className="phone-brand-copy">
              <h3>{item.title}</h3>
              <strong>{item.subtitle}</strong>
              <p>{item.copy}</p>
            </div>
            <div className="phone-brand-highlights">
              {item.highlights.map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
            <Link href={`?marca=${encodeURIComponent(item.brand)}#catalogo`} className="phone-brand-link">
              {item.cta}
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>

      <div className="phone-universe-secondary">
        <div>
          <small>MARCAS COMPLEMENTARIAS</small>
          <h3>La categoría queda preparada para seguir creciendo.</h3>
          <p>
            Xiaomi y otras líneas pueden sumarse con la misma lógica visual, sin romper la coherencia del sector Celulares.
          </p>
        </div>
        <div className="phone-secondary-grid">
          {secondaryBrands.map((item) => (
            <a key={item.title} href={`?marca=${encodeURIComponent(item.brand)}#catalogo`} className="phone-secondary-card">
              <small>{item.brand}</small>
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
