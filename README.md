# Terracierta by Onyx

> **Café con nombre propio.** Cada caficultor recibe una wallet propia y cobra directo con Open Payments: vendiendo en su tienda (con INVIMA) o a la mejor cooperativa que le recomienda un agente (sin INVIMA).
> Proyecto del **Hackatón Open Payments · Medellín 2026**.

## Estado

| Pieza | Estado |
|---|---|
| Ruta A: tienda, checkout, retorno de pago, panel de pagos | Funciona localmente con **pagos y login simulados** (mocks) |
| Tablas, RLS y datos semilla (Supabase) | Aplicados y probados (ver `AI_USAGE.md`) |
| Pagos reales (Open Payments) | Lo entrega el compañero de pagos en `src/payments` — hoy es un stub |
| Login real y asignación de wallets | Lo entrega el compañero de login en `src/auth` — hoy es un stub |
| Ruta B: lote, agente top 3, oferta, pago de la cooperativa | Pendiente (las tablas ya existen) |

## Cómo correrlo

Requisitos: Node 20+ (se recomienda 22), Docker Desktop abierto.

```bash
npm install
npx supabase start        # base de datos y Storage locales; aplica migraciones y seed
npm run dev:local         # la página en http://localhost:3000 (PORT=3100 npm run dev:local para otro puerto)
```

`dev:local` lee las llaves **locales** de `supabase status` y las pasa solo al proceso de Next. No hace falta crear ningún `.env`.

En `/acceso` hay tres perfiles de ejemplo: caficultora con INVIMA, caficultor sin INVIMA y cooperativa demo.

### Probar la Ruta A

1. `/tienda` → tienda de Marta Ospina → un producto → poner una wallet de comprador (por ejemplo `$wallet.example.test/yo`) → **Pagar**.
2. En la pantalla de billetera simulada: **Autorizar** (o **Rechazar**).
3. La pantalla de retorno muestra *Solicitud → Autorización → Ejecución → Finalización* y el recibo.
4. Entrar como Marta → **Pedidos y pagos recibidos**.
5. Para ver un pago fallido, usá una wallet de comprador que contenga `fail` (ej. `$wallet.example.test/fail-yo`).

### Pruebas

```bash
npm run typecheck
npm test            # validación y escape de datos (vitest)
npm run test:rls    # pruebas de RLS contra la base local (necesita `supabase start`)
npm run db:reset    # recrea la base desde las migraciones y el seed
```

## Cómo está armado

```
supabase/        migraciones (tablas, RLS, vista pública, Storage), seed.sql, tests/rls.sql
src/app/         rutas (landing, acceso, caficultor, tienda, cooperativa, pago, api/pagos)
src/components/  componentes con los tokens de Terracierta
src/lib/         validación (zod), escape de URLs, clientes de Supabase, servicio de pagos de la página
src/adapters/    CONTRATOS + mocks + selector USE_MOCKS  ← la interfaz solo habla con esto
src/payments/    STUB — del compañero de pagos
src/auth/        STUB — del compañero de login
```

### Adaptadores y `USE_MOCKS`

Toda integración externa pasa por `src/adapters/`. `USE_MOCKS=true` usa los mocks; **cualquier otro valor (o ausente) usa los módulos reales** de `src/payments` y `src/auth`, para que un despliegue olvidado no simule pagos en silencio.

- Pagos (`src/adapters/types.ts`): `iniciarPago({ tipo, referenciaId, montoCop, walletReceptor, walletPagador, urlRetorno })` → `{ pagoId, redirectUrl | null, estado }` y `consultarPago(pagoId)` → `{ estado, detalle }`.
- Login: `obtenerSesion()`, `obtenerPerfil()`, `cerrarSesion()`; `requerirRol(rol)` protege rutas.
- La ruta de retorno es `/pago/retorno?tipo=…&ref=…&pago_id=…`. Si la billetera vuelve sin `pago_id`, se resuelve por `tipo` + `ref`.

### Lista de integración

1. Implementar `src/payments/index.ts` y/o `src/auth/index.ts` según los contratos y poner `USE_MOCKS=false`.
2. Reemplazar la tabla provisional `profiles` (migración `…_profiles_provisional.sql`) por la real, con las mismas columnas.
3. Acordar quién escribe `profiles.tiene_invima` (hoy lo hace la página con `declararInvima`).
4. Correr la Ruta A completa y registrar en `AI_USAGE.md` qué se integró y qué se ajustó.

## Desplegar en Vercel (para que todo el equipo vea los cambios)

Vercel no puede llegar al Supabase de tu computador, así que hace falta un proyecto de Supabase en la nube. Lo hace una persona con acceso a las cuentas; **las llaves se escriben solo en los paneles, nunca en el repo ni en chats**.

1. **Supabase en la nube:** crear un proyecto en supabase.com y, en *Project Settings → API*, tener a mano la URL, la `anon key` y la `service_role key`.
2. **Cargar esquema y datos de ejemplo** (pide iniciar sesión y la contraseña de la base):
   ```bash
   npx supabase login
   npx supabase link --project-ref <REF_DEL_PROYECTO>
   npx supabase db push --include-seed
   ```
3. **Vercel:** *Add New → Project* → importar `SalazarDukeImpactHub/terracierta-by-onyx` (framework Next.js, carpeta raíz).
4. **Variables de entorno** (*Settings → Environment Variables*, en Production y Preview):

   | Variable | Valor |
   |---|---|
   | `USE_MOCKS` | `true` (hasta integrar los pagos y el login reales) |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon key` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role key` (marcarla como *Sensitive*) |

   No hace falta `NEXT_PUBLIC_SITE_URL`: en Vercel la página usa la URL del despliegue (`src/lib/env.ts`).
5. **Resultado:** cada push a `main` actualiza producción y cada rama o pull request genera su propia URL de preview.

> Con `USE_MOCKS=true`, cualquiera que tenga la URL puede entrar como uno de los perfiles de ejemplo y editar datos de ejemplo. Dejá activa la *Deployment Protection* de Vercel para los previews y no difundas la URL pública. Al integrar los módulos reales, `USE_MOCKS=false`.

## Seguridad

- Repo público: **sin llaves, tokens ni `.env`**. Las variables que hacen falta están en `.env.example` (solo nombres).
- La llave de servicio y las de Open Payments viven solo en el servidor (sin prefijo `NEXT_PUBLIC_`).
- Las escrituras sensibles (pedidos, pagos) las hace el servidor tras validar; el monto y la wallet del caficultor se leen de la base, nunca del navegador.
- RLS en todas las tablas: cada caficultor ve y edita solo lo suyo; el catálogo público lee solo `publicado = true`.
- Los datos de usuario se pintan escapados (React) y las URLs de foto solo se aceptan `http(s)`.

## Registro de uso de IA

Política del evento: ver [`AI_USAGE.md`](./AI_USAGE.md) y [`/prompts`](./prompts/).
