# Prompts — README y documentación

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Merge de la Ruta B y siguientes pasos

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Cierre de la Ruta B y planificación
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
revisa y haz el merge que todo este ok y ya procedemos a correguir y crear todo lo que s enecesite en supabase  y ver que mas pendientes tenemos
```

### Resultado breve
- Se revisó el PR 2 (2 checks en verde, sin secretos en el diff, `main` sin cambios desde la rama) y se hizo el merge a `main` (`b962a9b`); rama borrada en GitHub y en local.
- Supabase: la CLI solo ve dos proyectos **ajenos** a Terracierta, así que no se cargó nada. Falta crear un proyecto propio (ver README → *Desplegar en Vercel*).

---

## Entrada 2 — Rehacer el README con su estilo

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** README
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
y el readme mejoralo esta feo no es mi estilo te doy uno de ejemplo  https://github.com/SalazarDukeImpactHub/cavaltechackathon
```

### Resultado breve
- Se leyó el README del repo de ejemplo solo para tomar el **estilo** (insignias, capturas, tabla de contenidos, tablas por sección, diagramas Mermaid, seguridad y limitaciones con franqueza). **No se copió contenido**: todo se escribió para Terracierta.
- Se tomaron 7 capturas reales de la app en local (`docs/`) y se reescribió `README.md`.
- Se verificó que las imágenes existan, que los anclajes de la tabla de contenidos coincidan con los encabezados y que no haya secretos.

### Archivos tocados
`README.md`, `docs/*.jpg` (7 capturas), `AI_USAGE.md`, `prompts/readme-docs.md`.

---

## Entrada 3 — Merge del README

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
si haz el merge
```

### Resultado breve
PR 3 fusionado en `main` (`ef29342`) con los 2 checks en verde; rama borrada en GitHub y en local.

---

## Entrada 4 — Quitar las capturas del README

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
quitemos als fotos del readme solo als agregamos al final con el diseño definitivo
```

### Resultado breve
- Se quitaron del `README.md` la imagen de la landing, la tabla de 6 capturas y la nota de las capturas; también la fila `docs/` de la tabla de estructura.
- Se agregó al roadmap del README el pendiente "capturas con el diseño definitivo".
- Los archivos `docs/*.jpg` **no se borraron** (borrar archivos requiere aprobación): quedan en el repo sin usar hasta que se decida si se reemplazan o se eliminan.

### Archivos tocados
`README.md`, `AI_USAGE.md`, `prompts/readme-docs.md`.
