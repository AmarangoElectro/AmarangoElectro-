import Image from "next/image";
import Link from "./store-link";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";

export function InternalSpaceHeader({ eyebrow, title, badge }: { eyebrow: string; title: string; badge: string }) {
  return (
    <header className="internal-space-header">
      <Link className="internal-space-brand" href="/" aria-label="Volver a la tienda AmarangoElectro">
        <Image src="/logo-320.webp" alt="AmarangoElectro" width={64} height={64} priority unoptimized />
        <span><small>{eyebrow}</small><strong>{title}</strong></span>
      </Link>
      <div className="internal-space-actions">
        <div className="internal-space-theme"><ThemeToggle /></div>
        <span className="internal-space-badge"><ShieldCheck size={15} /> {badge}</span>
        <Link href="/"><ArrowLeft size={16} /> Tienda</Link>
        <a className="internal-space-signout" href={chatGPTSignOutPath("/")}><LogOut size={16} /> Cerrar sesión</a>
      </div>
      <p className="identity-contract">Sesión activa. Mientras el acceso siga vigente, podés volver a este espacio sin iniciar sesión de nuevo.</p>
    </header>
  );
}
