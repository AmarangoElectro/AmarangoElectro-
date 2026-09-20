# AmarangoElectro V16 — MASTER STATE MATERIALIZADO

**Fecha:** 2026-09-17  
**Objetivo:** este archivo es la referencia física para continuar V16 desde cualquier chat sin reconstruir el historial.

## 1. Estado materializado actual

- Repo de trabajo recuperado: `/mnt/data/V16-RECOVERED-WRITABLE`
- Branch local actual: `master`
- HEAD local: `3f7ef7408b75fb6007b66fe7031837a93490f67b`
- TREE: `47ecf3fd72717f365d6ffb4917409012927fa58c`
- Working tree: CLEAN
- Home protegida SHA-256: `7ee05b586ff4700eccaa75537195d95a6839ed5e5911056221d97fdd3676637f`
- Regla: **HOME PRINCIPAL APROBADA = NO TOCAR** salvo autorización explícita del owner.

## 2. Arquitectura visual aprobada

`Shopping AmarangoElectro → Departamento/Sector → Local de marca → Producto`

Reglas:
- Home aprobada permanece intacta.
- Sector ambienta sin romper Amarango.
- Marca debe sentirse como “otro local” manteniendo shell, ProductCard, precios, cuotas, CTA y navegación.
- Light/Dark aplica a todo el local de marca.
- No banners gigantes salvo aprobación explícita.
- No mezcla de ProductCard.
- No textos LAB/checkpoint/recovery en superficies finales.
- No marca de agua abeja dentro de locales de marca; usar identidad de la marca.

## 3. Locales/marcas reconciliados en source

Registry dinámico recuperado/reconciliado:
Apple/iPhone, Samsung, Motorola, Xiaomi, Infinix, TCL, JBL, Sony, PlayStation, Kanjihome, Kanji, Kanji Tools, Telefunken, Ken Brown.

Regla dinámica:
- local visible sólo si tiene productos publicables reales en ese sector;
- no hardcodear una marca a una pantalla;
- configuración central por marca;
- misma marca puede vivir en varios sectores.

## 4. Sectores/taxonomía reconciliados

Top-level real:
audio, auto-motos-energia, bebes-juguetes, camping-aire-libre-mascotas, celulares, cuidado-personal-salud, descanso, electrodomesticos, gaming, herramientas, hogar, otros, smart-tv, tecnologia-accesorios.

Conceptos visuales reconciliados:
- Climatización → Electrodomésticos / climatizacion
- Blanquería → Hogar / blanqueria
- Muebles → Hogar / hogar-y-deco
- Movilidad & Aire Libre → rutas canónicas existentes; sin inventar top-level
- Computación/Informática → no promover a top-level sin evidencia adicional

## 5. Navegación y ProductCard

Cadena validada:
`Home → Sector → Local de marca → Catálogo → Producto`

- ProductCard storefront canónico único.
- PDP vuelve al catálogo.
- No review-index ni navegación técnica integrada al storefront.
- Customer fallbacks profesionalizados; no se inventan precio, cuotas, stock, garantía o imagen.

## 6. Separación Cliente / Asesor / Admin

- Cliente: storefront sin imports de Admin ni copy interno.
- `/administracion`, `/mi-amarango`, `/plataforma`, `/amarango-os`: autenticación server-side requerida.
- Mi Amarango no enlaza Product Bridge mock como si fuera Nueva Venta real.
- Admin conserva módulos: Catálogo, Revisión de tienda, 90 Celulares revisión, Clientes/CRM, Cobranzas, Reportes, Proveedores, Caja, Entregas, Asesores, Calculadora, Placas, Ofertas borrador.

## 7. RBAC

Autoridad histórica recuperada:
`v16_user_access`

Contrato local fail-closed definido:
- roles: owner / admin / advisor / customer
- Admin: owner/admin + `admin.access`
- Asesor: advisor + advisorId + `advisors.access`
- sin email hardcodeado;
- sin localStorage como autoridad;
- sin service_role en browser.

Falta todavía el read path real:
`current identity → v16_user_access → role/capabilities`

## 8. RPC / backend

Contrato secure bridge source-only definido:
`browser → server autenticado → identity mapping → v16_user_access → capability/AAL → RPC allowlisted → respuesta sanitizada`

Allowlist recuperada: 31 RPC.
Los adapters reales siguen fail-closed porque `getCrmAccessConfig()` retorna `null`.
No se tocó Supabase.

## 9. Catálogo real recuperado

Snapshot sanitizado físicamente recuperado:
- master: 1.488
- visibles: 590
- no visibles: 898
- tombstones: 48
- celulares legacy: 92
- read_only
- writeEnabled=false

Proyección estricta:
- Product V16 compatibles: 127
- disponibles: 127
- live HTTP pendiente: 112
- image review: 15
- pre-HTTP cohort-eligible: 111
- Cohort 0 curado: 9 candidatos
- READY bajo certificación HTTP live actual: 0

**No activar todavía el catálogo real en runtime.**

## 10. 90 celulares

- 90 IDs canónicos materializados localmente.
- Posiciones 10 y 91 excluidas.
- Adapter aislado, no activado.
- Sin precio/imagen/cuotas/stock comercial certificado en ese adapter.
- Mantener revisión/oculto hasta gate comercial.

## 11. Payment History — reglas permanentes

- Cobranzas: scope exacto `sale_id + client_id`
- Cliente 360 / Pagos: scope exacto `clientId` actual
- Zero-state exacto:
  `Todavía no hay pagos registrados en el historial V16.`
- sin leakage entre venta/cliente
- AAL2 donde corresponde
- Live Auth QA todavía pendiente para cierre final

## 12. Superficies mock/revisión aisladas

- V4.11/Cohort0 histórico: evidencia, no producción.
- Amarango OS Product Bridge: mock interno, autenticado, no Nueva Venta productiva.
- Ofertas: borrador localStorage.
- Revisión de tienda / 90 celulares: rotulados como revisión.
- Calculadora y Placas: funcionales localmente pero deben quedar detrás de RBAC real.

## 13. Bloqueos reales antes del preview final serio

1. Catálogo real todavía no activable públicamente.
2. Falta read path real de `v16_user_access`.
3. Adapters RPC reales todavía no tienen session bridge vivo.
4. Build/lint completo no certificado por falta de dependencias en el entorno recuperado.
5. Browser Live Auth QA pendiente.
6. Nuevo preview debe ser paralelo; nunca tocar preview roto, main o producción.

## 14. Regla de materialización a partir de ahora

**Nunca volver a reconstruir V16 desde memoria o desde un chat.**

Cada cambio futuro debe seguir:
1. partir de este baseline físico;
2. un cambio pequeño;
3. tests;
4. commit local;
5. checkpoint;
6. nuevo baseline ZIP cuando el cambio sea relevante;
7. sólo después, subir la rama paralela / preview.

Este archivo + el ZIP materializado son la fuente de continuidad entre chats.
