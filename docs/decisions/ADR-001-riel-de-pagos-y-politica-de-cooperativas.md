# ADR-001 — Riel de pagos reales y política de las cooperativas

**Estado:** Borrador (no vinculante hasta que Jennifer Salazar Duke lo acepte)
**Fecha:** 2026-10-17
**Autores:** Dev System (agente de IA), a pedido de Jennifer Salazar Duke. Revisión humana pendiente.

> Este documento **propone**; no decide. Ningún agente lo promueve a *Aceptado* por iniciativa propia (AGENTS.md §6).
> Lo que está marcado **[verificado]** se comprobó leyendo el código o corriendo algo; **[según el documento de Yamil]** viene de
> `docs/handoff-pasarela-login.md` (commit `f18a7e7`) y no lo comprobé de forma independiente; **[no verificado]** es una hipótesis.

---

## Contexto

`main` (`f9ab6ea`) funciona **con pagos y acceso simulados** (`USE_MOCKS=true`): tipos, lint, 86 pruebas unitarias, 115 con base de datos, 46 de RLS y los dos
builds pasan **[verificado]**. Los módulos reales (`src/payments` de Yamil y `src/auth` de Álvaro) llegaron el 17-oct, se fusionaron en `main` (PR 28–31,
08:10–08:16 UTC) y se **revirtieron** 30 minutos después (PR 32). El motivo del revert no está escrito. Hoy el trabajo vive en el PR 33
(`feat/integracion-ajustes`, 140 archivos, ~+8.000 líneas; tres commits: `53671f2`, `5aa6b81` y el merge del PR 34).

El PR 33 mezcla **dos rieles de pago incompatibles**:

| | Riel A — SDK oficial + GNAP (Yamil) | Riel B — API web de Test Wallet con cookie (PR 28) |
|---|---|---|
| Dónde | `src/payments/openPayments.ts`, `sdkAdapter.ts`, `settlement.ts`, `gateway.ts` | `src/lib/interledger.ts`, `src/payments/index.ts`, `src/adapters/payments.ts` |
| Cómo paga | Cotiza, pide un permiso (*grant*) GNAP y el **titular lo aprueba en su wallet** | Entra a Test Wallet con una cookie y hace `POST /quotes` y `POST /outgoing-payments` |
| Quién autoriza | El titular de la wallet pagadora | Nadie: usa la cookie guardada en `usuarios.token` o, si no hay, **entra con `INTERLEDGER_EMAIL`** (una cuenta compartida) |
| Con `USE_MOCKS=true` | Simula | **Paga de verdad** si las dos wallets son de `interledger-test.dev` (`adapters/payments.ts`) |

Hechos **[verificados]** leyendo `origin/feat/integracion-ajustes`:
- `src/lib/interledger.ts` sigue ahí (592 líneas) y llama a `/quotes` y `/outgoing-payments` con cookie.
- `adapters/payments.ts` decide "pago real" por el **dominio de la wallet**, no por una configuración explícita.
- El título del commit `5aa6b81` dice "las cooperativas … pagan con su cookie"; su diff muestra en el panel de la cooperativa el aviso de si la cuenta "ya tiene la cookie de la billetera". Apunta a **seguir usando** el riel B.

**[Según el documento de Yamil]** el riel con cookie "fue retirado porque el usuario reportó movimiento de fondos al llamar `/quotes`", y la pasarela
"conserva el consentimiento del estándar". Es decir: el propio autor del riel A documentó que el riel B no es una alternativa válida.

**Estado del riel A [según el documento de Yamil]:** estado, grants y llaves PQC viven **en memoria de un proceso**; "no desplegar con varias
réplicas/serverless sin persistir estado". Vercel es serverless. **[No verificado]** que el flujo GNAP completo funcione en Vercel; el documento
tampoco lo valida con login real ("Pendiente de validación real").

### Política de cooperativas: dos cambios distintos, hoy mezclados

1. **¿Pueden las cooperativas *comprar productos* de una tienda (Ruta A)?**
   - `main`: **no**. `pagos-service.ts` responde 403 si el rol no es `comprador`, y `checkout.db.test.ts` lo fija con una prueba **[verificado]**.
   - PR 33: **sí** (`comprador` o `cooperativa`) en `pagos-service.ts` y `checkoutHandlers.ts` **[verificado]**. Pero la prueba de Yamil
     `checkout.integration.test.ts` ("la cooperativa … no puede usar el inicio de comprador") sigue exigiendo 403 y **falla**.
   - No hay pantalla de compras para cooperativas: `/comprador` exige el rol comprador **[verificado]**.
