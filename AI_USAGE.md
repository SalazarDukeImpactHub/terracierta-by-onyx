# AI Usage Disclosure

Proyecto: **Terracierta by Onyx** — Hackatón Open Payments Medellín 2026.
Última actualización: 2026-10-16 — pasos 1 y 2 del orden de construcción + Ruta A (tienda, checkout contra mock, panel de pagos) + Ruta B (lote, agente de match, oferta y pago de la cooperativa, contra mock).

## Tools Used

- **Claude Code** (app de escritorio de Anthropic) con el modelo **Claude Sonnet 5.5** (`claude-sonnet-5-5`) — créditos usados: **[pendiente — lo consulta y anota el equipo]**.
- **Cómo se usó:** una sola sesión de Claude Code (el "Dev System") escribió la página. **Jennifer Salazar Duke dirige y revisa cada decisión:** aprobó el plan antes de crear estructuras grandes, aprobó la lista de dependencias y decidió cuándo seguir o parar.
- **Subagentes y skills:** *no se usaron* en esta etapa. Todo el trabajo lo hizo la sesión principal con sus herramientas (leer y escribir archivos, correr comandos, navegador integrado para probar).
- **Reglas que rigen al agente:** `AGENTS.md` del workspace (no hacer commits ni git sin aprobación, no instalar dependencias sin aprobación, preguntar ante ambigüedad).
- **Herramientas que no son IA:** `create-next-app` generó el esqueleto de Next.js; la CLI de Supabase y Docker corren la base local.

## Where and How We Used AI

Alcance: **todo el código del proyecto fue escrito con IA**, salvo lo listado en "Files with minimal or no AI". El esqueleto inicial (`package.json`, `tsconfig.json`, `eslint.config.mjs`, `public/*.svg`) lo generó `create-next-app`, no la IA; la IA lo ajustó.

### 1. Base y configuración (`package.json`, `next.config.ts`, `vitest.config.mts`, `scripts/dev-local.mjs`, `.gitignore`)
- IA: scripts, desactivar Cache Components del scaffold, fijar la raíz de Turbopack, script que arranca la página con las llaves locales sin escribir `.env`.

### 2. Adaptadores y mocks (`src/adapters/**`, `src/lib/env.ts`)
- IA: contratos de pagos (§7.1) y login (§7.2), selector `USE_MOCKS`, mock de pagos con ciclo autorización → ejecución → finalización y gancho de fallo, mock de login con tres perfiles de ejemplo.

### 3. Stubs de los compañeros (`src/payments/index.ts`, `src/auth/index.ts`)
- IA: **solo** el stub que lanza "no implementado" y documenta el contrato. Todo lo real lo escriben los compañeros.

### 4. Datos: tablas, RLS, seed y pruebas (`supabase/migrations/*`, `supabase/seed.sql`, `supabase/tests/rls.sql`)
- IA: 7 tablas, políticas RLS, vista pública sin wallets, bucket de fotos, datos de ejemplo inventados, 35 verificaciones de RLS en SQL.
- `profiles` es **provisional** (tabla del compañero de login).

### 5. Servicio de pagos de la página y API (`src/lib/pagos-service.ts`, `src/app/api/pagos/**`, `src/app/pago/**`)
- IA: crea el pago con monto y wallet leídos de la base, sincroniza `pagos`/`pedidos`, pantalla de retorno con estados y pantalla de consentimiento simulada.

### 6. Tienda pública y checkout (`src/app/tienda/**`, `src/components/formulario-checkout.tsx`, `foto-producto.tsx`, `src/lib/catalogo.ts`)
- IA: catálogo y detalle (lectura con llave anon bajo RLS), checkout con validación en cliente y servidor.

### 7. Panel del caficultor (`src/app/caficultor/**`, `src/components/formulario-producto.tsx`)
- IA: pregunta "¿Tienes INVIMA?", gestión de productos con foto (validación de tipo, tamaño y firma del archivo), panel de pedidos y pagos recibidos.

