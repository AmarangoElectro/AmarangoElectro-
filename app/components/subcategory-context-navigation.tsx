import type { SubcategoryContextItem } from "@/lib/navigation/subcategory-context";

export function SubcategoryContextNavigation({
  categoryTitle,
  items,
}: {
  categoryTitle: string;
  items: readonly SubcategoryContextItem[];
}) {
  if (items.length === 0) return null;

  return (
    <nav className="subcategory-context" aria-label={`Explorar ${categoryTitle}`} data-v417-subcategory-context>
      <div className="subcategory-context-heading">
        <small>ESTÁS EN {categoryTitle.toUpperCase()}</small>
        <span>{items.length - 1} opciones</span>
      </div>
      <div className="subcategory-context-track" data-v417-local-scroll>
        {items.map((item) => (
          <a
            key={item.slug}
            className={item.selected ? "is-selected" : undefined}
            href={item.href}
            aria-current={item.selected ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.title}</strong>
          </a>
        ))}
      </div>
    </nav>
  );
}