2. **¿Todas las cooperativas tienen cuenta para aceptar y pagar ofertas (Ruta B)?**
   - `main`: solo la **cuenta demo** (Cumbres) acepta y paga; las otras tres son datos precargados (README, "Cooperativas sin cuenta").
   - `5aa6b81`: **siete** cooperativas con perfil, wallet de ejemplo (`wallet.example.test`) y cuenta simulada; el seed y una verificación de RLS
     pasan de "4 cooperativas" a "7" **[verificado]**. **[No verificado]** que `test:rls` y `test:db` sigan pasando con ese seed.

## Decisión de Jennifer (2026-10-17, dada en el chat)

> Este bloque registra lo que Jennifer decidió. **El ADR sigue en *Borrador***: pasarlo a *Aceptado* requiere que ella lo confirme (AGENTS.md §6).

1. **Riel oficial hoy: el de cookie (riel B)**, el que ya corre en `main` y en producción (`src/lib/interledger.ts`, `src/payments/index.ts`).
2. **El SDK oficial + GNAP (riel A) queda como camino futuro**, no retirado: `src/payments/openPayments.ts`, `sdkAdapter.ts`, `settlement.ts`, `gateway.ts` y la pasarela `/pago/pasarela` se conservan, pero **no son el riel del checkout**. Mientras tanto, la pasarela sigue desactivada en producción (`/api/pasarela/key` responde 503).
3. **Política de cooperativas = la del código actual [verificado]**: pueden pagar **ofertas** y también **comprar productos** de la tienda (`pagos-service.ts` y `checkoutHandlers.ts` aceptan `comprador` o `cooperativa`); el caficultor no puede iniciar pagos. Los tests se ajustaron a esto (PR 41).
4. **Cooperativas con cuenta:** las siete quedan como datos de ejemplo, como estaba cargado en la base.

### Qué cambia en los tests (PR 41)
- `src/payments/index.test.ts`: ahora prueba el riel de cookie (mock de `@/lib/interledger`), no el SDK.
- `src/payments/railPolicy.test.ts`: el contrato del checkout comprueba que, sin poder entrar a la billetera, **no se llama a la API ni se envía dinero**.
- `src/payments/checkout.integration.test.ts`: la cooperativa puede iniciar su oferta y también comprar; el comprador no puede iniciar una oferta.
- Los tests de la pasarela (`gateway`, `openPayments`, PQC) siguen cubriendo el riel A tal cual.

### Riesgos que se aceptan con el riel de cookie (siguen abiertos)
- Sin consentimiento del titular: se usa la cookie de `usuarios.token` o, si falta, la cuenta compartida `INTERLEDGER_EMAIL`.
- **[Según Yamil]** llamar a `/quotes` por la API web movió fondos de prueba; el límite de 25 EUR y el control de 30 EUR de `pagarEntreBilleteras` son la única protección.
- `adapters/payments.ts` decide el pago real por el **dominio de la wallet**; con `USE_MOCKS=true` puede pagar de verdad. Conviene una bandera explícita.
- Cookies de wallet guardadas en la base (`usuarios.token`): la tabla no es legible desde el navegador (RLS sin políticas).
- Hay comentarios y mensajes en `settlement.ts` que dicen que el riel de cookie está "retirado": describen la pasarela, no el checkout, y pueden confundir.

### Condición de migración al riel A
Se pasa al SDK/GNAP cuando: (a) el estado de grants y llaves PQC esté **persistido** (hoy vive en memoria, incompatible con Vercel serverless), (b) exista una wallet receptora en COP o un contrato de conversión, y (c) el flujo complete un pago real con login real. Hasta entonces, no se toca.

## Propuesta original del agente (superada por la decisión de arriba)

1. **Un solo riel de pagos reales: el SDK oficial de Open Payments con GNAP y consentimiento del titular (riel A).** El riel con cookie (B) sale del flujo de
   pagos: se elimina `src/lib/interledger.ts` del camino de `iniciarPago`, se deja de guardar cookies de wallet en `usuarios.token` y se retira el
   inicio de sesión con `INTERLEDGER_EMAIL`.
