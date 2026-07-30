import { ejecutarSincronizacionSegura } from "./proveedores-sync.mjs";

const HOSTS_IMAGEN_PERMITIDOS = new Set(["cdn.catalog-store.link"]);
const TIPOS_IMAGEN_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

function json(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function servirImagenProveedor(request) {
  const pedido = new URL(request.url);
  const valor = pedido.searchParams.get("url") || "";
  let origenUrl;

  try {
    origenUrl = new URL(valor);
  } catch {
    return json({ ok: false, error: "URL de imagen inválida" }, 400);
  }

  if (
    origenUrl.protocol !== "https:" ||
    !HOSTS_IMAGEN_PERMITIDOS.has(origenUrl.hostname)
  ) {
    return json({ ok: false, error: "Origen de imagen no permitido" }, 403);
  }

  try {
    const origen = await fetch(origenUrl.toString(), {
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
      },
    });
    if (!origen.ok) {
      return json({ ok: false, error: "No se pudo descargar la imagen" }, 502);
    }

    const tipo = String(origen.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!TIPOS_IMAGEN_PERMITIDOS.has(tipo)) {
      return json(
        { ok: false, error: "El archivo recibido no es una imagen válida" },
        415,
      );
    }

    const largo = Number(origen.headers.get("content-length") || 0);
    if (largo > MAX_IMAGEN_BYTES) {
      return json(
        { ok: false, error: "La imagen supera el tamaño permitido" },
        413,
      );
    }

    const bytes = await origen.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_IMAGEN_BYTES) {
      return json(
        { ok: false, error: "La imagen supera el tamaño permitido" },
        413,
      );
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": tipo,
        "cache-control": "public, max-age=3600, s-maxage=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return json({ ok: false, error: "No se pudo preparar la imagen" }, 502);
  }
}

function redireccionarInicio(request) {
  const destino = new URL("/", request.url);
  return Response.redirect(destino.toString(), 301);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (
      url.pathname === "/.netlify/functions/imagen-proveedor" ||
      url.pathname === "/api/imagen-proveedor"
    ) {
      return servirImagenProveedor(request);
    }

    if (
      url.pathname === "/calculadora" ||
      url.pathname === "/calculadora.html" ||
      url.pathname === "/index.html" ||
      url.pathname === "/tienda"
    ) {
      return redireccionarInicio(request);
    }

    if (url.pathname === "/api/estado") {
      return json({ ok: true, servicio: "AmarangoElectro Cloudflare" });
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(ejecutarSincronizacionSegura(env));
  },
};
