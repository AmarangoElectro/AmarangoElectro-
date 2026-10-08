"use client";
import { useEffect, useState } from "react";
import type { SpaceAccess } from "@/lib/internal/auth/server-access";
import { ProtectedSpaceLink } from "./protected-space-link";
import { ShieldCheck, UsersRound, UserRound } from "lucide-react";

export function RoleAccessLinks({tabIndex,onNavigate}: {tabIndex?:number;onNavigate?:()=>void}) {
  const [access,setAccess] = useState<(SpaceAccess&{subscriber?:boolean})|null>(null);
  useEffect(()=>{let alive=true; fetch("/api/v16/access",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(value=>{if(alive)setAccess(value)}).catch(()=>{});return()=>{alive=false}},[]);
  return <section className="authorized-access" aria-label="Tu espacio autorizado">
    <ProtectedSpaceLink href="/mi-espacio" tabIndex={tabIndex} onClick={onNavigate}><UserRound size={18}/> Mi espacio</ProtectedSpaceLink>
    {access?.admin && <ProtectedSpaceLink href="/administracion" tabIndex={tabIndex} onClick={onNavigate}><ShieldCheck size={18}/> Administración</ProtectedSpaceLink>}
    {access?.advisor && <ProtectedSpaceLink href="/mi-amarango" tabIndex={tabIndex} onClick={onNavigate}><UsersRound size={18}/> Mi Amarango</ProtectedSpaceLink>}
    {access?.owner && <ProtectedSpaceLink href="/propietarios" tabIndex={tabIndex} onClick={onNavigate}>Propietarios</ProtectedSpaceLink>}
    {access?.subscriber && <ProtectedSpaceLink href="/mi-tienda" tabIndex={tabIndex} onClick={onNavigate}>Mi tienda</ProtectedSpaceLink>}
  </section>;
}
