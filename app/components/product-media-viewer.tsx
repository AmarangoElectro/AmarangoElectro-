"use client";

import Image from "next/image";
import { Maximize2, Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/lib/catalog/types";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

export function ProductMediaViewer({ image, productName }: { image: ProductImage; productName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => setZoomed(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  function open() {
    playSonicCue("tap");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function toggleZoom() {
    setZoomed((value) => !value);
    playSonicCue("tap");
  }

  return (
    <>
      <button className="detail-zoom-trigger" type="button" onClick={open} aria-label={`Ampliar imagen de ${productName}`}>
        <Maximize2 size={17} aria-hidden="true" />
        <span>Ampliar</span>
      </button>
      <dialog
        ref={dialogRef}
        className="product-lightbox"
        aria-label={`Vista ampliada de ${productName}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="product-lightbox-shell">
          <div className="product-lightbox-header">
            <div>
              <small>VISTA DE PRODUCTO</small>
              <strong>{productName}</strong>
            </div>
            <button type="button" onClick={close} aria-label="Cerrar imagen ampliada"><X size={20} /></button>
          </div>
          <div
            className={`product-lightbox-stage ${zoomed ? "zoomed" : ""}`}
            onDoubleClick={toggleZoom}
            title="Doble toque o doble clic para ampliar"
          >
            <div className="product-lightbox-image-canvas">
              <Image src={image.src} alt={image.alt} fill sizes="100vw" priority unoptimized />
            </div>
          </div>
          <div className="product-lightbox-controls" aria-label="Controles de zoom">
            <button type="button" onClick={() => setZoomed(false)} aria-label="Reducir imagen"><Minus size={17} /></button>
            <span>{zoomed ? "AMPLIADA" : "AJUSTADA"}</span>
            <button type="button" onClick={() => setZoomed(true)} aria-label="Ampliar imagen"><Plus size={17} /></button>
          </div>
          <p className="product-lightbox-hint">En móvil podés usar el gesto de pellizcar del navegador y también tocar dos veces para alternar el zoom.</p>
        </div>
      </dialog>
    </>
  );
}
