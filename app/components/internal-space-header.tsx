import Image from "next/image";
import Link from "./store-link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

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
      </div>
      <p className="identity-contract">Sesión activa. Volvé a la tienda sin cerrar tu acceso; mientras la sesión de ChatGPT siga vigente, podés regresar a este espacio sin elegir la cuenta otra vez.</p>
    </header>
  );
}
