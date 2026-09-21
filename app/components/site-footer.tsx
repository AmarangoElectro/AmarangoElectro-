import Image from "next/image";
import Link from "./store-link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Image src="/logo-320.webp" alt="" width={320} height={320} unoptimized />
        <span>AMARANGO<i>ELECTRO</i></span>
      </div>
      <div className="footer-grid">
        <div>
          <h2>Una nueva experiencia en tecnología.</h2>
          <p>Electrodomésticos, tecnología y atención personalizada.<br />Equipo AmarangoElectro.</p>
        </div>
        <div>
          <h3>Descubrir</h3>
          <Link href="/#productos">Productos</Link>
          <Link href="/buscar">Catálogo completo</Link>
          <Link href="/categoria/celulares">Celulares</Link>
        </div>
        <div>
          <h3>Ayuda</h3>
          <Link href="/#experiencia">Atención y compra</Link>
          <Link href="/#financiacion">Financiación</Link>
          <span>Entregas</span>
        </div>
        <div>
          <h3>Empresa</h3>
          <Link href="/#experiencia">Nuestra atención</Link>
          <span>Contacto</span>
          <Link href="/mi-amarango">Área asesores</Link>
        </div>
      </div>
      <div className="footer-legal">
        <span>AmarangoElectro</span>
        <span>Tecnología para tu vida. Personas para acompañarte.</span>
      </div>
    </footer>
  );
}
