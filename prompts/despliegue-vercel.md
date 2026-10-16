# Prompts — Despliegue en Vercel

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión.

---

## Entrada 1 — Conectar el repo con Vercel

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
antes de esta respuesta que necesito para conectar el repo con vercel y poder ir viendo todo el equipo lso cambios no solo en local
```

### Resultado breve
- Se detectó que en Vercel la página mandaría al pagador de vuelta a `localhost`: `SITE_URL` ahora sale de las variables del sistema de Vercel (`src/lib/env.ts`) y quedó cubierto con 4 pruebas.
- Se agregó la guía "Desplegar en Vercel" al `README.md`: proyecto de Supabase en la nube, `db push --include-seed`, importar el repo y las 4 variables de entorno.
- Verificado: tipos sin errores, lint sin avisos, 25/25 pruebas. **No verificado:** el despliegue real en Vercel (requiere las cuentas del equipo).

### Archivos tocados
`src/lib/env.ts`, `src/lib/env.test.ts`, `README.md`, `AI_USAGE.md`.

---

## Entrada 2 — Subir los cambios antes de reintentar el deploy

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
si subelo para que todo quede ok antes de intentar de nuevo el deploy
```

### Resultado breve
Push de los commits pendientes a `origin/main`; local y remoto coincidieron en `6506de2`.

---

## Entrada 3 — Error del primer deploy en Vercel

- **Fecha/hora:** 2026-10-16 · 16:41 (hora de los logs de Vercel)
- **Quién:** Jennifer Salazar Duke (pegó el log del build)

### Prompt (texto íntegro)

```
16:41:40.200 Running build in Washington, D.C., USA (East) – iad1
16:41:40.201 Build machine configuration: 2 cores, 8 GB
16:41:40.321 Cloning github.com/SalazarDukeImpactHub/terracierta-by-onyx (Branch: main, Commit: 6506de2)
16:41:40.322 Previous build caches not available.
16:41:40.576 Cloning completed: 254.000ms
16:41:41.156 Running "vercel build"
16:41:41.169 Vercel CLI 64.0.2
16:41:41.536 Installing dependencies...
16:41:42.184 npm warn Unknown env config "cache-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
16:41:50.859 npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
16:41:58.501 
16:41:58.502 added 420 packages in 17s
16:41:58.502 
16:41:58.502 169 packages are looking for funding
16:41:58.502   run `npm fund` for details
16:41:58.504 npm warn install-scripts 1 package has install scripts not yet covered by allowScripts:
16:41:58.504 npm warn install-scripts   unrs-resolver@1.12.2 (postinstall: node postinstall.js)
16:41:58.505 npm warn install-scripts
16:41:58.505 npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
16:41:58.569 Detected Next.js version: 16.4.2
16:41:58.577 Running "npm run build"
16:41:58.755 npm warn Unknown env config "cache-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
16:41:58.773 
16:41:58.774 > terracierta-by-onyx@0.1.0 build
16:41:58.774 > next build
16:41:58.774 
16:41:59.348 ▲ Next.js 16.4.2 (Turbopack)
16:41:59.455   Applying modifyConfig from Vercel
16:41:59.459 ✓ Running next.config.ts took 110ms
16:41:59.482 Attention: Next.js now collects completely anonymous telemetry regarding usage.
16:41:59.483 This information is used to shape Next.js' roadmap and prioritize features.
16:41:59.483 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
16:41:59.483 https://nextjs.org/telemetry
16:41:59.483 
16:41:59.508 - Experiments (use with caution):
16:41:59.509   · serverActions
16:41:59.509 
16:41:59.537   Creating an optimized production build ...
16:42:10.523 ✓ Compiled successfully in 11.0s
16:42:10.539   Running TypeScript ...
16:42:16.331   Finished TypeScript in 5.8s ...
16:42:16.334   Collecting page data using 1 worker ...
16:42:17.198   Generating static pages using 1 worker (0/9) ...
16:42:17.382   Generating static pages using 1 worker (2/9) 
16:42:17.445 Error occurred prerendering page "/cooperativa". Read more: https://nextjs.org/docs/messages/prerender-error
16:42:17.474 Error: src/auth no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.
16:42:17.478     at Module.b [as obtenerSesion] (src/auth/index.ts:17:9)
16:42:17.478     at Object.obtenerSesion (src/adapters/auth.ts:12:37)
16:42:17.478     at async p (src/adapters/auth.ts:29:18)
16:42:17.478     at async d (src/app/cooperativa/page.tsx:8:18)
16:42:17.478   15 |
16:42:17.478   16 | export async function obtenerSesion(): Promise<Sesion | null> {
16:42:17.478 > 17 |   throw new Error("src/auth no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.");
16:42:17.478      |         ^
16:42:17.478   18 | }
16:42:17.478   19 |
16:42:17.478   20 | export async function obtenerPerfil(): Promise<Perfil | null> { {
16:42:17.479   digest: '488009093'
16:42:17.479 }
16:42:17.479 Export encountered an error on /cooperativa/page: /cooperativa, exiting the build.
16:42:17.505 ⨯ Next.js build worker exited with code: 1 and signal: null
16:42:17.562 Error: [BUILD_UTILS_SPAWN_1] Command "npm run build" exited with 1
```

### Resultado breve
- Causa: sin `USE_MOCKS=true` en el entorno del build, la app usó el stub de `src/auth` (que lanza error) y `/cooperativa` se intentó prerenderizar. Reproducido igual en local (build sin `USE_MOCKS`).
- Corrección: `export const dynamic = "force-dynamic"` en `src/app/layout.tsx`. Verificado: build con y sin `USE_MOCKS`, tipos, lint y 25/25 pruebas.

### Archivos tocados
`src/app/layout.tsx`, `AI_USAGE.md`, `prompts/despliegue-vercel.md`.

---

## Entrada 4 — Aprobar el arreglo y ordenar el flujo de ramas

- **Fecha/hora:** 2026-10-16 · hora no registrada
- **Quién:** Jennifer Salazar Duke

### Prompt (texto íntegro)

```
si hazlo pero recuerda si debe ser en el main o como mantenemos todo limpio y ordenado
```

### Resultado breve
El arreglo se hizo en la rama `fix/build-dinamico` con pull request hacia `main`, en vez de pushear directo a `main`. Se propuso la regla: `main` siempre desplegable, cambios por rama corta + PR (Vercel da una URL de preview por rama) y los compañeros en `feat/payments` y `feat/auth`.
