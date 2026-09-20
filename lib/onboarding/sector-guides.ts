import type { SectorGuideDefinition } from "./sector-guide-types";

/**
 * V16 FIRST-TIME SECTOR GUIDES — registry.
 *
 * IMPORTANT — SCOPE HONESTY: the gate document lists many suggested sector
 * names per role (Mis Compras, Nueva Venta, Cliente 360, Cobranzas, Caja,
 * Provider Inbox, etc.). Most of those do not exist as real routes or
 * components in this checkpoint. Per the repeated rule of this engagement
 * ("no inventar", smallest additive implementation, no unrelated
 * refactors), this registry only defines guides for sectors that are real,
 * already-implemented pages in this repo:
 *
 * - `asesor:mi-amarango` → `/mi-amarango` (`AdvisorWorkspace`)
 * - `admin:administracion` → `/administracion` (`AdminConsolidatedWorkspace`)
 * - `admin:clientes-crm` → the "Clientes / CRM" tab inside `/administracion`
 *   (`CrmClientsPanel`), added once that tab became a real, contract-backed
 *   surface (V16-CLIENTES-CRM-UI-CONTRACT-INTEGRATION gate)
 *
 * No `cliente` guide is registered: the only Cliente-facing surface in this
 * repo is Home (`/`) and the public catalog routes (`/buscar`,
 * `/categoria/[slug]`, `/producto/[slug]`), and this gate's own Home/public
 * catalog safety rule forbids touching any of them, even additively. Wiring
 * a Cliente guide would require modifying one of those protected surfaces,
 * so it is intentionally left undefined here rather than improvised
 * against a page that isn't allowed to change. The engine (types + store +
 * `<SectorGuide>` component) is fully role-agnostic and ready to receive a
 * `cliente` definition the moment a non-Home, non-public-catalog Cliente
 * sector exists to host it.
 */
