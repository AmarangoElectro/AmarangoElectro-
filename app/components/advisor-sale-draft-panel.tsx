"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, ClipboardPaste, LockKeyhole, Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog/types";
import { normalizeCatalogText } from "@/lib/catalog/search";
import { v16OperationalAdapter } from "@/lib/operations/operational-adapter";
import type { ActiveFinancingMode } from "@/lib/internal/finance/active-financing-mode-contract";

type PaymentPlan = 0 | 2 | 3 | 4 | 6;

type AuthorizedQuote = {
  authorizedQuoteId: string;
  expiresAt: string;
  productId: string;
  productName: string;
  productModel: string | null;
  paymentMode: "CASH" | "FINANCED";
  financingMode: ActiveFinancingMode;
  cashPrice: number;
  initialPayment: number;
  installments: number;
  installmentAmount: number;
  financedTotal: number;
  paymentAmounts: number[];
  pricingPolicyVersion: string;
};

function money(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? `$${Math.round(value).toLocaleString("es-AR")}`
    : "A confirmar";
}

function requestId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

export function AdvisorSaleDraftPanel({ products }: { products: readonly Product[] }) {
  const [productQuery, setProductQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [plan, setPlan] = useState<PaymentPlan>(0);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [activity, setActivity] = useState("");
  const [activeMode, setActiveMode] = useState<ActiveFinancingMode | null>(null);
  const [connectionState, setConnectionState] = useState<"loading" | "ready" | "blocked">("loading");
  const [quote, setQuote] = useState<AuthorizedQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [confirmedSaleId, setConfirmedSaleId] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products],
  );

  const matches = useMemo(() => {
    const term = normalizeCatalogText(productQuery);
    if (!term) return [];
    return products
      .filter((product) => normalizeCatalogText([product.name, product.brand, product.model].filter(Boolean).join(" ")).includes(term))
      .slice(0, 6);
  }, [productQuery, products]);

  const availablePlans: readonly PaymentPlan[] = activeMode === "PROTECTED"
    ? [0, 3, 6]
    : [0, 2, 4, 6];

  const selectedFinancing = useMemo(
    () => plan === 0 ? null : selectedProduct?.financing.find((option) => option.installments === plan) ?? null,
    [plan, selectedProduct],
  );

  const saleTotal = quote?.financedTotal ?? (
    plan === 0
      ? selectedProduct?.price?.amount ?? null
      : selectedFinancing?.totalAmount?.amount ?? null
  );
  const installmentAmount = quote?.installmentAmount ?? (
    plan === 0 ? null : selectedFinancing?.installmentAmount?.amount ?? null
  );
  const financed = plan > 0;

  useEffect(() => {
    let cancelled = false;
    v16OperationalAdapter.getActiveFinancingMode().then((result) => {
      if (cancelled) return;
      if (result.status === "ok" && result.data) {
        setActiveMode(result.data.active_financing_mode);
        setConnectionState("ready");
        return;
      }
      setConnectionState("blocked");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!availablePlans.includes(plan)) setPlan(0);
  }, [activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setQuote(null);
    setConfirmedSaleId(null);
  }, [productId, plan]);

  function selectProduct(product: Product) {
    setProductId(product.id);
    setProductQuery(product.name);
  }

  function validateDraft() {
    if (!clientName.trim()) {
      toast.error("Falta el nombre del cliente.");
      return false;
    }
    if (phone.replace(/\D+/g, "").length < 8) {
      toast.error("Ingresá un WhatsApp válido.");
      return false;
    }
    if (!selectedProduct) {
      toast.error("Elegí un producto del catálogo.");
      return false;
    }
    if (!address.trim() || !locality.trim()) {
      toast.error("Completá dirección y localidad.");
      return false;
    }
    if (financed && (!dni.trim() || !activity.trim())) {
      toast.error("Para cuotas completá DNI y actividad.");
      return false;
    }
    return true;
  }

  async function pasteProduct() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast("No encontramos texto para pegar.");
        return;
      }
      const normalized = normalizeCatalogText(text);
      const exact = products.find((product) => normalizeCatalogText(product.name) === normalized);
      const contained = products
        .filter((product) => {
          const name = normalizeCatalogText(product.name);
          return name.length >= 5 && normalized.includes(name);
        })
        .sort((a, b) => b.name.length - a.name.length)[0];
      const match = exact ?? contained ?? products.find((product) => normalized.includes(normalizeCatalogText(product.model ?? "")) && Boolean(product.model));
      if (match) {
        selectProduct(match);
        toast.success("Producto encontrado en el catálogo.");
        return;
      }
      setProductQuery(text.split(/\r?\n/).find(Boolean)?.slice(0, 180) ?? text.slice(0, 180));
      toast("Pegamos el texto. Elegí una coincidencia del catálogo.");
    } catch {
      toast.error("No pudimos leer el portapapeles. Podés buscar el producto manualmente.");
    }
  }

  async function prepareQuote() {
    if (!validateDraft() || !selectedProduct) return;
    if (connectionState !== "ready" || !activeMode) {
      toast.error("La conexión operativa todavía no está disponible.");
      return;
    }

    setQuoting(true);
    setConfirmedSaleId(null);
    try {
      const response = await fetch("/api/v16/sale-quote", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          paymentMode: plan === 0 ? "CASH" : "FINANCED",
          installments: plan === 0 ? 1 : plan,
        }),
        cache: "no-store",
      });
      const payload = await response.json() as { status?: string; data?: AuthorizedQuote; reason?: string };
      if (!response.ok || payload.status !== "ok" || !payload.data) {
        if (payload.reason === "protected_cost_unavailable") {
          toast.error("Este producto todavía no tiene costo certificado para Plan Protegido.");
        } else {
          toast.error("No pudimos generar la cotización oficial.");
        }
        setQuote(null);
        return;
      }
      setQuote(payload.data);
      toast.success("Cotización oficial preparada.");
    } catch {
      setQuote(null);
      toast.error("No pudimos conectar con la cotización segura.");
    } finally {
      setQuoting(false);
    }
  }

  async function registerSale() {
    if (!validateDraft() || !selectedProduct) return;
    if (!quote) {
      toast.error("Primero prepará la cotización oficial.");
      return;
    }

    setRegistering(true);
    try {
      const client = await v16OperationalAdapter.createClient({
        nombre: clientName.trim(),
        dni: dni.trim() || null,
        telefono: phone.trim(),
        telefonoAlternativo: null,
        direccion: address.trim(),
        localidad: locality.trim(),
        ocupacionActividad: activity.trim() || null,
        observaciones: null,
        source: "advisor_sale",
        idempotencyKey: requestId("advisor-client"),
      });
      if (client.status !== "ok" || !client.data) {
        toast.error(client.status === "unauthorized" ? "No tenés permiso para registrar este cliente." : "No pudimos validar el cliente.");
        return;
      }

      const sale = await v16OperationalAdapter.confirmSale({
        clientId: client.data.client_id,
        authorizedQuoteId: quote.authorizedQuoteId,
        source: "advisor",
        idempotencyKey: requestId("advisor-sale"),
      });
      if (sale.status !== "ok" || !sale.data) {
        toast.error(sale.status === "unauthorized" ? "No tenés permiso para registrar esta venta." : "No pudimos registrar la venta.");
        return;
      }

      setConfirmedSaleId(sale.data.sale_id);
      toast.success("Venta registrada correctamente.");
    } finally {
      setRegistering(false);
    }
  }

  async function copySummary() {
    if (!validateDraft() || !selectedProduct) return;

    const lines = [
      "NUEVA VENTA · AMARANGOELECTRO",
      `Cliente: ${clientName.trim()}`,
      `WhatsApp: ${phone.trim()}`,
      `Dirección: ${address.trim()}`,
      `Localidad: ${locality.trim()}`,
      dni.trim() ? `DNI: ${dni.trim()}` : "",
      activity.trim() ? `Actividad: ${activity.trim()}` : "",
      "",
      `Producto: ${selectedProduct.name}`,
      `Forma de pago: ${plan === 0 ? "Contado" : `${plan} pagos`}`,
      quote ? `Contado oficial: ${money(quote.cashPrice)}` : "",
      quote && quote.paymentMode === "FINANCED" ? `Inicial: ${money(quote.initialPayment)}` : "",
      `Total: ${money(saleTotal)}`,
      plan > 0 ? `Pago posterior de referencia: ${money(installmentAmount)}` : "",
      "",
      confirmedSaleId ? `Venta registrada: ${confirmedSaleId}` : quote ? "Estado: cotización oficial preparada." : "Estado: pendiente de cotización oficial.",
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Resumen de venta copiado.");
    } catch {
      toast.error("No pudimos copiar el resumen.");
    }
  }

  return (
    <section id="advisor-sale-draft" className="advisor-sale-draft" aria-labelledby="advisor-sale-draft-title">
      <header className="advisor-sale-draft__header">
        <div>
          <p className="eyebrow orange">NUEVA VENTA</p>
          <h2 id="advisor-sale-draft-title">Prepará y registrá la operación.</h2>
          <p>Cliente, producto y forma de pago quedan validados por el circuito seguro antes de guardar la venta.</p>
        </div>
        <span className="advisor-sale-draft__safe">
          <LockKeyhole size={16} />
          {connectionState === "ready"
            ? `Conexión operativa · ${activeMode === "PROTECTED" ? "Plan Protegido" : "Clásica"}`
            : connectionState === "loading"
              ? "Conectando…"
              : "Conexión operativa requerida"}
        </span>
      </header>

      <div className="advisor-sale-draft__grid">
        <section className="advisor-sale-draft__card" aria-labelledby="advisor-sale-client-title">
          <div className="advisor-sale-draft__section-title"><span>1</span><div><small>CLIENTE</small><strong id="advisor-sale-client-title">Datos de contacto</strong></div></div>
          <div className="advisor-sale-fields">
            <label className="full"><span>Nombre y apellido *</span><input value={clientName} onChange={(event) => setClientName(event.target.value)} autoComplete="name" /></label>
            <label><span>WhatsApp *</span><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" /></label>
            <label><span>DNI {financed ? "*" : ""}</span><input value={dni} onChange={(event) => setDni(event.target.value)} inputMode="numeric" /></label>
            <label className="full"><span>Dirección *</span><input value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" /></label>
            <label><span>Localidad *</span><input value={locality} onChange={(event) => setLocality(event.target.value)} /></label>
            <label><span>Actividad {financed ? "*" : ""}</span><input value={activity} onChange={(event) => setActivity(event.target.value)} placeholder={financed ? "Requerida para cuotas" : "Opcional contado"} /></label>
          </div>
        </section>

        <section className="advisor-sale-draft__card" aria-labelledby="advisor-sale-product-title">
          <div className="advisor-sale-draft__section-title"><span>2</span><div><small>PRODUCTO</small><strong id="advisor-sale-product-title">Elegí desde el catálogo</strong></div></div>
          <div className="advisor-sale-product-search">
            <Search size={17} />
            <input value={productQuery} onChange={(event) => { setProductQuery(event.target.value); setProductId(""); }} placeholder="Nombre, marca o modelo…" />
            <button type="button" onClick={pasteProduct} aria-label="Pegar producto"><ClipboardPaste size={17} /><span>Pegar</span></button>
          </div>
          {!selectedProduct && matches.length > 0 && <div className="advisor-sale-suggestions" role="listbox" aria-label="Coincidencias del catálogo">
            {matches.map((product) => <button key={product.id} type="button" onClick={() => selectProduct(product)}>
              <span><strong>{product.name}</strong><small>{product.brand}</small></span>
              <b>{money(product.price?.amount)}</b>
            </button>)}
          </div>}
          {selectedProduct && <div className="advisor-sale-selected">
            <span><ShoppingBag size={18} /></span>
            <div><small>PRODUCTO SELECCIONADO</small><strong>{selectedProduct.name}</strong><p>{selectedProduct.brand} · Contado visible {money(selectedProduct.price?.amount)}</p></div>
            <button type="button" onClick={() => { setProductId(""); setProductQuery(""); }}>Cambiar</button>
          </div>}

          <div className="advisor-sale-plan" role="group" aria-label="Forma de pago">
            {availablePlans.map((value) => <button key={value} type="button" aria-pressed={plan === value} onClick={() => setPlan(value)}>
              {value === 0 ? "Contado" : activeMode === "PROTECTED" ? `Plan ${value}` : `${value} cuotas`}
            </button>)}
          </div>

          <div className="advisor-sale-quote" aria-live="polite">
            <div><small>{quote ? "TOTAL OFICIAL" : "TOTAL ESTIMADO"}</small><strong>{money(saleTotal)}</strong></div>
            {plan > 0 && <div><small>{quote && activeMode === "PROTECTED" ? "PAGO POSTERIOR" : "CADA CUOTA"}</small><strong>{money(installmentAmount)}</strong></div>}
            {quote && <div><small>INICIAL</small><strong>{money(quote.initialPayment)}</strong></div>}
            {plan > 0 && !quote && !selectedFinancing && <p>Prepará la cotización oficial para ver el importe validado.</p>}
          </div>

          {quote && (
            <div className="crm-notes">
              <small>COTIZACIÓN AUTORIZADA</small>
              <p>
                {quote.financingMode === "PROTECTED" ? "Plan Protegido" : "Clásica"} · Contado {money(quote.cashPrice)} · vence {new Date(quote.expiresAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}
          {confirmedSaleId && (
            <div className="crm-empty-state">
              <b>Venta registrada</b>
              <p>ID: {confirmedSaleId}</p>
            </div>
          )}
        </section>
      </div>

      <footer className="advisor-sale-draft__footer">
        <div><LockKeyhole size={17} /><p><strong>Registro seguro.</strong><span>La app calcula en servidor, valida al cliente y guarda una instantánea comercial antes de confirmar.</span></p></div>
        <div className="advisor-sale-draft__actions">
          <button type="button" onClick={copySummary}><ClipboardCopy size={17} /> Copiar resumen</button>
          <button type="button" onClick={prepareQuote} disabled={quoting || registering || connectionState !== "ready" || !selectedProduct}>
            {quoting ? "Cotizando…" : quote ? "Actualizar cotización" : "Preparar cotización"}
          </button>
          <button type="button" onClick={registerSale} disabled={!quote || registering || Boolean(confirmedSaleId)}>
            {registering ? "Registrando…" : confirmedSaleId ? "Venta registrada" : "Registrar venta"}
          </button>
        </div>
      </footer>
    </section>
  );
}
