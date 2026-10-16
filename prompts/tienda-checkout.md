# Prompts — Tienda, checkout y verificación de la Ruta A

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Verificar y recorrer la Ruta A

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Verificación de Supabase local, RLS y Ruta A
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
Seguí: verificá que Supabase local esté arriba, aplicá migraciones y seed, probá RLS y recorré la Ruta A.
```

### Resultado breve

- Supabase local verificado; migraciones y seed aplicados.
- RLS: se encontró y corrigió una recursión infinita; 35 verificaciones pasan.
- Ruta A recorrida de punta a punta en el navegador, más los caminos de fallo y las pruebas de seguridad. Resultados reales en `AI_USAGE.md` → Verification Log.

### Archivos tocados

`supabase/migrations/20261016000200_rls.sql`, `supabase/tests/rls.sql`, `scripts/dev-local.mjs`, `next.config.ts`, `package.json`, `src/app/globals.css`, `src/components/estado-del-pago.tsx`, `README.md`, `AI_USAGE.md`, `prompts/*`. También se agregó la entrada `terracierta` a `.claude/launch.json` del workspace para poder previsualizar.
