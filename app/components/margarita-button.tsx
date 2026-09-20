"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ConsultationPayload } from "@/lib/commerce/consultation";

export function MargaritaButton() {
  const [open, setOpen] = useState(false);
  const [consultation, setConsultation] = useState<ConsultationPayload | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const receiveConsultation = (event: Event) => {
      const detail = (event as CustomEvent<ConsultationPayload>).detail;
      if (!detail?.productId || !detail.product) return;
      setConsultation(detail);
      setOpen(true);
    };
    window.addEventListener("amarango:consult-product", receiveConsultation);
    return () => window.removeEventListener("amarango:consult-product", receiveConsultation);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function closeDrawer() {
    setOpen(false);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  return (
    <>
      <button
        ref={openerRef}
        className="margarita-button"
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="margarita-drawer"
        aria-label="Abrir Margarita, asistente AmarangoElectro"
      >
        <span className="bee" aria-hidden="true">🐝</span>
        <span><strong>Margarita</strong><small>Estoy para ayudarte</small></span>
      </button>

      <div className={`margarita-layer ${open ? "open" : ""}`} aria-hidden={!open}>
        <button className="margarita-scrim" type="button" aria-label="Cerrar Margarita" tabIndex={open ? 0 : -1} onClick={closeDrawer} />
        <aside
          id="margarita-drawer"
          className="margarita-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="margarita-title"
        >
          <header className="margarita-drawer-header">
            <div className="margarita-identity">
              <span className="bee" aria-hidden="true">🐝</span>
              <div><strong id="margarita-title">Margarita</strong><small>Asistente AmarangoElectro</small></div>
            </div>
            <button ref={closeButtonRef} type="button" aria-label="Cerrar Margarita" onClick={closeDrawer}><X size={21} /></button>
          </header>

          <div className="margarita-messages" aria-live="polite">
            <div className="margarita-status"><span /> Preparada para integración</div>
            <div className="margarita-message assistant">
              <span className="message-icon" aria-hidden="true"><MessageCircle size={16} /></span>
              <div>
                <strong>Hola, soy Margarita.</strong>
                <p>Este espacio ya está preparado para acompañarte sin sacarte de la tienda.</p>
              </div>
            </div>

            {consultation && (
              <section className="margarita-product-context" aria-label="Producto preparado para consultar">
                <small>CONSULTA PREPARADA</small>
                <strong>{consultation.product}</strong>
                <dl>
                  <div><dt>Modelo</dt><dd>{consultation.model ?? "Pendiente del catálogo"}</dd></div>
                  <div><dt>Categoría</dt><dd>{consultation.category}</dd></div>
                  <div><dt>ID interno</dt><dd>{consultation.productId}</dd></div>
                </dl>
              </section>
            )}

            <p className="margarita-integration-note">
              La conversación real, WhatsApp y los datos internos se conectarán únicamente cuando estén auditados. Esta versión no envía información ni escribe en el catálogo.
            </p>
          </div>

          <footer className="margarita-composer" aria-label="Entrada preparada para integración futura">
            <div aria-disabled="true">Escribile a Margarita próximamente…</div>
            <button type="button" aria-label="Enviar próximamente" disabled><Send size={18} /></button>
          </footer>
        </aside>
      </div>
    </>
  );
}
