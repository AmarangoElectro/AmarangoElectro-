interface StoreLoadingShellProps {
  variant?: "store" | "category" | "product";
}

export function StoreLoadingShell({ variant = "store" }: StoreLoadingShellProps) {
  if (variant === "product") {
    return (
      <main className="route-skeleton route-skeleton-product" aria-busy="true" aria-label="Cargando ficha de producto">
        <div className="route-skeleton-header skeleton-surface" />
        <div className="route-skeleton-breadcrumb skeleton-line short" />
        <section className="route-skeleton-product-shell">
          <div className="route-skeleton-product-media skeleton-surface" />
          <div className="route-skeleton-product-copy">
            <div className="skeleton-line micro" />
            <div className="skeleton-line title" />
            <div className="skeleton-line title medium" />
            <div className="skeleton-line paragraph" />
            <div className="skeleton-line paragraph medium" />
            <div className="route-skeleton-data-grid">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-surface" />)}
            </div>
            <div className="route-skeleton-cta skeleton-surface" />
          </div>
        </section>
      </main>
    );
  }

  if (variant === "category") {
    return (
      <main className="route-skeleton route-skeleton-category" aria-busy="true" aria-label="Cargando categoría">
        <div className="route-skeleton-header skeleton-surface" />
        <section className="route-skeleton-category-hero skeleton-surface">
          <div className="route-skeleton-hero-copy">
            <div className="skeleton-line micro" />
            <div className="skeleton-line display" />
            <div className="skeleton-line paragraph medium" />
          </div>
        </section>
        <section className="route-skeleton-catalog">
          <div className="skeleton-line title medium" />
          <div className="route-skeleton-toolbar skeleton-surface" />
          <div className="route-skeleton-card-grid">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="route-skeleton-card skeleton-surface" />)}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="route-skeleton route-skeleton-store" aria-busy="true" aria-label="Cargando AmarangoElectro">
      <div className="route-skeleton-header skeleton-surface" />
      <section className="route-skeleton-home-hero skeleton-surface">
        <div className="route-skeleton-hero-copy">
          <div className="skeleton-line micro" />
          <div className="skeleton-line display" />
          <div className="skeleton-line display medium" />
          <div className="skeleton-line paragraph" />
          <div className="route-skeleton-actions"><span className="skeleton-surface" /><span className="skeleton-surface" /></div>
        </div>
      </section>
    </main>
  );
}
