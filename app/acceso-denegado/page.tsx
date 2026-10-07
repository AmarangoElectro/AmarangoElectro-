import Link from "next/link";
export const dynamic = "force-dynamic";
export default function AccessDeniedPage() {
  return <main className="internal-workspace"><section className="internal-empty"><h1>Este espacio requiere autorización.</h1><p>Tu cuenta puede seguir recorriendo la tienda. Administración habilita los accesos de cada persona.</p><Link href="/">Volver a la tienda</Link></section></main>;
}
