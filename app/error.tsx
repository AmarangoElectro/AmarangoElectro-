"use client";

import Link from "./components/store-link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-state">
      <p className="eyebrow orange">AMARANGOELECTRO</p>
      <h1>No pudimos cargar esta sección.</h1>
      <p>Podés intentarlo nuevamente o volver al catálogo para seguir explorando.</p>
      <div className="error-state-actions">
        <button type="button" onClick={reset}>Intentar de nuevo</button>
        <Link href="/buscar">Ver catálogo</Link>
      </div>
    </main>
  );
}
