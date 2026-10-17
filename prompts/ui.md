# Prompts — Interfaz (flujos y pantallas)

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Subir `.env.example` y la pregunta repetida del INVIMA

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Área:** `.env.example` y pantalla de inicio del caficultor
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
ya revise todo esta ok sube el example y debemso revisar otro tema y es que al ingresar como caficutltor ya se sabe si tiene o no invima sin embargo vuekvlve y aaprece  llego a una pantalla donde me pregunta por el invima y despues de contestar me aparece de neuvo aqui si tengo o no invima revisemos bien esto
```

**Imagen adjunta** (el texto de la imagen no es un prompt, se describe): captura del inicio del caficultor con el título "¿Tienes INVIMA?", la línea "De eso depende tu camino para cobrar. Hoy figura: **con INVIMA**.", dos tarjetas ("I · Sí, tengo INVIMA" con el botón "Ir a mi tienda" y "II · No, todavía no" con el botón "No tengo INVIMA") y el enlace "Ver mis pedidos y pagos recibidos →".

### Resultado breve
- **`.env.example` subido** (PR 11, fusionado en `main`). El agente no pudo leerlo localmente por una restricción de permisos sobre archivos `.env*`; Jennifer lo revisó en su computador y, antes de fusionar, el agente comprobó el contenido publicado en el PR (7 variables, solo `USE_MOCKS=true` con valor, sin llaves ni URLs reales).
- **INVIMA:** causa encontrada: el inicio siempre dibujaba la pregunta aunque el perfil ya trae el dato, y las tarjetas reescribían `tiene_invima` desde la página (además permitían a un caficultor darse el INVIMA con un clic). Se quitó la pregunta y la acción `declararInvima`; el inicio muestra el camino que corresponde. Resultados reales en `AI_USAGE.md` → Verification Log.

### Archivos tocados (entrada 1)
`.env.example` (nuevo), `src/app/caficultor/page.tsx`, `src/app/caficultor/tienda/actions.ts`, `src/auth/index.ts`, `README.md`, `AI_USAGE.md`, `prompts/ui.md`.

---

## Entrada 2 — Merge del PR 12

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Contexto
El agente preguntó si hacía el merge del PR 12 (el inicio del caficultor sin la pregunta del INVIMA) cuando pasara su check.

### Prompt (texto íntegro)

```
si hazlo
```

### Resultado breve
PR 12 fusionado en `main` (`400fd23`) con el check en verde; Vercel redeployó y producción ya sirve la pantalla nueva (Marta: "Con INVIMA"; Jairo: "Sin INVIMA"; sin la pregunta). Ver `AI_USAGE.md` → Verification Log.

### Archivos tocados
`AI_USAGE.md`, `prompts/ui.md`.
