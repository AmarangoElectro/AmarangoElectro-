// ============================================================
//  AMARA 🐝 — VERSIÓN DIAGNÓSTICO
//  Esta versión muestra el error REAL en el chat, para saber
//  qué falla. Después la reemplazamos por la versión final.
// ============================================================

const CEREBRO_AMARA = `
Sos AMARA 🐝, la asistente de ventas de AmarangoElectro, una tienda argentina
de electrodomésticos, celulares, muebles y productos para el hogar que se venden
en CUOTAS FIJAS SIN TARJETA ni banco. Hablás en español argentino, informal y
cálido (vos, no tú). Respondés corto. Solo hablás de la tienda; si se van de tema,
cortás con amabilidad. Cuando el cliente quiere comprar, lo derivás al WhatsApp
https://wa.me/5491168610532. No pidas datos sensibles.
`;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 200,
      body: JSON.stringify({ respuesta: "DIAGNÓSTICO: NO hay clave configurada en Netlify (GEMINI_API_KEY vacía)." }),
    };
  }

  const pista = API_KEY.substring(0, 5) + "...(" + API_KEY.length + " caracteres)";

  let mensajes;
  try {
    const body = JSON.parse(event.body || "{}");
    mensajes = body.mensajes || [];
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ respuesta: "DIAGNÓSTICO: pedido mal formado." }) };
  }

  const contents = mensajes.map(function (m) {
    return {
      role: m.rol === "amara" ? "model" : "user",
      parts: [{ text: m.texto || "" }],
    };
  });

  const MODELO = "gemini-2.5-flash";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODELO +
    ":generateContent?key=" +
    API_KEY;

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: CEREBRO_AMARA }] },
        contents: contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });

    const data = await respuesta.json();

    if (data.error) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuesta:
            "DIAGNÓSTICO 🔧\nClave: " + pista +
            "\nCódigo: " + (data.error.code || "?") +
            "\nMensaje: " + (data.error.message || "?") +
            "\nEstado: " + (data.error.status || "?"),
        }),
      };
    }

    let texto = "";
    try {
      texto = data.candidates[0].content.parts[0].text;
    } catch (e) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuesta: "DIAGNÓSTICO 🔧 Google respondió raro:\n" + JSON.stringify(data).substring(0, 300),
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuesta: texto }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        respuesta: "DIAGNÓSTICO 🔧 Error de conexión:\n" + e.toString(),
      }),
    };
  }
};
