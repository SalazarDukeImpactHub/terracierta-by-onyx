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

---

## Entrada 5 — Qué hacer con las capturas de `docs/`

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Contexto
El agente preguntó si hacía el merge del PR 4 y qué hacer con los 7 archivos `docs/*.jpg`: dejarlos (listos para reemplazar) o borrarlos.

### Prompt (texto íntegro)

```
dejarlos queda lsito para remplazar cunado este
```

### Resultado breve
- Los 7 archivos `docs/*.jpg` **se dejan** en el repo, listos para reemplazarlos cuando esté el diseño definitivo.
- La respuesta eligió "dejarlos" y no dijo nada sobre el merge del PR 4; el agente lo interpretó como conformidad, ya que el PR solo cambia texto, tenía los 2 checks en verde y es reversible con un revert.

---

## Entrada 6 — Qué hacer con `.env.example` y los nombres del equipo

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
que debo hacer con el .env.example yaa te dpy tpdps los nombres para agregar caren briyid hoyos estrada,astrid carolina hoyos estrada,yamil andre la barrera lopez alvaro henao gonzalez
```

### Resultado breve
- Los 4 nombres se agregaron a la sección **Equipo** del README **tal cual se escribieron, sin tildes**; los roles de cada integrante quedan pendientes de confirmar (no se asignaron por suposición).
- `.env.example`: el entorno del agente no permite crear archivos `.env*`, así que se entregó el contenido listo para que una persona lo guarde con ese nombre (solo nombres de variables, sin valores). Se quitó `LLM_API_KEY`, porque el agente de match es solo reglas.

### Archivos tocados
`README.md`, `AI_USAGE.md`, `prompts/readme-docs.md`.

---

## Entrada 7 — Roles, tildes y cierre de los PR pendientes

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Contexto
El agente preguntó quién se encarga de pagos y de login, y si los nombres llevan tildes (Álvaro, González, López).

### Prompt (texto íntegro)

```
loggin alvaro pagos yamil si agrega als tildes  y cerremso lso pr pendientes para dejar todo lsito
```

### Resultado breve
- **Roles:** login = Álvaro Henao González (`src/auth`); pagos = Yamil Andre La Barrera López (`src/payments`). Se reflejaron en el README y en la lista "Files with minimal or no AI" de `AI_USAGE.md`. El rol de Caren y de Astrid no se indicó y no se asumió.
- **Tildes:** agregadas a Álvaro, González y López. "Andre" quedó sin tilde porque no se pidió.
- **Cierre:** PR 7 y PR 8 fusionados a `main`.

### Archivos tocados
`README.md`, `AI_USAGE.md`, `prompts/readme-docs.md`.

---

## Entrada 8 — Roles de Caren y Astrid, invitaciones al repo y `.env.example`

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
ya estan invitados a el repo que es ya voy a crear el env exammple y lso roles de caro y  caren ayudame a ponerlo ellas se encargan de no se adminsitracion y parte creativa hasignales aaglo de valor aunque lo tecnico recaae mas en lso otros ellas igual aportan con ideas y revisando errores que se nos escapen
```

### Resultado breve
- **Roles:** Caren y Astrid → administración y parte creativa, aportan ideas y revisan la app para detectar errores. Se redactó así en el README, sin inventarles tareas técnicas; "Caro" se interpretó como Astrid Carolina.
- **Invitaciones:** el repo ya muestra 4 colaboradores con permiso de escritura (y ninguna invitación pendiente). Falta que Jennifer confirme qué usuario de GitHub es cada integrante antes de armar un `CODEOWNERS`.
- **`.env.example`:** Jennifer lo va a crear; el agente lo sube con su PR cuando exista.

### Archivos tocados
`README.md`, `AI_USAGE.md`, `prompts/readme-docs.md`.

---

## Entrada — README al día, en inglés y sin la landing

- **Fecha/hora:** 2026-10-17 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
todo esta verde y ok solo falta actualizar el readme que esta viejo que tenga uno en ingles y al final que habla de la landing eliminarlo no va con esto  Terracierta es un proyecto de café con nombre propio, que parte de Marsella. Conózcalo en terracierta-landing.vercel.app.
```

### Resultado breve
- `README.md` actualizado y `README.en.md` nuevo (traducción completa), con un enlace de cambio de idioma arriba en cada uno.
- Se eliminó el párrafo final de la landing. **Supuesto declarado:** también se quitó el enlace "Conozca Terracierta" de la parte de arriba, que apuntaba a la misma landing.
- **Supuesto declarado:** el README describe el estado de `main` (todo simulado); el trabajo de pagos y cuentas de los compañeros sigue en integración y por eso se avisa arriba, sin documentarlo como funcionando.
- No se agregó la URL pública de la demo: el propio README pide no difundirla mientras los pagos sean simulados.
- Archivos: `README.md`, `README.en.md`, `AI_USAGE.md`, `prompts/readme-docs.md`.