### 7b. Ruta B: lote, agente de match, oferta y pago de la cooperativa (`src/lib/match.ts`, `src/lib/ruta-b.ts`, `src/lib/pagos-service.ts`, `src/app/caficultor/lote/**`, `src/app/cooperativa/**`, `src/components/formulario-lote.tsx`)
- IA: agente determinista de puntaje (precio, cercanía, método, variedad, capacidad) con motivo en texto, **sin modelo de lenguaje** (decisión de Jennifer); formulario de lote, pantalla del top 3, creación de la oferta al elegir, panel de la cooperativa (aceptar, pagar, historial), pago de la oferta por el mismo módulo de pagos.
- **Supuesto declarado:** la cercanía usa una tabla chica de municipios con coordenadas **aproximadas** escritas de memoria por la IA (no verificadas con una fuente oficial); un municipio que no está en la tabla da cercanía neutra.
- Los pesos del puntaje (35/25/15/10/15) los eligió la IA; Jennifer decidió que sean solo reglas y que la oferta se cree al elegir. **Pendiente de revisión humana.**

### 7c. El comprador también inicia sesión (`supabase/migrations/20261017000000_comprador.sql`, `src/lib/roles.ts`, `src/app/comprador/page.tsx`, `src/components/formulario-checkout.tsx`, `src/lib/pagos-service.ts`, `src/app/api/pagos/iniciar/route.ts`, `src/adapters/**`, `scripts/cloud-sql.mjs`)
- **Decisión de Jennifer** (cambia el brief original, que decía "comprador sin registro"): todos necesitan cuenta para tener su wallet y pagar; el catálogo sigue público y el login se pide solo al pagar.
- IA: rol `comprador` en el contrato, migración y política de RLS, perfiles de ejemplo, checkout con sesión (la wallet sale del perfil, la API responde 401/403 y ignora lo que mande el navegador), login con `siguiente` y su validación contra redirecciones abiertas, pantalla "Mis compras", textos corregidos, modo `update` del generador de SQL para la nube. **Pendiente de revisión humana.**
- **Cambio de contrato con el compañero de login:** `profiles.rol` admite `comprador`, wallet asignada al registrarse y respetar `?siguiente=`. Queda anotado en `src/auth/index.ts` y en el README.

### 8. Identidad visual y páginas (`src/app/globals.css`, `layout.tsx`, `page.tsx`, `src/components/cabecera.tsx`, `pie.tsx`, `src/app/acceso/**`)
- IA: tokens de Terracierta (brief §5.1 y valores medidos en la landing viva), fuentes, landing, acceso. No se crearon logos ni ilustraciones.

### 9. Validación y seguridad (`src/lib/validacion.ts`, `validacion.test.ts`)
- IA: esquemas zod, wallet address, URLs seguras, 21 pruebas.

### 10. Documentación (`README.md`, `AI_USAGE.md`, `prompts/*`, `docs/*.jpg`)
- IA: redactados por el agente; pendientes de revisión humana.
- `README.md` reescrito al estilo del README de ejemplo que indicó Jennifer (`cavaltechackathon`), usado **solo como referencia de formato**; el contenido es propio.
- `docs/*.jpg`: 7 capturas de la app corriendo en local, tomadas por el agente con el navegador integrado (datos de ejemplo, sin información real). **Ya no se muestran en el README**: Jennifer pidió agregarlas al final, con el diseño definitivo.
- Nombres del equipo en el README: los dio Jennifer en el chat; después ella pidió agregar las tildes (Álvaro, González, López) y asignó los roles de pagos y login. "Andre" se dejó sin tilde porque no se indicó otra cosa. Pendiente de revisión humana: el rol de Caren Briyid Hoyos Estrada y de Astrid Carolina Hoyos Estrada.

## Files with minimal or no AI

- `src/payments/...` — **servicio real de Open Payments: Yamil Andre La Barrera López (pagos).** (Hoy solo existe el stub del punto 3.)
- `src/auth/...` — **login y asignación de wallets: Álvaro Henao González (login).** (Hoy solo existe el stub del punto 3.)

> Cuando entreguen, cada uno lista aquí sus rutas exactas y cuánta IA usó, por separado. **Cuánta IA usó cada uno es una declaración suya**: el agente no puede saberla.

