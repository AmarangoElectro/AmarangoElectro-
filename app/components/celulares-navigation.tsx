const profiles = [
  {
    kicker: "EXPERIENCIA PREMIUM",
    title: "Diseño y cámara",
    copy: "Para quienes priorizan una experiencia refinada, fotografía, fluidez y terminaciones premium.",
    brands: "iPhone · Samsung",
  },
  {
    kicker: "EQUILIBRIO",
    title: "Para todos los días",
    copy: "Opciones confiables para comunicación, trabajo, redes y uso cotidiano sin complicaciones.",
    brands: "Samsung · Motorola · Xiaomi",
  },
  {
    kicker: "RENDIMIENTO",
    title: "Batería y potencia",
    copy: "Equipos pensados para quienes necesitan autonomía, multitarea y un ritmo de uso más intenso.",
    brands: "Infinix · Xiaomi · Motorola",
  },
  {
    kicker: "GAMING & ENTRETENIMIENTO",
    title: "Jugá, mirá y disfrutá",
    copy: "Un recorrido con foco en pantalla, batería, rendimiento y una estética más ligada al universo gamer.",
    brands: "Infinix · Samsung · Xiaomi",
  },
] as const;

export function CelularesNavigation() {
  return (
    <section className="phone-choice-section" aria-labelledby="phone-choice-title">
        <div className="section-intro split">
          <div>
            <p className="eyebrow orange">ELEGÍ POR TU FORMA DE USARLO</p>
            <h2 id="phone-choice-title">Primero tu necesidad. Después el modelo.</h2>
          </div>
          <p>
            En vez de empujarte un equipo, organizamos la categoría para que primero identifiques qué valorás más y después explores las marcas que mejor encajan.
          </p>
        </div>
        <div className="phone-choice-grid">
          {profiles.map((profile, index) => (
            <article key={profile.title} className="phone-choice-card">
              <div className="phone-choice-number">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <small>{profile.kicker}</small>
                <h3>{profile.title}</h3>
                <p>{profile.copy}</p>
                <strong>{profile.brands}</strong>
              </div>
            </article>
          ))}
        </div>
    </section>
  );
}
