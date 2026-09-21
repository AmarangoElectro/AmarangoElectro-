import { requireChatGPTUser } from "@/app/chatgpt-auth";
import Link from "@/app/components/store-link";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { ArrowRight, Database, ShieldCheck, Store, UsersRound } from "lucide-react";

const spaces = [
  { icon: Store, label: "Cliente", text: "Descubre categorías, productos y campañas sin ver controles internos.", href: "/" },
  { icon: UsersRound, label: "Asesor", text: "Consume el producto oficial, comparte y acompaña sin acceder a costos.", href: "/mi-amarango" },
  { icon: ShieldCheck, label: "Administración", text: "Controla publicación, precios, fotos, stock, ofertas y placas.", href: "/administracion" },
];

export default async function PlataformaPage() {
  await requireChatGPTUser("/plataforma");
  return <><InternalSpaceHeader eyebrow="ESPACIOS INTERNOS" title="Una sola plataforma" badge="Acceso organizado" /><main className="internal-workspace platform-tour"><section className="internal-hero"><div><p className="eyebrow orange">UNA SOLA FUENTE DE PRODUCTO</p><h1>Tienda, Asesores y Admin.<br /><span>Cada rol ve lo que necesita.</span></h1></div><p>Cada espacio utiliza el mismo catálogo y aplica permisos según el rol autorizado.</p></section><div className="platform-flow">{spaces.map(({ icon: Icon, ...space }) => <article key={space.label}><Icon /><small>ESPACIO</small><h2>{space.label}</h2><p>{space.text}</p><Link href={space.href}>Recorrer <ArrowRight /></Link></article>)}</div><section className="platform-master-contract"><Database /><div><small>CATÁLOGO ÚNICO</small><h2>Una sola fuente para toda la tienda</h2><p>Cliente, Asesor y Administración trabajan sobre el mismo catálogo oficial. Cada espacio muestra únicamente la información que corresponde a su rol.</p></div><span>ACCESO SEGÚN PERMISOS</span></section></main></>;
}
