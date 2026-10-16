# Prompts — Base, adaptadores, tablas, RLS y seed

> Texto real de cada instrucción recibida para esta área. Las horas exactas de los mensajes 2 a 4 no quedaron registradas en la sesión: se señalan como "no registrada" en lugar de inventarlas.

---

## Entrada 1 — Aprobación del plan

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Base, adaptadores con mocks, tablas, RLS y seed
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
Plan aprobado, incluidas las dependencias listadas. Arrancá con repo base, adaptadores con mocks, tablas, RLS y seed.
```

### Resultado breve

Esqueleto Next.js, dependencias aprobadas (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `vitest`, `supabase`), adaptadores y mocks, stubs de `src/payments` y `src/auth`, migraciones con RLS y seed.

### Archivos tocados

`package.json`, `next.config.ts`, `src/adapters/**`, `src/payments/index.ts`, `src/auth/index.ts`, `supabase/**`, `src/lib/**`.

---

## Entrada 2 — Continuar

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Base y construcción de la Ruta A
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
continua
```

### Resultado breve

Se retomó tras una tarea en segundo plano que se detuvo; se completó la instalación y se siguió con la construcción.

### Archivos tocados

`package.json`, `package-lock.json`, `supabase/config.toml`, y las pantallas y servicios de la Ruta A.

---

## Entrada 3 — Continuar (segunda vez)

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Base y construcción de la Ruta A
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
continua
```

### Resultado breve

Se escribieron la landing, el acceso, la tienda pública, el checkout, la pantalla de retorno, la pantalla de billetera simulada y el panel del caficultor; se dejó Docker arrancando para Supabase local.

### Archivos tocados

`src/app/**`, `src/components/**`, `src/lib/**`, `vitest.config.mts`, `src/lib/validacion.test.ts`.
