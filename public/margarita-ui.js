export * from "./margarita-ui-core.js?v=20260824-aprobada-1";

// Margarita base no debe caerse porque falle un módulo auxiliar.
// Referencia visual aprobada: commit bc6358d9284ef3d306e418ed7ef462d7ec7a52f0
const MODULOS_AUXILIARES = [
  "./tienda-optimizaciones.js",
  "./margarita-identidad.js",
  "./margarita-ui-approved-guard.js?v=20260824-1",
  "./margarita-visual-tune.js?v=20260824-1",
  "./cliente-referidos.js?v=20260824-3",
  "./equipo-ventas-menu.js?v=20260823-1",
  "./fidelidad-compra-hook.js?v=20260824-2",
  "./asesor-registrar-venta.js?v=20260824-4",
  "./margarita-client-onboarding.js?v=20260824-5",
  "./margarita-client-alias-guard.js?v=20260823-1",
  "./margarita-client-role-guard.js?v=20260824-1",
  "./clientes-crm-export.js?v=20260824-4",
  "./admin-clientes-fidelidad.js?v=20260824-2",
  "./cliente-compartir-productos.js?v=20260824-1",
  "./cliente-compartir-deeplink.js?v=20260824-3",
  "./cliente-ui-comercial.js?v=20260824-3",
  "./margarita-query-guard.js?v=20260823-2",
  "./admin-stable-actions.js?v=20260823-1",
  "./app-dialog-guard.js?v=20260824-2"
];

for (const modulo of MODULOS_AUXILIARES) {
  import(modulo).catch((error) => {
    console.warn("[AmarangoElectro] Módulo auxiliar no cargado:", modulo, error);
  });
}
