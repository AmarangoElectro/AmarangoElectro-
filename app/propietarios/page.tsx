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
  description: "Centro de control de propietarios, suscriptores y marca blanca.",
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
    title: "Tiendas / workspaces",
    description:
      "Cada negocio vive en su propio espacio aislado: branding, miembros, asesores y permisos.",
    status: "Aislamiento por workspace",
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
        badge="Módulo nuevo · aislado"
      />

      <main className={styles.workspace}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>AMARANGO PLATFORM</p>
            <h1>
              Suscriptores, identidad y permisos.
              <span> Sin tocar la tienda aprobada.</span>
            </h1>
            <p>
              Este espacio nace separado del storefront. Primero se construye y valida acá;
              recién después se conectan las acciones reales.
            </p>
          </div>

          <div className={styles.safetyCard}>
            <LockKeyhole aria-hidden="true" />
            <div>
              <strong>MODO SEGURO</strong>
              <span>Sin escrituras productivas en esta primera etapa.</span>
            </div>
          </div>
        </section>

        <section className={styles.guardrails} aria-label="Reglas de trabajo">
          <div>
            <Settings2 aria-hidden="true" />
            <strong>Storefront congelado</strong>
            <span>No modifica Home, catálogo visual, tarjetas ni navegación pública.</span>
          </div>
          <div>
            <Store aria-hidden="true" />
            <strong>Todo por workspace</strong>
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
              La interfaz queda preparada antes de habilitar altas, bajas o cambios persistentes.
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
            <p>SIGUIENTE GATE</p>
            <h2>Suscriptores · lectura real primero</h2>
          </div>
          <p>
            El próximo paso conecta este módulo a la capa segura existente para listar
            workspaces, planes y estado de suscripción. La escritura queda bloqueada hasta
            validar la pantalla y los permisos de propietario.
          </p>
        </section>
      </main>
    </>
  );
}
