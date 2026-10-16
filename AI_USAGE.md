# AI Usage Disclosure

Proyecto: **Terracierta by Onyx** — Hackatón Open Payments Medellín 2026.
Última actualización: 2026-10-16 — pasos 1 y 2 del orden de construcción + Ruta A (tienda, checkout contra mock, panel de pagos).

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
- `src/app/caficultor/lote/page.tsx` y `src/app/cooperativa/page.tsx` son **marcadores** de la Ruta B (aún sin construir).

### 8. Identidad visual y páginas (`src/app/globals.css`, `layout.tsx`, `page.tsx`, `src/components/cabecera.tsx`, `pie.tsx`, `src/app/acceso/**`)
- IA: tokens de Terracierta (brief §5.1 y valores medidos en la landing viva), fuentes, landing, acceso. No se crearon logos ni ilustraciones.

### 9. Validación y seguridad (`src/lib/validacion.ts`, `validacion.test.ts`)
- IA: esquemas zod, wallet address, URLs seguras, 21 pruebas.

### 10. Documentación (`README.md`, `AI_USAGE.md`, `prompts/*`)
- IA: redactados por el agente; pendientes de revisión humana.

## Files with minimal or no AI

- `src/payments/...` — **servicio real de Open Payments: compañero de pagos.** (Hoy solo existe el stub del punto 3.)
- `src/auth/...` — **login y asignación de wallets: compañero de login.** (Hoy solo existe el stub del punto 3.)

> Cuando los compañeros entreguen, se listan aquí sus rutas exactas y cuánta IA usaron, por separado.

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

### Lo que falló y lo que se corrigió

1. **Recursión infinita en RLS** (`lotes` ↔ `ofertas`): lo destapó `test:rls` en la primera corrida. Se corrigió con dos funciones `security definer` que cortan el ciclo; se recreó la base y las 35 verificaciones pasan.
2. **Scaffold con Cache Components activado** (`cacheComponents`, `partialPrefetching`): obliga a envolver todo dato dinámico en Suspense. Se desactivó.
3. **Turbopack tomaba un `package-lock.json` ajeno** (`C:\Users\jsala`): se fijó `turbopack.root`.
4. **`dev-local.mjs` fallaba al lanzarse desde otra carpeta**: no encontraba el proyecto de Supabase. Se fijó el `cwd` a la raíz del proyecto.
5. **`test:rls` dependía del seed limpio** y falló tras las pruebas manuales ("obtuvo 3, esperaba 2"). Ahora recrea la base antes de correr.
6. **Cifras de Cormorant** (el "1" parecía una "I"): se activó `lining-nums`; verificado en la landing.
7. **Error mío al probar:** un selector tocó el botón "Salir" del encabezado en vez del formulario; se repitió la prueba bien.
8. **Docker Desktop estaba apagado**; se lanzó a mano y tardó varios minutos en responder.
9. **Bloqueo de permisos:** no se pudo escribir `.env.example` (la regla del entorno veta archivos `.env*`). **Pendiente** que una persona del equipo lo cree con las variables de `README.md`.

### Sin probar todavía

- Edición de un producto ajeno **desde la interfaz** con un segundo caficultor con INVIMA (cubierto solo por el filtro `dueno_id` del código y por RLS en SQL).
- Ruta B completa y pago de la cooperativa (aún no construidos).
- Integración real de pagos y login.
- Accesibilidad con lector de pantalla y vista móvil real (solo se vio el ancho del panel del navegador).

## Prompt Log

Ver [`/prompts/`](./prompts/) (un archivo por área):
- [`inicio.md`](./prompts/inicio.md) — mensaje inicial completo.
- [`base-y-datos.md`](./prompts/base-y-datos.md) — aprobación del plan y arranque de la construcción.
- [`tienda-checkout.md`](./prompts/tienda-checkout.md) — verificación de la Ruta A.
- [`git-y-repo.md`](./prompts/git-y-repo.md) — repo propio y publicación en GitHub.
- [`despliegue-vercel.md`](./prompts/despliegue-vercel.md) — preparación para desplegar en Vercel.

## Security

- Repo público: sin llaves, tokens ni `.env.local`. Las variables necesarias son solo nombres en `README.md` / `.env.example` (pendiente de crear, ver arriba).
- Nada de secretos en `/prompts` ni en este archivo.
