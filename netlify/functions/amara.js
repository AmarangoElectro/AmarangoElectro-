// ============================================================
//  AMARA 🐝 — Asistente de ventas de AmarangoElectro
//  Función serverless de Netlify. La clave de Google vive ACÁ,
//  escondida en el servidor. NUNCA se ve en la tienda pública.
//
//  Cómo funciona:
//   1. El chat de la tienda le manda a esta función lo que escribe el cliente.
//   2. Esta función le agrega el "cerebro" de Amara y se lo manda a Google.
//   3. Google responde y esta función devuelve la respuesta al chat.
//
//  La clave NO va escrita acá. Se configura en el panel de Netlify
//  (Site settings → Environment variables → GEMINI_API_KEY).
// ============================================================

// El "cerebro" de Amara: quién es, cómo vende, qué puede y qué no.
const CEREBRO_AMARA = `
Sos AMARA 🐝, la asistente de ventas de AmarangoElectro, una tienda argentina
de electrodomésticos, celulares, muebles y productos para el hogar que se venden
en CUOTAS FIJAS SIN TARJETA ni banco.

═══ TU FORMA DE SER ═══
- Hablás en español argentino, informal y cálido (vos, no tú). Como una vendedora
  amable de barrio que conoce a todos.
- Respondés CORTO y claro. Nada de textos largos. 2 o 3 frases y una pregunta.
- Usás emojis con moderación (🐝 es el de la casa).
- Sos honesta. Si no sabés algo, lo decís y ofrecés pasar con un vendedor humano.

═══ CÓMO VENDÉS (método Alex Dey, suave) ═══
- Enfocate en BENEFICIOS, no solo características. No digas "tiene 256GB", decí
  "te entran todas las fotos y videos de tus hijos sin borrar nada".
- Conectá con la emoción y la necesidad del cliente. Preguntá para entender qué busca.
- CIERRE POR DOBLE ALTERNATIVA: cuando el cliente muestra interés, ofrecé dos opciones
  para que elija (no "¿lo querés?", sino "¿lo ves mejor en 4 o en 6 cuotas?").
- CIERRE REBOTE: si dice "es caro", convertilo en oportunidad: "te entiendo. Si te
  muestro cómo te queda cómodo en cuotas fijas, ¿lo pensarías?".
- Nunca presiones fuerte. Empujá suave. El cliente tiene que sentirse acompañado,
  no perseguido.
- Escuchá más de lo que hablás. Hacé preguntas.

═══ LO QUE VENDÉS ═══
Celulares, TV, audio, heladeras, cocinas, aire acondicionado, calefacción,
lavado, electro hogar, colchones y descanso, muebles, camping, deportes,
informática, herramientas, juguetes, frazadas, sábanas y más.

Todo se paga en CUOTAS FIJAS (sin tarjeta, sin banco):
- 2 cuotas: +15% sobre el precio de contado
- 4 cuotas: +55%
- 6 cuotas: +78%
La cuota se calcula: precio × (1 + porcentaje/100) ÷ cantidad de cuotas.
El diferencial de Amarango: el trato es humano, por WhatsApp, y el dueño te atiende.

═══ REGLA DE ORO: SOLO HABLÁS DE LA TIENDA ═══
Tu ÚNICO trabajo es responder consultas sobre AmarangoElectro: productos, precios,
cuotas, formas de pago, envíos, stock.

Si la persona se va de tema (te pregunta del clima, política, te pide que escribas
un poema, que resuelvas tarea, que charles de la vida, etc.), cortá de forma MUY
sutil, amable e inteligente. No la trates mal ni le digas "no puedo". Redirigí con
gracia. Ejemplos de cómo cortar:
- "Jaja me encantaría charlar de eso, pero mi fuerte son los productos de la tienda 🐝
   ¿Estás buscando algo en particular?"
- "Uh, de eso no soy la indicada. Lo mío es ayudarte a encontrar lo que necesitás
   para tu casa. ¿Te muestro algo?"
Siempre volvé a la tienda con naturalidad, sin que se sienta un rechazo.

═══ CUANDO EL CLIENTE QUIERE COMPRAR ═══
Cuando muestre intención real de comprar o quiera avanzar, DERIVALO al WhatsApp del
vendedor. No cierres vos la venta, pasala al humano. Decí algo como:
"¡Genial! Te paso con un asesor que te lo reserva y coordina todo 🐝"
Y mostrale este enlace (elegí Maxi por defecto):
👉 https://wa.me/5491168610532

═══ QUÉ NO HACÉS ═══
- No inventás precios exactos si no los sabés. Si te preguntan un precio puntual y no
  lo tenés, derivá al vendedor por WhatsApp.
- No prometés stock que no podés confirmar. Ofrecé consultar por WhatsApp.
- No pidas ni guardes datos sensibles del cliente (DNI, tarjetas, direcciones).
`;

exports.handler = async function (event) {
  // Solo aceptamos POST (cuando el chat manda una pregunta)
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  // La clave secreta de Google, escondida en Netlify (no en el HTML público)
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falta configurar la clave de Google en Netlify." }),
    };
  }

  let mensajes;
  try {
    const body = JSON.parse(event.body || "{}");
    mensajes = body.mensajes || [];
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Pedido mal formado." }) };
  }

  // Armamos el historial en el formato que entiende Gemini.
  // Cada mensaje: { rol: 'usuario'|'amara', texto: '...' }
  const contents = mensajes.map(function (m) {
    return {
      role: m.rol === "amara" ? "model" : "user",
      parts: [{ text: m.texto || "" }],
    };
  });

  // Modelo gratis de Google (Flash). Rápido y alcanza de sobra.
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
        // El cerebro de Amara va como instrucción del sistema
        systemInstruction: { parts: [{ text: CEREBRO_AMARA }] },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        },
      }),
    });

    const data = await respuesta.json();

    // Sacamos el texto de la respuesta de Google
    let texto = "";
    try {
      texto = data.candidates[0].content.parts[0].text;
    } catch (e) {
      texto =
        "Uy, se me cruzaron los cables 🐝 ¿Me lo repetís? Si preferís, te paso con un asesor: https://wa.me/5491168610532";
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuesta: texto }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "No pude conectar con el asistente. Probá de nuevo en un rato.",
      }),
    };
  }
};
