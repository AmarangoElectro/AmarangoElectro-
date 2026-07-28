// Sincronización automática de proveedores para AmarangoElectro.
//
// - Se ejecuta una vez por hora en Netlify.
// - Toma precio y stock publicados por Mega Electro y Electro Impacto.
// - Calcula el precio de venta con la misma fórmula de calculadora.html.
// - Nunca borra productos: cuando se agotan, los oculta; cuando vuelven,
//   los muestra nuevamente.
// - Conserva intactos todos los productos cargados manualmente.
// - Mega Boutique, Perfumes y Relojes quedan excluidos.

const PARSE_URL = "https://ecured.ecunegocio.com/parse/classes";
const PARSE_APP_ID = "Ecu_Al@2019o_0708777z8A31qProt";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://zctaukyrhsmpjkcddcqq.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjdGF1a3lyaHNtcGprY2RkY3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzQ0ODAsImV4cCI6MjA5NzQxMDQ4MH0.lxhPH9bASIV__jETAwYZvoJmSpk0Q32CJl9tSlQeLdA";

const PROVEEDORES = [
  {
    clave: "mega",
    nombre: "Mega Electro",
    owner: "KIpPe9qXMa",
    minimoEsperado: 10,
    categoriasExcluidas: new Set([
      "MEGA BOUTIQUE",
      "PERFUMES",
      "RELOJES",
    ]),
  },
  {
    clave: "impacto",
    nombre: "Electro Impacto",
    owner: "P9ovvzhWkx",
    minimoEsperado: 10,
    categoriasExcluidas: new Set(),
  },
];

const POST_KEYS = [
  "objectId",
  "titulo",
  "codigo",
  "precio",
  "stock",
  "sin_stock",
  "subcategory",
  "subcate",
  "image",
  "imageThumb",
  "mostrar_catalogo",
  "updatedAt",
].join(",");

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function categoriaAmarango(categoriaProveedor, nombreProducto) {
  const texto = normalizar(
    `${categoriaProveedor || ""} ${nombreProducto || ""}`,
  );

  if (/SMART TV|TELEVISION|TELEVISOR|\bTV\b/.test(texto)) return "📺 TV";
  if (/PARLANTE|TORRE|EQUIPO DE MUSICA|AURICULAR|AUDIO/.test(texto))
    return "🔊 Audio";
  if (/HELADER|FREEZER|EXHIBIDOR/.test(texto)) return "❄️ Heladeras";
  if (/AIRE ACONDICIONADO|SPLIT/.test(texto))
    return "🌬️ Aire acondicionado";
  if (/CALEFACCION|ESTUFA|CALOVENTOR|PANEL CALEFACTOR/.test(texto))
    return "🔥 Calefacción";
  if (/VENTILADOR|TURBO|CIRCULADOR/.test(texto)) return "🌀 Ventilación";
  if (/LAVARROP|LAVASECARROP|LAVAVAJILL/.test(texto)) return "🧺 Lavado";
  if (/ASPIRADOR|LIMPIEZA|MOPA/.test(texto)) return "🧹 Limpieza";
  if (/COCINA|HORNO|ANAFE|MICROONDAS/.test(texto)) return "🍳 Cocina";
  if (/COLCHON|SOMMIER|BLANQUERIA|SABANA|ACOLCHADO|ALMOHADA/.test(texto))
    return "🛏️ Descanso";
  if (/MUEBLE|MESA|SILLA|SILLON|PLACARD|ROPERO/.test(texto))
    return "🪑 Muebles";
  if (/CAMPING|CARPA|JARDINERIA|PILETA|GAZEBO/.test(texto))
    return "⛺ Camping y aire libre";
  if (/BICICLETA|FITNESS|DEPORTE|MONOPATIN/.test(texto))
    return "🚲 Deportes";
  if (/NOTEBOOK|COMPUTACION|COMPUTADORA|TABLET|IMPRESORA|MONITOR|CAMARA/.test(texto))
    return "💻 Informática";
  if (/HERRAMIENTA|TALADRO|AMOLADORA|SIERRA/.test(texto))
    return "🔧 Herramientas";
  if (/JUGUETE|INFANTIL|MUÑECA/.test(texto)) return "🧸 Juguetes";
  if (/BEBE|BEBES|CUNA|COCHECITO/.test(texto)) return "👶 Bebés";
  if (/BELLEZA|CUIDADO PERSONAL|SECADOR|PLANCHITA|CORTABARBA|MAQUINA DE PELO/.test(texto))
    return "💄 Belleza y cuidado personal";
  if (/BAZAR|VAJILLA|VASO|OLLA|SARTEN|TERMO|MATE/.test(texto))
    return "🍺 Bazar y mesa";
  if (/CONSOLA|GAMING|VIDEOJUEGO/.test(texto)) return "🎮 Gaming";
  if (/DECORACION|HOGAR Y DECO/.test(texto)) return "🏠 Hogar y deco";
  if (/AUTO|MOTO|AUTOMOTOR/.test(texto)) return "🚗 Autos y motos";
  if (/TERMOTANQUE|PEQUEÑO ELECTRO|ELECTRODOMESTICO/.test(texto))
    return "☕ Electro hogar";

  return "📦 Otros";
}

