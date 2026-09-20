import Link from "./components/store-link";

export default function NotFound() {
  return <main className="error-state"><p className="eyebrow orange">AMARANGOELECTRO</p><h1>No encontramos esa página.</h1><p>Volvé a la tienda para seguir explorando.</p><Link href="/">Ir al inicio</Link></main>;
}
