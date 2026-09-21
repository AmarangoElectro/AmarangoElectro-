"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CatalogMatchCandidate } from "@/lib/internal/catalog/provider-offer-matcher";

type Decision = "same" | "different" | "later";

const STORAGE_KEY = "amarango:v16:catalog-match-review:v1";

function money(value: number) {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

export function CatalogMatchReview({ candidates }: { candidates: readonly CatalogMatchCandidate[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDecisions(JSON.parse(raw));
    } catch {}
  }, []);

  function decide(id: string, decision: Decision) {
    setDecisions((current) => {
      const next = { ...current, [id]: decision };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const pending = useMemo(() => candidates.filter((candidate) => !decisions[candidate.id] || decisions[candidate.id] === "later"), [candidates, decisions]);
  const reviewed = candidates.length - pending.length;

  return (
    <main className="catalog-match-review">
      <header className="catalog-match-review__hero">
        <div>
          <p>CATÁLOGO · COINCIDENCIAS</p>
          <h1>Revisión humana de posibles productos iguales</h1>
          <span>La IA sugiere. Maxi/Angie confirman. No se fusiona nada automáticamente.</span>
        </div>
        <div className="catalog-match-review__metrics">
          <strong>{candidates.length}</strong><span>candidatos</span>
          <strong>{reviewed}</strong><span>revisados</span>
          <strong>{pending.length}</strong><span>pendientes</span>
        </div>
      </header>

      <section className="catalog-match-review__list">
        {pending.map((candidate) => {
          const suggestedSide = candidate.suggestedOfferSourceProductId === candidate.left.sourceProductId ? "left" : "right";
          return (
            <article key={candidate.id} className="catalog-match-review__card">
              <header>
                <div>
                  <small>CONFIANZA {candidate.confidence === "high" ? "ALTA" : "MEDIA"} · {Math.round(candidate.score * 100)}%</small>
                  <h2>¿Es el mismo producto?</h2>
                  <p>{candidate.rationale.join(" · ")}</p>
                </div>
                <div className="catalog-match-review__suggestion">
                  <span>Precio sugerido</span>
                  <strong>{money(candidate.suggestedSalePrice)}</strong>
                  <small>{suggestedSide === "left" ? candidate.left.provider : candidate.right.provider}</small>
                </div>
              </header>

              <div className="catalog-match-review__compare">
                {[candidate.left, candidate.right].map((offer) => {
                  const suggested = offer.sourceProductId === candidate.suggestedOfferSourceProductId;
                  return (
                    <section key={offer.sourceProductId} className={suggested ? "is-suggested" : ""}>
                      <div className="catalog-match-review__image">
                        {offer.image ? <Image src={offer.image} alt={offer.name} fill sizes="(max-width: 760px) 100vw, 40vw" unoptimized /> : <span>Sin foto</span>}
                      </div>
                      <div className="catalog-match-review__copy">
                        <small>{offer.provider}</small>
                        <h3>{offer.name}</h3>
                        <strong>{money(offer.salePrice)}</strong>
                        <p>Código: {offer.supplierCode ?? "sin código"}</p>
                        <p>{offer.availability === "available" ? "Disponible" : "Sin stock"}</p>
                        {suggested && <b>OFERTA SUGERIDA</b>}
                      </div>
                    </section>
                  );
                })}
              </div>

              <footer>
                <button type="button" onClick={() => decide(candidate.id, "same")}>Sí, es el mismo producto</button>
                <button type="button" onClick={() => decide(candidate.id, "different")}>No, son distintos</button>
                <button type="button" onClick={() => decide(candidate.id, "later")}>Revisar después</button>
              </footer>
            </article>
          );
        })}
        {pending.length === 0 && <div className="catalog-match-review__empty">No quedan coincidencias pendientes en este dispositivo.</div>}
      </section>
    </main>
  );
}