export const sectorGuides: readonly SectorGuideDefinition[] = [
  {
    role: "asesor",
    sectorId: "mi-amarango",
    guideVersion: 1,
    title: "Mi Amarango · Asesores",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Todo lo comercial, sin exponer datos privados",
        description: "Acá encontrás el catálogo oficial, seguimiento de clientes y herramientas de atención. Los precios los define Administración — vos nunca ves costos ni márgenes.",
      },
      {
        id: "quick-grid",
        title: "Accesos rápidos",
        target: "advisor-quick-grid",
        description: "Clientes, Cuotas y Nueva Venta quedan a un clic. \"Nueva Venta\" abre el Product Bridge para armar una venta guiada.",
      },
      {
        id: "catalog-search",
        title: "Catálogo maestro",
        target: "advisor-catalog-search",
        description: "Buscá por nombre, modelo o marca. Cada producto te deja compartirlo o abrir su ficha pública tal cual la ve el cliente.",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "administracion",
    guideVersion: 1,
    title: "Administración",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Tu centro de control, siempre en modo seguro",
        description: "Todo lo que ves acá es evidencia local de solo lectura salvo que confirmes explícitamente un cambio. Nada se publica solo por navegar.",
      },
      {
        id: "tabs",
        title: "Módulos administrativos",
        target: "admin-workspace-tabs",
        description: "Catálogo, Tienda Admin, 90 Celulares (Preview), Calculadora, Placas y Ofertas viven cada uno en su propia pestaña.",
      },
      {
        id: "catalog-grid",
        title: "Editar un producto",
        target: "admin-catalog-grid",
        description: "Desde acá podés revisar precio, stock, fotos y visibilidad de cada producto. Esta acción puede requerir confirmación adicional antes de aplicarse.",
      },
      {
        id: "storefront-preview",
        title: "Vista previa de Tienda",
        target: "admin-workspace-tabs",
        description: "La pestaña \"Tienda Admin\" te deja ver el catálogo como lo vería un cliente, con una capa opcional de acciones rápidas — nunca escribe nada real.",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "clientes-crm",
    guideVersion: 1,
    title: "Clientes / CRM",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Solo lectura, siempre",
        description: "Este sector consulta el CRM a través de una conexión segura de solo lectura. Nunca modifica clientes, ventas ni cuotas desde acá.",
      },
      {
        id: "search",
        title: "Buscar un cliente",
        target: "crm-search",
        description: "Buscá por nombre, DNI o teléfono para encontrar la ficha que necesitás.",
      },
      {
        id: "client-list",
        title: "Resultados",
        target: "crm-client-list",
        description: "Cada resultado abre la ficha completa del cliente (Cliente 360) con sus ventas y el estado de sus cuotas.",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "cobranzas",
    guideVersion: 1,
    title: "Cobranzas",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Solo lectura, sin registrar pagos",
        description: "Este sector muestra qué está atrasado, qué vence hoy y qué falta confirmar. No registra pagos ni aplica recargos desde acá.",
      },
      {
        id: "summary",
        title: "Resumen",
        target: "collections-summary",
        description: "Cantidad de ventas atrasadas, que vencen hoy, próximas y con datos incompletos, más el monto pendiente ya conocido.",
      },
      {
        id: "filters",
        title: "Filtros",
        target: "collections-filters",
        description: "Filtrá por Atrasadas, Vencen hoy, Próximas o Datos incompletos.",
      },
      {
        id: "list",
        title: "Detalle por venta",
        target: "collections-list",
        description: "Cada fila te deja abrir la ficha completa del cliente (Cliente 360) desde \"Ver Cliente 360\".",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "reportes",
    guideVersion: 1,
    title: "Reportes",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Solo ventas, sin ganancia ni caja",
        description: "Este sector muestra cantidad e importe de ventas por período — nunca ganancia, margen, comisión, cobrado ni saldo de caja.",
      },
      {
        id: "filters",
        title: "Período",
        target: "reports-filters",
        description: "Filtrá por fecha desde/hasta y decidí si incluir las ventas archivadas.",
      },
      {
        id: "summary",
        title: "Resumen",
        target: "reports-summary",
        description: "Cantidad de ventas por modalidad, precio de venta total, envío y clientes/responsables distintos.",
      },
      {
        id: "by-month",
        title: "Por mes y por responsable",
        target: "reports-by-month",
        description: "Desglose mensual y por responsable de la misma información — sin ranking punitivo, solo lectura.",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "proveedores",
    guideVersion: 1,
    title: "Proveedores",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Seguimiento operativo, no contabilidad",
        description: "Proveedores registra el mapeo canónico y la Bandeja lleva seguimiento de consultas — nunca saldo, deuda ni cuenta corriente de proveedor.",
      },
      {
        id: "nav",
        title: "Proveedores y Bandeja",
        target: "providers-area-nav",
        description: "Dos vistas: el registro canónico de proveedores, y la Bandeja de seguimientos abiertos con cada uno.",
      },
      {
        id: "inbox",
        title: "Bandeja",
        target: "inbox-filters",
        description: "Filtrá por estado, buscá por asunto y abrí \"Nuevo hilo\" para registrar una consulta o seguimiento.",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "caja",
    guideVersion: 1,
    title: "Caja / Movimientos",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Ledger operativo, no saldo bancario",
        description: "Registrá y revisá los movimientos operativos de Caja V16. El neto registrado nunca es saldo bancario, efectivo disponible ni ganancia.",
      },
      {
        id: "summary",
        title: "Resumen",
        target: "cash-summary",
        description: "Entradas registradas, salidas registradas, neto registrado y cantidad de movimientos del período consultado.",
      },
      {
        id: "filters",
        target: "cash-filters",
        title: "Filtros",
        description: "Filtrá por entradas, salidas, tipo de movimiento, período y buscá por referencia.",
      },
      {
        id: "list",
        title: "Movimientos",
        target: "cash-list",
        description: "Cada movimiento puede revertirse con un motivo obligatorio — nunca se borra el original.",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "entregas",
    guideVersion: 1,
    title: "Entregas",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Ciclo de vida canónico, por venta",
        description: "Cada entrega sigue su propio ciclo de vida V16 — nunca se infiere ni se escribe desde el estado de la venta.",
      },
      {
        id: "filters",
        title: "Filtros",
        target: "deliveries-filters",
        description: "Filtrá por Pendientes, Coordinadas, En camino, Entregadas o Canceladas.",
      },
      {
        id: "list",
        title: "Entregas",
        target: "deliveries-list",
        description: "Abrí una entrega para coordinarla, marcarla en camino, entregarla o cancelarla — según lo que el backend permita desde su estado actual.",
      },
    ],
  },
  {
    role: "admin",
    sectorId: "asesores",
    guideVersion: 1,
    title: "Asesores",
    intro: "Te mostramos este sector en 30 segundos.",
    steps: [
      {
        id: "welcome",
        title: "Cartera canónica, nunca por responsable",
        description: "La cartera de cada asesor viene siempre de la fuente canónica V16 — nunca se infiere desde el responsable de venta, nombre o email.",
      },
      {
        id: "list",
        title: "Asesores",
        target: "advisors-list",
        description: "Abrí el perfil de un asesor para ver su cartera activa, su historial de asignaciones, asignar un cliente o finalizar una asignación.",
      },
      {
        id: "assign",
        title: "Acciones sensibles",
        target: "advisors-assign-action",
        description: "Crear un asesor, asignar un cliente y finalizar una asignación piden verificación adicional de identidad por seguridad.",
      },
    ],
  },
];

/**
 * V16_PAYMENT_HISTORY_UI_CONTRACT_CORRECTION removed the standalone
 * `admin:historial-pagos` guide/tab here: Payment History is no longer a
 * top-level Admin sector — it's reached contextually through Cobranzas
 * (por venta) y Cliente 360 (pestaña "Pagos"), so it no longer needs (or
 * qualifies for) its own first-visit sector guide.
 */

export function findSectorGuide(role: SectorGuideDefinition["role"], sectorId: string) {
  return sectorGuides.find((guide) => guide.role === role && guide.sectorId === sectorId) ?? null;
}