## Prior Code and Reference Material

- **Tienda Luli (`luli-crea-tu-look`): no se copió nada y no se abrió su código durante esta etapa.** El brief la define como referencia de patrones (organización del catálogo, modelo de producto, validación en el servidor, protección de escrituras, escape de datos contra XSS). Esos patrones se aplicaron desde conocimiento general y se escribieron de nuevo para Terracierta con Supabase y Next.js. No se abrió ni se copió su `.env.local`.
- Identidad visual: tokens y tipografías del brief (§5.1); los valores `#8C4E2B`, `#232E22`, `#EAE1CE` y `#5B6455` se midieron en la landing viva (`terracierta-landing.vercel.app`), que se consultó como referencia visual. No se copiaron textos ni imágenes.
- Datos semilla: **inventados** para la demo (personas y cooperativas ficticias; wallets con dominio reservado `wallet.example.test`).

## What We Did Ourselves

- Brief y propuesta del proyecto, y todas las decisiones de dirección (Jennifer Salazar Duke y el equipo).
- Aprobación del plan y de las dependencias antes de construir.
- Pruebas y verificación del código generado (resultados reales abajo).
- Pendiente de revisión humana: lectura del código por una persona del equipo antes de la entrega.

## Verification Log

> Resultados reales de lo que se corrió. Fallos y correcciones incluidos.

