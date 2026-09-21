import Image from "next/image";
import Link from "./store-link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function InternalSpaceHeader({ eyebrow, title, badge, userName }: { eyebrow: string; title: string; badge: string; userName?: string | null }) {
  return (
    <header className="internal-space-header">
      <Link className="internal-space-brand" href="/" aria-label="Volver a la tienda AmarangoElectro">
        <Image src="/logo-320.webp" alt="AmarangoElectro" width={64} height={64} priority unoptimized />
        <span><small>{eyebrow}</small><strong>{title}</strong></span>
      </Link>
      <div className="internal-space-actions">
        {userName ? <span className="internal-space-user"><ShieldCheck size={15} /> Hola, {userName}</span> : null}
        <span className="internal-space-badge"><ShieldCheck size={15} /> {badge}</span>
        <Link href="/"><ArrowLeft size={16} /> Tienda</Link>
      </div>
      <p className="identity-contract">La sesión autenticada se reconoce automáticamente; no requiere abrir y cerrar sesión para cambiar de pantalla.</p>
    </header>
  );
}
