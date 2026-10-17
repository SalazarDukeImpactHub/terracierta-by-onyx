# Prompts — El comprador también inicia sesión

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Merge del PR 5 y corrección del comprador

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Cambio de producto: comprador con cuenta
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
si pero un detalle y es que dice que el comprador persona no neccesita loggin pero todos lso necesita el loggin para tener su billetera y poder hacer las compras
```

### Resultado breve
- Se hizo el merge del PR 5 a `main` (`dbb879b`).
- Se identificó que no era solo un texto: el brief original decía que el comprador compra "sin registro, solo indica su wallet", y el cambio toca el **contrato con el login**. Se propuso el alcance completo y se pidió una decisión antes de tocar el código (regla de `AGENTS.md`: la ambigüedad que cambia el alcance bloquea).

---

## Entrada 2 — Decisión de diseño

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Contexto
El agente preguntó: ¿el catálogo sigue siendo público y el login se pide solo al pagar, o todo el sitio pide login?

### Prompt (texto íntegro)

```
Sí: el catálogo sigue público y el login se pide solo al pagar. Hacé el cambio completo del comprador con su wallet de perfil, en una rama con PR.
```

### Resultado breve
Rama `feat/comprador-con-login`:
- **Contrato:** `Rol` admite `comprador`; migración `20261017000000_comprador.sql` (rol, `pedidos.comprador_id`, política de RLS); dos compradores de ejemplo (uno cuya wallet contiene `fail`, para mostrar el pago fallido).
- **Checkout con sesión:** la wallet sale del perfil; el campo de texto desapareció. La API responde 401 sin sesión y 403 a otros roles, e ignora cualquier wallet o monto que mande el navegador.
- **Login:** `/acceso?siguiente=<ruta interna>` vuelve al producto que se iba a pagar; `rutaSegura` bloquea redirecciones abiertas.
- **Mis compras** (`/comprador`), textos corregidos (landing, tienda, acceso y README) y nota de cambio de contrato en el stub `src/auth`.
- **Nube:** `npm run cloud:update` genera el SQL de la migración + datos de ejemplo para un proyecto que ya tiene lo anterior.
- Resultados reales de las pruebas en `AI_USAGE.md` → Verification Log.

### Archivos tocados
`supabase/migrations/20261017000000_comprador.sql`, `supabase/seed-updates/…`, `supabase/seed.sql`, `supabase/tests/rls.sql`, `supabase/tests/cloud-verify.sql`, `scripts/cloud-sql.mjs`, `src/adapters/**`, `src/auth/index.ts`, `src/lib/roles.ts`, `src/lib/pagos-service.ts`, `src/lib/validacion.ts`, `src/app/acceso/**`, `src/app/comprador/page.tsx`, `src/app/tienda/**`, `src/app/api/pagos/iniciar/route.ts`, `src/app/page.tsx`, `src/components/formulario-checkout.tsx`, `src/components/cabecera.tsx`, pruebas (`*.test.ts`, `checkout.db.test.ts`), `README.md`, `AI_USAGE.md`, `prompts/comprador-con-login.md`.
