"use client";

import { ArrowUpRight, ChevronDown, Heart, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { buildCatalogSuggestions, normalizeCatalogText, rankProductsForSearch, suggestCatalogCorrection } from "@/lib/catalog/search";
import {
  getFavoritesServerSnapshot,
  getFavoritesSnapshot,
  parseFavoritesSnapshot,
  subscribeFavorites,
} from "@/lib/commerce/favorites-store";
import { ProductCard } from "./product-card";
import { ProductComparison } from "./product-comparison";
import {
  clearCompareIds,
  compareLimit,
  getCompareServerSnapshot,
  getCompareSnapshot,
  parseCompareSnapshot,
  setCompareIds,
  subscribeCompare,
} from "@/lib/commerce/compare-store";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { BrandCampaignBanner, hasCompleteBrandCampaign } from "./brand-campaign-banner";

const brandProfiles = {
  Todos: {
    eyebrow: "SELECCIÓN AMARANGO",
    title: "Todo el catálogo. Una experiencia clara.",
    description: "Buscá, filtrá y compará sin recorrer pantallas innecesarias.",
    badges: ["Catálogo curado", "Compra acompañada"],
  },
  Apple: {
    eyebrow: "APPLE / IPHONE",
    title: "Diseño, precisión y ecosistema.",
    description: "Una experiencia limpia para explorar iPhone.",
    badges: ["iPhone", "Experiencia Apple"],
  },
  Samsung: {
    eyebrow: "SAMSUNG GALAXY",
    title: "Innovación Galaxy, bien ordenada.",
    description: "Modelos Samsung en una experiencia directa y reconocible.",
    badges: ["Galaxy", "Samsung Experience"],
  },
  Motorola: {
    eyebrow: "MOTOROLA",
    title: "Fluidez para todos los días.",
    description: "La familia Motorola con una navegación simple y confiable.",
    badges: ["hello moto", "Motorola"],
  },
  Xiaomi: {
    eyebrow: "XIAOMI / REDMI",
    title: "Tecnología con identidad Xiaomi.",
    description: "Líneas Xiaomi y Redmi organizadas para comparar rápido.",
    badges: ["Xiaomi", "Redmi"],
  },
  Infinix: {
    eyebrow: "INFINIX",
    title: "Energía y rendimiento Infinix.",
    description: "Diseño y potencia en una experiencia propia.",
    badges: ["Infinix", "Performance"],
  },
} as const;

interface CatalogClientProps {
  adminOverlay?: { enabled: boolean; onQuickActions: (product: Product) => void };
  products: Product[];
  initialBrand?: string;
  initialSearch?: string;
  initialSort?: "recommended" | "brand" | "name" | "price-asc" | "price-desc";
  initialFavoritesOnly?: boolean;
  initialCategory?: string;
  initialMaxPrice?: number | null;
  initialAvailableOnly?: boolean;
  categoryTitle?: string;
  showCategoryFilter?: boolean;
  compactBrandMode?: boolean;
}

export function CatalogClient({
  products,
  adminOverlay,
  initialBrand = "Todos",
  initialSearch = "",
  initialSort = "recommended",
  initialFavoritesOnly = false,
  initialCategory = "Todas",
  initialMaxPrice = null,
  initialAvailableOnly = false,
  categoryTitle = "Celulares",
  showCategoryFilter = false,
  compactBrandMode = false,
}: CatalogClientProps) {
  const brands = useMemo(() => ["Todos", ...new Set(products.map((product) => product.brand))], [products]);
  const categoryOptions = useMemo(() => ["Todas", ...new Set(products.map((product) => product.category))], [products]);
  const [brand, setBrand] = useState(() => brands.includes(initialBrand) ? initialBrand : "Todos");
  const [category, setCategory] = useState(() => categoryOptions.includes(initialCategory) ? initialCategory : "Todas");
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const [maxPrice, setMaxPrice] = useState(() => initialMaxPrice ? String(initialMaxPrice) : "");
  const [availableOnly, setAvailableOnly] = useState(initialAvailableOnly);
  const [filtersOpen, setFiltersOpen] = useState(() => Boolean(initialFavoritesOnly || initialMaxPrice || initialAvailableOnly || initialSort !== "recommended" || initialCategory !== "Todas"));
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(search);
  const deferredBrand = useDeferredValue(brand);
  const deferredCategory = useDeferredValue(category);
  const deferredSort = useDeferredValue(sort);
  const deferredFavoritesOnly = useDeferredValue(favoritesOnly);
  const deferredMaxPrice = useDeferredValue(maxPrice);
  const deferredAvailableOnly = useDeferredValue(availableOnly);
  const favoritesSnapshot = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesServerSnapshot);
  const favoriteIds = useMemo(() => parseFavoritesSnapshot(favoritesSnapshot), [favoritesSnapshot]);
  const compareSnapshot = useSyncExternalStore(subscribeCompare, getCompareSnapshot, getCompareServerSnapshot);
  const compareIds = useMemo(() => parseCompareSnapshot(compareSnapshot), [compareSnapshot]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const comparedProducts = useMemo(
    () => compareIds.map((id) => productById.get(id)).filter((product): product is Product => Boolean(product)),
    [compareIds, productById],
  );

  const suggestions = useMemo(() => buildCatalogSuggestions(products, search), [products, search]);

  const filtered = useMemo(() => {
    const candidates = products.filter((product) => {
      const brandMatches = deferredBrand === "Todos" || product.brand === deferredBrand;
      const categoryMatches = deferredCategory === "Todas" || product.category === deferredCategory;
      const favoriteMatches = !deferredFavoritesOnly || favoriteIds.has(product.id);
      const availableMatches = !deferredAvailableOnly || product.stock.status === "in_stock";
      const parsedMaxPrice = Number(deferredMaxPrice);
      const priceMatches = !deferredMaxPrice || (Number.isFinite(parsedMaxPrice) && product.price !== null && product.price.amount <= parsedMaxPrice);
      return brandMatches && categoryMatches && favoriteMatches && availableMatches && priceMatches;
    });
    const result = rankProductsForSearch(candidates, deferredSearch.trim());
    if (deferredSort === "brand") return [...result].sort((a, b) => a.brand.localeCompare(b.brand, "es"));
    if (deferredSort === "name") return [...result].sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (deferredSort === "price-asc") return [...result].sort((a, b) => (a.price?.amount ?? Number.POSITIVE_INFINITY) - (b.price?.amount ?? Number.POSITIVE_INFINITY));
    if (deferredSort === "price-desc") return [...result].sort((a, b) => (b.price?.amount ?? Number.NEGATIVE_INFINITY) - (a.price?.amount ?? Number.NEGATIVE_INFINITY));
    return result;
  }, [deferredAvailableOnly, deferredBrand, deferredCategory, deferredFavoritesOnly, deferredMaxPrice, deferredSearch, deferredSort, favoriteIds, products]);

  const correction = useMemo(
    () => (filtered.length === 0 && deferredSearch.trim() ? suggestCatalogCorrection(products, deferredSearch) : null),
    [deferredSearch, filtered.length, products],
  );

  useEffect(() => {
    const validIds = compareIds.filter((id) => productById.has(id));
    if (validIds.length !== compareIds.length) setCompareIds(validIds);
  }, [compareIds, productById]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (deferredBrand !== "Todos") params.set("marca", deferredBrand); else params.delete("marca");
    if (showCategoryFilter && deferredCategory !== "Todas") params.set("categoria", deferredCategory); else params.delete("categoria");
    if (deferredSearch.trim()) params.set("q", deferredSearch.trim()); else params.delete("q");
    if (deferredSort !== "recommended") params.set("orden", deferredSort); else params.delete("orden");
    if (deferredFavoritesOnly) params.set("favoritos", "1"); else params.delete("favoritos");
    if (deferredMaxPrice) params.set("precioMax", deferredMaxPrice); else params.delete("precioMax");
    if (deferredAvailableOnly) params.set("disponible", "1"); else params.delete("disponible");
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || "#catalogo"}`;
    window.history.replaceState({}, "", next);
  }, [deferredAvailableOnly, deferredBrand, deferredCategory, deferredFavoritesOnly, deferredMaxPrice, deferredSearch, deferredSort, showCategoryFilter]);

  const profile = categoryTitle === "Celulares"
    ? brandProfiles[brand as keyof typeof brandProfiles] ?? brandProfiles.Todos
    : {
        eyebrow: "CATÁLOGO",
        title: brand === "Todos" ? "Buscá sin duplicar catálogos." : `Explorá ${brand}.`,
        description: "Un solo catálogo, siempre actualizado, para encontrar lo que buscás sin vueltas.",
        badges: ["Información clara", "Catálogo curado", "Sin duplicados"],
      };
  const activeFilterCount = Number(brand !== "Todos") + Number(category !== "Todas") + Number(Boolean(search.trim())) + Number(sort !== "recommended") + Number(favoritesOnly) + Number(Boolean(maxPrice)) + Number(availableOnly);
  const catalogUpdating = deferredSearch !== search || deferredBrand !== brand || deferredCategory !== category || deferredSort !== sort || deferredFavoritesOnly !== favoritesOnly || deferredMaxPrice !== maxPrice || deferredAvailableOnly !== availableOnly;
  const hasBrandCampaign = brand !== "Todos" && hasCompleteBrandCampaign(brand);

  function clearFilters() {
    setBrand("Todos");
    setCategory("Todas");
    setSearch("");
    setSort("recommended");
    setFavoritesOnly(false);
    setMaxPrice("");
    setAvailableOnly(false);
    setSearchOpen(false);
  }

  function commitSearch(value: string) {
    setSearch(value);
    setSearchOpen(false);
    setActiveSuggestion(-1);
    playSonicCue("navigate");
    searchInputRef.current?.focus();
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      commitSearch(suggestions[activeSuggestion].query);
      return;
    }
    if (!search.trim()) return;
    setSearchOpen(false);
    playSonicCue("tap");
  }

  function removeComparedProduct(productId: string) {
    setCompareIds(compareIds.filter((id) => id !== productId));
    playSonicCue("tap");
  }

  function toggleComparedProduct(product: Product) {
    if (compareIds.includes(product.id)) {
      removeComparedProduct(product.id);
      return;
    }
    const category = comparedProducts[0]?.category;
    if (category && category !== product.category) {
      toast.info("Compará productos de la misma categoría para que las diferencias sean útiles.");
      return;
    }
    if (comparedProducts.length >= compareLimit) {
      toast.info("Podés comparar hasta 3 productos a la vez.");
      return;
    }
    setCompareIds([...compareIds, product.id]);
    playSonicCue("compare");
    toast.success(comparedProducts.length === 0 ? "Producto listo para comparar" : "Producto agregado a la comparación");
  }

  function navigateSuggestions(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveSuggestion(-1);
      return;
    }
    if (!suggestions.length || (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter")) return;

    if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      commitSearch(suggestions[activeSuggestion].query);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveSuggestion((current) => {
        if (event.key === "ArrowDown") return current >= suggestions.length - 1 ? 0 : current + 1;
        return current <= 0 ? suggestions.length - 1 : current - 1;
      });
    }
  }

  return (
    <section className={`catalog-section${hasBrandCampaign ? " has-brand-campaign" : ""}${compactBrandMode ? " is-compact-brand" : ""}`} aria-label={`Catálogo ${brand === "Todos" ? "AmarangoElectro" : brand}`}>
      {hasBrandCampaign ? <BrandCampaignBanner brand={brand} /> : null}

      {!hasBrandCampaign && <div className={`catalog-brand-stage ${brand === "Todos" ? "stage-all" : `stage-${normalizeCatalogText(brand)}`}`}>
        <div className="catalog-brand-stage-copy">
          <p className="eyebrow orange">{profile.eyebrow}</p>
          <h2>{profile.title}</h2>
          <p>{profile.description}</p>
          <div className="catalog-profile-tags">
            {profile.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
        <div className="catalog-stage-panel">
          <small>TU BÚSQUEDA</small>
          <div className="catalog-stage-stat"><span>Marca</span><strong>{brand}</strong></div>
          <div className="catalog-stage-stat"><span>Resultados</span><strong>{filtered.length}</strong></div>
        </div>
      </div>}

      {!compactBrandMode ? <div className="catalog-quick-brands" aria-label="Cambiar experiencia de marca">
        {brands.map((item) => (
          <button
            key={item}
            type="button"
            className={brand === item ? "active" : ""}
            aria-pressed={brand === item}
            onClick={() => { playSonicCue("filter"); setBrand(item); }}
          >
            <small>{item === "Todos" ? "VER TODO" : "MARCA"}</small>
            <strong>{item}</strong>
          </button>
        ))}
      </div> : null}

      <div className={`catalog-toolbar-shell ${filtersOpen ? "filters-open" : ""}`}>
        <div className="catalog-toolbar">
          <div
            className="catalog-search-wrap"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchOpen(false);
            }}
          >
            <form className={`catalog-search ${searchOpen ? "open" : ""}`} role="search" onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Buscar productos</span>
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActiveSuggestion(-1);
                setSearchOpen(Boolean(event.target.value.trim()));
              }}
              onFocus={() => setSearchOpen(Boolean(search.trim()))}
              onKeyDown={navigateSuggestions}
              type="search"
              placeholder="Buscar marca, modelo o característica…"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="catalog-search-suggestions"
              aria-expanded={searchOpen}
              aria-activedescendant={activeSuggestion >= 0 ? `catalog-suggestion-${activeSuggestion}` : undefined}
            />
            <button type="submit" className="catalog-search-submit" aria-label="Buscar">
              <ArrowUpRight size={17} aria-hidden="true" />
              <span>Buscar</span>
            </button>
            </form>
            {searchOpen && search.trim() && (
              <div id="catalog-search-suggestions" className="catalog-search-suggestions">
              <div className="catalog-search-suggestions-title">
                <Sparkles size={14} aria-hidden="true" />
                <span>Sugerencias del catálogo</span>
              </div>
              {suggestions.length ? (
                <div className="catalog-search-suggestion-list" role="listbox" aria-label="Sugerencias de búsqueda">
                  {suggestions.map((suggestion, index) => (
                    <button
                      id={`catalog-suggestion-${index}`}
                      key={suggestion.id}
                      type="button"
                      role="option"
                      aria-selected={activeSuggestion === index}
                      className={activeSuggestion === index ? "active" : ""}
                      onPointerEnter={() => setActiveSuggestion(index)}
                      onClick={() => commitSearch(suggestion.query)}
                    >
                      <span>
                        <small>{suggestion.kind === "correction" ? suggestion.meta : suggestion.kind === "brand" ? "MARCA" : suggestion.meta}</small>
                        <strong>{suggestion.label}</strong>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="catalog-search-suggestion-empty">No hay sugerencias directas. Podés buscar el término tal como lo escribiste.</div>
              )}
              <button type="button" className="catalog-search-exact" onClick={() => commitSearch(search.trim())}>
                Buscar “{search.trim()}”
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="catalog-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="catalog-advanced-filters"
            onClick={() => { playSonicCue("filter"); setFiltersOpen((value) => !value); }}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span>Filtros</span>
            {activeFilterCount > 0 ? <strong>{activeFilterCount}</strong> : null}
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>
        <div id="catalog-advanced-filters" className="catalog-advanced-filters" hidden={!filtersOpen}>
          {showCategoryFilter && <div className="brand-filters catalog-category-filters" aria-label="Filtrar por categoría">
            {categoryOptions.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => { playSonicCue("filter"); setCategory(item); }}>{item === "Todas" ? "Todas las categorías" : item.replace(/-/g, " ")}</button>)}
          </div>}
          <label className="catalog-price-filter">
            <span>Precio máximo</span>
            <input inputMode="numeric" type="number" min="0" step="1000" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/[^\d]/g, ""))} placeholder="Sin límite" />
          </label>
          <button type="button" className={`catalog-availability-filter ${availableOnly ? "active" : ""}`} aria-pressed={availableOnly} onClick={() => { playSonicCue("filter"); setAvailableOnly((value) => !value); }}>Stock confirmado</button>
          <button
            type="button"
            className={`catalog-favorites-filter ${favoritesOnly ? "active" : ""}`}
            aria-pressed={favoritesOnly}
            onClick={() => { playSonicCue("filter"); setFavoritesOnly((value) => !value); }}
          >
            <Heart size={17} fill={favoritesOnly ? "currentColor" : "none"} />
            Favoritos ({favoriteIds.size})
          </button>
          <label className="catalog-sort">
            <span className="sr-only">Ordenar productos</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="recommended">Recomendados</option>
              <option value="brand">Marca A–Z</option>
              <option value="name">Nombre A–Z</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
          </label>
        </div>
      </div>

      {activeFilterCount > 0 && <div className="catalog-active-filters" aria-live="polite">
        <div>
          <SlidersHorizontal size={16} aria-hidden="true" />
          <strong>{activeFilterCount}</strong>
          <span>{activeFilterCount === 1 ? "filtro activo" : "filtros activos"}</span>
        </div>
        <div className="catalog-active-tags">
          {brand !== "Todos" && <span>Marca: {brand}</span>}
          {category !== "Todas" && <span>Categoría: {category.replace(/-/g, " ")}</span>}
          {search.trim() && <span>Búsqueda: {search.trim()}</span>}
          {sort !== "recommended" && <span>Orden: {sort === "brand" ? "Marca A–Z" : sort === "name" ? "Nombre A–Z" : sort === "price-asc" ? "Menor precio" : "Mayor precio"}</span>}
          {favoritesOnly && <span>Solo favoritos</span>}
          {maxPrice && <span>Hasta ${Number(maxPrice).toLocaleString("es-AR")}</span>}
          {availableOnly && <span>Stock confirmado</span>}
        </div>
        {activeFilterCount > 0 && (
          <button type="button" className="catalog-clear" onClick={() => { playSonicCue("tap"); clearFilters(); }}>
            <X size={16} aria-hidden="true" />
            Limpiar
          </button>
        )}
      </div>}

      <div className="catalog-heading">
        <div><p className="eyebrow orange">CATÁLOGO</p><h2 id="catalog-title">Explorá {categoryTitle.toLowerCase()}.</h2></div>
        <p>Los datos que todavía no confirmamos se muestran como pendientes — nunca los inventamos.</p>
      </div>
      <div className="catalog-count" aria-live="polite">
        <span>{filtered.length} {filtered.length === 1 ? "opción" : "opciones"} para explorar</span>
        {catalogUpdating && <small className="catalog-refresh-indicator">Actualizando…</small>}
      </div>
      {filtered.length ? (
        <div className={`catalog-grid ${catalogUpdating ? "is-updating" : ""} ${filtered.length <= 2 ? "sparse-results" : ""}`} aria-busy={catalogUpdating}>{filtered.map((product) => {
          const customerCard = (
            <ProductCard
              key={product.id}
              product={product}
              isCompared={compareIds.includes(product.id)}
              compareDisabled={!compareIds.includes(product.id) && comparedProducts.length >= compareLimit}
              onCompareToggle={toggleComparedProduct}
              visualContext={brand === "Todos" ? (showCategoryFilter ? "amarango" : "sector") : "brand"}
            />
          );
          if (!adminOverlay?.enabled) return customerCard;
          return (
            <div key={product.id} className="v418b-storefront-card-shell" data-v418b-admin-control="true">
              {customerCard}
              <button type="button" className="v418b-storefront-quick-action" onClick={() => adminOverlay.onQuickActions(product)}>
                <span aria-hidden="true">⚡</span><strong>Acciones rápidas</strong><small>Vista de revisión</small>
              </button>
            </div>
          );
        })}</div>
      ) : (
        <div className="catalog-empty" role="status" aria-live="polite">
          <strong>No encontramos coincidencias.</strong>
          <span>{favoritesOnly ? "Todavía no guardaste productos que coincidan con estos filtros." : "Probá otra marca o una búsqueda más general."}</span>
          {correction && !favoritesOnly && (
            <button type="button" className="catalog-correction" onClick={() => commitSearch(correction)}>
              ¿Quisiste decir <b>{correction}</b>?
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          )}
          {activeFilterCount > 0 && (
            <button type="button" className="catalog-empty-reset" onClick={() => { playSonicCue("tap"); clearFilters(); }}>
              Ver todo el catálogo
            </button>
          )}
        </div>
      )}
      <ProductComparison
        products={comparedProducts}
        onRemove={removeComparedProduct}
        onClear={() => { clearCompareIds(); playSonicCue("tap"); }}
      />
      <aside className="catalog-finance-band">
        <div><p className="eyebrow orange">FINANCIACIÓN CON CLARIDAD</p><h3>Elegí el equipo.<br />Nosotros te explicamos las opciones.</h3><p>La financiación acompaña la experiencia sin dominarla. Las cuotas reales aparecerán únicamente cuando estén validadas.</p></div>
        <div className="finance-benefits"><span>Créditos con mínimos requisitos</span><span>Atención personalizada</span><span>Consulta sin presión</span></div>
      </aside>
    </section>
  );
}
