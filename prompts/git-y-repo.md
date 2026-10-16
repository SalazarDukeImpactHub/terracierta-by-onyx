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