function markupVenta(costo) {
  let multiplicador;
  if (costo <= 50000) multiplicador = 1.8;
  else if (costo <= 100000) multiplicador = 1.6;
  else if (costo <= 250000) multiplicador = 1.5;
  else if (costo <= 350000) multiplicador = 1.4;
  else multiplicador = 1.3;
  return Math.round((costo * multiplicador) / 500) * 500;
}

function fotoProducto(producto) {
  const imagenes = Array.isArray(producto.image) ? producto.image : [];
  const principal = imagenes.find((item) => item && item.url);
  if (principal) return principal.url;
  if (producto.imageThumb && producto.imageThumb.url)
    return producto.imageThumb.url;
  return "";
}

async function parseGet(clase, where, keys, skip = 0) {
  const url = new URL(`${PARSE_URL}/${clase}`);
  url.searchParams.set("where", JSON.stringify(where));
  url.searchParams.set("limit", "1000");
  url.searchParams.set("skip", String(skip));
  if (keys) url.searchParams.set("keys", keys);

  const respuesta = await fetch(url, {
    headers: { "X-Parse-Application-Id": PARSE_APP_ID },
  });
  if (!respuesta.ok) {
    throw new Error(`Proveedor ${clase}: HTTP ${respuesta.status}`);
  }

  const data = await respuesta.json();
  if (!Array.isArray(data.results)) {
    throw new Error(`Proveedor ${clase}: respuesta inválida`);
  }
  return data.results;
}

async function parseTodos(clase, where, keys) {
  const todos = [];
  let skip = 0;
  while (true) {
    const pagina = await parseGet(clase, where, keys, skip);
    todos.push(...pagina);
    if (pagina.length < 1000) break;
    skip += pagina.length;
    if (skip > 20000) throw new Error(`Proveedor ${clase}: demasiados datos`);
  }
  return todos;
}