| Fecha | Tarea | Qué se corrió | Resultado real |
|---|---|---|---|
| 2026-10-16 | Tipos, lint, pruebas unitarias | `tsc --noEmit`, `eslint src`, `vitest run` | Tipos sin errores; lint sin avisos; 21/21 pruebas (wallet, URL segura, producto, checkout) |
| 2026-10-16 | Build de producción | `next build` con USE_MOCKS=true y llaves locales | Compila; 17 rutas dinámicas |
| 2026-10-16 | Migraciones y seed | `supabase start` / `db reset` | 4 migraciones + seed aplicados: 3 perfiles, 4 cooperativas, 3 productos (2 publicados), 1 tienda pública, bucket `productos-fotos`; RLS activo en las 7 tablas |
| 2026-10-16 | RLS | `npm run test:rls` (anon, Marta, Jairo, cooperativa demo) | **35 verificaciones OK**, incluido: anon no ve pedidos, pagos ni wallets; sin INVIMA no se crea producto; nadie con sesión escribe pedidos ni pagos; cada actor ve solo lo suyo |
| 2026-10-16 | Ruta A en el navegador | Tienda → producto → checkout (2 unidades) → billetera simulada → autorizar → retorno → panel de la caficultora | Pago de $76.000 calculado en el servidor (2 × $38.000), recibo `RCB-…`, pedido `pagado` y pago `completado` en la base; el panel mostró $76.000 cobrado y el pedido |
| 2026-10-16 | Ruta A, caminos no felices | Wallet `javascript:`, billetera con `fail`, botón Rechazar | Los tres terminan con mensaje claro; pagos `fallido`, pedidos `fallido`; el estado pasó por "En curso…" y luego "Falló" |
| 2026-10-16 | Seguridad de la API | 9 peticiones manipuladas a `/api/pagos/iniciar` | Borrador no publicado 404; uuid inválido 400; cantidad 99 400; wallet `javascript:` 400; pagarse a sí mismo 400; no-JSON 415; JSON roto 400. Con `monto` y `walletReceptor` falsos en el cuerpo, el pago salió con el precio de la base ($21.000) y la wallet real de Marta |
| 2026-10-16 | Protección por rol | `curl` con cookies de cada perfil | Sin sesión → `/acceso`; sin INVIMA → `/caficultor`; cooperativa ↔ caficultor redirigidos; cookie falsa → `/acceso`; ids basura → 404/400 |
| 2026-10-16 | XSS y fotos | Producto con `<b>` e `<img onerror>` en nombre y descripción; PNG real; archivo de texto disfrazado de PNG | El HTML se muestra como texto (0 elementos inyectados, el título de la página no cambió); la foto subió a Storage y se ve en la tienda; el archivo falso fue rechazado ("no parece una imagen válida") |
| 2026-10-16 | Secretos | Búsqueda en el bundle del navegador (`.next/static`) y en archivos versionables | La llave de servicio no aparece en el bundle; no hay llaves ni `.env` en el repo |
| 2026-10-16 | Preparación para Vercel | `tsc`, `eslint`, `vitest run` tras cambiar `SITE_URL` | Tipos y lint sin errores; 25/25 pruebas (4 nuevas: localhost, valor manual, preview y producción de Vercel). **El despliegue real no se probó**: requiere las cuentas de Vercel y Supabase del equipo |
| 2026-10-16 | Primer deploy en Vercel (falló) y corrección | Se reprodujo el fallo con `next build` sin `USE_MOCKS`; luego, tras `dynamic = "force-dynamic"` en el layout, build sin `USE_MOCKS`, build con `USE_MOCKS=true`, `tsc`, `eslint`, `vitest` | El error se reprodujo idéntico (`/cooperativa` prerenderizada ejecutaba el stub de `src/auth`). Tras la corrección ambos builds pasan con 17 rutas dinámicas; tipos y lint sin errores; 25/25 pruebas. **El redeploy en Vercel aún no se probó** |
| 2026-10-16 | Ruta B: agente de match | `vitest` sobre `src/lib/match.ts` | 15 pruebas: 3 resultados ordenados, determinista (mismo orden de entrada o invertido), elegibilidad por método/variedad/capacidad, relleno con no elegibles, tildes y mayúsculas, municipio desconocido, puntajes entre 0 y 100. Con el lote de ejemplo (Caturra lavado 500 kg, Marsella) quedan: Aroma del Suroeste 88, Cumbres 87, Raíz Alta 59; Tierra Nueva queda afuera por no recibir Caturra |
| 2026-10-16 | Ruta B: integración con la base | `npm run test:db` (13 pruebas) | Lote ajeno rechazado; cooperativa que no puede comprar o inexistente rechazada; **la oferta se crea solo al elegir** (precio y total del servidor); segunda oferta con una en curso rechazada; pagar sin aceptar 409; aceptar/pagar con otro perfil rechazado; pago con wallet pagadora de la cooperativa, receptora del caficultor y monto de la oferta; completado → oferta `pagada` y lote `vendido`; rechazo del pagador → oferta `fallida` y reintento posible; no se paga dos veces una oferta pagada. Los datos de prueba se borran solos |
| 2026-10-16 | Ruta B en el navegador | Jairo carga lote → top 3 → elige Cumbres → cooperativa demo acepta → paga → billetera simulada → recibo → vista de Jairo | Todo el recorrido funciona: pago de $10.750.000 (500 kg × $21.500) de la wallet de la cooperativa a la de Jairo; oferta `pagada`, lote `vendido`, pago `completado` en la base; Jairo ve "Pagada ✦" y el recibo |
| 2026-10-16 | Ruta B: acceso cruzado | `curl` con cookies de cada perfil | Marta no ve el lote de Jairo (404); cooperativa en `/caficultor/lote` → `/cooperativa`; Jairo en `/cooperativa` → `/caficultor`; sin sesión → `/acceso`; id basura → 404 |
| 2026-10-16 | Verificación completa de la rama | `tsc`, `eslint`, `test:rls` (recrea la base con el seed nuevo), `test:db`, `next build` sin y con `USE_MOCKS` | Tipos y lint sin errores; RLS 35/35; 53/53 pruebas (40 unitarias + 13 de integración); ambos builds pasan |
| 2026-10-16 | Supabase en la nube: carga y verificación | Jennifer ejecutó `cloud-setup.sql` (4 migraciones + seed en una transacción) y luego `supabase/tests/cloud-verify.sql` en el *SQL Editor* del proyecto nuevo | **Los 12 chequeos coinciden con lo esperado**: 7 tablas con RLS, 10 políticas, 2 funciones auxiliares, 3 perfiles, 4 cooperativas, 3 productos (2 publicados), 1 tienda pública, Jairo en Marsella, bucket `productos-fotos` público de 2 MB, `anon` sin escritura en `productos` y con lectura de la vista pública. **La ejecución la hizo una persona** (el agente no tiene acceso a esa cuenta de Supabase) |
| 2026-10-16 | Producción en Vercel (solo lectura) | `curl` al dominio público `terracierta-by-onyx.vercel.app` | Primero daba 500 en `/tienda` y no mostraba el modo demostración: servía un despliegue anterior, sin las variables. Tras el redeploy que hizo Jennifer: modo demostración activo, `/tienda` muestra a Marta con sus 2 productos publicados, el borrador da 404 (el RLS también lo oculta en la nube), `/caficultor` y `/cooperativa` redirigen a `/acceso`, un pago inexistente da 404. **La URL de preview está protegida por el login de Vercel**: el agente no pudo entrar |
| 2026-10-16 | Scripts para la nube (local) | `npm run test:rls`; `cloud:setup` en una base de prueba aparte con stubs de `auth` y `storage`; `cloud:reset` tras ensuciar los datos a propósito | RLS 35/35; `setup` pasa y los 12 chequeos coinciden (y una segunda ejecución falla sin dejar nada a medias); `reset` deja pedidos, pagos, lotes y ofertas en 0, 3 productos, Jairo en Marsella, Marta con INVIMA y el precio original, sin tocar el esquema (7 tablas, 10 políticas) |
| 2026-10-16 | RLS de comportamiento en la nube | Jennifer ejecutó `supabase/tests/rls.sql` en el *SQL Editor* del proyecto de Supabase en la nube (termina en `ROLLBACK`) | **Pasó completo**: devolvió la fila `RLS: todas las pruebas pasaron (transacción revertida)` (las 35 verificaciones con anon, Marta, Jairo y la cooperativa). La ejecución la hizo una persona; el resultado es el que ella pegó |
| 2026-10-16 | Ruta A en producción (Vercel + Supabase en la nube) | Navegador sobre `terracierta-by-onyx.vercel.app`: checkout de 2 unidades → billetera simulada → autorizar → recibo → panel de Marta | Pago de $76.000 (2 × $38.000) completado; la URL de retorno usa el dominio de Vercel (no `localhost`); recibo `RCB-…`; el panel muestra $76.000 cobrado, 1 pago completado y el pedido `Pagado` |
| 2026-10-16 | Fotos y XSS en producción | Producto con `<b>` y un `<img onerror>` en nombre y descripción, más un PNG real, creado y publicado por Marta | El producto se creó y la foto quedó en el bucket `productos-fotos` de la nube (`200`, `image/png`, 70 bytes, firma PNG correcta); el HTML se ve como texto (0 elementos inyectados; en el HTML público aparece escapado como `&lt;b&gt;`); un visitante anónimo, sin cookies, ve el producto publicado y el borrador sigue oculto |
| 2026-10-16 | Ruta B en producción | Jairo carga un lote (500 kg Caturra lavado, Marsella) → top 3 → elige Cumbres → la cooperativa demo acepta → paga → billetera simulada → recibo → historial | El agente da el mismo top 3 que en local (88, 87 y 59); oferta `propuesta` → `aceptada` → `pagada`; pago de $10.750.000 de la wallet de la cooperativa a la de Jairo; la cooperativa ve la oferta en su historial como `Pagada` |
| 2026-10-16 | Caminos no felices y seguridad en producción | 8 peticiones manipuladas a `/api/pagos/iniciar`; `curl` con la cookie de cada perfil; pago con wallet `fail` | Borrador 404, id con inyección SQL 400, cantidad 99 400, wallet `javascript:` 400, pagarse a sí mismo 400, producto inexistente 404, no JSON 415, JSON roto 400; sin INVIMA → `/caficultor`; cada rol redirigido a su home; cookie falsa → `/acceso`; Marta no ve el lote de Jairo (404); ids basura 404/400; el pago con `fail` termina "No se pudo completar" con el motivo y el paso III en rojo |
| 2026-10-16 | Comprador con cuenta: base de datos (local) | `npm run test:rls` (recrea la base con la migración y el seed nuevos) y `cloud-verify.sql` sobre la base local | RLS **46/46** (35 anteriores + 11 nuevas con dos compradores: ve su compra y su pago, no ve lotes ni ofertas, no escribe pedidos directo, no modifica pedidos, no crea productos, y otra compradora no ve la compra ajena); verificación estructural 15/15 con los valores nuevos (11 políticas, 5 perfiles, `pedidos.comprador_id`, rol `comprador`) |
| 2026-10-16 | Comprador con cuenta: pruebas | `tsc`, `eslint`, `vitest` (unitarias) y `npm run test:db` | Tipos y lint sin errores ni avisos; **78/78** pruebas: 57 unitarias (nuevas: `roles.test.ts` con 13 casos de redirección abierta, y que el esquema de checkout descarta una wallet del navegador) y 21 de integración (8 nuevas del checkout: paga con la wallet del perfil, ignora wallet/monto falsos, 403 a caficultor y cooperativa sin crear nada, 409 sin wallet, 404/400 en entradas inválidas, queda en "Mis compras" y no en las de otro, y el comprador con `fail` termina fallido); los datos de prueba se borran solos |
| 2026-10-16 | Comprador con cuenta: navegador (local) | Visitante anónimo → "Entrar para pagar" → `/acceso?siguiente=…` → comprador demo → vuelve al producto → pagar → billetera simulada → recibo → "Mis compras"; luego el comprador cuyo pago falla | Funciona completo: el catálogo se ve sin cuenta, tras entrar vuelve al mismo producto y la wallet sale del perfil (no hay campo de texto); compra de $38.000 completada y en "Mis compras"; el comprador con `fail` termina en "No se pudo completar" |
| 2026-10-16 | Comprador con cuenta: seguridad y roles (local) | `curl` con la cookie de cada perfil | API de checkout: sin sesión 401, cookie falsa 401, caficultora 403, cooperativa 403. `?siguiente=` con `https://evil.test` y `//evil.test` se ignora (va a la home del rol); `/tienda` válido se respeta. `/comprador`: sin sesión → `/acceso`, otros roles → su home; el comprador en `/caficultor`, `/cooperativa` y `/caficultor/lote` → `/comprador`. El panel de pago: anónimo "Entrar para pagar", caficultora y cooperativa "Cambiar de cuenta", comprador "Pagar con Open Payments". Landing, tienda y acceso ya no dicen "sin registro" |
| 2026-10-16 | Comprador con cuenta: migración para la nube | `npm run cloud:update -- 20261017000000_comprador` aplicado sobre una base de prueba que imita la nube actual (migraciones anteriores + seed anterior) | Pasa de 3 a 5 perfiles y de 10 a 11 políticas; los 15 chequeos coinciden; repetirla falla sin dejar nada a medias. Dos builds de producción (con y sin `USE_MOCKS`) pasan; la llave de servicio no aparece en el bundle del navegador. **Todavía no se aplicó en el proyecto de Supabase de la nube**: la ejecuta una persona |
| 2026-10-16 | Comprador con cuenta: migración aplicada en la nube | Jennifer ejecutó `cloud-update.sql` en el *SQL Editor* del proyecto de Supabase y luego `supabase/tests/cloud-verify.sql` (15 chequeos) | **14 de 15 coinciden** (7 tablas con RLS, 11 políticas, 2 funciones, 5 perfiles, 4 cooperativas, 1 tienda pública, Jairo en Marsella, bucket de fotos, `anon` sin escritura, `pedidos.comprador_id`, rol `comprador` admitido, 2 compradores con wallet). El chequeo 7 dio `4 / 3` en vez de `3 / 2`: **no es un error de la migración** sino el producto de prueba "Prueba `<b>nube</b>` & café" que el agente creó y publicó en producción al probar las fotos; lo quita `cloud-reset.sql`. La ejecución la hizo una persona |
| 2026-10-16 | Comprador con cuenta en producción (Vercel + Supabase en la nube) | Tras el merge del PR 6 y el redeploy: navegador sobre `terracierta-by-onyx.vercel.app` con el comprador demo y con el comprador cuyo pago falla; `curl` con la cookie de cada perfil | **Funciona**: el producto pide "Entrar para pagar" al anónimo, `/acceso?siguiente=…` vuelve al mismo producto y la wallet sale del perfil (sin campo de texto); compra de $38.000 completada con recibo `RCB-…` y visible en "Mis compras"; el comprador con `fail` termina en "No se pudo completar" (paso III en rojo, con motivo). Cada comprador ve solo lo suyo (Andrés: 1 pagada; Sofía: 1 fallida). La API de checkout da 401 al anónimo y a una cookie falsa, y 403 a caficultora y cooperativa; `?siguiente=` con `https://evil.test` y `//evil.test` se ignora; cada rol cae en su home. Quedaron 2 pedidos de prueba nuevos en la nube (con `comprador_id`), que quita `cloud-reset.sql` |
| 2026-10-16 | Protección de `main` y `CODEOWNERS` | Configuración aplicada con la API de GitHub y leída de vuelta; `CODEOWNERS` validado con `codeowners/errors` de GitHub | `main` queda con **pull request obligatorio** (0 aprobaciones, no frena a nadie), sin *force push* y sin poder borrarse; **no incluye administradores** (Jennifer puede saltarla en una emergencia). La API confirma `main` como protegida. `CODEOWNERS` sin errores: `src/payments/` → Yamil (`@0x15k`), `src/auth/` → Álvaro (`@ahenao1256`), el contrato `src/adapters/types.ts` → Jennifer, Yamil y Álvaro. **No se probó con una cuenta sin permisos de administrador** que un push directo a `main` sea rechazado: se verificó la configuración, no el rechazo |

