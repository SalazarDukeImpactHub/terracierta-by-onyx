# Prompts — Inicio del proyecto

> Registro de la Política de IA del evento. Texto real y completo de cada instrucción recibida. No contiene secretos.

---

## Entrada 1

- **Fecha/hora:** 2026-10-16 · 13:42 (hora de Colombia, UTC-5)
- **Área:** Inicio / repo base (pasos 1 y 2 del orden de construcción, sección 11 del brief)
- **Quién da la instrucción:** Jennifer Salazar Duke (dirige y revisa)

### Prompt (texto íntegro)

```
Lee primero el AGENTS.md del trazzos-dev-system (rige tu comportamiento). Luego lee completo y sigue al pie de la letra este brief:
C:\Users\jsala\OneDrive\obsidian\Jennifer Salazar Duke Brain\00_INBOX\Hackathon Open Payments — Brief Dev System.md
Contexto adicional en la misma carpeta: "Hackathon Open Payments — Documento de propuesta.md". Ambos son texto sin datos sensibles.

Proyecto: "Terracierta by Onyx", repo de GitHub público para el Hackatón Open Payments de Medellín. Hoy es el primer día; el código final se entrega el sábado 17 a las 11:00. Trabajá en esta carpeta nueva:
C:\Users\jsala\trazzos-dev-system\experiments\terracierta-by-onyx

Stack: Next.js (App Router) + Supabase.

Identidad visual: la web hereda la identidad de Terracierta (sección 5.1 del brief: paleta, tipografías, tono y reglas de contraste). Tomá como referencia viva https://terracierta-landing.vercel.app/ para aprender cómo se ve y se siente, y construí los componentes nuevos con esos mismos tokens.

Tu rol: construir TODA la página. Los pagos (Open Payments) y el login con asignación de wallets los hacen dos compañeros y sus contratos aún no están definidos: construí contra adaptadores con mocks (USE_MOCKS) y dejá los puntos de enchufe listos, sin tocar /src/payments ni /src/auth más allá de los stubs.

Antes de escribir código:
1. Creá AI_USAGE.md y la carpeta /prompts, y guardá en /prompts/inicio.md el texto íntegro de este mensaje como primera entrada.
2. Mostrame el plan corto (estructura de carpetas, adaptadores, tablas) y esperá mi OK antes de crear estructuras grandes.

Reglas duras: nada de secretos en el repo. La tienda de luli-crea-tu-look es otro proyecto con otra marca: consultala solo para aprender qué técnicas sirven (organización del catálogo, modelo de producto, validación en el servidor, protección de escrituras, escape de datos para evitar XSS). NO copies código, estilos, textos, imágenes, datos ni identidad de marca; todo se escribe de nuevo con la identidad de Terracierta. No abras ni copies su .env.local. Declará en AI_USAGE.md que Luli se usó solo como referencia de patrones. Verificá y probá cada tarea y anotá el resultado real, nunca "debería funcionar".

Empezá por los pasos 1 y 2 del orden de construcción (sección 11 del brief): repo base, adaptadores con mocks, tablas propias con RLS y datos semilla. Terminado = la Ruta A (tienda, checkout contra el mock, panel de pagos) corre localmente con evidencia y el registro de la política de IA está al día.
```

### Resultado breve

- Se leyeron `AGENTS.md`, el brief v2 y el documento de propuesta.
- Se creó `AI_USAGE.md` y esta carpeta `/prompts`.
- Se presenta el plan corto a Jennifer y se espera su OK antes de crear estructuras grandes (sin código todavía).

### Archivos tocados

- `AI_USAGE.md` (nuevo)
- `prompts/inicio.md` (nuevo)

### Notas de registro

- El mensaje de Jennifer llegó como texto pegado; se transcribe sin cambios.
- Los archivos del brief y la propuesta viven en el vault de Obsidian de Jennifer (fuera del repo) y no se copian aquí.
