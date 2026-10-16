# Prompts — Ruta B: lote, agente de match, oferta y pago de la cooperativa

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Decisiones de diseño de la Ruta B

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Ruta B (agente, oferta, cooperativa)
- **Quién:** Jennifer Salazar Duke

### Contexto
El agente le había pedido dos decisiones: (1) si el "por qué" del agente lo redacta solo un conjunto de reglas o también un modelo de lenguaje; (2) cuándo se crean las ofertas (al calcular el top 3 o cuando el caficultor elige).

### Prompt (texto íntegro)

```
1 el agente solo reglas despues lov amso evolucionando  y el 2. cuando el caficultor elije
```

### Resultado breve
- **Agente solo con reglas**, sin modelo de lenguaje ni llave (`src/lib/match.ts`); queda preparado para evolucionarlo después.
- **La oferta se crea cuando el caficultor elige** una de las 3 cooperativas; ver el top 3 no crea nada.
- Flujo completo: lote → top 3 con motivo → elegir (oferta *propuesta*) → la cooperativa acepta (*aceptada*) → paga por el mismo módulo de pagos (*pagada*, lote *vendido*).
- Datos: el caficultor sin INVIMA del seed (Jairo) pasa a ser de Marsella, para que la demo coincida con el brief.

### Archivos tocados
`src/lib/match.ts`, `src/lib/match.test.ts`, `src/lib/ruta-b.ts`, `src/lib/ruta-b.db.test.ts`, `src/lib/pagos-service.ts`, `src/app/caficultor/lote/**`, `src/app/cooperativa/**`, `src/components/formulario-lote.tsx`, `src/components/estado-del-pago.tsx`, `supabase/seed.sql`, `scripts/test-db.mjs`, `package.json`, `README.md`, `AI_USAGE.md`.
