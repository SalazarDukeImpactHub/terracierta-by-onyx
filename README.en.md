<p align="center">
  <img src="./public/brand/terracierta-grano-claro.svg" alt="Terracierta by Onyx" width="96">
</p>

# ☕ Terracierta by Onyx — Coffee with its own name

[🇪🇸 Español](./README.md) · **🇬🇧 English**

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Interledger](https://img.shields.io/badge/Payments-Interledger-334132)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-D97757?logo=anthropic&logoColor=white)
![Hackathon](https://img.shields.io/badge/Hackathon-Open%20Payments%20Medell%C3%ADn%202026-B0673C)
![Made in Colombia](https://img.shields.io/badge/Made%20in-Colombia%20🇨🇴-FCD116)

> A web platform that gives every small coffee grower in **Antioquia and Marsella** their own **wallet** to get paid directly with **Interledger**: by selling in their own online shop (if they have INVIMA, the Colombian food-safety registration) or to the best cooperative, recommended by an agent (if they don't).

**[🧾 AI usage log](./AI_USAGE.md)** · **[💬 Prompt log](./prompts/)** *(both written in Spanish)* · **[🇪🇸 Español](./README.md)**

> ℹ️ The app's interface and the project documents are in **Spanish**. In this file, button and screen names appear in Spanish with an English gloss.

> ✅ **Current status: functional on the Interledger test wallet.** Sign-in is **real** (accounts and sessions in Supabase) and payments **actually execute** against the **Interledger testnet**: they move **test funds**, not real money. Mocks (`USE_MOCKS=true`) are an **optional** demo mode, off when the variable is missing. For an account to pay it needs a test wallet and its token loaded in the database (see [Accounts and wallets](#-accounts-and-wallets)). Known gaps and risks: [Limitations and roadmap](#-limitations-and-roadmap).

---

## 📑 Table of contents

- [✨ What it does](#-what-it-does)
- [🎯 Features](#-features)
- [🧩 Architecture](#-architecture)
- [🧰 Tech stack](#-tech-stack)
- [💸 How the money moves](#-how-the-money-moves)
- [🔑 Accounts and wallets](#-accounts-and-wallets)
- [🤖 How the agent decides](#-how-the-agent-decides)
- [🚀 Run locally](#-run-locally)
- [🌐 Deploy on Vercel](#-deploy-on-vercel)
- [📁 Project structure](#-project-structure)
- [🔐 Security](#-security)
- [🧭 AI use and transparency](#-ai-use-and-transparency)
- [🚧 Limitations and roadmap](#-limitations-and-roadmap)
- [👥 Team](#-team)
- [💡 About the hackathon](#-about-the-hackathon)

---

## ✨ What it does

**Starting hypothesis** *(to be validated with someone in the field)*: a small coffee grower has no direct, verifiable channel of their own to get paid. They depend on intermediaries who decide when and how they are paid, often with no receipt and no income history. And a grower without INVIMA cannot even open a shop.

Terracierta by Onyx addresses this in four steps:

1. **Sign in** with an account (grower, cooperative or buyer). Each account is linked to an **Interledger wallet**: a payment address that any wallet can use to pay or to get paid.
2. **Your path** depends on whether you have INVIMA, a fact that is **stored with your account**: the app reads it and never asks again.
3. **Route A, with INVIMA:** open your shop, publish your products and get paid by each buyer straight into your wallet.
4. **Route B, without INVIMA:** upload your lot, pick one of the **3 best cooperatives** recommended by the agent, and the cooperative pays you through the platform.

Three entry points, depending on what each person is looking for:

| Who | What they do | Needs an account |
|-----|--------------|:----------------:|
| ☕ **Grower** | Sells in their shop or to a cooperative, and gets paid in their wallet | Yes |
| 🛒 **Buyer** | Browses the catalogue without an account; to **pay**, signs in and pays from their own wallet | To pay |
| 🏢 **Cooperative** | Receives offers for lots, accepts them and pays them | Yes |

---

## 🎯 Features

| Feature | Detail |
|---------|--------|
| 🧭 **Entry by role** | The home page lets you choose grower, buyer or cooperative and shows only what applies, with its main action (for the grower, creating an account) |
| 🏪 **Public shop** | Catalogue and detail page per grower, photos in Supabase Storage. Only published items are visible |
| 🛒 **Checkout with an account** | Paying requires signing in as a buyer: **the wallet comes from the profile**, not from a form. The catalogue stays public. **The amount and the grower's wallet are computed by the server** |
| 🧾 **My purchases** | The buyer sees their wallet, what they paid and the receipt for each purchase. Each account sees only its own |
| 💸 **Full payment cycle** | Request → authorization → execution → completion, with `pendiente / completado / fallido` states (pending / completed / failed) and a return route |
| 🧾 **Receipt** | Shared screen for orders and offers, refreshing automatically while a payment is pending |
| 🤖 **Match agent** | **Deterministic** score (no language model) over price, proximity, method, variety and capacity. Returns the top 3 with the reason |
| 📦 **Offer on choice** | The offer is created **only when the grower chooses**; seeing the top 3 commits nobody |
| 🏢 **Cooperative dashboard** | Offers to answer, to pay and history. Retry if a payment fails |
| 📊 **Payments dashboard** | The grower sees what was collected, completed payments and pending ones |
| 🔐 **Real sign-in** | Accounts in Supabase (`usuarios`), hashed passwords and a session in an httpOnly cookie backed by the `sesiones` table |
| 💳 **Interledger payments** | Wallet to wallet on the testnet; the status is confirmed against the wallet's transactions |
| 🛡️ **Post-quantum channel** | Payment calls (`/api/pagos/*`) travel encrypted with ML-KEM-768. The `/pago/pasarela` gateway signs the receipt with Ed25519 + ML-DSA-65 |
| 🧪 **Optional demo mode** | `USE_MOCKS=true` adds sample accounts and a simulated wallet to rehearse without moving funds |
| 🔌 **Adapters** | Payments and sign-in go through a layer (`src/adapters`): the interface never talks directly to the modules |
| 🔒 **Layered security** | RLS on every table, server-side validation, sensitive writes only from the server |
| 🧾 **AI transparency** | A record of tools, files and prompts, as the event's policy requires |

---

## 🧩 Architecture

```mermaid
flowchart TB
  F([☕ Grower]) --> L[Sign up: data and INVIMA<br/>wallet assigned]
  L --> Q{Has INVIMA?}
  Q -->|Yes · Route A| T[Shop and products]
  T --> C([🛒 Buyer<br/>with account and wallet])
  C -->|Checkout| P[[Payments module<br/>Interledger]]
  Q -->|No · Route B| LO[Lot]
  LO --> A[🤖 Match agent<br/>rules and top 3]
  A -->|The grower chooses| O[Offer]
  O --> K([🏢 Cooperative])
  K -->|Accepts and pays| P
  P -->|Wallet to wallet| W[(Grower's wallet)]
```

The interface never talks directly to the payments and accounts modules. Everything goes through **adapters**:

```mermaid
flowchart TB
  UI[Next.js interface] --> AD{{src/adapters}}
  AD --> AUTH[src/auth<br/>accounts and session]
  AD -->|Interledger wallets| PAY[src/payments<br/>real payments]
  AD -. USE_MOCKS=true and other wallets .-> MK[Payments mock<br/>demo only]
  AUTH --> DB[(Supabase<br/>Postgres, RLS and Storage)]
  UI --> DB
  PAY -. keys only on the server .-> OP[Interledger testnet]
```

**Key decisions:**

- **The server decides the amount.** The browser only says *which product and how many units*; the price and the receiving wallet come from the database. Nobody can change the charge from the console.
- **Mocks only on purpose.** Only with `USE_MOCKS=true`. If the variable is missing, the app uses the real modules: a forgotten deployment never silently simulates payments. Mind the opposite direction too: today a payment between two Interledger wallets is **real even if** `USE_MOCKS` is `true` (the wallet's domain decides). [ADR-001](./docs/decisions/ADR-001-riel-de-pagos-y-politica-de-cooperativas.md) *(draft, in Spanish)* proposes replacing that with an explicit setting.
- **The database guarantees security.** RLS isolates each grower; the orders and payments tables have no write policies for users, only the server writes them.
- **The platform holds no money.** Payments go wallet to wallet. In the gateway (official SDK) the holder authorizes in their own wallet; in the shop checkout the payment goes out with the wallet session stored for that account (see [How the money moves](#-how-the-money-moves)).
- **The agent uses rules only.** It is explainable and needs no keys. It is ready to evolve (for example, a model could write the "why") without changing the score.
- **Everyone has an account and a wallet to pay or get paid.** Growers, cooperatives **and buyers**. Browsing coffee needs no account; paying does, and the wallet used to pay comes from the profile (nobody can pay with someone else's wallet).

**Sign-in contract** (`src/adapters/types.ts`), with two distinct moments:

| Function | Input | Output | What it does |
|----------|-------|--------|--------------|
| `registrarse` *(sign up)* | `correo`, `contrasena`, `rol`, `nombre` (or `nombres` + `apellidos`), `tipo_documento`, `numero_documento`, `fecha_nacimiento`, `municipio`, `tieneInvima` | `{ ok, rol }` or `{ ok: false, error }` | Creates the account and the profile, stores INVIMA and signs in. **It does not assign a wallet**: it stays empty until loaded in the database (see [Accounts and wallets](#-accounts-and-wallets)). Rejects a repeated email or document |
| `iniciarSesion` *(sign in)* | `correo`, `contrasena` | `{ ok, rol }` or `{ ok: false, error }` | Only validates credentials; **everything else is detected automatically**. The error is generic (it does not reveal whether the email exists) |
| `obtenerSesion` / `obtenerPerfil` | — | session or profile with `wallet_address` and `tiene_invima` | The app only **reads** INVIMA; no screen changes it |
| `cerrarSesion` | — | — | — |

`Rol = caficultor | cooperativa | comprador` (grower | cooperative | buyer). The app sends users to `/acceso?siguiente=<route>` (or `/registro?...`) to return to the product they were about to pay for; `siguiente` accepts internal routes only, validated by `rutaSegura`.

---

## 🧰 Tech stack

| Layer | Technology | Role |
|-------|------------|------|
| Frontend + Backend | **Next.js 16** (App Router) | UI, Server Actions and Route Handlers |
| UI | **React 19** + **Tailwind CSS 4** | Components using the Terracierta tokens |
| Typefaces | **Cormorant Garamond** + **EB Garamond** | Headings and body, via `next/font` |
| Language | **TypeScript** (strict) | Typed across the whole project |
| Database and Storage | **Supabase** (PostgreSQL + RLS) | Data, row-level security and photos |
| Validation | **Zod 4** | Inputs validated on the server |
| Payments | **Interledger** (Open Payments with the official SDK, and the Test Wallet API) | Wallet to wallet on the testnet |
| Post-quantum cryptography | **@noble/post-quantum** + **@noble/curves** | ML-KEM-768 for the channel, ML-DSA-65 + Ed25519 for receipts |
| Tests | **Vitest 4** + SQL | Unit, integration and RLS |
| Hosting and CI/CD | **Vercel** | Preview per branch and deploy on every push to `main` |

---

## 💸 How the money moves

```
Route A:  Buyer ── pays at checkout ──────────────▶ Grower's wallet
Route B:  Cooperative ── pays on accepting the offer ▶ Grower's wallet
```

Everything happens on the **Interledger testnet**: the money is **test money**. Today there are **two real payment paths** that coexist:

| | Shop checkout and offers | Gateway (`/pago/pasarela`) |
|---|---|---|
| Code | `src/payments/index.ts` + `src/lib/interledger.ts` | `src/payments/openPayments.ts` (official Open Payments SDK) |
| How it pays | Signs in to the Test Wallet with the paying account's stored session, quotes and sends the outgoing payment | Quotes, requests a GNAP grant and **the holder authorizes it in their wallet**; then creates the outgoing payment |
| Consent | The wallet session loaded for the account | Explicit, from the holder, in their wallet |
| Confirmation | Looks for the transaction in the wallet (`COMPLETED` / `FAILED`) | Observes the send and the receipt through the SDK; receipt with a hybrid signature |
| Safety caps | 25 EUR per payment and 30 EUR debit on the quote (test account) | Configurable maximum received amount (`OPEN_PAYMENTS_MAX_RECEIVE`, 0.05 by default) |

The checkout validates the amount, the receiving wallet and the role on the server; calls to `/api/pagos/*` travel through the ML-KEM-768 encrypted channel. If a wallet is not an Interledger one and `USE_MOCKS=true`, the payment falls back to the mock and the screen declares it as simulated.

> ⚠️ **Two paths, one goal.** Having two rails is an integration state, not a final design. [ADR-001](./docs/decisions/ADR-001-riel-de-pagos-y-politica-de-cooperativas.md) *(draft, not accepted; in Spanish)* analyzes unifying them on the official SDK. The gateway guide is in [`docs/pasarela-hackathon.md`](./docs/pasarela-hackathon.md) and the jury demo in [`docs/demo-pqc-jurado.md`](./docs/demo-pqc-jurado.md) *(both in Spanish)*.

**Contract the app expects** (`src/adapters/types.ts`):

| Function | Input | Output |
|----------|-------|--------|
| `iniciarPago` | `tipo`, `referenciaId`, `montoCop`, `walletReceptor`, `walletPagador`, `urlRetorno` | `pagoId`, `redirectUrl` or `null`, `estado` |
| `consultarPago` | `pagoId` | `estado` (`pendiente`, `completado`, `fallido`), `detalle` |

The return route is `/pago/retorno?tipo=…&ref=…&pago_id=…`. If the wallet comes back without `pago_id`, it is resolved by `tipo` + `ref`.

---

## 🔑 Accounts and wallets

- **Sign up (`/registro`):** creates the account (`usuarios`) and the profile (`profiles`) and opens the session. It **does not assign a wallet**: `profiles.wallet_address` stays empty.
- **For an account to pay or get paid through Interledger** two pieces of data are needed that today are **loaded by hand in the database**: its test wallet address (`profiles.wallet_address`, on `interledger-test.dev`) and, to pay from it, the wallet session (`usuarios.token`). The sign-up form never writes the token.
- **Sample data (`seed.sql`):** its wallets use the reserved domain `wallet.example.test`. They are **placeholders**, not Interledger wallets: payments with them are not real. They must be replaced by test wallets to operate.
- **With no wallet, or a non-Interledger wallet,** the real payment does not complete: with `USE_MOCKS=true` it falls back to the mock, and without that variable the payment does not go out.
- **Fallback account:** if an account's token expired or does not exist, the module tries to sign in with `INTERLEDGER_EMAIL` / `INTERLEDGER_PASSWORD` (a shared account). ADR-001 proposes removing this mechanism.

---

## 🤖 How the agent decides

A score from **0 to 100**, computed in `src/lib/match.ts`, always the same for the same lot and the same cooperatives:

| Criterion | Max points | Rule |
|-----------|:----------:|------|
| 💰 Price per kg | 35 | Higher is better (the cooperative **pays** the grower) |
| 📍 Proximity | 25 | 100 % in the same municipality, dropping to 0 at 150 km |
| ⚙️ Method | 15 | Washed, honey or natural: does it accept it? |
| 🌱 Variety | 10 | Does it accept the lot's variety? |
| 📦 Capacity | 15 | Can it take the lot's kilos? |

A cooperative **can only be chosen** if it accepts the method and the variety and has capacity. If fewer than three qualify, the list is filled with those that don't, marked with the reason.

**Real example** *(500 kg of washed Caturra, Marsella, with the sample data)*:

| # | Cooperative | Score | Reason |
|:-:|-------------|:-----:|--------|
| I | Aroma del Suroeste | 88 | About 74 km away, pays the best price among the cooperatives |
| II | Cumbres Cafeteras | 87 | In the same municipality, pays COP 21,500 per kg |
| III | Raíz Alta | 59 | About 82 km away, the lowest price of the three |

*Tierra Nueva is left out: it does not accept the Caturra variety.*

> ⚠️ Proximity uses an **approximate** table of municipalities; if a municipality is missing, it is neutral. The weights are a first criterion and can be adjusted.

---

## 🚀 Run locally

**Requirements:** **Node 22** (`@supabase/supabase-js` 2.118 already requires it; on Node 20 there are warnings and the database tests use a `WebSocket` stand-in) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

```bash
# 1. Clone and install
git clone https://github.com/SalazarDukeImpactHub/terracierta-by-onyx.git
cd terracierta-by-onyx
npm install

# 2. Local database and Storage (applies migrations and sample data)
npx supabase start

# 3. Run the app at http://localhost:3000
npm run dev:local
```

> 💡 `dev:local` reads the **local** Supabase keys (`supabase status`) and passes them only to the Next process. **You do not need to create any `.env` file for the database.** Real payments do need the Interledger variables (see [Environment variables](#-environment-variables)); without them, rehearse with `USE_MOCKS=true`.

There are two distinct screens, as on any platform:

- **`/registro` (sign up):** asks for the person's data (role, name, document, date of birth, municipality, email and password), creates the account and opens the session. Growers declare their INVIMA. Cooperatives are preloaded and cannot sign up on their own. It **does not assign a wallet** (see [Accounts and wallets](#-accounts-and-wallets)).
- **`/acceso` (sign in):** asks only for **email and password**; the role, profile, wallet and INVIMA are detected automatically. It never asks for INVIMA again.

With `USE_MOCKS=true`, `/acceso` also lists sample accounts with their email and password on screen, and a **quick entry** button. They are made-up data, not secrets, and **exist only in demo mode**. Accounts you create at `/registro` are stored, in this mode too.

### 🧪 Try Route A (with INVIMA)

1. **Tienda** (Shop) → Marta Ospina's shop → a product → **Entrar para pagar** (Sign in to pay) → sign in as a buyer. You return to the same product, now with your wallet: **Pagar** (Pay).
2. **Demo mode:** the simulated wallet appears; **Autorizar** (Authorize) or **Rechazar** (Reject). **With Interledger wallets loaded:** there is no simulated screen, the payment executes against the testnet and the return screen shows its real status.
3. The return screen shows the four steps and the receipt; the purchase appears under **Mis compras** (`/comprador`).
4. Sign in as Marta → **Pedidos y pagos recibidos** (Orders and payments received).
5. To see a failed payment in demo mode, sign in as the buyer whose payment fails: their wallet contains `fail`, and the mock makes it end in "No se pudo completar" (Could not be completed).

### 🧪 Try Route B (without INVIMA)

1. Sign in as **Caficultor sin INVIMA** (Jairo, Marsella) → **Cargar mi lote** (Upload my lot) → for example washed, Caturra, 500 kg, Marsella.
2. The agent shows the 3 cooperatives. **Choose Cumbres Cafeteras**: it is the one with a demo account.
3. Sign out and sign in as **Cooperativa (cuenta demo)** → **Aceptar oferta** (Accept offer) → **Pagar con Interledger** (Pay with Interledger). In demo mode you authorize in the simulated wallet; with real wallets the payment executes on the testnet.
4. The receipt shows the payment from the cooperative's wallet to the grower's; the lot becomes *Vendido* (Sold).

### ✅ Tests

```bash
npm run typecheck   # types
npm test            # unit and payments: validation, match agent, PQC channel, gateway
npm run test:db     # integration against the local database (needs `supabase start`)
npm run test:rls    # RLS tests against the local database (recreates the database first)
npm run db:reset    # recreates the database from the migrations and the seed
```

> ⚠️ **`npm test` does not pass cleanly yet:** `jsdom` is missing from `package.json` and 2 payments tests contradict the current code (see [Limitations and roadmap](#-limitations-and-roadmap)). The result of each run, failures included, is recorded in [`AI_USAGE.md`](./AI_USAGE.md); numbers that could go stale are not repeated here.

### 🔑 Environment variables

`dev:local` already resolves the local Supabase ones. You need them written down if you point at a cloud Supabase or want real payments. **Never** commit them; on Vercel they go in the dashboard.

| Group | Variable | What for |
|-------|----------|----------|
| Mode | `USE_MOCKS` | `true` turns on the simulated demo. If missing, there are no mocks |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(or* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`*)* | Public key |
| | `SUPABASE_SERVICE_ROLE_KEY` *(or* `SUPABASE_SECRET_KEY`*)* | Server key. **Never** with the `NEXT_PUBLIC` prefix |
| Site | `NEXT_PUBLIC_SITE_URL` | Optional. On Vercel it is taken from the deployment URL |
| Checkout (Test Wallet) | `INTERLEDGER_API_URL` | Optional; defaults to `https://api-wallet.interledger-test.dev` |
| | `INTERLEDGER_EMAIL`, `INTERLEDGER_PASSWORD` | Fallback account when an account has no valid token |
| Gateway (official SDK) | `OPEN_PAYMENTS_CLIENT_WALLET`, `OPEN_PAYMENTS_KEY_ID` | Open Payments client wallet and key |
| | `OPEN_PAYMENTS_PRIVATE_KEY` *(or* `OPEN_PAYMENTS_PRIVATE_KEY_PATH`*)* | Private key. Server only |
| | `OPEN_PAYMENTS_SENDER_WALLET` | Wallet that pays in the demo |
| | `OPEN_PAYMENTS_MAX_RECEIVE`, `OPEN_PAYMENTS_MAX_DEBIT` | Charge caps |
| | `OPEN_PAYMENTS_REDIRECT_ORIGIN` | Origin the holder returns to after authorizing |
| | `PAYMENTS_RAIL` | Only accepts `open-payments` (the default) |
| | `PAYMENTS_EXECUTION_ENABLED` | `false` blocks execution and only allows checking the total |
| | `PASARELA_DEMO_ENABLED` | Enables the demo gateway |

The Interledger keys live **only on the server**.

---

## 🌐 Deploy on Vercel

Vercel cannot reach the Supabase on your computer: you need a **cloud Supabase** project. A person with access to the accounts does this; **keys are typed only into the dashboards, never into the repo or into chats**.

1. **Supabase:** create a new project (one **owned by Terracierta**, do not reuse other teams' projects) and have the URL, the `anon key` and the `service_role key` at hand (*Project Settings → API*).
2. **Load the schema and the sample data:**
   ```bash
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push --include-seed
   ```
   > 💡 If the CLI is signed in with **another** Supabase account and cannot see your project, you do not need to switch accounts: in the dashboard's *SQL Editor*, paste the migrations from `supabase/migrations/` (in order) and then `supabase/seed.sql`. Every **new** migration is applied the same way, in order, in the cloud project.

   To **check** that it went well, run `supabase/tests/cloud-verify.sql` in the *SQL Editor*: it returns one row per check with the expected value in parentheses (tables with RLS, policies, functions, seed profiles, the photo bucket and the `anon` permissions). If you added migrations after that test was written, check that its numbers are still current.

   And to check the **behavior** of RLS (not just that it exists), run `supabase/tests/rls.sql` in the *SQL Editor* on a clean seed: the checks end in `ROLLBACK`, so they leave no data behind. If everything is fine, it returns the row `RLS: todas las pruebas pasaron` (all tests passed).

   **Cloud scripts** (generated from the migrations and the seed, so they never go stale; they are written to `supabase/.temp/`, ignored by git):

   | Command | What it generates |
   |---------|-------------------|
   | `npm run cloud:setup` | Migrations + seed in one transaction, for a **new, empty** project (once) |
   | `npm run cloud:update -- <migration>` | **One new migration** (and its sample data) for a project that already has the previous ones. E.g.: `npm run cloud:update -- 20261017000000_comprador` |
   | `npm run cloud:reset` | Resets the **demo**: deletes the data in the 7 tables and reloads the seed. Does not touch the schema or the Storage photos |
3. **Vercel:** *Add New → Project* → import `SalazarDukeImpactHub/terracierta-by-onyx` (Next.js framework, root folder).
4. **Variables** (*Settings → Environment Variables*, in Production **and** Preview):

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon key` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role key` (mark it as *Sensitive*) |
   | Interledger variables | The ones in the [variables table](#-environment-variables), depending on whether you use the checkout, the gateway or both (keys as *Sensitive*) |
   | `USE_MOCKS` | **Do not set it for real payments.** Set it to `true` only for a simulated demo deployment |

5. **Redeploy.** New variables are not applied to existing deployments.

Every push to `main` updates production, and every branch or *pull request* gets its own preview URL.

> ⚠️ With `USE_MOCKS=true`, anyone who has the URL can sign in as one of the sample profiles (there is a quick entry button) and edit sample data. Keep Vercel's *Deployment Protection* on for previews. For a deployment with real payments, remove the variable.

**Team workflow:** `main` is always deployable · every change goes on a short branch (`feat/…`, `fix/…`, `docs/…`) with a *pull request* · each teammate touches only their own folder (`src/payments`, `src/auth`).

- **`main` is protected:** it can only be changed through a *pull request* (no required reviews, so nobody is blocked), it does not accept *force push* and cannot be deleted. Vercel creates a *preview* URL for each branch.
- **`.github/CODEOWNERS`:** GitHub requests review automatically by folder: `src/payments/` → Yamil, `src/auth/` → Álvaro, and `src/adapters/types.ts` (the contract between the app and the two modules) → Jennifer, Yamil and Álvaro. Everything else is reviewed by Jennifer.

---

## 📁 Project structure

| Folder / file | What it contains |
|---------------|------------------|
| `src/app/` | Routes: home, sign in (`acceso`), sign up (`registro`), grower, shop, buyer, cooperative, payment (return, gateway, security) and the payments and gateway APIs |
| `src/components/` | Header, footer, home role selector, brand bean, forms, receipt, product photos |
| `public/` | Brand logos (`brand/`: bean and seal, light and dark versions) and the home photo (`fotos/`) |
| `src/adapters/` | **Contracts** + mocks + the `USE_MOCKS` switch. The interface only talks to this layer |
| `src/payments/` | Payments module *(Yamil)*: checkout, gateway with the official SDK, post-quantum channel and receipts (`pqc/`) |
| `src/auth/` | Accounts module *(Álvaro)*: sign up, sign in and session; the session logic is in `src/lib/sesion.ts` |
| `src/lib/interledger.ts` | Test Wallet API client: quote, send and confirm checkout payments |
| `docs/` | Gateway, jury demo, ADR-001 (draft), integration plans and PQC research *(in Spanish)* |
| `src/lib/match.ts` | Match agent: score, breakdown and reason |
| `src/lib/ruta-b.ts` | Lot, cooperative choice, accepting an offer |
| `src/lib/roles.ts` | Each role's home and `rutaSegura` (where to return after signing in, internal routes only) |
| `src/lib/pagos-service.ts` | Create the payment from database data, sync status, orders and offers |
| `src/lib/validacion.ts` | Zod schemas, wallet address, safe URLs |
| `supabase/` | Migrations (tables, RLS, public view, Storage), `seed.sql` and `tests/rls.sql` |
| `scripts/` | `dev-local.mjs` and `test-db.mjs`: start with the local keys, no `.env`; `cloud-sql.mjs`: generates the SQL for the cloud |
| `AI_USAGE.md` · `prompts/` | The event's AI policy: tools, files and prompts |

---

## 🔐 Security

A platform that moves payments has to **pass its own audit**. Layers implemented and verified:

- **Amount and receiving wallet from the server.** A tampered request with fake `monto` and `walletReceptor` went out with the database price and the real wallet.
- **Row Level Security on the business tables.** Each grower sees and edits only their own; the public catalogue reads only `publicado = true`. SQL checks (`supabase/tests/rls.sql`) with different actors: no session, growers, cooperative and buyers.
- **Sensitive writes only from the server.** Orders, payments and offers have no write policies for users.
- **Public view without wallets.** The shop is built from a view that exposes only `id`, `nombre` and `municipio`.
- **No INVIMA, no shop**, also at the database level. And INVIMA is **not self-declared from the app**: the fact comes from the account, so a grower cannot grant themselves shop access with one click.
- **Server-side validation.** Zod on every input; wallet address `https://` or `$`; bounded prices and quantities.
- **Escaped data.** HTML typed into names and descriptions is shown as text; photo URLs accept only `http(s)`.
- **Validated photos.** Type, size (2 MB) and the file's **real signature**: a text file disguised as a PNG is rejected.
- **Role protection.** No session → `/acceso`; each role sees only its own space; a grower cannot see another's lots; a buyer sees only their purchases.
- **Checkout with a session.** The payments API answers 401 without a session and 403 to growers; the wallet used to pay comes from the profile, so a wallet sent by the browser is ignored. Today the checkout admits buyers **and** cooperatives; that policy is under review (ADR-001, draft).
- **Post-quantum encrypted channel.** Payment calls travel with ML-KEM-768 + AES-256-GCM; the gateway adds a single-use token bound to the session and the quote, expiring in five minutes. Encryption protects the browser–server leg: it **does not authorize** payments and does not make Interledger post-quantum.
- **Caps on the test account.** The checkout rejects payments over 25 EUR or quotes that would debit more than 30 EUR.
- **No open redirects.** The `siguiente` parameter accepts only internal routes: `https://…`, `//…` and `javascript:` are discarded, also on `/acceso` and `/registro`.
- **Real session in an httpOnly cookie.** The session id is random (64 hex), lives in the `sesiones` table and expires in 7 days; the cookie is `httpOnly`, `sameSite=lax` and `secure` in production. An id with any other format is discarded without querying the database.
- **Hashed passwords** and the same sign-in error for an unknown email and a wrong password. Sign-up rejects a repeated email or document.
- **Keys only on the server.** The service key does not appear in the browser bundle (verified) or in the repo.
- **No custody.** The platform never touches the money.

> Verified with SQL tests, integration tests against the database and browser walkthroughs. **It is not an external audit.**

---

## 🧭 AI use and transparency

We comply with the **event's AI Policy**: everything is recorded as the work happens, not at the end.

- **Tool:** *Claude Code* with the *Claude Sonnet 5.5* model wrote the app. **Jennifer Salazar Duke directs and reviews every decision.**
- **What Jennifer's AI did not write:** the payments module (`src/payments`) and the accounts module (`src/auth`) belong to teammates; their files are listed separately.
- **Verification:** every task was run and tested, and the real result (including failures and their fixes) is in [`AI_USAGE.md`](./AI_USAGE.md).
- **Prompts:** the full text of each instruction, by area, in [`prompts/`](./prompts/).
- **Prior code:** no code was copied from other projects. The Luli shop was defined as a pattern reference and **nothing was opened or copied**.

---

## 🚧 Limitations and roadmap

| Pending | Status |
|---------|--------|
| Two payment paths (checkout with the Test Wallet API, and gateway with the official SDK and GNAP) | They coexist. [ADR-001](./docs/decisions/ADR-001-riel-de-pagos-y-politica-de-cooperativas.md) *(draft)* proposes unifying them on the official SDK; the decision is the team's |
| Real checkout payment without explicit consent | The checkout pays with the account's stored wallet session (or the fallback `INTERLEDGER_EMAIL`); the gateway does ask for the holder's authorization |
| Wallet assignment | Sign-up **does not assign** a wallet or token: they are loaded by hand in the database. How they get assigned is still to be defined |
| Sample data with placeholder wallets | `seed.sql` uses `wallet.example.test`: they are not Interledger wallets |
| Duplicated `tiene_invima` | Sign-up stores it in `usuarios` and in `profiles`; the single source is still to be defined |
| Currency and minor units of the amount | Prices are in COP and the test wallet charges in EUR: converted with the Test Wallet rate, with caps |
| Cooperative policy | Today the checkout admits cooperatives as buyers, with no purchases screen of their own; which cooperatives have accounts is still to be decided (ADR-001, draft) |
| Double payment with the real module | An abandoned pending payment is not cancelled: review |
| Gateway state on serverless | According to the gateway's documentation, its grants and keys live in one process's memory: on Vercel (serverless) the full flow may not complete. It still needs validation with a real sign-in |
| Tests | `jsdom` is not declared in `package.json`. Also, 2 tests in `src/payments/index.test.ts` expect the checkout to delegate to the SDK without cookies, and today it delegates to the Test Wallet API with a cookie (the same tension as ADR-001). The remaining failures in the last local run came from uninstalled dependencies (`npm install`) |
| Migrations | Two migrations share the timestamp `20261017000000` (`comprador` and `usuarios`) |
| Agent: municipality coordinates | Approximate; the agent will evolve (for example, a model that writes the reason) |
| Cloud Supabase + public URL on Vercel | **Done.** Before presenting, check the deployment variables ([Deploy](#-deploy-on-vercel)). `npm run cloud:reset` deletes data: confirm which tables it touches (there are new ones, such as `usuarios` and `sesiones`) before running it |
| Demo-mode notice | Removed from the interface at the team's request. With real payments it no longer applies; **if deployed with `USE_MOCKS=true`, the presentation must say payments are simulated** |
| Teammates' AI use | Still to be declared in [`AI_USAGE.md`](./AI_USAGE.md) |
| Home photo | Made by Jennifer Salazar Duke. If an AI tool was used to make it, it still has to be declared in [`AI_USAGE.md`](./AI_USAGE.md) |
| Screenshots in the README | Added **at the end, with the final design** |
| Validation with someone in the field | Pending: how a grower gets paid today, how long it takes, whether they have Nequi |
| Repository license | To be defined by the team |

---

## 👥 Team

| Member | Role |
|--------|------|
| **Jennifer Salazar Duke** | Project direction, product and review |
| **Yamil Andre La Barrera López** | Payments with Interledger (`src/payments`) |
| **Álvaro Henao González** | Authentication (sign in / sign up) and wallet assignment (`src/auth`) |
| **Caren Briyid Hoyos Estrada** | Administration and creative side · ideas and error review |
| **Astrid Carolina Hoyos Estrada** | Administration and creative side · ideas and error review |

The technical work falls mostly on Yamil and Álvaro. Caren and Astrid handle **administration** and the **creative side**, contribute ideas and **review the app to catch the errors the technical team misses**.

> Each technical member works **only in their own folder** and on their own branch, with a *pull request* into `main`. Integrating the real modules goes through small, chained PRs, not a single one.

---

## 💡 About the hackathon

Built for the **Open Payments Hackathon · Medellín 2026** (Ruta N, October 16–17). The demo shows the full cycle: **payment request → authorization → execution → successful completion**, on both routes: a grower with INVIMA who publishes their coffee and receives a direct payment, and another without INVIMA who uploads a lot, chooses a cooperative and sees the payment. Payments execute on the **Interledger testnet**, with test funds.
