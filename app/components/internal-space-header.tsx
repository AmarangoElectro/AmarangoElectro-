import Image from "next/image";
import Link from "./store-link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function InternalSpaceHeader({ eyebrow, title, badge }: { eyebrow: string; title: string; badge: string }) {
  return (
    <header className="internal-space-header">
      <Link className="internal-space-brand" href="/" aria-label="Volver a la tienda AmarangoElectro">
        <Image src="/logo-320.webp" alt="AmarangoElectro" width={64} height={64} priority unoptimized />
        <span><small>{eyebrow}</small><strong>{title}</strong></span>
      </Link>
      <div className="internal-space-actions">
        <span className="internal-space-badge"><ShieldCheck size={15} /> {badge}</span>
        <Link href="/"><ArrowLeft size={16} /> Tienda</Link>
      </div>
      <p className="identity-contract">Zona reservada para login, perfiles Maxi/Angie y sesión persistente.</p>
    </header>
  );
}
