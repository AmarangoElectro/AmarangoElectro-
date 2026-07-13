# 🐝 Cómo crear una tienda nueva en Amarango

## Cada tienda = 1 carpeta con 5 archivos

```
/marcelo/
   ├── index.html      ← el motor (SIEMPRE el mismo)
   ├── manifest.json   ← cambia 4 líneas
   ├── sw.js           ← SIEMPRE el mismo
   ├── icon-192.png    ← SIEMPRE el mismo
   └── icon-512.png    ← SIEMPRE el mismo
```

**Solo el `manifest.json` cambia.** Los otros 4 son idénticos para todas.

---

## 📝 El manifest.json — reemplazá "marcelo" por el código de la tienda

```json
{
  "id": "/marcelo/",
  "name": "Mi Tienda",
  "short_name": "Tienda",
  "description": "Tu tienda en cuotas",
  "start_url": "/marcelo/",
  "scope": "/marcelo/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#0B2D6B",
  "icons": [
    {
      "src": "/marcelo/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/marcelo/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**⚠️ Las 5 líneas que cambian:** `id`, `start_url`, `scope`, y las 2 rutas de los íconos.

---

## 🔑 Por qué el `id` es la clave

Sin el `id`, Chrome piensa que todas las tiendas son **la misma app** y las pisa.

Con el `id` único, cada tienda es **una app independiente**:

- 📱 AmarangoElectro
- 📱 Marcelo Hogar
- 📱 Electro Round

**Las tres instaladas al mismo tiempo, sin pisarse.**

---

## ✅ Pasos para dar de alta a un cliente

1. **GitHub** → crear carpeta con el código (ej: `marcelo`)
2. Subir los **5 archivos** (el manifest con el código correcto)
3. **Panel → 👥 Suscripciones → ➕ Agregar**
   - Nombre, **Código: `marcelo`**, WhatsApp, cuánto paga
4. Mandarle el link: `amarangoelectro.com.ar/marcelo/`
5. Que entre y toque **"Instalar app"**

---

## 🔄 Cuando actualices el motor

Subís el **mismo `index.html`** a todas las carpetas.
**No hay versiones distintas.** Un motor, muchas configs.
