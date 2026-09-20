import type { Metadata } from "next";
import Link from "@/app/components/store-link";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { Brush, CreditCard, ImagePlus, ShieldCheck, Store, UsersRound } from "lucide-react";
import styles from "./propietarios.module.css";

export const metadata: Metadata = {
  title: "Propietarios · AmarangoElectro",
  description: "Centro de propietarios para suscriptores, tiendas, branding y módulos.",
};

const modules = [
  { icon: UsersRound, title: "Suscriptores", text: "Tiendas, familia/equipo, acceso y estado.", href: "/propietarios/suscriptores", ready: true },
  { icon: Store, title: "Tiendas / Workspaces", text: "Aislamiento por negocio y configuración propia.", href: "/propietarios/suscriptores?vista=tiendas", ready: true },
  { icon: Brush, title: "Identidad de tienda", text: "Nombre, colores y logo por suscriptor.", href: "/propietarios/suscriptores?vista=identidad", ready: true },
  { icon: CreditCard, title: "Planes y módulos", text: "Estructura preparada sin precios inventados.", href: "/propietarios/suscriptores?vista=planes", ready: true },
  { icon: ImagePlus, title: "Placas por marca", text: "Preparado para heredar branding según plan.", href: "#", ready: false },
];

export default async function OwnersPage() {
  await requireChatGPTUser("/propietarios");

  return (
    <>
      <InternalSpaceHeader eyebrow="CONTROL DE PLATAFORMA" title="Propietarios" badge="Módulo aislado" />
      <main className={styles.workspace}>
        <section className={styles.hero}>
          <div>
            <p>AMARANGO PLATFORM</p>
            <h1>Hacé crecer la red <span>sin tocar la tienda aprobada.</span></h1>
            <small>Todo lo nuevo vive aislado del storefront y se integra por gates revisados.</small>
          </div>
          <div className={styles.safe}><ShieldCheck /><strong>Storefront congelado</strong><span>Esta rama no modifica Home, cards ni navegación pública.</span></div>
        </section>

        <section className={styles.grid}>
          {modules.map(({ icon: Icon, title, text, href, ready }) => (
            ready ? (
              <Link key={title} className={styles.card} href={href}>
                <Icon /><div><strong>{title}</strong><span>{text}</span></div><b>→</b>
              </Link>
            ) : (
              <article key={title} className={styles.card + " " + styles.disabled}>
                <Icon /><div><strong>{title}</strong><span>{text}</span></div><b>Próximo</b>
              </article>
            )
          ))}
        </section>
      </main>
    </>
  );
}
