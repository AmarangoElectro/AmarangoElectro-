// Sincronización LEGADA de proveedores en Netlify.
//
// La sincronización oficial de AmarangoElectro corre ahora en Cloudflare Workers
// (src/worker.mjs + src/proveedores-sync.mjs). Mantener también este job horario
// generaba una segunda lectura/escritura completa del catálogo y, además, esta
// versión antigua podía reemplazar la foto elegida por Amarango con la foto del
// mayorista.
//
// Se conserva este endpoint únicamente como marcador compatible para no romper
// enlaces antiguos. NO tiene schedule y NO modifica Supabase.

export default async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      disabled: true,
      message: "Sync legado de Netlify desactivado. La sincronización oficial corre en Cloudflare Workers.",
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
};
