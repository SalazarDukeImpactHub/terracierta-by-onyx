# Plan: integrar el trabajo de pagos y cuentas en PRs encadenados

**Estado:** Borrador, a validar por Jennifer Salazar Duke. **Fecha:** 2026-10-17. **Relacionado:** [ADR-001](../decisions/ADR-001-riel-de-pagos-y-politica-de-cooperativas.md).

## Por qué no se fusiona el PR 33 tal cual

El PR 33 (`feat/integracion-ajustes`) tiene **140 archivos y ~+8.000 líneas** juntos: pasarela, login, pagos, panel del caficultor, migraciones, documentos y scripts.
Nadie puede revisarlo entero, y ya hubo un intento igual (PR 28–31) que se **revirtió a los 30 minutos**. Además trae problemas conocidos:

- Dos rieles de pago incompatibles (ver ADR-001) y una política de cooperativas que contradice una prueba.
- Migración con versión duplicada: `20261017000000_comprador.sql` y `20261017000000_usuarios.sql`.
- 4 pruebas rojas y un archivo que no arranca (`jsdom` falta en `package.json`); falta `pagos-service.security.test.ts`.
- Sin `AI_USAGE.md`, `README` ni `.env.example` actualizados.

`main` (`f9ab6ea`) hoy está sano y desplegado. **Regla del plan: nada entra a `main` sin pasar todas las puertas de abajo.**

## Reloj

- Entrega: **sábado 17-oct-2026, 11:00 (hora Colombia)**. Al escribir esto eran ~06:30: quedan unas 4 h 30 min.
- Por eso hay **dos caminos**. Se decide en el *punto de control de las 08:30*.

| Camino | Qué se entrega | Cuándo elegirlo |
|---|---|---|
| **A. Mínimo seguro** | `main` actual (todo simulado, verificado) **declarado como simulación** + la pasarela de Yamil aislada (PR-1) como evidencia del riel real | Si a las 08:30 PR-1 no está verde o hay dudas sobre el riel |
| **B. Integración completa** | La cadena PR-1 → PR-5 | Solo si PR-1 y PR-2 están verdes a las 08:30 y las decisiones del ADR están tomadas |

## La cadena

Cada PR sale **desde `main` actualizado** (o desde el PR anterior ya fusionado), es pequeño, y trae sus propias pruebas y documentación.
Quién escribe cada uno sigue `CODEOWNERS`: pagos → Yamil, auth → Álvaro, contrato `src/adapters/types.ts` → los tres. El Dev System verifica y documenta.

| PR | Contenido (archivos del PR 33) | Depende de | Riesgo |
|---|---|---|---|
| **PR-0** (este) | ADR-001 y este plan. Solo documentos | — | Ninguno |
| **PR-1a** Núcleo de la pasarela | `src/payments/` **sin** `index.ts`, `sdkAdapter.ts` ni `checkout*`: `gateway*`, `openPayments*`, `amounts*`, `pqc/*`, `pqc*Demo`, `pqcProof`, `paymentProgress`, `settlement`; `package.json` y lockfile (SDK, `@noble/*`, `jsdom`), `next.config.ts` | PR-0 | Medio: dependencias nuevas |
| **PR-1b** Pantallas de la pasarela | `src/app/pago/pasarela/*`, `src/app/pago/seguridad`, `src/app/api/pasarela/*`, `src/components/flujo-pago*`, `public/pqc`, `scripts/quantum`, `scripts/verify-pqc-native.mjs`, documentos de Yamil | PR-1a | Bajo: rutas nuevas, no tocan la tienda |
| **PR-2** Cuentas y login | `src/lib/sesion.ts`, `contrasena.ts`, `supabase/{browser,server,update-session}.ts`, `src/proxy.ts`, `src/auth`, `adapters/{auth,mocks/auth,types}.ts`, `acceso/*`, `registro`, `formulario-registro`, `validacion`; migraciones `usuarios` y `documento` **renumeradas** | PR-0 | **Alto**: cambia el acceso de todos los roles |
| **PR-3** Checkout real sobre el riel único | `src/payments/{index,sdkAdapter,savedAuthorization,railPolicy,checkout*}`, `adapters/payments.ts`, `pagos-service.ts`, `api/pagos/{iniciar,key,oferta}`, `pago-oferta`, `formulario-checkout`; **se elimina** `lib/interledger.ts` y `billetera-interledger.tsx`; se restablece la regla "la cooperativa no compra productos" | PR-1a, PR-2 y la decisión del ADR | **Alto**: mueve dinero |
| **PR-4** Panel del caficultor | `src/app/caficultor/*`, `menu-caficultor`, `campo-archivo`, `catalogo.ts`, migración `tienda` | PR-2 | Medio: cambia pantallas ya verificadas |
| **PR-5** Cooperativas de ejemplo con cuenta | Solo los **datos** de `5aa6b81`: `seed.sql`, `mocks/auth.ts`, `rls.sql` y `cloud-verify.sql` con "7 cooperativas" | PR-2 y la decisión del ADR | Bajo si `test:rls` y `test:db` pasan |