2. **El pago real nunca se activa por inferencia.** `USE_MOCKS=true` significa "ningún pago real". El riel real se activa **solo** con una configuración
   explícita (por ejemplo `PAYMENTS_RAIL=open-payments` y `USE_MOCKS=false`), no por el dominio de la wallet.
3. **Cooperativas, pregunta 1: se mantiene la regla de `main`.** Las cooperativas **no compran productos de tienda**; su flujo de pago es el de las
   **ofertas** (`/api/pagos/oferta`). Se revierte la ampliación `comprador`/`cooperativa` del PR 33.
4. **Cooperativas, pregunta 2 (pendiente de decisión de Jennifer):** recomiendo **aceptar** que las siete tengan cuenta **solo como datos de ejemplo**
   (seed + cuentas simuladas de `5aa6b81`), condicionado a que `test:rls` y `test:db` pasen, y **sin** su parte de "pagar con su cookie".

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| Dejar ambos rieles y elegir por `PAYMENTS_RAIL` o por el dominio de la wallet | Doble superficie de pago real; el PR 33 ya los mezcla y el comportamiento depende de un nombre de dominio. Un error de configuración mueve dinero. |
| **Riel B (cookie de Test Wallet) como único riel** *(elegida por Jennifer para hoy; ver "Decisión de Jennifer")* | No hay consentimiento del titular; usa una cuenta compartida; guarda cookies de wallet en la base; usa un endpoint que, según Yamil, movió fondos al cotizar; paga real con `USE_MOCKS=true`. Contradice la promesa del producto ("de wallet a wallet, con consentimiento"). |
| Solo mocks para la entrega (sin riel real) | Es la **contingencia** (ver el plan), no una decisión de fondo: sirve para entregar hoy, pero el brief pide el ciclo con Open Payments. Compatible con la propuesta 1. |
| Permitir que las cooperativas compren productos (política del PR 33) | Es un cambio de modelo no pedido: sin pantalla de compras, sin prueba que lo respalde y contradice una prueba existente. Si se quiere, merece su propio ADR. |

## Consecuencias

**Positivas:**
- Una sola forma de mover dinero, con consentimiento explícito, auditable en un solo lugar (`src/payments`).
- Un error de configuración ya no puede pagar de verdad por accidente.
- Se eliminan credenciales de wallet guardadas en la base.

**Negativas o trade-offs:**
- Hay que **reintegrar** la parte de pagos de la rama (checkout, ofertas, `pago-oferta.tsx`) sobre el riel A y borrar el B: trabajo real antes de la entrega.
- El riel A exige llaves y una wallet receptora en la moneda del precio (COP) o un contrato de conversión; **[según Yamil]** hoy solo hay una wallet de demo en EUR.
- Se pierde la pantalla de saldos/movimientos de `billetera-interledger.tsx`, que depende del riel B.

**Pendientes o riesgos:**
- **Persistencia del estado del riel A** (en memoria) vs. Vercel serverless: sin resolverlo, el flujo real puede no completarse en producción. Alternativa de demo: ejecutarlo en local (`127.0.0.1:3100`, como indica Yamil).
- **No hay validación con login real ni pago real completo** **[según Yamil]**.
- Quien reintegre debe conservar el trabajo de login de Álvaro y no sobrescribir módulos completos al resolver conflictos.
- Falta declarar en `AI_USAGE.md` el uso de IA de los compañeros (un commit trae `Co-authored-by: Cursor`); no lo declararon todavía.

## Tipo de decisión
- [ ] operacional
- [x] estructural candidata a ADR

## Estado de madurez
- [x] provisional
- [ ] validada
- [ ] escalar a ADR

## Referencias

- Plan de integración: [`docs/planes/integracion-prs-encadenados.md`](../planes/integracion-prs-encadenados.md).
- Documentos de Yamil (en el historial, commit `f18a7e7`): `docs/handoff-pasarela-login.md`, `docs/pasarela-hackathon.md`, `docs/investigacion-pagos-pqc.md`, `docs/planes/cierre-pasarela.md`.
- PR de origen: 28, 29, 30, 31 (fusionados), 32 (revert), 33 (abierto), 34 (arreglo del build, fusionado en la rama del 33).
- Commits: `750cb95` (Yamil, riel A), `bf6fa2b` (pagos con cookie), `5aa6b81` (cooperativas con cookie).
- Contrato: `src/adapters/types.ts`. Prueba que fija la política actual: `src/lib/checkout.db.test.ts`.
