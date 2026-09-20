import { activeCategories, compatibilityCategories, getActiveSubcategories, getBannerSlots, getPlannedSubcategories } from "../../../lib/catalog/categories";
import { adminCategoryManagementContract, getAdminCategoryOverview } from "../../../lib/internal/admin/category-management";

export function AdminCategoryManager() {
  const overview = getAdminCategoryOverview();
  const slots = getBannerSlots();
  return (
    <section className="admin-category-manager" aria-label="Arquitectura de categorías">
      <header>
        <div><small>CATEGORÍAS V16</small><h2>Arquitectura preparada para catálogo grande</h2><p>Administrá sectores y banners sin convertir “Otros” en una lista interminable.</p></div>
        <div><strong>{overview.categoryCount}</strong><span>universos</span><strong>{overview.subcategoryCount}</strong><span>sectores</span></div>
      </header>
      <div className="admin-category-manager-grid">
        {activeCategories.map((category) => {
          const activeSubcategories = getActiveSubcategories(category);
          const plannedSubcategories = getPlannedSubcategories(category);
          return <article key={category.slug}>
            <div className="admin-category-manager-title"><span>{category.icon}</span><div><strong>{category.title}</strong><small>{activeSubcategories.length} sectores activos · {category.imageStatus === "ready" ? "banner listo" : "imagen pendiente"}</small></div></div>
            {activeSubcategories.length > 0 && <div className="admin-category-manager-subs">{activeSubcategories.map((subcategory) => <span key={subcategory.slug}>{subcategory.title}</span>)}</div>}
            {plannedSubcategories.length > 0 && <div className="admin-category-manager-planned"><small>Preparado:</small>{plannedSubcategories.map((subcategory) => <span key={subcategory.slug}>{subcategory.title}</span>)}</div>}
          </article>;
        })}
      </div>
      <footer><span>{slots.filter((slot) => slot.imageStatus === "awaiting-image").length} imágenes reemplazables pendientes · {compatibilityCategories.length} rutas V16 preservadas</span><b>{adminCategoryManagementContract.minimumCatalogScale.toLocaleString("es-AR")}+ productos</b></footer>
    </section>
  );
}