async function bajarProveedor(proveedor) {
  const [categorias, productos] = await Promise.all([
    parseTodos(
      "Subcategory",
      { owner: proveedor.owner },
      "objectId,name,mostrar_tienda",
    ),
    parseTodos(
      "Post",
      {
        owner_post: proveedor.owner,
        mostrar_catalogo: true,
        stock: { $gt: 0 },
        sin_stock: { $ne: true },
      },
      POST_KEYS,
    ),
  ]);

  if (!categorias.length) {
    throw new Error(`${proveedor.nombre}: no se recibieron categorías`);
  }
  if (productos.length < proveedor.minimoEsperado) {
    throw new Error(
      `${proveedor.nombre}: cantidad sospechosa (${productos.length})`,
    );
  }

  const categoriasPorId = new Map(
    categorias.map((categoria) => [categoria.objectId, categoria.name || ""]),
  );

  const disponibles = productos
    .map((producto) => {
      const categoriaId = producto.subcategory?.objectId || "";
      const categoriaNombre = categoriasPorId.get(categoriaId) || "";
      return { producto, categoriaNombre };
    })
    .filter(({ producto, categoriaNombre }) => {
      const costo = Number(producto.precio);
      if (!producto.objectId || !String(producto.titulo || "").trim()) return false;
      if (!Number.isFinite(costo) || costo <= 0) return false;
      return !proveedor.categoriasExcluidas.has(normalizar(categoriaNombre));
    });

  if (disponibles.length < proveedor.minimoEsperado) {
    throw new Error(
      `${proveedor.nombre}: quedaron muy pocos productos (${disponibles.length})`,
    );
  }

  return {
    proveedor,
    recibidos: productos.length,
    excluidos: productos.length - disponibles.length,
    disponibles,
  };
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function leerCatalogo() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/tienda_catalogo`);
  url.searchParams.set("id", "eq.catalogo");
  url.searchParams.set("select", "datos,actualizado");
  url.searchParams.set("limit", "1");

  const respuesta = await fetch(url, { headers: supabaseHeaders() });
  if (!respuesta.ok) {
    throw new Error(`Supabase lectura: HTTP ${respuesta.status}`);
  }
  const filas = await respuesta.json();
  const fila = filas[0];
  if (!fila || !Array.isArray(fila.datos)) {
    throw new Error("Supabase: no se encontró el catálogo");
  }
  return fila;
}

async function upsertFila(id, datos) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/tienda_catalogo`);
  url.searchParams.set("on_conflict", "id");
  const respuesta = await fetch(url, {
    method: "POST",
    headers: supabaseHeaders({
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify({
      id,
      datos,
      actualizado: new Date().toISOString(),
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`Supabase guardado ${id}: HTTP ${respuesta.status}`);
  }
}

async function actualizarCatalogoSiNoCambio(fila, productos) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/tienda_catalogo`);
  url.searchParams.set("id", "eq.catalogo");
  url.searchParams.set("actualizado", `eq.${fila.actualizado}`);
  url.searchParams.set("select", "id");

  const respuesta = await fetch(url, {
    method: "PATCH",
    headers: supabaseHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({
      datos: productos,
      actualizado: new Date().toISOString(),
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`Supabase actualización: HTTP ${respuesta.status}`);
  }
  const filas = await respuesta.json();
  return Array.isArray(filas) && filas.length === 1;
}

function claveProveedor(proveedor, idExterno) {
  return `${proveedor}|${idExterno}`;
}

function fusionarCatalogo(catalogoActual, resultados, fechaISO) {
  const ahora = Date.now();
  const siguienteResumen = {};
  let proximoId = Math.min(
    0,
    ...catalogoActual
      .map((producto) => Number(producto && producto.id))
      .filter(Number.isFinite),
  ) - 1;

  const catalogo = catalogoActual.map((producto) => ({ ...producto }));
  const indice = new Map();
  catalogo.forEach((producto) => {
    if (
      producto &&
      producto.automaticoProveedor &&
      producto.proveedorClave &&
      producto.proveedorId
    ) {
      indice.set(
        claveProveedor(producto.proveedorClave, producto.proveedorId),
        producto,
      );
    }
  });

  for (const resultado of resultados) {
    const { proveedor, disponibles } = resultado;
    let nuevos = 0;
    let actualizados = 0;
    let ocultos = 0;
    const ocultosManuales = new Set();

    // Primero suponemos que los automáticos de este proveedor se agotaron.
    // Los que sigan disponibles se restauran en el paso siguiente.
    catalogo.forEach((producto) => {
      if (
        producto &&
        producto.automaticoProveedor &&
        producto.proveedorClave === proveedor.clave
      ) {
        if (producto.visible === false && producto.sinStock !== true) {
          ocultosManuales.add(
            claveProveedor(producto.proveedorClave, producto.proveedorId),
          );
        }
        if (producto.visible !== false || producto.sinStock !== true) ocultos++;
        producto.visible = false;
        producto.sinStock = true;
        producto.proveedorStock = 0;
        producto.estadoProveedor = "sin_stock";
        producto.ultimaSincronizacionProveedor = fechaISO;
      }
    });

    for (const item of disponibles) {
      const fuente = item.producto;
      const llave = claveProveedor(proveedor.clave, fuente.objectId);
      let producto = indice.get(llave);
      const costo = Math.round(Number(fuente.precio));
      const venta = markupVenta(costo);
      const foto = fotoProducto(fuente);

      if (!producto) {
        producto = {
          id: proximoId--,
          creado: ahora,
          visible: true,
          sinStock: false,
        };
        catalogo.push(producto);
        indice.set(llave, producto);
        nuevos++;
      } else {
        actualizados++;
      }

      const precioCambio =
        Math.round(Number(producto.costo || 0)) !== costo ||
        Math.round(Number(producto.venta || 0)) !== venta;
      const ocultoManual = ocultosManuales.has(llave);

      producto.nombre = String(fuente.titulo || "").trim();
      producto.costo = costo;
      producto.venta = venta;
      producto.visible = !ocultoManual;
      producto.sinStock = false;
      producto.categoria = categoriaAmarango(
        item.categoriaNombre,
        fuente.titulo,
      );
      if (foto) producto.foto = foto;
      producto.precioActualizado = precioCambio
        ? ahora
        : producto.precioActualizado || ahora;
      producto.automaticoProveedor = true;
      producto.proveedor = proveedor.nombre;
      producto.proveedorClave = proveedor.clave;
      producto.proveedorId = fuente.objectId;
      producto.proveedorCodigo = String(fuente.codigo || "");
      producto.proveedorCategoria = item.categoriaNombre || "";
      producto.proveedorStock = Number(fuente.stock) || 0;
      producto.proveedorActualizado = fuente.updatedAt || "";
      producto.ultimaSincronizacionProveedor = fechaISO;
      producto.estadoProveedor = "disponible";
    }

    siguienteResumen[proveedor.clave] = {
      nombre: proveedor.nombre,
      recibidos: resultado.recibidos,
      excluidos: resultado.excluidos,
      disponibles: disponibles.length,
      nuevos,
      actualizados,
      ocultos,
    };
  }

  return { catalogo, resumen: siguienteResumen };
}

async function ejecutarSincronizacion() {
  if (!SUPABASE_KEY) throw new Error("Falta la clave de Supabase");

  const intentos = await Promise.allSettled(PROVEEDORES.map(bajarProveedor));
  const correctos = [];
  const errores = [];

  intentos.forEach((intento, indice) => {
    if (intento.status === "fulfilled") correctos.push(intento.value);
    else {
      errores.push({
        proveedor: PROVEEDORES[indice].nombre,
        error: String(intento.reason?.message || intento.reason),
      });
    }
  });

  if (!correctos.length) {
    throw new Error(`Fallaron todos los proveedores: ${JSON.stringify(errores)}`);
  }

  const fechaISO = new Date().toISOString();
  let ultimoResultado;

  // Si alguien guarda un producto manual justo durante la sincronización,
  // no pisamos su cambio: volvemos a leer y reintentamos la mezcla.
  for (let intento = 1; intento <= 3; intento++) {
    const fila = await leerCatalogo();
    const fusion = fusionarCatalogo(fila.datos, correctos, fechaISO);

    await upsertFila("catalogo_respaldo_proveedores", {
      fecha: fechaISO,
      cantidad: fila.datos.length,
      productos: fila.datos,
    });

    const guardado = await actualizarCatalogoSiNoCambio(fila, fusion.catalogo);
    if (guardado) {
      ultimoResultado = {
        ok: errores.length === 0,
        fecha: fechaISO,
        antes: fila.datos.length,
        despues: fusion.catalogo.length,
        proveedores: fusion.resumen,
        errores,
      };
      break;
    }
  }

  if (!ultimoResultado) {
    throw new Error("El catálogo cambió durante los tres intentos");
  }

  await upsertFila("proveedores_sync", ultimoResultado);
  console.log(`PROVEEDORES_SYNC ${JSON.stringify(ultimoResultado)}`);
  return ultimoResultado;
}

export default async () => {
  try {
    await ejecutarSincronizacion();
  } catch (error) {
    const detalle = {
      ok: false,
      fecha: new Date().toISOString(),
      error: String(error?.message || error),
    };
    console.error(`PROVEEDORES_SYNC_ERROR ${JSON.stringify(detalle)}`);
    try {
      await upsertFila("proveedores_sync", detalle);
    } catch {
      // Si Supabase también falla, el error igualmente queda en los logs.
    }
  }
};

export const config = {
  background: true,
  schedule: "@hourly",
};

export { bajarProveedor, fusionarCatalogo, markupVenta };
