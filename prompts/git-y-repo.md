# Prompts — Repo propio y publicación en GitHub

> Texto real de cada instrucción recibida para esta área. Las horas exactas no quedaron registradas en la sesión.

---

## Entrada 1 — Proponer repo propio

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
Antes de la Ruta B, preparemos git: proponé cómo hacer repo propio para experiments/terracierta-by-onyx.
```

### Resultado breve
Revisión de solo lectura del estado git y propuesta de plan (sin ejecutar nada).

---

## Entrada 2 — Remoto

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
https://github.com/SalazarDukeImpactHub/terracierta-by-onyx.git
```

### Resultado breve
Se comprobó que el repo existe, es público y estaba vacío; el plan se ajustó para usarlo. Se pidió confirmación antes de publicar.

---

## Entrada 3 — Aprobación

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
Aprobado: hacé los pasos 1, 2 y 3, incluido el push a https://github.com/SalazarDukeImpactHub/terracierta-by-onyx.git. En el padre dejá .claude/launch.json fuera del commit.
```

### Resultado breve
- Repo padre: un commit que solo agrega `experiments/terracierta-by-onyx/` a su `.gitignore`.
- Repo propio: `git init -b main`, `!.env.example` en `.gitignore`, 5 commits convencionales.
- Escaneo de secretos sobre todo el historial (sin hallazgos) y push a `origin/main`; local y remoto coinciden en `dd4e74d`.

### Archivos tocados
`.gitignore` (del padre y del proyecto), `prompts/git-y-repo.md`.

---

## Entrada 4 — Commitear lo pendiente

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
commitea primero todo antes de seguir con la ruta b
```

### Resultado breve
Commit `08b7858` en el repo propio con `AI_USAGE.md` y `prompts/git-y-repo.md`. En el padre no se commiteó nada más (los otros cambios no eran de este trabajo).

---

## Entrada 5 — Subir el commit

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
hazlo antes de seguir con el b  y de tomar deciones
```

### Resultado breve
Push de `08b7858` a `origin/main`; local y remoto coinciden. La Ruta B sigue sin empezar a la espera de dos decisiones de diseño.

---

## Entrada 6 — Protección de `main` y `CODEOWNERS`

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Contexto
El repo ya tenía 4 colaboradores con permiso de escritura y `main` sin protección. El agente propuso exigir *pull request* para entrar a `main` y un `CODEOWNERS`, y preguntó si el usuario `0x15k` era Yamil.

### Prompt (texto íntegro)

```
si ese es yamil y si proteje y codeowners
```

### Resultado breve
- **Protección de `main`** (configuración del repo, aplicada con la API de GitHub y leída de vuelta): *pull request* obligatorio, **0 aprobaciones requeridas** (no frena a nadie), sin *force push*, sin borrar la rama, y **sin incluir administradores** (Jennifer puede saltarla en una emergencia). No se exige la revisión de los code owners, porque bloquearía a cada dueño en su propia carpeta.
- **`.github/CODEOWNERS`:** `src/payments/` → `@0x15k` (Yamil), `src/auth/` → `@ahenao1256` (Álvaro), `src/adapters/types.ts` (el contrato) → Jennifer, Yamil y Álvaro; todo lo demás → `@SalazarDukeImpactHub`. La correspondencia de usuarios la confirmó Jennifer solo para Yamil (`0x15k`); Álvaro (`ahenao1256`) se dedujo por el nombre del usuario.

### Archivos tocados
`.github/CODEOWNERS` (nuevo), `README.md`, `AI_USAGE.md`, `prompts/git-y-repo.md`.