Los nombres de archivo salen del diff real de `origin/feat/integracion-ajustes` contra `main`. **[A confirmar con `tsc`]** que PR-1a compila sin `index.ts` ni `sdkAdapter.ts`; si no, esos archivos se mueven a PR-1a.

## Puertas que cada PR debe pasar antes de fusionarse

1. `tsc --noEmit` y `eslint` sin errores.
2. `vitest run`, con **Node 22** (el SDK de Supabase ya lo exige; con Node 20 fallan pruebas por `WebSocket`).
3. `npm run test:db` y `npm run test:rls` (46 verificaciones, o las que correspondan si se amplía el seed) contra la base local, con Docker arriba.
4. `next build` **con y sin `USE_MOCKS`**, y búsqueda de llaves en `.next/static`.
5. Versiones de migración **únicas** (`ls supabase/migrations | sed 's/_.*//' | sort | uniq -d` debe salir vacío).
6. Vista previa de Vercel en verde.
7. `AI_USAGE.md` (herramientas, archivos, prompts y resultados reales, también de los compañeros: hay commits con `Co-authored-by: Cursor`) y `prompts/` al día.
8. Sin secretos en el repo. **`.env.example` lo actualiza una persona**: el agente no puede escribir archivos `.env*`.

## Base de datos en la nube (antes de desplegar cada PR que la toque)

- Las migraciones nuevas se aplican **primero** en Supabase (con `npm run cloud:update -- <migración>`, que genera el SQL para el *SQL Editor*) y se verifican con `cloud-verify.sql`.
- Si el código llega antes que las tablas, el login muestra "La base todavía no tiene la tabla de usuarios" y nadie entra.
- Orden propuesto de versiones: `comprador` (ya aplicada) → `usuarios` `20261018000000` → `documento` `20261018000100` → `tienda` `20261019000000`.
- **Antes de presentar**: `cloud-reset.sql` y borrar la foto de prueba de Storage (siguen pendientes de Jennifer).

## Reloj sugerido (hora Colombia; ajustar)

| Hora | Qué |
|---|---|
| 06:30–07:00 | Jennifer decide el ADR-001 (riel único y política de cooperativas) |
| 07:00–08:30 | PR-1a y PR-1b: verificación y fusión |
| **08:30** | **Punto de control:** elegir camino A o B |
| 08:30–09:45 | (solo B) PR-2 y PR-3 |
| 09:45 | Congelar: no entran cambios nuevos |
| 09:45–10:30 | Verificación final en producción, README y `AI_USAGE.md` |
| 10:30–11:00 | Ensayo de la demostración y entrega |

## Qué NO hacer

- No fusionar el PR 33 completo ni hacer `git revert` del revert a ciegas: devuelve los mismos problemas.
- No empujar a `main` ni forzar nada (`main` está protegida; no se usa `push --force` ni `reset --hard`).
- No activar pagos reales sin la configuración explícita del ADR ni sin consentimiento del titular.
- No presentar como validado lo que solo se probó con simulaciones: el riel real **no está validado con login ni pago completo** **[según Yamil]**.

## Qué dejar dicho en la presentación

Mientras algo siga simulado hay que **decirlo**: la página principal ya no muestra aviso de modo demostración (se quitó a pedido de Jennifer), así que quien mire solo la tienda puede creer que los pagos son reales.
