// Corre las pruebas de integración (*.db.test.ts) contra el Supabase LOCAL, igual que dev-local.mjs:
// lee las llaves de `supabase status` y las pasa solo al proceso de vitest. Sin archivos .env.
import { execSync, spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
  USE_MOCKS: "true",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: estado.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: estado.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: estado.SERVICE_ROLE_KEY,
};

// El paquete no exporta su binario por `require.resolve`: se apunta al archivo directamente.
const vitest = join(raiz, "node_modules", "vitest", "vitest.mjs");
const hijo = spawn(process.execPath, [vitest, "run", "--reporter=verbose", ...process.argv.slice(2)], { cwd: raiz, env, stdio: "inherit" });
hijo.on("exit", (codigo) => process.exit(codigo ?? 0));
