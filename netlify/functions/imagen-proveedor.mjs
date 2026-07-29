// Puente seguro para compartir por WhatsApp las imágenes automáticas.
// El CDN del proveedor deja ver las fotos, pero no permite leerlas desde
// JavaScript por CORS. Esta función las entrega desde el mismo dominio de
// Amarango sin modificar el catálogo ni guardar copias.

const HOSTS_PERMITIDOS = new Set(["cdn.catalog-store.link"]);
const TIPOS_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function handler(event) {
  const valor = event?.queryStringParameters?.url || "";
  let url;

  try {
    url = new URL(valor);
  } catch {
    return respuestaError(400, "URL de imagen inválida");
  }

  if (url.protocol !== "https:" || !HOSTS_PERMITIDOS.has(url.hostname)) {
    return respuestaError(403, "Origen de imagen no permitido");
  }

  try {
    const origen = await fetch(url.toString(), {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*" },
    });

    if (!origen.ok) {
      return respuestaError(502, "No se pudo descargar la imagen");
    }

    const tipo = String(origen.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!TIPOS_PERMITIDOS.has(tipo)) {
      return respuestaError(415, "El archivo recibido no es una imagen válida");
    }

    const bytes = new Uint8Array(await origen.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) {
      return respuestaError(413, "La imagen supera el tamaño permitido");
    }

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": tipo,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
      },
      body: Buffer.from(bytes).toString("base64"),
    };
  } catch {
    return respuestaError(502, "No se pudo preparar la imagen");
  }
}

function respuestaError(statusCode, mensaje) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({ ok: false, error: mensaje }),
  };
}
