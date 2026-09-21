"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, ClipboardPaste, LockKeyhole, Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog/types";
import { normalizeCatalogText } from "@/lib/catalog/search";

type PaymentPlan = 0 | 2 | 4 | 6;

function money(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? `$${Math.round(value).toLocaleString("es-AR")}`
    : "A confirmar";
}

function cleanNumber(value: string) {
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function AdvisorSaleDraftPanel({ products }: { products: readonly Product[] }) {
  const [productQuery, setProductQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [plan, setPlan] = useState<PaymentPlan>(0);
  const [deposit, setDeposit] = useState("");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [activity, setActivity] = useState("");

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

  const selectedFinancing = useMemo(
    () => plan === 0 ? null : selectedProduct?.financing.find((option) => option.installments === plan) ?? null,
    [plan, selectedProduct],
  );

  const saleTotal = plan === 0
    ? selectedProduct?.price?.amount ?? null
    : selectedFinancing?.totalAmount?.amount ?? null;
  const installmentAmount = plan === 0 ? null : selectedFinancing?.installmentAmount?.amount ?? null;
  const depositAmount = cleanNumber(deposit);
  const balance = saleTotal !== null ? Math.max(0, saleTotal - depositAmount) : null;
  const financed = plan > 0;

  function selectProduct(product: Product) {
    setProductId(product.id);
    setProductQuery(product.name);
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

  async function copySummary() {
    if (!clientName.trim()) {
      toast.error("Falta el nombre del cliente.");
      return;
    }
    if (phone.replace(/\D+/g, "").length < 8) {
      toast.error("Ingresá un WhatsApp válido.");
      return;
    }
    if (!selectedProduct) {
      toast.error("Elegí un producto del catálogo.");
      return;
    }
    if (!address.trim() || !locality.trim()) {
      toast.error("Completá dirección y localidad.");
      return;
    }
    if (financed && (!dni.trim() || !activity.trim())) {
      toast.error("Para cuotas completá DNI y actividad.");
      return;
    }

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
      `Forma de pago: ${plan === 0 ? "Contado" : `${plan} cuotas`}`,
      `Total: ${money(saleTotal)}`,
      plan > 0 ? `Valor por cuota: ${money(installmentAmount)}` : "",
      depositAmount > 0 ? `Seña / entrega: ${money(depositAmount)}` : "",
      depositAmount > 0 ? `Saldo estimado: ${money(balance)}` : "",
      "",
      "Estado: preparado para confirmación de Administración.",
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
          <h2 id="advisor-sale-draft-title">Prepará la operación completa.</h2>
          <p>Podés reunir cliente, producto, forma de pago y seña sin ver costos ni información privada.</p>
        </div>
        <span className="advisor-sale-draft__safe"><LockKeyhole size={16} /> Registro seguro pendiente</span>
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
            <div><small>PRODUCTO SELECCIONADO</small><strong>{selectedProduct.name}</strong><p>{selectedProduct.brand} · Contado {money(selectedProduct.price?.amount)}</p></div>
            <button type="button" onClick={() => { setProductId(""); setProductQuery(""); }}>Cambiar</button>
          </div>}

          <div className="advisor-sale-plan" role="group" aria-label="Forma de pago">
            {([0, 2, 4, 6] as const).map((value) => <button key={value} type="button" aria-pressed={plan === value} onClick={() => setPlan(value)}>
              {value === 0 ? "Contado" : `${value} cuotas`}
            </button>)}
          </div>

          <div className="advisor-sale-quote" aria-live="polite">
            <div><small>TOTAL</small><strong>{money(saleTotal)}</strong></div>
            {plan > 0 && <div><small>CADA CUOTA</small><strong>{money(installmentAmount)}</strong></div>}
            {plan > 0 && !selectedFinancing && <p>Este producto todavía no tiene una cuota validada en el catálogo. Administración debe confirmar el importe.</p>}
          </div>

          <label className="advisor-sale-deposit"><span>Seña o entrega</span><div><b>$</b><input value={deposit} onChange={(event) => setDeposit(event.target.value)} inputMode="numeric" placeholder="Opcional" /></div></label>
          {depositAmount > 0 && <div className="advisor-sale-balance"><span>Saldo estimado</span><strong>{money(balance)}</strong></div>}
        </section>
      </div>

      <footer className="advisor-sale-draft__footer">
        <div><LockKeyhole size={17} /><p><strong>La venta todavía no se guarda.</strong><span>Falta conectar una confirmación segura para que cada asesor registre sólo sus propias operaciones.</span></p></div>
        <div className="advisor-sale-draft__actions">
          <button type="button" onClick={copySummary}><ClipboardCopy size={17} /> Copiar resumen</button>
          <button type="button" disabled>Registrar venta</button>
        </div>
      </footer>
    </section>
  );
}
