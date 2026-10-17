# Prompts — Ajustes visuales: "Mi cuenta", color y foto de fondo

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — "Mi espacio", el verde y una foto de fondo

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Identidad visual y textos
- **Quién:** Jennifer Salazar Duke

### Contexto
Jennifer compartió dos imágenes: una captura del inicio con la sesión abierta y una fotografía de un cafetal al amanecer, para usar de fondo.

### Prompt (texto íntegro)

```
ese mi espaciono es tan claro me gustaria que lo fuera mas  que otra palabra es mas intituitiva y el verde que usamos es un poco agotador para al vista que otras opciones tenemos y quiero una foto en el fondo dodne esta el verde
```

### Resultado breve
- **"Mi espacio" → "Mi cuenta"** (cabecera, enlaces de regreso del caficultor y título de su página): es la palabra que se espera en una tienda web. Supuesto declarado: se eligió esa, sin preguntar, por ser reversible (un reemplazo de texto).
- **Foto de fondo** en el encabezado del inicio, con un velo oscuro para que el texto se lea. En pantallas anchas el velo es más fuerte a la izquierda (donde va el texto); en móvil es parejo.
- **Encabezado en móvil:** al revisar en 375 px se vio que el menú se salía de la pantalla (se cortaba "Mi cuenta"). Ahora el menú baja a una segunda fila y el nombre y el grano se achican.
- **El verde:** se propusieron tres opciones (café tostado, verde salvia, casi todo claro) y Jennifer eligió la A en la entrada 2.

### Archivos tocados
`public/fotos/cafetal-amanecer.webp`, `src/app/page.tsx`, `src/components/cabecera.tsx`, `src/app/caficultor/page.tsx`, `src/app/caficultor/{lote,pedidos,tienda}/page.tsx`, `AI_USAGE.md`, `prompts/ajustes-visuales.md`.

---

## Entrada 2 — Opción de color

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
Opción A: café tostado para fondos oscuros y botones en cobre. Aplicalo en una rama con PR junto con lo de Mi cuenta y la foto.
```

### Resultado breve
- Fondos oscuros (pie, encabezado del inicio, recuadros) en café tostado `#2b2118` / `#3d2e22` y botones en cobre; se eliminó `btn-bosque`. El verde queda en los logos y en detalles de éxito.
- **Supuesto declarado:** los dos tonos de café los eligió el agente; cambiarlos es editar dos variables en `src/app/globals.css`.
- Archivos: `src/app/globals.css`, `pie.tsx`, `src/app/page.tsx`, y los formularios y páginas que usaban `btn-bosque` o recuadros verdes.

---

## Entrada 3 — Sin sello y mejor alineación

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Contexto
Jennifer compartió dos capturas: el pie (grano con el nombre y el lema) y el encabezado del inicio con el sello a la derecha sobre la foto.

### Prompt (texto íntegro)

```
se ve raro no se ve alineado mejoremoslo  y a la foto quitemosle este logo  para que se vea toda al foto
```

### Resultado breve
- **Sello fuera del inicio:** la foto se ve completa; el velo oscuro ahora solo cubre el lado del texto. Se eliminó el componente `Sello` porque ya no lo usa nadie (los archivos del sello siguen en `public/brand/`).
- **Pie alineado:** el grano queda centrado con "TERRACIERTA / BY ONYX", como en el logo; el lema va debajo, alineado al borde del grano, y el texto de la derecha comparte la base.
- **Supuesto declarado:** "no se ve alineado" se entendió como el pie (grano desalineado con el texto de su bloque) y el sello flotando a un costado en el inicio; si era otra cosa, hay que indicarlo.
- Archivos: `src/app/page.tsx`, `src/components/pie.tsx`, `src/components/marca.tsx`.
