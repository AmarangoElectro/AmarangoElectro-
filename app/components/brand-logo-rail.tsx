const brands = ["Samsung", "Apple", "Motorola", "Xiaomi", "Infinix", "Philips", "JBL", "Sony", "Aiwa", "TCL", "BGH", "Noblex"];

function slug(value: string) {
  return value.toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, "-");
}

export function BrandLogoRail() {
  return (
    <section className="brand-logo-rail" aria-labelledby="brand-logo-title">
      <div className="brand-logo-heading"><p className="eyebrow orange">MARCAS QUE ELEGÍS</p><h2 id="brand-logo-title">Identidad real. Selección Amarango.</h2></div>
      <div className="brand-logo-window" aria-label="Marcas disponibles">
        <div className="brand-logo-track">
          {[...brands, ...brands].map((brand, index) => <span key={`${brand}-${index}`} className={`brand-wordmark brand-wordmark-${slug(brand)}`}>{brand}</span>)}
        </div>
      </div>
    </section>
  );
}
