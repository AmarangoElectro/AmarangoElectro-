# V16 — Mi espacio, entrada según permisos

La entrada común `/mi-espacio` exige la identidad de Sites y decide el destino en el servidor. No recibe un rol ni un workspace desde el navegador.

| Permiso vigente | Destino principal |
| --- | --- |
| Administración habilitada (propietario o administrador) | `/administracion` |
| Propietario sin permiso administrativo | `/propietarios` |
| Asesor autorizado | `/mi-amarango` |
| Cuenta con tienda propia | `/mi-tienda` |
| Cliente/cuenta sin permisos internos ni tienda | `/mi-cuenta` |

Los permisos internos tienen prioridad sobre una tienda de prueba del mismo usuario. `Probar mi propia tienda` conserva su acceso explícito desde Propietarios. El ingreso no crea tiendas, no cambia planes, no modifica capacidades y no habilita herramientas de suscripción.

El menú y pie muestran `Mi espacio` y sólo agregan accesos internos devueltos por el endpoint de permisos. La navegación móvil de sectores usa la misma entrada. El reintento de sesión vuelve a esa entrada con navegación superior de Sites.

Cada destino conserva su autorización de servidor. La ruta antigua `/amarango-os` ahora verifica `admin` antes de cargar datos de operaciones. Los clientes sin permiso de asesor se redirigen desde `/mi-amarango` antes de cargar su catálogo. Las respuestas de roles se validan con booleanos explícitos y roles reconocidos; un nombre de rol por sí solo no concede acceso.

## Validación de esta entrega

- 63 pruebas dirigidas de entrada, autorización, navegación, fotografías, identidad de suscriptor y planes: aprobadas.
- Compilación oficial Sites/Vinext: aprobada; las nuevas páginas son dinámicas.
- Consulta de sólo lectura en staging: la cuenta de Maxi mantiene `owner`, activa y con permiso administrativo.
- Sin migraciones ni escrituras a la base de datos. Sin cambios a catálogo, campañas principales, banners, fotos, precios, planes ni workspaces.
- Audiencia conservada: vista privada autorizada únicamente para Maxi. No se invitaron usuarios ni se habilitó acceso público.

## QA Android pendiente

No se ejecutó QA de navegador/Android en esta entrega. Las pruebas automatizadas ejecutan las rutas con identidades y respuestas de backend simuladas; no prueban sesiones reales de otras personas.

1. Con Maxi, abrir `Mi espacio`: debe ir a Administración, aunque exista su tienda de prueba.
2. Volver a la tienda y reabrir `Mi espacio`: debe conservar el acceso de la sesión.
3. Abrir Propietarios y `Probar mi propia tienda`: debe conservar la tienda y su plan actual.
4. Tras autorizar explícitamente cuentas individuales: repetir con asesor, administrador, suscriptor y cliente. Confirmar destino y ausencia de accesos ajenos.
5. Con cada cuenta no administrativa, abrir directamente `/administracion`, `/plataforma`, `/amarango-os` y `/propietarios`: debe denegar el acceso antes de mostrar datos privados.
6. Repetir el QA de aislamiento de logos, productos y fotos entre dos workspaces independientes. No marcar PASS de aislamiento Android hasta verificarlo con sesiones reales.

Para habilitar personas hace falta su correo de ingreso y rol autorizado, además del permiso de visita a esta vista privada. La foto de Ángela en Propietarios no acredita por sí sola que su cuenta tenga acceso.
