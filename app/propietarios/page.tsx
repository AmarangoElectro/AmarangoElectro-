import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import {
  BadgeCheck,
  Brush,
  Gift,
  ImagePlus,
  LockKeyhole,
  Settings2,
  Store,
  UsersRound,
  WalletCards,
} from "lucide-react";
import styles from "./propietarios.module.css";

export const metadata: Metadata = {
  title: "Propietarios · AmarangoElectro",
  description: "Centro de control de propietarios, suscriptores e identidad de tienda.",
};

const modules = [
  {
    icon: UsersRound,
    title: "Suscriptores",
    description:
      "Altas, estado, plan asignado, permisos y acceso a la tienda de cada suscriptor.",
    status: "Próximo: lectura segura",
  },
  {
    icon: Brush,
    title: "Identidad de tienda",
    description:
      "Nombre comercial, logo, color principal y color secundario por tienda, sin alterar Amarango.",
    status: "Base preparada",
  },
  {
    icon: WalletCards,
    title: "Planes y módulos",
    description:
      "Definir qué incluye cada suscripción y habilitar funciones por nivel sin hardcodear precios.",
    status: "Base preparada",
  },
  {
    icon: Store,
    title: "Tiendas y espacios",
    description:
      "Cada negocio vive en su propio espacio: identidad, miembros, asesores y permisos.",
    status: "Datos separados por tienda",
  },
  {
    icon: BadgeCheck,
    title: "Asesores",
    description:
      "Accesos, cartera, ventas y futura vista personal de comisiones y objetivos.",
    status: "Sin reglas de premios todavía",
  },
  {
    icon: ImagePlus,
    title: "Placas por marca",
    description:
      "El generador podrá heredar automáticamente colores y, según plan, el logo de la tienda activa.",
    status: "Preparado para integrar",
  },
];

export default async function PropietariosPage() {
  await requireChatGPTUser("/propietarios");

  return (
    <>
      <InternalSpaceHeader
        eyebrow="CONTROL DE PLATAFORMA"
        title="Propietarios"
        badge="Acceso de propietarios"
      />

      <main className={styles.workspace}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>AMARANGO · PROPIETARIOS</p>
            <h1>
              Suscriptores, identidad y permisos.
              <span> Sin tocar la tienda aprobada.</span>
            </h1>
            <p>
              Este espacio reúne la gestión de suscriptores, identidad y permisos sin alterar la experiencia pública de la tienda.
            </p>
          </div>

          <div className={styles.safetyCard}>
            <LockKeyhole aria-hidden="true" />
            <div>
              <strong>MODO SEGURO</strong>
              <span>Los cambios sensibles permanecen protegidos hasta su confirmación.</span>
            </div>
          </div>
        </section>

        <section className={styles.guardrails} aria-label="Reglas de trabajo">
          <div>
            <Settings2 aria-hidden="true" />
            <strong>Tienda protegida</strong>
            <span>No modifica Home, catálogo visual, tarjetas ni navegación pública sin confirmación.</span>
          </div>
          <div>
            <Store aria-hidden="true" />
            <strong>Todo por tienda</strong>
            <span>Cada suscriptor tendrá identidad, miembros y datos separados.</span>
          </div>
          <div>
            <Gift aria-hidden="true" />
            <strong>Objetivos después</strong>
            <span>Comisiones sí; premios y metas se activan cuando queden definidos.</span>
          </div>
        </section>

        <section className={styles.modules} aria-labelledby="owner-modules-title">
          <div className={styles.sectionIntro}>
            <p>PRIMER BLOQUE</p>
            <h2 id="owner-modules-title">Centro de propietarios</h2>
            <span>
              La gestión se habilita por etapas y siempre mantiene separados los datos de cada tienda.
            </span>
          </div>

          <div className={styles.grid}>
            {modules.map(({ icon: Icon, title, description, status }) => (
              <article key={title} className={styles.moduleCard}>
                <div className={styles.iconWrap}>
                  <Icon aria-hidden="true" />
                </div>
                <div className={styles.moduleCopy}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <small>{status}</small>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.nextGate}>
          <div>
            <p>PRÓXIMO PASO</p>
            <h2>Suscriptores · información real y segura</h2>
          </div>
          <p>
            El próximo paso es mostrar suscriptores, planes y estado de cada tienda desde la conexión segura. Los cambios seguirán protegidos por permisos de propietario.
          </p>
        </section>
      </main>
    </>
  );
}
