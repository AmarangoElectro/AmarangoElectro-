// ============================================================
//  AMARA 🐝 — VERSIÓN DETECTIVE
//  Prueba varios modelos y te dice cuál funciona con tu clave.
// ============================================================

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return { statusCode: 200, body: JSON.stringify({ respuesta: "NO hay clave configurada." }) };
  }

  const modelos = [
    "gemini-3-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-flash-lite-latest",
  ];

  let reporte = "DETECTIVE 🔍 Probando modelos:\n\n";

  for (const modelo of modelos) {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      modelo +
      ":generateContent";
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "hola" }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
      });
      const data = await r.json();
      if (data.error) {
        reporte += "❌ " + modelo + " → " + data.error.code + " " + data.error.status + "\n";
      } else if (data.candidates) {
        reporte += "✅ " + modelo + " → FUNCIONA!\n";
      } else {
        reporte += "⚠️ " + modelo + " → respuesta rara\n";
      }
    } catch (e) {
      reporte += "❌ " + modelo + " → error conexión\n";
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respuesta: reporte }),
  };
};
