# Prompts — Sign in y sign up

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Corrección del concepto: sign in vs sign up

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Autenticación (contrato y pantallas)
- **Quién:** Jennifer Salazar Duke

### Contexto
Antes de este mensaje, Jennifer había detectado que el caficultor, ya con cuenta, volvía a ver una pantalla que le preguntaba el INVIMA (corregido en el PR 12). El agente había llamado "login" a todo.

### Prompt (texto íntegro)

```
loggin es sing in y el registro es sign up es quien solicita lso datos del usuario y es donde dicen si tienen invima y el sign in detecta la inforamcion de amnera automatica  apartir de el correo y contraseña
```

### Resultado breve
- Se separaron los dos momentos: **sign up** (`/registro`) pide los datos y, solo a los caficultores, si tienen INVIMA; **sign in** (`/acceso`) pide solo correo y contraseña y detecta rol, perfil, wallet e INVIMA solo.
- El agente propuso el plan (dos funciones nuevas en el contrato y dos pantallas) y esperó la aprobación, porque cambia el contrato con el compañero de autenticación.

---

## Entrada 2 — Aprobación del plan y merge del PR 13 (doc.)

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
Aprobado el plan de sign in y sign up con las dos funciones nuevas en el contrato y las pantallas /acceso y /registro, en una rama con PR. Y fusioná el PR 13.
```

### Resultado breve
- Se fusionó el PR 13 (documentación del inicio del caficultor ya verificado en producción).
- Rama `feat/sign-in-sign-up`:
  - **Contrato** (`src/adapters/types.ts`): `iniciarSesion` y `registrarse`, más `CredencialesInicio`, `DatosRegistro` y `ResultadoAuth`.
  - **Pantallas:** `/acceso` (correo y contraseña) y `/registro` (datos; INVIMA solo si el rol es caficultor; `?rol=` y `?siguiente=` admitidos).
  - **Simulación:** cuentas de ejemplo con correo y contraseña de demostración; cuentas nuevas con wallet de ejemplo; sesión en cookie **firmada**; cooperativas no se registran solas.
  - **Para el compañero de autenticación:** el contrato completo quedó documentado en `src/auth/index.ts`.
  - Resultados reales de las pruebas en `AI_USAGE.md` → Verification Log.

---

## Archivos tocados por esta área
`src/adapters/types.ts`, `src/adapters/auth.ts`, `src/adapters/mocks/auth.ts`, `src/auth/index.ts`, `src/lib/sesion-mock.ts`, `src/lib/validacion.ts`, `src/app/acceso/**`, `src/app/registro/page.tsx`, `src/components/formulario-acceso.tsx`, `src/components/formulario-registro.tsx`, `src/components/cabecera.tsx`, `src/components/formulario-checkout.tsx`, `src/app/page.tsx`, pruebas (`sesion-mock.test.ts`, `validacion.test.ts`, `auth.db.test.ts`), `README.md`, `AI_USAGE.md`, `.github/CODEOWNERS`, `prompts/sign-in-sign-up.md`.
