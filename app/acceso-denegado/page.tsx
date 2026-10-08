import { ProtectedSpaceLink } from "@/app/components/protected-space-link";
export const dynamic = "force-dynamic";
export default function AccessDeniedPage() {
  return <main className="internal-workspace"><section className="internal-empty"><h1>Este espacio requiere autorización.</h1><p>Tu cuenta puede seguir recorriendo la tienda. Propietarios autoriza los accesos de cada persona.</p><ProtectedSpaceLink href="/mi-espacio">Ir a mi espacio</ProtectedSpaceLink><ProtectedSpaceLink href="/">Volver a la tienda</ProtectedSpaceLink></section></main>;
}
