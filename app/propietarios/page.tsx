import type {Metadata} from "next";
import Image from "next/image";
import {requireChatGPTUser} from "@/app/chatgpt-auth";
import {InternalSpaceHeader} from "@/app/components/internal-space-header";
import {requireSpaceAccess} from "@/lib/internal/auth/server-access";
import {OwnerSubscriptions} from "@/components/subscriptions/owner-subscriptions";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Propietarios · AmarangoElectro",description:"Control de tiendas, suscriptores y niveles de herramientas."};
export default async function PropietariosPage(){
 await requireChatGPTUser("/propietarios");await requireSpaceAccess("owner");
 return <><InternalSpaceHeader eyebrow="CONTROL DE PLATAFORMA" title="Propietarios" badge="Acceso de propietarios"/><main className="subscriber-workspace"><header className="subscription-intro"><small>AMARANGOELECTRO · PROPIETARIOS</small><h1>Tiendas y suscriptores</h1><p>Habilitá cada negocio con las herramientas que necesita y definí su escala de valores.</p><div className="platform-owners" aria-label="Propietarios de AmarangoElectro"><div><Image src="/assets/owners/maxi.jpg" alt="Foto de Maxi" width={72} height={72} unoptimized/><strong>Maxi</strong></div><div><Image src="/assets/owners/angela.jpg" alt="Foto de Ángela" width={72} height={72} unoptimized/><strong>Ángela</strong></div></div></header><OwnerSubscriptions/><section className="store-panel"><h2>Alta gradual</h2><p>Las herramientas de cada suscriptor trabajan en su propio negocio. Tu administración de Amarango, sus costos, ventas y cartera conservan sus permisos.</p><a href="/mi-tienda">Probar mi propia tienda →</a><p className="muted">Esta vista sigue privada. Para que ingrese otro negocio, primero debe tener acceso autorizado al sitio. Los cobros recurrentes y las invitaciones a equipos se incorporarán después.</p></section></main></>
}
