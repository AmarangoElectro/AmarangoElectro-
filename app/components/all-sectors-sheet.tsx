"use client";

import { ArrowRight, ChevronDown, LayoutGrid, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "./store-link";
import { retailCategories } from "@/lib/catalog/retail-categories";
import { closeSectorsSheet, isSectorsSheetOpen, subscribeSectorsSheet } from "@/lib/ux/sectors-sheet";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

export function AllSectorsSheet() {
  const [open, setOpen] = useState(false);
  const [openSectorId, setOpenSectorId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const next = isSectorsSheetOpen();
      setOpen(next);
      if (!next) {
        setOpenSectorId(null);
      }
    };
    sync();
    return subscribeSectorsSheet(sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSectorsSheet();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className={`sectors-sheet-layer ${open ? "open" : ""}`} aria-hidden={!open}>
      <button className="sectors-sheet-scrim" type="button" tabIndex={open ? 0 : -1} aria-label="Cerrar" onClick={() => closeSectorsSheet()} />
      <aside className="sectors-sheet" aria-label="Todos los sectores" role="dialog" aria-modal="true">
        <header>
          <div>
            <small>{retailCategories.length} SECTORES</small>
            <strong>Todos los sectores</strong>
          </div>
          <button type="button" aria-label="Cerrar" onClick={() => closeSectorsSheet()}><X size={20} /></button>
        </header>
        <div className="sectors-sheet-category-label" aria-label="Categorías disponibles">
          <span><LayoutGrid size={17} aria-hidden="true" /></span>
          <div><small>EXPLORÁ AMARANGO</small><strong>Categorías</strong></div>
          <Sparkles size={17} aria-hidden="true" />
        </div>
        <div className="sectors-sheet-list">
          {retailCategories.map((category) => {
            const expanded = openSectorId === category.id;
            const panelId = `sector-drawer-${category.id}`;
            return (
              <article key={category.id} className={`sectors-sheet-item ${expanded ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="sectors-sheet-row"
                  tabIndex={open ? 0 : -1}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => {
                    playSonicCue("navigate");
                    setOpenSectorId((current) => current === category.id ? null : category.id);
                  }}
                >
                  <span className="sectors-sheet-row-art" aria-hidden="true">
                    <Image src={category.mobileImage} alt="" fill sizes="(max-width: 779px) 100vw, 720px" unoptimized />
                  </span>
                  <span className="sectors-sheet-row-shade" aria-hidden="true" />
                  <span className="sectors-sheet-row-copy">
                    <small className="sectors-sheet-row-category">{category.eyebrow}</small>
                    <strong className="sectors-sheet-row-name">{category.title}</strong>
                  </span>
                  <span className="sectors-sheet-row-toggle" aria-hidden="true"><ChevronDown size={18} strokeWidth={2.4} /></span>
                </button>
                {expanded && (
                  <div className="sectors-sheet-row-panel" id={panelId}>
                    <p>{category.description}</p>
                    <Link
                      href={category.href}
                      tabIndex={open ? 0 : -1}
                      onClick={() => { playSonicCue("navigate"); closeSectorsSheet(); }}
                    >
                      Entrar al sector <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
