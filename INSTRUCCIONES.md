# 📘 INSTRUCCIONES — Proyecto AmarangoElectro

> Manual maestro del proyecto. Si estás leyendo esto en un chat nuevo con Claude,
> decile: **"Leé el INSTRUCCIONES.md de mi repo"** y va a tener todo el contexto al instante.

---

## 🌐 Datos clave del proyecto

- **Repo de la web pública:** `github.com/AmarangoElectro/AmarangoElectro-`
  (¡OJO! El guion final `-` es parte del nombre. NO confundir con `crm-amarangoelectro`, que es otro repo distinto.)
- **Web publicada en:** `amarangoelectro.com.ar`
- **Hosting / deploy:** Netlify (conectado al repo, publica solo)
- **Trabajo desde:** celular (Android, navegador Chrome)

### Archivos del repo
| Archivo | Qué es |
|---|---|
| `index.html` | Tienda / página principal del cliente |
| `calculadora.html` | Calculadora de precios (panel admin, 4 pestañas: Contado, Cuotas, Comisiones, Inversión) |
| `revendedores.html` | Portal de revendedores |

---

## 🚀 CÓMO SUBIR O ACTUALIZAR UN ARCHIVO (método seguro desde el celular)

Este es el camino que funciona sin copiar/pegar código. Sube el archivo tal cual está.

### Paso 1 — Tener el archivo en el celular
Asegurate de tener el archivo `.html` guardado (ej: `calculadora.html`).
- El nombre tiene que terminar en `.html`
- Si el archivo no tiene la extensión, cambiásela antes (renombrar → agregar `.html`)

### Paso 2 — Ir a la pantalla de subida
Abrí el navegador, tocá la barra de direcciones y escribí exacto:

```
github.com/AmarangoElectro/AmarangoElectro-/upload/main
```

Enter. Esto abre la pantalla **"Drag files here / choose your files"**.

### Paso 3 — Elegir el archivo
Tocá el texto azul **"choose your files"** → se abre el explorador del celular → elegí tu archivo `.html`.
- Esperá a que aparezca cargado abajo (con el ícono de documento y su nombre).

### Paso 4 — Confirmar (commit)
- Dejá marcado **"Commit directly to the main branch"** (viene marcado por defecto).
- (Opcional) Escribí un mensaje tipo `actualizar calculadora`.
- Tocá el botón verde **"Commit changes"**.

### Paso 5 — Listo ✅
- El archivo aparece en el repo con la marca **"now"**.
- Netlify lo publica solo en **1–2 minutos**.

> 💡 **Importante:** subir un archivo con el MISMO nombre PISA (reemplaza) el anterior.
> Así se actualiza una página: subís la versión nueva con el mismo nombre.

---

## 🔍 CÓMO VERIFICAR QUE SE PUBLICÓ

Esperá 1–2 minutos después del commit y abrí en el navegador:

- `amarangoelectro.com.ar/calculadora.html`
- `amarangoelectro.com.ar/revendedores.html`

Si carga la versión nueva, está todo OK. (Si ves la vieja, esperá un minuto más y recargá.)

---

## ⚠️ ERRORES COMUNES Y CÓMO EVITARLOS

- **"Abrí el archivo y veo la página funcionando, no el código":** eso es la versión renderizada. Para subir a GitHub NO hace falta el código — usá el método de **upload** (Paso 2), que sube el archivo entero sin copiar nada.
- **Confundir repos:** el correcto es `AmarangoElectro-` (con guion final). El `crm-amarangoelectro` es otro proyecto.
- **El "+" de arriba de GitHub:** ese menú (New issue, New repository...) NO sirve para agregar archivos al repo. Usá siempre la URL de `/upload/main`.
- **Archivo sin `.html`:** si el nombre no termina en `.html`, la web no lo lee bien. Renombralo antes de subir.

---

## 💰 REGLAS DE PRECIOS (referencia del sistema)

- **Cotización dólar:** USD × $1.500 ARS
- **Recargos sobre el costo:**
  - hasta $50.000 → +80%
  - hasta $100.000 → +60%
  - hasta $250.000 → +50%
  - hasta $350.000 → +40%
  - más de $350.000 → +30%
- **Fórmula de cuotas:**
  - 2x = precio × 1,15 ÷ 2
  - 4x = precio × 1,15 × 1,35 ÷ 4
  - 6x = precio × 1,15 × 1,35 × 1,15 ÷ 6
  - (redondeado al $500 más cercano)
- **Regla de coherencia de memoria:** si una variante de más almacenamiento (ej. 256GB) da igual o menor que una de menos (ej. 128GB), se le suman $9.000 ARS. En cascada: 128 → 256 → 512, cada una al menos $9.000 más que la anterior.

---

## 📞 EQUIPO

| Nombre | Rol | WhatsApp |
|---|---|---|
| Maximiliano (Max) | Admin / dueño | 5491168610532 |
| Angela (Angie) | Vendedora | 5491168746034 |
| Selene (Sechu) | Vendedora | 5491162107212 |

---

## 📝 NOTAS PARA EL FUTURO

- [ ] Idea pendiente: sistema de **membresías**
- (Acá podés ir agregando lo que se te ocurra. Cuando quieras actualizar este archivo,
  subí la versión nueva con el mismo método de upload, pisando la anterior.)

---

*Última actualización: junio 2026*
