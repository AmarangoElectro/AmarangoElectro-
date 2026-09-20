"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-state"><p className="eyebrow orange">AMARANGOELECTRO</p><h1>No pudimos cargar esta sección.</h1><p>La tienda quedó en un estado seguro. Podés intentar nuevamente sin riesgo de modificar el catálogo.</p><button type="button" onClick={reset}>Intentar de nuevo</button></main>
  );
}
