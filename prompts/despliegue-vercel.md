# Prompts — Despliegue en Vercel

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Conectar el repo con Vercel

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
antes de esta respuesta que necesito para conectar el repo con vercel y poder ir viendo todo el equipo lso cambios no solo en local
```

### Resultado breve
- Se detectó que en Vercel la página mandaría al pagador de vuelta a `localhost`: `SITE_URL` ahora sale de las variables del sistema de Vercel (`src/lib/env.ts`) y quedó cubierto con 4 pruebas.
- Se agregó la guía "Desplegar en Vercel" al `README.md`: proyecto de Supabase en la nube, `db push --include-seed`, importar el repo y las 4 variables de entorno.
- Verificado: tipos sin errores, lint sin avisos, 25/25 pruebas. **No verificado:** el despliegue real en Vercel (requiere las cuentas del equipo).

### Archivos tocados
`src/lib/env.ts`, `src/lib/env.test.ts`, `README.md`, `AI_USAGE.md`.
