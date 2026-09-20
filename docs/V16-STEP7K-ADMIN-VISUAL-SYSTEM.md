# V16 Step 7K — Admin Visual System + Speed Workspace

## Objetivo
Mantener el ADN visual premium de AmarangoElectro dentro de Administración, pero optimizado para velocidad operativa. La estética nunca debe añadir pasos ni ocultar información de trabajo.

## Regla UX
- Storefront: premium/comercial/emocional.
- Admin: premium/operativo/denso cuando conviene.
- Mismo lenguaje de marca, distinto nivel de información.
- Las tareas diarias deben quedar a 1–2 acciones de distancia.

## Acciones diarias fijas
1. Pegar celulares.
2. Pegar precios.
3. Buscar producto.
4. Confirmar precios.
5. Registrar venta.
6. Clientes.

## Herramientas de productividad
- Dock rápido adaptable a desktop/mobile.
- Buscador global / command palette para alcanzar cualquiera de las funciones Legacy exigidas.
- Atajos de teclado como mejora opcional, nunca como requisito para operar.
- Bandeja "Para resolver hoy" construida desde señales autoritativas: precios 30+, importaciones dudosas, celulares faltantes, precios 20–29, fotos, stock y ventas.
- Acciones masivas con preview obligatorio.
- Acciones destructivas fuera del grupo primario y con confirmación/auditoría futura.
- Preservación de contexto al volver de un producto, lista o revisión.

## Influencia de UX actual
La dirección toma principios actuales de Admins de e-commerce: acciones masivas para tareas repetitivas y atajos para navegación rápida, sin copiar una UI de terceros. El diseño final conserva identidad AmarangoElectro.

## Seguridad
Step 7K sigue siendo modelo/prototipo interno:
- no ruta Admin pública;
- no Auth simulada;
- no Supabase write;
- no producción;
- no Margarita;
- no Workers;
- no comandos administrativos reales.

La activación sigue condicionada a Auth real, MFA Admin, RLS/autorización server-side y auditoría.
