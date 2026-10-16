// Arranca la página contra el Supabase LOCAL sin escribir ningún archivo .env.
// Lee las llaves de `supabase status` (llaves de desarrollo local, no de producción) y las pasa
// solo al proceso de Next. Requiere `npx supabase start` corriendo.
//   npm run dev:local            -> puerto 3000, USE_MOCKS=true
//   PORT=3100 npm run dev:local  -> otro puerto
import { execSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const puerto = process.argv[2] ?? process.env.PORT ?? "3000";
// Raíz del proyecto, sin depender del directorio desde donde se lance el script
const raiz = fileURLToPath(new URL("..", import.meta.url));

let estado;
try {
  estado = JSON.parse(
    execSync("npx supabase status -o json", { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }),
  );
} catch {
  console.error("No pude leer `supabase status`. ¿Está corriendo `npx supabase start`?");
  process.exit(1);
}

const env = {
  ...process.env,
  USE_MOCKS: process.env.USE_MOCKS ?? "true",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${puerto}`,
  NEXT_PUBLIC_SUPABASE_URL: estado.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: estado.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: estado.SERVICE_ROLE_KEY,
};

const next = require.resolve("next/dist/bin/next");
const hijo = spawn(process.execPath, [next, "dev", "-p", puerto], { cwd: raiz, env, stdio: "inherit" });
hijo.on("exit", (codigo) => process.exit(codigo ?? 0));
