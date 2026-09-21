"use client";

import { BadgeCheck, Building2, Palette, ShieldCheck, Users } from "lucide-react";

const ownerModules = [
  { icon: Users, title: "Suscriptores", detail: "Altas, planes y estado de cada tienda", status: "Flujo preparado" },
  { icon: BadgeCheck, title: "Familia y cuentas", detail: "Miembros, roles y accesos de confianza", status: "Gate futuro" },
  { icon: Building2, title: "Tienda white-label", detail: "Nombre comercial, dominio y configuración por cuenta", status: "Estructura visible" },
  { icon: Palette, title: "Logo y colores", detail: "Identidad visual por tienda sin alterar el storefront base", status: "Preview local" },
] as const;

export function OwnerControlCenter() {
  return (
    <section className="owner-control-center" aria-labelledby="owner-control-title">
      <header><div><p className="eyebrow orange">SECTOR PROPIETARIO</p><h2 id="owner-control-title">Suscripción, familia y marca blanca.</h2><span>La estructura queda encaminada y aislada. No crea cuentas ni persiste cambios todavía.</span></div><div className="owner-control-center__gate"><ShieldCheck /><strong>GATE LOCAL</strong><span>Supabase y producción intactos</span></div></header>
      <div className="owner-control-center__grid">{ownerModules.map(({ icon: Icon, title, detail, status }) => <article key={title}><Icon aria-hidden="true" /><div><strong>{title}</strong><p>{detail}</p></div><span>{status}</span></article>)}</div>
      <div className="owner-control-center__identity" aria-label="Vista previa de identidad de tienda"><div><small>IDENTIDAD ACTUAL</small><strong>AmarangoElectro</strong><span>Logo aprobado · Azul Amarango · Naranja Amarango</span></div><button type="button" disabled>Cambiar logo · próximo gate</button><button type="button" disabled>Cambiar colores · próximo gate</button></div>
    </section>
  );
}
