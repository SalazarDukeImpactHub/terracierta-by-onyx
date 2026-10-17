<p align="center">
  <img src="./public/brand/terracierta-by-onyx-horizontal.svg" alt="Terracierta by Onyx" width="420">
</p>

# ☕ Terracierta by Onyx — Café con nombre propio

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Interledger](https://img.shields.io/badge/Pagos-Interledger-334132)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Claude Code](https://img.shields.io/badge/Construido%20con-Claude%20Code-D97757?logo=anthropic&logoColor=white)
![Hackatón](https://img.shields.io/badge/Hackat%C3%B3n-Open%20Payments%20Medell%C3%ADn%202026-B0673C)
![Hecho en Colombia](https://img.shields.io/badge/Hecho%20en-Colombia%20🇨🇴-FCD116)

> Plataforma web que le da a cada pequeño caficultor de **Antioquia y Marsella** una **wallet propia** para cobrar directo con **Interledger**: vendiendo en su tienda virtual (con INVIMA) o a la mejor cooperativa que le recomienda un agente (sin INVIMA).

**[🌿 Conozca Terracierta](https://terracierta-landing.vercel.app/)** · **[🧾 Registro de uso de IA](./AI_USAGE.md)** · **[💬 Registro de prompts](./prompts/)**

---

## 📑 Tabla de contenidos

- [✨ Qué hace](#-qué-hace)
- [🎯 Funcionalidades](#-funcionalidades)
- [🧩 Arquitectura](#-arquitectura)
- [🧰 Stack tecnológico](#-stack-tecnológico)
- [💸 Cómo viaja el dinero](#-cómo-viaja-el-dinero)
- [🤖 Cómo decide el agente](#-cómo-decide-el-agente)
- [🚀 Correr localmente](#-correr-localmente)
- [🌐 Desplegar en Vercel](#-desplegar-en-vercel)
- [📁 Estructura del proyecto](#-estructura-del-proyecto)
- [🔐 Seguridad](#-seguridad)
- [🧭 Uso de IA y transparencia](#-uso-de-ia-y-transparencia)
- [🚧 Limitaciones y roadmap](#-limitaciones-y-roadmap)
- [👥 Equipo](#-equipo)
- [💡 Sobre el hackatón](#-sobre-el-hackatón)

---

## ✨ Qué hace

**Hipótesis de partida** *(a validar con alguien de campo)*: el pequeño caficultor no tiene un canal propio, directo y verificable para cobrar. Depende de intermediarios que fijan cuándo y cómo le pagan, muchas veces sin recibo ni historial de ingresos. Y quien no tiene INVIMA ni siquiera puede abrir una tienda.

Terracierta by Onyx lo resuelve en cuatro pasos:

1. **Ingrese** con su cuenta (caficultor, cooperativa o comprador) y reciba su **wallet propia**: una dirección de cobro y de pago que cualquier billetera puede usar.
2. **Su camino** depende de si tiene INVIMA, un dato que queda **registrado con su cuenta**: la página lo lee y no se lo vuelve a preguntar.
3. **Ruta A, con INVIMA:** abra su tienda, publique sus productos y reciba el pago de cada comprador directo en su wallet.
4. **Ruta B, sin INVIMA:** cargue su lote, elija entre las **3 mejores cooperativas** que le recomienda el agente, y la cooperativa le paga por la plataforma.

Tres entradas, según lo que busca cada quien:

| Quién | Qué hace | Necesita cuenta |
|-------|----------|:---------------:|
| ☕ **Caficultor** | Vende en su tienda o a una cooperativa, y cobra en su wallet | Sí |
| 🛒 **Comprador** | Mira el catálogo sin cuenta; para **pagar** entra con su cuenta y paga desde su billetera | Para pagar |
| 🏢 **Cooperativa** | Recibe ofertas por lotes, las acepta y las paga | Sí |

---

## 🎯 Funcionalidades

| Función | Detalle |
|---------|---------|
| 🏪 **Tienda pública** | Catálogo y detalle por caficultor, fotos en Supabase Storage. Solo se ve lo publicado |
| 🛒 **Checkout con cuenta** | Pagar exige iniciar sesión como comprador: **la wallet sale de su perfil**, no de un formulario. El catálogo sigue siendo público. **El monto y la wallet del caficultor los calcula el servidor** |
| 🧾 **Mis compras** | El comprador ve su wallet, lo que pagó y el recibo de cada compra. Cada cuenta ve solo las suyas |
| 💸 **Ciclo de pago completo** | Solicitud → autorización → ejecución → finalización, con estados `pendiente / completado / fallido` y ruta de retorno |
| 🧾 **Recibo** | Pantalla compartida para pedidos y ofertas, con refresco automático mientras el pago está pendiente |
| 🤖 **Agente de match** | Puntaje **determinista** (sin modelo de lenguaje) sobre precio, cercanía, método, variedad y capacidad. Devuelve el top 3 con el motivo |
| 📦 **Oferta al elegir** | La oferta se crea **solo cuando el caficultor elige**; ver el top 3 no compromete a nadie |
| 🏢 **Panel de la cooperativa** | Ofertas por responder, por pagar e historial. Reintento si el pago falla |
| 📊 **Panel de pagos** | El caficultor ve lo cobrado, los pagos completados y los pendientes |
| 🔌 **Adaptadores con mocks** | Pagos y login pasan por una capa con interruptor `USE_MOCKS`: la interfaz no cambia cuando llegan los módulos reales |
| 🔒 **Seguridad por capas** | RLS en todas las tablas, validación en el servidor, escrituras sensibles solo desde el servidor |
| 🧾 **Transparencia de IA** | Registro de herramientas, archivos y prompts, como pide la política del evento |

---

## 🧩 Arquitectura

```mermaid
flowchart TB
  F([☕ Caficultor]) --> L[Sign up: datos e INVIMA<br/>wallet asignada]
  L --> Q{¿Tiene INVIMA?}
  Q -->|Sí · Ruta A| T[Tienda y productos]
  T --> C([🛒 Comprador<br/>con cuenta y wallet])
  C -->|Checkout| P[[Módulo de pagos<br/>Interledger]]
  Q -->|No · Ruta B| LO[Lote]
  LO --> A[🤖 Agente de match<br/>reglas y top 3]
  A -->|El caficultor elige| O[Oferta]
  O --> K([🏢 Cooperativa])
  K -->|Acepta y paga| P
  P -->|De wallet a wallet| W[(Wallet del caficultor)]
```

La interfaz nunca habla directo con los módulos de los compañeros. Todo pasa por **adaptadores**:

```mermaid
flowchart TB
  UI[Interfaz Next.js] --> AD{{src/adapters<br/>USE_MOCKS}}
  AD -->|true| MK[Mocks<br/>pagos y login]
  AD -->|false| PAY[src/payments<br/>módulo de pagos]
  AD -->|false| AUTH[src/auth<br/>módulo de login]
  UI --> DB[(Supabase<br/>Postgres, RLS y Storage)]
  PAY -. llaves solo en el servidor .-> OP[Interledger]
```

**Decisiones clave:**

- **El servidor decide el monto.** El navegador solo dice *qué producto y cuántas unidades*; el precio y la wallet receptora salen de la base. Nadie puede cambiar el cobro desde la consola.
- **Interruptor seguro.** Los mocks se activan **solo** con `USE_MOCKS=true`. Si la variable falta, la app usa los módulos reales: un despliegue olvidado no simula pagos en silencio.
- **La seguridad la garantiza la base.** El RLS aísla a cada caficultor; las tablas de pedidos y pagos no tienen políticas de escritura para usuarios, solo las escribe el servidor.
- **La plataforma no custodia dinero.** Muestra la cotización, pide el consentimiento y deja el recibo; el dinero va de wallet a wallet.
- **El agente solo usa reglas.** Es explicable y no necesita llaves. Queda preparado para evolucionar (por ejemplo, que un modelo redacte el "por qué") sin cambiar el puntaje.
- **Todos tienen cuenta y wallet para pagar o cobrar.** Caficultores, cooperativas **y compradores**. Mirar el café no necesita cuenta; pagar sí, y la wallet con la que se paga sale del perfil (nadie puede pagar con una wallet ajena).

**Contrato con el login** (`src/adapters/types.ts`), con dos momentos distintos:

| Función | Entrada | Salida | Qué hace |
|---------|---------|--------|----------|
| `registrarse` *(sign up)* | `correo`, `contrasena`, `rol`, `nombre`, `municipio`, `tieneInvima` | `{ ok, rol }` o `{ ok: false, error }` | **Solicita los datos**, crea la cuenta, **asigna la wallet**, guarda el perfil (el INVIMA solo si es caficultor) e inicia sesión |
| `iniciarSesion` *(sign in)* | `correo`, `contrasena` | `{ ok, rol }` o `{ ok: false, error }` | Solo valida credenciales; **todo lo demás se detecta solo**. El error es genérico (no revela si el correo existe) |
| `obtenerSesion` / `obtenerPerfil` | — | sesión o perfil con `wallet_address` y `tiene_invima` | La página solo **lee** el INVIMA; ninguna pantalla lo cambia |
| `cerrarSesion` | — | — | — |

`Rol = caficultor | cooperativa | comprador`. La página manda a `/acceso?siguiente=<ruta>` (o `/registro?...`) para volver al producto que se iba a pagar: el módulo de login debe respetar `siguiente` (solo rutas internas, ya validadas por `rutaSegura`).

---

## 🧰 Stack tecnológico

| Capa | Tecnología | Rol |
|------|------------|-----|
| Frontend + Backend | **Next.js 16** (App Router) | UI, Server Actions y Route Handlers |
| UI | **React 19** + **Tailwind CSS 4** | Componentes con los tokens de Terracierta |
| Tipografías | **Cormorant Garamond** + **EB Garamond** | Títulos y cuerpo, vía `next/font` |
| Lenguaje | **TypeScript** (strict) | Tipado en todo el proyecto |
| Base de datos y Storage | **Supabase** (PostgreSQL + RLS) | Datos, seguridad por fila y fotos |
| Validación | **Zod 4** | Entradas validadas en el servidor |
| Pagos | **Interledger** | De wallet a wallet *(módulo real en integración)* |
| Pruebas | **Vitest 4** + SQL | Unitarias, integración y RLS |
| Hosting y CI/CD | **Vercel** | Preview por rama y deploy en cada push a `main` |

---

## 💸 Cómo viaja el dinero

```
Ruta A:  Comprador ── paga al comprar ──────────▶ Wallet del caficultor
Ruta B:  Cooperativa ── paga al aceptar la oferta ▶ Wallet del caficultor
```

Los seis pasos técnicos de un pago con Interledger, y qué hace cada uno hoy:

| # | Paso | Módulo real *(compañero de pagos)* | Mock actual |
|:-:|------|:-----------------------------------:|:-----------:|
| 1 | Descubrir la wallet del caficultor | Pendiente de integrar | Simulado |
| 2 | Crear el pago entrante | Pendiente de integrar | Simulado |
| 3 | Generar la cotización | Pendiente de integrar | Se muestra el monto exacto |
| 4 | Obtener el consentimiento del pagador | Pendiente de integrar | Pantalla de billetera simulada |
| 5 | Ejecutar el pago saliente | Pendiente de integrar | ~3 s y queda `completado` |
| 6 | Confirmar el estado y emitir el recibo | Pendiente de integrar | Recibo `RCB-…` |

**Contrato que espera la página** (`src/adapters/types.ts`):

| Función | Entrada | Salida |
|---------|---------|--------|
| `iniciarPago` | `tipo`, `referenciaId`, `montoCop`, `walletReceptor`, `walletPagador`, `urlRetorno` | `pagoId`, `redirectUrl` o `null`, `estado` |
| `consultarPago` | `pagoId` | `estado` (`pendiente`, `completado`, `fallido`), `detalle` |

La ruta de retorno es `/pago/retorno?tipo=…&ref=…&pago_id=…`. Si la billetera vuelve sin `pago_id`, se resuelve por `tipo` + `ref`.

---

## 🤖 Cómo decide el agente

Puntaje de **0 a 100**, calculado en `src/lib/match.ts`, siempre igual para el mismo lote y las mismas cooperativas:

| Criterio | Puntos máximos | Regla |
|----------|:--------------:|-------|
| 💰 Precio por kg | 35 | Más alto es mejor (la cooperativa le **paga** al caficultor) |
| 📍 Cercanía | 25 | 100 % en el mismo municipio, baja hasta 0 a 150 km |
| ⚙️ Método | 15 | Lavado, honey o natural: ¿lo recibe? |
| 🌱 Variedad | 10 | ¿Recibe la variedad del lote? |
| 📦 Capacidad | 15 | ¿Le alcanza para los kilos del lote? |

Una cooperativa **solo se puede elegir** si acepta el método y la variedad y tiene capacidad. Si hay menos de tres, se completan con las que no calzan, marcadas con el motivo.

**Ejemplo real** *(lote de 500 kg Caturra lavado, Marsella, con los datos de ejemplo)*:

| # | Cooperativa | Puntaje | Motivo |
|:-:|-------------|:-------:|--------|
| I | Aroma del Suroeste | 88 | Queda a unos 74 km, paga el mejor precio entre las cooperativas |
| II | Cumbres Cafeteras | 87 | Está en el mismo municipio, paga $ 21.500 por kg |
| III | Raíz Alta | 59 | Queda a unos 82 km, el precio más bajo de las tres |

*Tierra Nueva queda afuera: no recibe la variedad Caturra.*

> ⚠️ La cercanía usa una tabla **aproximada** de municipios; si un municipio no está, queda neutra. Los pesos son un primer criterio y se pueden ajustar.

---

## 🚀 Correr localmente

**Requisitos:** Node 20+ (se recomienda 22), [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
# 1. Clonar e instalar
git clone https://github.com/SalazarDukeImpactHub/terracierta-by-onyx.git
cd terracierta-by-onyx
npm install

# 2. Base de datos y Storage locales (aplica migraciones y datos de ejemplo)
npx supabase start

# 3. Correr la página en http://localhost:3000
npm run dev:local
```

> 💡 `dev:local` lee las llaves **locales** de `supabase status` y se las pasa solo al proceso de Next. **No hace falta crear ningún `.env`.**

Hay dos pantallas distintas, como en cualquier plataforma:

- **`/registro` (sign up):** pide los datos de la persona (rol, nombre, municipio, correo y contraseña) y asigna su wallet. **Solo a los caficultores** les pregunta si tienen INVIMA, y ahí queda guardado. Las cooperativas están precargadas y no se registran solas.
- **`/acceso` (sign in):** pide solo **correo y contraseña**; el rol, el perfil, la wallet y el INVIMA se detectan solos. Nunca vuelve a preguntar el INVIMA.

En modo demostración `/acceso` también lista cinco cuentas de ejemplo (caficultora con INVIMA, caficultor sin INVIMA, cooperativa demo y dos compradores, uno cuyo pago siempre falla) con la contraseña `demo1234`, p. ej. `marta@terracierta.demo`. Son datos inventados, no secretos. Las cuentas que cree en `/registro` en este modo no guardan la contraseña: es una simulación para recorrer la demo.

### 🧪 Probar la Ruta A (con INVIMA)

1. **Tienda** → tienda de Marta Ospina → un producto → **Entrar para pagar** → elija **Comprador (cuenta demo)**. Vuelve al mismo producto, ya con su wallet: **Pagar**.
2. En la billetera simulada, **Autorizar** (o **Rechazar**).
3. La pantalla de retorno muestra los cuatro pasos y el recibo; en **Mis compras** (`/comprador`) queda la compra.
4. Entre como Marta → **Pedidos y pagos recibidos**.
5. Para ver un pago fallido, entre como **Comprador cuyo pago falla (demo)**: su wallet contiene `fail` y el mock hace que su pago termine en "No se pudo completar".

### 🧪 Probar la Ruta B (sin INVIMA)

1. Entre como **Caficultor sin INVIMA** (Jairo, Marsella) → **Cargar mi lote** → por ejemplo lavado, Caturra, 500 kg, Marsella.
2. El agente muestra las 3 cooperativas. **Elija Cumbres Cafeteras**: es la que tiene cuenta demo.
3. Salga y entre como **Cooperativa (cuenta demo)** → **Aceptar oferta** → **Pagar con Interledger** → autorice.
4. El recibo muestra el pago de la wallet de la cooperativa a la del caficultor; el lote pasa a *Vendido*.

### ✅ Pruebas

```bash
npm run typecheck   # tipos
npm test            # unitarias: validación, escape, agente de match, URL del sitio
npm run test:db     # integración de la Ruta B contra la base local (necesita `supabase start`)
npm run test:rls    # pruebas de RLS contra la base local (recrea la base antes de correr)
npm run db:reset    # recrea la base desde las migraciones y el seed
```

Hoy: **115 pruebas** (86 unitarias y 29 de integración) y **46 verificaciones de RLS**.

### 🔑 Variables de entorno

Solo las necesita si no usa `dev:local` (por ejemplo, para apuntar a un Supabase en la nube). **Nunca** las suba al repo.

```env
USE_MOCKS=true                              # pagos y login simulados (hasta integrar los reales)
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key   # solo servidor, nunca con prefijo NEXT_PUBLIC
# NEXT_PUBLIC_SITE_URL=http://localhost:3000    # opcional: en Vercel se toma de la URL del despliegue
```

Las llaves de Interledger las define el módulo de pagos y viven **solo en el servidor**.

---

## 🌐 Desplegar en Vercel

Vercel no puede llegar al Supabase de su computador: hace falta un proyecto de **Supabase en la nube**. Lo hace una persona con acceso a las cuentas; **las llaves se escriben solo en los paneles, nunca en el repo ni en chats**.

1. **Supabase:** cree un proyecto nuevo (uno **propio de Terracierta**, no reutilice proyectos de otros equipos) y tenga a mano la URL, la `anon key` y la `service_role key` (*Project Settings → API*).
2. **Cargar el esquema y los datos de ejemplo:**
   ```bash
   npx supabase login
   npx supabase link --project-ref <REF_DEL_PROYECTO>
   npx supabase db push --include-seed
   ```
   > 💡 Si la CLI está iniciada con **otra cuenta** de Supabase y no ve su proyecto, no hace falta cambiar de cuenta: en el *SQL Editor* del dashboard pegue las 4 migraciones de `supabase/migrations/` (en orden) y luego `supabase/seed.sql`. Cada migración **nueva** se aplica igual, en orden, en el proyecto de la nube.

   Para **comprobar** que quedó bien, ejecute `supabase/tests/cloud-verify.sql` en el *SQL Editor*: devuelve 15 filas con el valor esperado entre paréntesis (7 tablas con RLS, 11 políticas, 2 funciones, 5 perfiles, 4 cooperativas, 3 productos, el rol `comprador`, el bucket de fotos y los permisos de `anon`).

   Y para comprobar el **comportamiento** del RLS (no solo que exista), ejecute `supabase/tests/rls.sql` en el *SQL Editor* con el seed limpio: 46 verificaciones con seis actores que terminan en `ROLLBACK`, así que no dejan datos. Si todo está bien, devuelve la fila `RLS: todas las pruebas pasaron`.

   **Scripts para la nube** (se generan desde las migraciones y el seed, así nunca quedan desactualizados; salen en `supabase/.temp/`, ignorada por git):

   | Comando | Qué genera |
   |---------|------------|
   | `npm run cloud:setup` | Migraciones + seed en una transacción, para un proyecto **nuevo y vacío** (una sola vez) |
   | `npm run cloud:update -- <migración>` | **Una migración nueva** (y sus datos de ejemplo) para un proyecto que ya tiene las anteriores. Ej.: `npm run cloud:update -- 20261017000000_comprador` |
   | `npm run cloud:reset` | Reinicia la **demo**: borra los datos de las 7 tablas y recarga el seed. No toca el esquema ni las fotos de Storage |
3. **Vercel:** *Add New → Project* → importe `SalazarDukeImpactHub/terracierta-by-onyx` (framework Next.js, carpeta raíz).
4. **Variables** (*Settings → Environment Variables*, en Production **y** Preview):

   | Variable | Valor |
   |----------|-------|
   | `USE_MOCKS` | `true` (hasta integrar los pagos y el login reales) |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon key` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role key` (márquela como *Sensitive*) |

5. **Redeploy.** Las variables nuevas no se aplican a despliegues ya hechos.

Cada push a `main` actualiza producción y cada rama o *pull request* genera su propia URL de preview.

> ⚠️ Con `USE_MOCKS=true`, cualquiera que tenga la URL puede entrar como uno de los perfiles de ejemplo y editar datos de ejemplo. Deje activa la *Deployment Protection* de Vercel en los previews y no difunda la URL pública. Al integrar los módulos reales: `USE_MOCKS=false`.

**Flujo de trabajo del equipo:** `main` siempre desplegable · cada cambio en una rama corta (`feat/…`, `fix/…`, `docs/…`) con *pull request* · cada compañero toca solo su carpeta (`src/payments`, `src/auth`).

- **`main` está protegida:** solo se entra por *pull request* (no se aprueba con revisiones obligatorias, para no frenar a nadie), no admite *force push* y no se puede borrar. Vercel genera una URL de *preview* por cada rama.
- **`.github/CODEOWNERS`:** GitHub pide revisión automáticamente según la carpeta: `src/payments/` → Yamil, `src/auth/` → Álvaro, y `src/adapters/types.ts` (el contrato entre la página y los dos módulos) → Jennifer, Yamil y Álvaro. Todo lo demás lo revisa Jennifer.

---

## 📁 Estructura del proyecto

| Carpeta / archivo | Qué contiene |
|-------------------|--------------|
| `src/app/` | Rutas: landing, acceso (sign in), registro (sign up), caficultor, tienda, comprador, cooperativa, pago y API de pagos |
| `src/components/` | Cabecera, pie, formularios, recibo, fotos de producto |
| `src/adapters/` | **Contratos** + mocks + selector `USE_MOCKS`. La interfaz solo habla con esta capa |
| `src/payments/` | ⛔ **Stub** del módulo de pagos *(compañero de pagos)* |
| `src/auth/` | ⛔ **Stub** del módulo de login y wallets *(compañero de login)* |
| `src/lib/match.ts` | Agente de match: puntaje, desglose y motivo |
| `src/lib/ruta-b.ts` | Lote, elección de cooperativa, aceptar oferta |
| `src/lib/roles.ts` | Home de cada rol y `rutaSegura` (a dónde volver tras entrar, solo rutas internas) |
| `src/lib/pagos-service.ts` | Crear el pago desde datos de la base, sincronizar estado, pedidos y ofertas |
| `src/lib/validacion.ts` | Esquemas Zod, wallet address, URLs seguras |
| `supabase/` | Migraciones (tablas, RLS, vista pública, Storage), `seed.sql` y `tests/rls.sql` |
| `scripts/` | `dev-local.mjs` y `test-db.mjs`: arrancan con las llaves locales, sin `.env` |
| `AI_USAGE.md` · `prompts/` | Política de IA del evento: herramientas, archivos y prompts |

---

## 🔐 Seguridad

Una plataforma que mueve cobros tiene que **pasar su propia auditoría**. Capas implementadas y verificadas:

- **Monto y wallet receptora desde el servidor.** Una petición manipulada con `monto` y `walletReceptor` falsos salió con el precio de la base y la wallet real.
- **Row Level Security en las 7 tablas.** Cada caficultor ve y edita solo lo suyo; el catálogo público lee solo `publicado = true`. **46 verificaciones en SQL** con seis actores distintos (sin sesión, caficultora, caficultor sin INVIMA, cooperativa y dos compradores).
- **Escrituras sensibles solo desde el servidor.** Pedidos, pagos y ofertas no tienen políticas de escritura para usuarios.
- **Vista pública sin wallets.** La tienda se arma con una vista que expone solo `id`, `nombre` y `municipio`.
- **Sin INVIMA no se abre tienda**, también a nivel de base de datos. Y el INVIMA **no se autodeclara desde la página**: el dato viene de la cuenta, así que un caficultor no puede darse acceso a la tienda con un clic.
- **Validación en el servidor.** Zod en cada entrada; wallet address `https://` o `$`; precios y cantidades acotados.
- **Datos escapados.** El HTML escrito en nombres y descripciones se muestra como texto; las URLs de foto solo aceptan `http(s)`.
- **Fotos validadas.** Tipo, tamaño (2 MB) y **firma real del archivo**: un texto disfrazado de PNG se rechaza.
- **Protección por rol.** Sin sesión → `/acceso`; cada rol solo ve su espacio; un caficultor no ve los lotes de otro; un comprador solo ve sus compras.
- **Checkout con sesión.** La API de pagos responde 401 sin sesión y 403 a caficultores y cooperativas; la wallet con la que se paga sale del perfil, así que una wallet que mande el navegador se ignora.
- **Sin redirecciones abiertas.** El parámetro `siguiente` solo acepta rutas internas: `https://…`, `//…` y `javascript:` se descartan, también en `/acceso` y `/registro`.
- **Sesión simulada firmada.** En modo demostración la cookie de sesión va firmada con un secreto del servidor: un id suelto, una firma inventada o la firma de otra cuenta se rechazan. Sigue siendo una simulación, no la autenticación real.
- **Registro acotado.** El rol que mande el navegador no puede ser cooperativa; el INVIMA solo cuenta si el rol es caficultor; la contraseña exige 8 caracteres o más; el error de sign in es el mismo para correo desconocido y contraseña errónea.
- **Llaves solo en el servidor.** La llave de servicio no aparece en el bundle del navegador (verificado) ni en el repo.
- **Sin custodia.** La plataforma nunca toca el dinero.

> Verificado con pruebas en SQL, pruebas de integración contra la base y recorridos en el navegador. **No es una auditoría externa.**

---

## 🧭 Uso de IA y transparencia

Cumplimos la **Política de IA del evento**: todo está registrado mientras se trabaja, no al final.

- **Herramienta:** *Claude Code* con el modelo *Claude Sonnet 5.5* escribió la página completa. **Jennifer Salazar Duke dirige y revisa cada decisión.**
- **Qué no escribió la IA:** el servicio real de Interledger y el login real son de los compañeros; sus archivos se listan aparte.
- **Verificación:** cada tarea se corrió y probó, y el resultado real (incluidos los fallos y sus correcciones) está en [`AI_USAGE.md`](./AI_USAGE.md).
- **Prompts:** el texto íntegro de cada instrucción, por área, en [`prompts/`](./prompts/).
- **Código previo:** no se copió código de otros proyectos. La tienda de Luli se definió como referencia de patrones y **no se abrió ni se copió nada**.

---

## 🚧 Limitaciones y roadmap

| Pendiente | Estado |
|-----------|--------|
| Pagos reales con Interledger | Lo entrega el compañero de pagos en `src/payments` |
| Autenticación real (sign in / sign up) y asignación de wallets | Lo entrega el compañero de login en `src/auth`: `iniciarSesion` y `registrarse` (la página ya tiene las pantallas `/acceso` y `/registro`) |
| Reemplazar la tabla `profiles` provisional por la real | Al integrar el login. `tiene_invima` lo **registra el sign up** (solo caficultores; la página solo lo lee) |
| Rol `comprador` y wallet asignada en el login real | El compañero de login debe admitir `comprador` en `profiles.rol`, asignar wallet al registrarse y respetar `?siguiente=` (cambio de contrato) |
| Moneda y unidades menores del monto | Por confirmar con el módulo de pagos (hoy: COP entero) |
| Cooperativas sin cuenta | Solo la **cuenta demo** puede aceptar y pagar ofertas; las demás son precargadas |
| Doble pago con el módulo real | Un pago pendiente abandonado no se cancela: revisar al integrar |
| Agente: coordenadas de municipios | Aproximadas; el agente evolucionará (por ejemplo, un modelo que redacte el motivo) |
| Supabase en la nube + URL pública en Vercel | Pendiente de crear y cargar (ver [Desplegar](#-desplegar-en-vercel)) |
| Capturas de pantalla en el README | Se agregan **al final, con el diseño definitivo** |
| Validación con alguien de campo | Pendiente: cómo cobra hoy el caficultor, cuánto tarda, si tiene Nequi |
| Licencia del repositorio | Por definir por el equipo |

---

## 👥 Equipo

| Integrante | Rol |
|------------|-----|
| **Jennifer Salazar Duke** | Dirección del proyecto, producto y revisión |
| **Yamil Andre La Barrera López** | Pagos con Interledger (`src/payments`) |
| **Álvaro Henao González** | Autenticación (sign in / sign up) y asignación de wallets (`src/auth`) |
| **Caren Briyid Hoyos Estrada** | Administración y parte creativa · ideas y revisión de errores |
| **Astrid Carolina Hoyos Estrada** | Administración y parte creativa · ideas y revisión de errores |

Lo técnico recae sobre todo en Yamil y Álvaro. Caren y Astrid llevan la **administración** y la **parte creativa**, aportan ideas y **revisan la app para detectar los errores que se le escapen al equipo técnico**.

> Cada integrante técnico trabaja **solo en su carpeta** y en su propia rama (`feat/payments`, `feat/auth`), con *pull request* hacia `main`.

---

## 💡 Sobre el hackatón

Proyecto construido para el **Hackatón Open Payments · Medellín 2026** (Ruta N, 16 y 17 de octubre). La demo muestra el ciclo completo: **solicitud de pago → autorización → ejecución → finalización exitosa**, en las dos rutas: un caficultor con INVIMA que publica su café y recibe un pago directo, y otro sin INVIMA que carga su lote, elige una cooperativa y ve el cobro.

Terracierta es un proyecto de café con nombre propio, que parte de Marsella. Conózcalo en **[terracierta-landing.vercel.app](https://terracierta-landing.vercel.app/)**.
