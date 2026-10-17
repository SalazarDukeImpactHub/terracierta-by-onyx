# Prompts — Supabase en la nube

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Lista de lo que falta

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Cierre del proyecto y Supabase
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
dame una lsita de todo lo que me falta para terminar y dejar funcional mi parte en especial en supabase
```

### Resultado breve
Lista priorizada en 6 bloques (Supabase, Supabase con los compañeros, Vercel, integración, pendientes de código y de cierre), marcando qué hace cada quien.

---

## Entrada 2 — Proyecto de Supabase

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
project id aquxsadhincsdveerbdh
```

### Resultado breve
- El proyecto existe (la API responde 401 sin llaves y la base resuelve), pero **no aparece en la CLI** de esta computadora: pertenece a otra cuenta de Supabase distinta de la que tiene la sesión abierta, así que no se pudo enlazar ni usar `db push`.
- Alternativa sin contraseñas ni cambio de cuenta: un solo script SQL (4 migraciones + seed dentro de una transacción) para pegar en el *SQL Editor*, más un script de verificación.
- Nota: el project ref es un identificador público (aparece en las URLs del proyecto), no un secreto; las llaves siguen fuera del repo.

---

## Entrada 3 — Mensaje sin la tabla

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
Corrí cloud-setup.sql y cloud-verify.sql. Te pego la tabla de resultados:
```

### Resultado breve
El mensaje llegó sin la tabla (era el texto de un botón de respuesta rápida). Se pidió pegar el resultado.

---

## Entrada 4 — Resultado de la verificación

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
| chequeo                                                            | resultado                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 1. tablas en public con RLS activo (esperado 7)                    | 7                                                                 |
| 10. bucket productos-fotos (esperado: público true, 2097152 bytes) | público true, 2097152 bytes                                       |
| 11. anon puede escribir en productos (esperado false)              | false                                                             |
| 12. anon lee la vista tiendas_publicas (esperado true)             | true                                                              |
| 2. tablas en public                                                | cooperativas, lotes, ofertas, pagos, pedidos, productos, profiles |
| 3. políticas RLS (esperado 10)                                     | 10                                                                |
| 4. funciones auxiliares (esperado 2)                               | 2                                                                 |
| 5. perfiles (esperado 3)                                           | 3                                                                 |
| 6. cooperativas (esperado 4)                                       | 4                                                                 |
| 7. productos / publicados (esperado 3 / 2)                         | 3 / 2                                                             |
| 8. tiendas públicas (esperado 1)                                   | 1                                                                 |
| 9. municipio de Jairo (esperado Marsella)                          | Marsella                                                          |
```

### Resultado breve
Los 12 chequeos coinciden con lo esperado: la base de Supabase en la nube quedó cargada (7 tablas con RLS, 10 políticas, 2 funciones, datos de ejemplo, vista pública, bucket de fotos y `anon` sin escritura).

### Archivos tocados
`supabase/tests/cloud-verify.sql` (nuevo), `README.md`, `AI_USAGE.md`, `prompts/supabase-nube.md`.
