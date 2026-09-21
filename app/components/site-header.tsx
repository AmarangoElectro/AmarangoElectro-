"use client";

import Link from "./store-link";
import Image from "next/image";
import { Heart, HelpCircle, Menu, Search, ShieldCheck, Store, UsersRound, X } from "lucide-react";
import { SoundToggle } from "./sound-toggle";
import { ThemeToggle } from "./theme-toggle";
import { InstallAppButton } from "./install-app-button";
import { ShareStoreButton } from "./share-store-button";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { openSectorsSheet } from "@/lib/ux/sectors-sheet";
import { useEffect, useState } from "react";

const navigation = [
  { href: "/#ofertas", label: "Ofertas & Outlet" },
  { href: "/#como-comprar", label: "Cómo comprar" },
  { href: "/#experiencia", label: "Nuestra forma de atender" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <div className="announce">
        ATENCIÓN PERSONALIZADA <span>·</span> ENVÍOS A TODO EL PAÍS <span>·</span>
        GARANTÍA <span>·</span> ESTAMOS PARA ACOMPAÑARTE
      </div>
      <header className="site-header">
        <Link className="header-logo" href="/" aria-label="AmarangoElectro, inicio">
          <Image src="/logo-320.webp" alt="AmarangoElectro" width={320} height={320} priority unoptimized />
        </Link>
        <form className="header-search" action="/buscar" role="search">
          <Search size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="store-header-search">Buscar productos</label>
          <input id="store-header-search" type="search" name="q" placeholder="¿Qué estás buscando hoy?" autoComplete="off" />
          <button type="submit">Buscar</button>
        </form>
        <div className="header-actions">
          <ShareStoreButton compact />
          <Link className="header-help-link" href="/#como-comprar" aria-label="Ayuda para comprar" onClick={() => playSonicCue("navigate")}>
            <HelpCircle size={20} strokeWidth={1.8} />
          </Link>
          <Link className="header-favorites-link" href="/categoria/celulares?favoritos=1#catalogo" aria-label="Ver favoritos guardados en este dispositivo" onClick={() => playSonicCue("navigate")}>
            <Heart size={20} strokeWidth={1.8} />
          </Link>
          <button
            className="store-menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="store-drawer"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => { playSonicCue("tap"); setOpen((value) => !value); }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <div className={`store-drawer-layer ${open ? "open" : ""}`} aria-hidden={!open}>
        <button className="store-drawer-scrim" type="button" tabIndex={open ? 0 : -1} aria-label="Cerrar menú" onClick={() => setOpen(false)} />
        <aside id="store-drawer" className="store-drawer" aria-label="Menú AmarangoElectro">
          <header><span><small>MENÚ</small><strong>AmarangoElectro</strong></span><button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)}><X size={20} /></button></header>
          <nav aria-label="Navegación de la tienda">
            <button type="button" tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); openSectorsSheet(); }}>Categorías<span>→</span></button>
            {navigation.map((item) => <Link key={item.label} href={item.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{item.label}<span>→</span></Link>)}
          </nav>
          <section className="store-drawer-settings" aria-label="Preferencias locales">
            <ShareStoreButton />
            <InstallAppButton />
            <SoundToggle />
            <ThemeToggle />
          </section>
          <section className="authorized-access" aria-label="Acceso autorizado">
            <div><ShieldCheck size={18} /><span><small>ACCESO AUTORIZADO</small><strong>Espacios internos preparados</strong></span></div>
            <Link href="/mi-amarango" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}><UsersRound size={18} /> Mi Amarango · Asesores</Link>
            <Link href="/administracion" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}><ShieldCheck size={18} /> Administración</Link>
            <Link href="/plataforma" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}><Store size={18} /> Ver conexión de espacios</Link>
            <p>Estos espacios requieren una sesión autorizada.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