### Lo que falló y lo que se corrigió

0. **Primer deploy en Vercel falló** ("Error occurred prerendering page /cooperativa"): sin `USE_MOCKS=true` en el entorno, el build ejecutó el stub de `src/auth`, que lanza error, al prerenderizar una página que depende de la sesión. Se marcó la app como dinámica (`src/app/layout.tsx`). Aparte, para ver la demo en Vercel hay que cargar `USE_MOCKS=true` y las variables de Supabase y redeployar.

1. **Recursión infinita en RLS** (`lotes` ↔ `ofertas`): lo destapó `test:rls` en la primera corrida. Se corrigió con dos funciones `security definer` que cortan el ciclo; se recreó la base y las 35 verificaciones pasan.
2. **Scaffold con Cache Components activado** (`cacheComponents`, `partialPrefetching`): obliga a envolver todo dato dinámico en Suspense. Se desactivó.
3. **Turbopack tomaba un `package-lock.json` ajeno** (`C:\Users\jsala`): se fijó `turbopack.root`.
4. **`dev-local.mjs` fallaba al lanzarse desde otra carpeta**: no encontraba el proyecto de Supabase. Se fijó el `cwd` a la raíz del proyecto.
5. **`test:rls` dependía del seed limpio** y falló tras las pruebas manuales ("obtuvo 3, esperaba 2"). Ahora recrea la base antes de correr.
6. **Cifras de Cormorant** (el "1" parecía una "I"): se activó `lining-nums`; verificado en la landing.
7. **Error mío al probar:** un selector tocó el botón "Salir" del encabezado en vez del formulario; se repitió la prueba bien.
8. **Docker Desktop estaba apagado**; se lanzó a mano y tardó varios minutos en responder.
9. **Bloqueo de permisos:** no se pudo escribir `.env.example` (la regla del entorno veta archivos `.env*`). **Pendiente** que una persona del equipo lo cree con las variables de `README.md`.
10. **Ruta B:** (a) una prueba mía fallaba por esperar minúscula en un texto que empieza en mayúscula; (b) el runner de pruebas (Node 20, sin `WebSocket` nativo) no podía crear el cliente de Supabase: se agregó un reemplazo vacío solo en la prueba, porque la app no usa realtime; (c) el botón del recibo de un pago de oferta decía "Seguir mirando café": ahora el destino y el texto salen del tipo de pago.

