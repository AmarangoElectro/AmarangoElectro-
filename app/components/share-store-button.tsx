"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

interface ShareStoreButtonProps {
  compact?: boolean;
}

function copyWithLegacyFallback(value: string) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function ShareStoreButton({ compact = false }: ShareStoreButtonProps) {
  async function shareStore() {
    playSonicCue("share");
    const url = `${window.location.origin}/`;
    const text = "Abrí AmarangoElectro y, si querés, instalá la tienda en tu celular.";

    if (navigator.share) {
      try {
        await navigator.share({ title: "AmarangoElectro", text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(`${text}\n${url}`);
      else copyWithLegacyFallback(`${text}\n${url}`);
      toast.success("Enlace de la tienda copiado");
    } catch {
      toast.error("No se pudo compartir. Intentá nuevamente.");
    }
  }

  return (
    <button
      type="button"
      className={`share-store-button ${compact ? "share-store-button-compact" : ""}`}
      onClick={shareStore}
      aria-label="Compartir tienda AmarangoElectro"
      title="Compartir tienda"
    >
      <Share2 size={18} strokeWidth={1.8} aria-hidden="true" />
      <span>Compartir tienda</span>
    </button>
  );
}
