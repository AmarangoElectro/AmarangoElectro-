"use client";

import { Check, ChevronRight, Copy, CreditCard, PackageCheck, ShoppingBag, Truck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  PURCHASE_INTENT_EVENT,
  buildPurchaseIntentSummary,
  intentLabel,
  type PurchaseIntent,
  type PurchaseIntentProduct,
} from "@/lib/commerce/purchase-intent";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

const intentOptions: Array<{
  id: PurchaseIntent;
  title: string;
  detail: string;
  Icon: typeof ShoppingBag;
}> = [
  { id: "buy", title: "Quiero este", detail: "Ya encontré el producto que me interesa.", Icon: ShoppingBag },
  { id: "installments", title: "Ver cuotas", detail: "Quiero conocer las opciones oficiales disponibles.", Icon: CreditCard },
  { id: "availability", title: "Confirmar disponibilidad", detail: "Quiero saber si está disponible antes de avanzar.", Icon: PackageCheck },
  { id: "delivery", title: "Consultar entrega", detail: "Quiero confirmar modalidad y zona de entrega.", Icon: Truck },
];

function safeWriteClipboard(text: string) {
  if (!navigator.clipboard?.writeText) return Promise.reject(new Error("clipboard-unavailable"));
  return navigator.clipboard.writeText(text);
}

export function PurchaseIntentFlow() {
  const [product, setProduct] = useState<PurchaseIntentProduct | null>(null);
  const [intent, setIntent] = useState<PurchaseIntent>("buy");
  const [note, setNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const open = product !== null;
  const summary = useMemo(
    () => product ? buildPurchaseIntentSummary({ product, intent, note }) : "",
    [intent, note, product],
  );

  useEffect(() => {
    const receiveIntent = (event: Event) => {
      const detail = (event as CustomEvent<PurchaseIntentProduct>).detail;
      if (!detail?.productId || !detail.product || !detail.url) return;
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setProduct(detail);
      setIntent("buy");
      setNote("");
      setReviewing(false);
    };
    window.addEventListener(PURCHASE_INTENT_EVENT, receiveIntent);
    return () => window.removeEventListener(PURCHASE_INTENT_EVENT, receiveIntent);
  }, []);

  const close = useCallback(() => {
    setProduct(null);
    setReviewing(false);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute("aria-hidden"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyboard);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [close, open]);

  function chooseIntent(nextIntent: PurchaseIntent) {
    setIntent(nextIntent);
    setReviewing(false);
    playSonicCue("tap");
  }

  function prepare() {
    setReviewing(true);
    playSonicCue("success");
  }

  async function copySummary() {
    try {
      await safeWriteClipboard(summary);
      playSonicCue("share");
      toast.success("Resumen de consulta copiado");
    } catch {
      toast.error("No pudimos copiar el resumen en este dispositivo.");
    }
  }

  if (!product) return null;

  return (
    <div className="purchase-intent-layer open" role="presentation">
      <button className="purchase-intent-scrim" type="button" aria-label="Cerrar consulta" onClick={close} />
      <aside ref={sheetRef} className="purchase-intent-sheet" role="dialog" aria-modal="true" aria-labelledby="purchase-intent-title">
        <header className="purchase-intent-header">
          <div>
            <small>DECISIÓN DE COMPRA</small>
            <strong id="purchase-intent-title">Dejá tu consulta lista.</strong>
          </div>
          <button ref={closeButtonRef} type="button" aria-label="Cerrar" onClick={close}><X size={20} /></button>
        </header>

        <div className="purchase-intent-progress" aria-label="Progreso de la consulta">
          <span className="done"><Check size={13} /> Producto</span>
          <i />
          <span className={reviewing ? "done" : "active"}>2. Motivo</span>
          <i />
          <span className={reviewing ? "active" : ""}>3. Resumen</span>
        </div>

        <div className="purchase-intent-body">
          <section className="purchase-intent-product" aria-label="Producto seleccionado">
            <div className="purchase-intent-monogram" aria-hidden="true">{product.brand.slice(0, 2).toUpperCase()}</div>
            <div>
              <small>{product.brand}</small>
              <strong>{product.product}</strong>
              <p>{product.model ?? "Modelo a confirmar"} · {product.priceLabel ?? "Precio a confirmar"}</p>
            </div>
          </section>

          {!reviewing ? (
            <>
              <section className="purchase-intent-section" aria-labelledby="purchase-intent-reason">
                <div className="purchase-intent-section-heading">
                  <small>PASO 2</small>
                  <h2 id="purchase-intent-reason">¿Qué querés resolver?</h2>
                  <p>Elegí una opción. No hace falta completar formularios largos para avanzar.</p>
                </div>
                <div className="purchase-intent-options">
                  {intentOptions.map(({ id, title, detail, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={intent === id ? "active" : ""}
                      aria-pressed={intent === id}
                      onClick={() => chooseIntent(id)}
                    >
                      <span><Icon size={20} /></span>
                      <div><strong>{title}</strong><small>{detail}</small></div>
                      {intent === id ? <Check className="intent-check" size={18} /> : <ChevronRight className="intent-arrow" size={18} />}
                    </button>
                  ))}
                </div>
              </section>

              <label className="purchase-intent-note">
                <span>¿Querés agregar algo? <small>Opcional</small></span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={240}
                  rows={3}
                  placeholder="Ej.: quisiera confirmar si hay entrega en mi zona."
                />
                <small>{note.length}/240</small>
              </label>

              <div className="purchase-intent-primary-row">
                <button type="button" className="purchase-intent-primary" onClick={prepare}>
                  Revisar consulta <ChevronRight size={18} />
                </button>
                <p>No se envía nada todavía. Primero ves exactamente qué información queda preparada.</p>
              </div>
            </>
          ) : (
            <section className="purchase-intent-review" aria-labelledby="purchase-intent-review-title">
              <div className="purchase-intent-section-heading">
                <small>PASO 3</small>
                <h2 id="purchase-intent-review-title">Todo claro antes de continuar.</h2>
                <p>Este resumen usa solamente la información disponible del producto. Si falta algún dato, queda marcado como “A confirmar”.</p>
              </div>

              <dl className="purchase-intent-review-grid">
                <div><dt>Producto</dt><dd>{product.product}</dd></div>
                <div><dt>Motivo</dt><dd>{intentLabel(intent)}</dd></div>
                <div><dt>Modelo</dt><dd>{product.model ?? "A confirmar"}</dd></div>
                <div><dt>Precio</dt><dd>{product.priceLabel ?? "A confirmar"}</dd></div>
                <div><dt>Disponibilidad</dt><dd>{product.availabilityLabel ?? "A confirmar"}</dd></div>
                {intent === "installments" && <div><dt>Financiación</dt><dd>{product.financingLabel ?? "A confirmar"}</dd></div>}
              </dl>

              {note.trim() && <div className="purchase-intent-review-note"><small>TU COMENTARIO</small><p>{note.trim()}</p></div>}

              <div className="purchase-intent-summary" aria-label="Resumen preparado"><pre>{summary}</pre></div>

              <div className="purchase-intent-review-actions">
                <button type="button" className="purchase-intent-primary" onClick={copySummary}><Copy size={17} /> Copiar consulta</button>
                <button type="button" className="purchase-intent-secondary" onClick={() => setReviewing(false)}>Editar</button>
              </div>
              <p className="purchase-intent-handoff-note">Copiá la consulta para compartirla con nuestro equipo por el canal que uses. Nada se envía ni se guarda automáticamente.</p>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