11. **Supabase en la nube:** la CLI de esta computadora tenía la sesión de **otra cuenta** de Supabase y no veía el proyecto nuevo (la API del proyecto sí respondía). En vez de forzar un cambio de cuenta o usar contraseñas, el agente armó un solo script SQL (migraciones + seed) y un script de verificación para el *SQL Editor*. No pudo probarlo antes en una base de prueba local porque Docker se apagó y la sesión se reinició; el SQL es el mismo que ya había pasado las pruebas locales y el resultado en la nube coincide con lo esperado.

12. **Falso positivo en producción:** una foto recién subida figuró "sin cargar" (`naturalWidth` 0) en el listado. No era un fallo: la imagen tiene `loading="lazy"` y el panel del navegador no la pinta fuera de pantalla. Se comprobó con una descarga directa (200, PNG válido) y forzando la carga del elemento real (ancho 1).
13. **Datos de prueba en la nube:** el recorrido dejó filas de prueba en el proyecto de Supabase (2 pedidos, 3 pagos, 1 lote, 1 oferta, 1 producto) y **1 archivo en Storage**. Las filas se quitan con `npm run cloud:reset` (generado en `supabase/.temp/`); el archivo de Storage hay que borrarlo a mano desde el panel de Storage.

14. **Cambio de producto a mitad del proyecto:** el brief decía "comprador sin registro". Jennifer corrigió que todos necesitan cuenta para tener su wallet. Como cambia el contrato con el login, el agente no tocó el código hasta que ella decidió el alcance (catálogo público, login solo al pagar), según la regla de `AGENTS.md` de bloquear ante ambigüedad que cambia el alcance.

