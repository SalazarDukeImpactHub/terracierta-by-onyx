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

---

## Entrada 5 — URL del proyecto para Vercel

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
dame el url con  el id listo para el public
```

### Resultado breve
Se entregó `https://aquxsadhincsdveerbdh.supabase.co` para la variable pública `NEXT_PUBLIC_SUPABASE_URL` (sin barra final) y se comprobó que sus endpoints públicos responden (API 401, Auth 401, Storage 400, sin llaves). Las llaves no pasaron por el chat.

---

## Entrada 6 — Advertencia de Vercel (imagen)

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt
Mensaje con **una imagen y sin texto**. El texto íntegro no está disponible; lo que mostraba la imagen, una advertencia de Vercel:

```
[imagen] Keep This Value Private — The NEXT_PUBLIC_ prefix exposes this value to the browser. Remove the prefix, or change the variable to Config if it's safe to expose. [botón: Change to Config]
```

### Resultado breve
Se explicó qué hacer según la variable (la URL y la llave pública pueden ir como configuración; la llave privada nunca lleva `NEXT_PUBLIC_`) y cómo distinguir la llave pública de la privada. No se pegó ninguna llave.

---

## Entrada 7 — Error de Vercel por variables duplicadas

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
A variable with the name `USE_MOCKS` already exists for the target production on branch undefined. A variable with the name `SUPABASE_SERVICE_ROLE_KEY` already exists for the target production on branch undefined.
```

### Resultado breve
Las variables ya existían solo para Production: se indicó **editarlas** (marcar Production y Preview) y revisar las 4 variables.

---

## Entrada 8 — URL de Vercel

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
https://terracierta-by-onyx-kxy5mtww0.vercel.app/
```

### Resultado breve
- Esa URL (despliegue de *preview*) está protegida por el login de Vercel: no se pudo verificar desde fuera.
- El dominio de producción `terracierta-by-onyx.vercel.app` es **público** y en ese momento daba error 500 en `/tienda`: servía un despliegue anterior, sin las variables nuevas. Se indicó redeployar el despliegue de Production.

---

## Entrada 9 — Revisión funcional

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
cuando este lsito el logging cambiamos el mocks si es necesario ya revise y la tienda sise ve marta  ahora que sigue revisemos que todo sea funcional
```

### Resultado breve
- Verificación en solo lectura del dominio público: modo demostración activo, `/tienda` muestra a Marta con sus 2 productos publicados, el borrador da 404, las rutas protegidas redirigen a `/acceso`.
- Se preparó la verificación de comportamiento en la nube: `rls.sql` ahora corre también en el SQL Editor (termina en `ROLLBACK`), y se agregaron `scripts/cloud-sql.mjs` (`cloud:setup` y `cloud:reset`) para cargar y reiniciar la demo.
- Probado en local: `test:rls` 35 de 35, el script de carga en una base de prueba aparte (12 de 12 chequeos) y el de reinicio ensuciando los datos antes (quedan idénticos al seed).

### Archivos tocados
`supabase/tests/rls.sql`, `scripts/cloud-sql.mjs`, `package.json`, `README.md`, `AI_USAGE.md`, `prompts/supabase-nube.md`.
