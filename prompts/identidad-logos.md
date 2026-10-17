# Prompts — Logos de la marca y nombre del protocolo

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Logos y "Interledger"

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** Identidad visual y textos
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
@"C:\Users\jsala\OneDrive\obsidian\Jennifer Salazar Duke Brain\00_INBOX\logo\terracierta-by-onyx-horizontal.svg" @"C:\Users\jsala\OneDrive\obsidian\Jennifer Salazar Duke Brain\00_INBOX\logo\terracierta-grano-claro.svg" @"C:\Users\jsala\OneDrive\obsidian\Jennifer Salazar Duke Brain\00_INBOX\logo\terracierta-grano-oscuro.svg" @"C:\Users\jsala\OneDrive\obsidian\Jennifer Salazar Duke Brain\00_INBOX\logo\terracierta-marca.svg" @"C:\Users\jsala\OneDrive\obsidian\Jennifer Salazar Duke Brain\00_INBOX\logo\terracierta-sello-claro.svg" @"C:\Users\jsala\OneDrive\obsidian\Jennifer Salazar Duke Brain\00_INBOX\logo\terracierta-sello-oscuro.svg"
logos para agregar  donde podamos usarlo para darle mayor identidad. y cambiar donde diga open payments por Interledger que es en realidad el nombre de el protocolo
```

### Resultado breve
- Los seis logos (hechos por el equipo, no por la IA) se copiaron sin cambios a `public/brand/`.
- **Dónde se usan:** emblema en la cabecera, el pie y las pantallas `/acceso` y `/registro`; sello "Café con nombre propio" en el encabezado de la página de inicio (solo en pantallas anchas); `src/app/icon.svg` como ícono de pestaña; el logo horizontal arriba del README.
- **Supuesto declarado:** "Open Payments" pasó a "Interledger" donde nombra el **protocolo o el módulo de pagos** (textos de la página, README, comentarios y `CODEOWNERS`). **Se dejó "Hackatón Open Payments · Medellín 2026"** porque es el nombre oficial del evento. Si hay que cambiarlo también, es una sustitución de texto.
- El texto de los prompts anteriores y las filas históricas del Verification Log **no se reescribieron**: son registro de lo que se dijo y se vio en su momento.

### Archivos tocados
`public/brand/*.svg`, `src/app/icon.svg`, `src/components/marca.tsx`, `cabecera.tsx`, `pie.tsx`, `src/app/page.tsx`, `src/app/acceso/page.tsx`, `src/app/registro/page.tsx`, `src/app/cooperativa/page.tsx`, `src/components/formulario-checkout.tsx`, `src/app/layout.tsx`, `src/lib/validacion.ts`, `src/adapters/mocks/payments.ts`, `src/payments/index.ts` (solo comentarios del stub), `.github/CODEOWNERS`, `README.md`, `AI_USAGE.md`.

---

## Entrada 2 — Los logos definitivos

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
el logo de las cerezas eliminar eso esta muy feo
```

Y, mientras el agente trabajaba, con una imagen de los logos que sí se usan (grano con "TERRACIERTA / BY ONYX" en versión clara y oscura, y el sello claro y oscuro):

```
estos son lso definitivos lso otros no
```

### Resultado breve
- Se quitó el emblema de cerezas (`terracierta-marca.svg` y el logo horizontal): del encabezado, el pie, `/acceso`, `/registro`, el ícono de pestaña y el README; los dos archivos se borraron de `public/brand/`. Queda el **grano** (claro u oscuro según el fondo) y el **sello**.
- **Supuesto declarado:** "eliminar" se entendió como quitarlo de la página y borrar esos dos archivos del repositorio; si se necesitan, están en el historial de git y en la carpeta de logos de Jennifer.
- La cabecera ahora dice solo "by Onyx", como en la imagen de los logos definitivos.