### Sin probar todavía

- **Comprador con cuenta:** ya está probado en local y en producción (ver el Verification Log). Lo que falta es probarlo con el **login real**, que hoy es el simulado.
- **Comprador con el login real:** solo se probó con el login simulado; el compañero de login debe admitir el rol, asignar wallet y respetar `?siguiente=`.

- **En la nube solo se verificó la estructura** (tablas, RLS, políticas, funciones, datos, bucket, permisos de `anon`). Las 35 pruebas de comportamiento de RLS (`test:rls`) y la Ruta A/B completas **no se han corrido contra Supabase en la nube**.

- Edición de un producto ajeno **desde la interfaz** con un segundo caficultor con INVIMA (cubierto solo por el filtro `dueno_id` del código y por RLS en SQL).
- Ruta B con **perfiles reales** (solo se probó con el login simulado) y con el pago real de Open Payments.
- Doble pago de una oferta con el módulo **real**: un pago pendiente abandonado no se cancela; con el mock no hay riesgo, con dinero real hay que revisarlo al integrar.
- Las coordenadas de los municipios del agente: aproximadas, sin contrastar con una fuente.
- Integración real de pagos y login.
- Accesibilidad con lector de pantalla y vista móvil real (solo se vio el ancho del panel del navegador).

## Prompt Log

