"use client";

import { ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import Link from "./store-link";

type ExplorerCategory = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: string;
  subcategories: Array<{ title: string }>;
};

interface Props {
  categories: ExplorerCategory[];
}

const groups = [
  { id: "all", label: "Todos los sectores", slugs: [] },
  { id: "home", label: "Casa y bienestar", slugs: ["electrodomesticos", "hogar", "descanso", "cuidado-personal-salud", "bebes-juguetes"] },
  { id: "technology", label: "Tecnología y entretenimiento", slugs: ["tecnologia-accesorios", "gaming"] },
  { id: "projects", label: "Proyectos y aire libre", slugs: ["herramientas", "auto-motos-energia", "camping-aire-libre-mascotas"] },
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function ProgressiveCategoryExplorer({ categories }: Props) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof groups)[number]["id"]>("all");
  const [expanded, setExpanded] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const selected = groups.find((item) => item.id === group) ?? groups[0];
    const needle = normalize(deferredQuery.trim());
    return categories.filter((category) => {
      const groupMatches = selected.id === "all" || (selected.slugs as readonly string[]).includes(category.slug);
      if (!groupMatches) return false;
      if (!needle) return true;
      const haystack = normalize([
        category.title,
        category.eyebrow,
        category.description,
        ...category.subcategories.map((subcategory) => subcategory.title),
      ].join(" "));
      return haystack.includes(needle);
    });
  }, [categories, deferredQuery, group]);

  const visible = deferredQuery.trim() || group !== "all" || expanded ? filtered : filtered.slice(0, 4);

  function reset() {
    setQuery("");
    setGroup("all");
    setExpanded(false);
  }

  return (
    <section className="progressive-explorer" aria-labelledby="progressive-explorer-title">
      <div className="progressive-explorer-heading">
        <div>
          <p className="eyebrow orange">EXPLORACIÓN PROGRESIVA</p>
          <h2 id="progressive-explorer-title">Buscá primero. Explorá después.</h2>
        </div>
        <p>Este sector evita listas interminables: te acerca al universo correcto y queda preparado para escalar con el catálogo auditado.</p>
      </div>

      <div className="progressive-explorer-controls">
        <label className="progressive-explorer-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar un sector</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej.: colchones, cargadores, gaming…"
            autoComplete="off"
          />
          {query && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}><X size={16} /></button>}
        </label>
        <div className="progressive-explorer-filters" aria-label="Filtrar sectores">
          <SlidersHorizontal size={16} aria-hidden="true" />
          {groups.map((item) => (
            <button
              key={item.id}
              type="button"
              className={group === item.id ? "active" : ""}
              aria-pressed={group === item.id}
              onClick={() => { setGroup(item.id); setExpanded(true); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="progressive-explorer-status" aria-live="polite">
        <strong>{filtered.length}</strong>
        <span>{filtered.length === 1 ? "sector disponible" : "sectores disponibles"}</span>
      </div>

      {visible.length ? (
        <div className="progressive-explorer-grid">
          {visible.map((category) => (
            <Link key={category.slug} href={`/categoria/${category.slug}`} className="progressive-explorer-card">
              <span className={`progressive-explorer-icon category-placeholder-${category.slug}`} aria-hidden="true">{category.icon}</span>
              <span className="progressive-explorer-copy">
                <small>{category.eyebrow}</small>
                <strong>{category.title}</strong>
                <span>{category.subcategories.length ? category.subcategories.map((item) => item.title).join(" · ") : category.description}</span>
              </span>
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="progressive-explorer-empty">
          <strong>No encontramos un sector con ese nombre.</strong>
          <span>Probá con una palabra más general o volvé a ver todas las categorías.</span>
          <button type="button" onClick={reset}>Ver todos los sectores</button>
        </div>
      )}

      {!deferredQuery.trim() && group === "all" && filtered.length > 4 && (
        <button type="button" className="progressive-explorer-more" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Mostrar menos" : `Ver los ${filtered.length} sectores`}
        </button>
      )}
    </section>
  );
}
