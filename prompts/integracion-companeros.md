# Prompts — Revisión de la integración de los compañeros

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión (2026-10-17, mañana).

---

## Entrada 1 — Entender qué se fusionó

```
holi volvi necesito que  antes de ahcer algo entiendas todo lo que se hizo nos nuevos merge de parte de lso compañeros ys atodo esta funcional
```

### Resultado breve
- Se leyeron los PR 28–32 sin cambiar nada: los PR 28–31 (pagos, panel, pasarela, cuentas) se fusionaron en `main` y el PR 32 los **revirtió** 30 minutos después; `main` quedó idéntico al PR 27.
- Hallazgos de lectura (no ejecutados): migración con versión duplicada, riel de pago con cookie que contradice el documento de Yamil, registro sin wallet, sin documentación de IA.

## Entrada 2 — Cuidado con lo local

```
revisa bien porque en ellocal se ve todo ya ok y antes de subir cambios necesito no romper nada quirurjicamente todo ya eld ocker esta arriba
```

### Resultado breve
- Con Docker arriba: `test:db` 115/115 y RLS 46/46 (esta última en una transacción con ROLLBACK, para no tocar la base local); app local en 200 por rol.

## Entrada 3 — Probar su código aislado

```
Sí: creá un worktree aparte con el commit f18a7e7, instalá dependencias solo allí y corré tipos, lint, pruebas y build; no toques main ni tu base local.
```

```
Sí, borrá el worktree C:\Users\jsala\tc-wt-f18a7e7 con git worktree remove y confirmá que main y la base local siguen intactos.
```

### Resultado breve
- En el worktree: tipos y lint sin errores; 132 de 133 pruebas unitarias; ambos builds pasan; `npm audit` sin vulnerabilidades. Una prueba no se pudo verificar (depende de Supabase y Node 22). Worktree borrado; `main` y la base local intactos.

## Entrada 4 — El deploy que falló

```
el ultimo deploy fallo necesito organizarlo para revisar los cambios y asi seguir mejorando
```

(Jennifer pegó además el registro de compilación de Vercel del PR 33; no se copia aquí.)

```
Sí: armá una rama nueva desde feat/integracion-ajustes (sin tocar la de ellos ni main) que agregue el CSS y las 2 rutas faltantes de Yamil, y probá tipos, lint, pruebas y build en un worktree aislado.
```

```
lo que sea mas apropiado para que todo funcione bien
```

```
Sí, fusioná el PR 34 en feat/integracion-ajustes y confirmá que el preview del PR 33 compila; no toques main.
```

### Resultado breve
- Causa: falta `flujo-pago.module.css` (y las rutas `/api/pagos/key` y `/oferta`), que la integración no copió de `750cb95`. El PR 34 los agrega; se fusionó en la rama de ellos y el preview del PR 33 compila.
- Siguen sin resolver: 4 pruebas rojas, `jsdom`, migración duplicada, riel con cookie, documentación.

## Entrada 5 — ADR y plan

```
Sí: escribí el plan de PRs encadenados y el ADR (en Borrador) del riel de pagos y la política de cooperativas, en una rama desde main, sin tocar el código.
```

### Resultado breve
- `docs/decisions/ADR-001-riel-de-pagos-y-politica-de-cooperativas.md` (**Borrador**) y `docs/planes/integracion-prs-encadenados.md`. Solo documentos; no se tocó código.
- Supuesto declarado: la recomendación del ADR (un solo riel con SDK + GNAP; la cooperativa no compra productos) es una **propuesta**; la decisión es de Jennifer.

### Archivos tocados
`docs/decisions/ADR-001-…md`, `docs/planes/integracion-prs-encadenados.md`, `AI_USAGE.md`, `prompts/integracion-companeros.md`.