Ver [`/prompts/`](./prompts/) (un archivo por área):
- [`inicio.md`](./prompts/inicio.md) — mensaje inicial completo.
- [`base-y-datos.md`](./prompts/base-y-datos.md) — aprobación del plan y arranque de la construcción.
- [`tienda-checkout.md`](./prompts/tienda-checkout.md) — verificación de la Ruta A.
- [`git-y-repo.md`](./prompts/git-y-repo.md) — repo propio y publicación en GitHub.
- [`despliegue-vercel.md`](./prompts/despliegue-vercel.md) — preparación para desplegar en Vercel.
- [`ruta-b-agente.md`](./prompts/ruta-b-agente.md) — Ruta B: agente de match, oferta y pago de la cooperativa.
- [`readme-docs.md`](./prompts/readme-docs.md) — merge de la Ruta B y rediseño del README.
- [`supabase-nube.md`](./prompts/supabase-nube.md) — carga y verificación de Supabase en la nube.
- [`comprador-con-login.md`](./prompts/comprador-con-login.md) — el comprador también inicia sesión y paga con su wallet de perfil.

## Security

- Repo público: sin llaves, tokens ni `.env.local`. Las variables necesarias son solo nombres en `README.md` / `.env.example` (pendiente de crear, ver arriba).
- Nada de secretos en `/prompts` ni en este archivo.
