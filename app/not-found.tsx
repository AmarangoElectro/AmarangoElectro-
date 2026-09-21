import Link from "./components/store-link";

export default function NotFound() {
  return (
    <main className="error-state">
      <p className="eyebrow orange">AMARANGOELECTRO</p>
      <h1>No encontramos esa página.</h1>
      <p>Podés volver al inicio o seguir explorando todos nuestros productos.</p>
      <div className="error-state-actions">
        <Link href="/">Ir al inicio</Link>
        <Link href="/buscar">Ver catálogo</Link>
      </div>
    </main>
  );
}
