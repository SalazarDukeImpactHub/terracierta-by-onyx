// Genera scripts SQL para pegar en el SQL Editor de Supabase en la nube (sin CLI, sin contraseñas).
// Se arman desde supabase/migrations/ y supabase/seed.sql, así nunca quedan desactualizados.
//
//   node scripts/cloud-sql.mjs setup            -> migraciones + seed (proyecto NUEVO y VACÍO; se corre UNA vez)
//   node scripts/cloud-sql.mjs update <nombre>  -> UNA migración nueva (sin .sql) + sus datos de ejemplo
//                                                  (supabase/seed-updates/<nombre>.sql, si existe), para un proyecto
//                                                  que ya tiene lo anterior
//   node scripts/cloud-sql.mjs reset            -> deja los datos como el seed: borra lo creado al probar la demo
//
// Salida por defecto: supabase/.temp/cloud-<modo>.sql (carpeta ignorada por git). Un último argumento cambia la ruta.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const modo = process.argv[2];
if (!["setup", "update", "reset"].includes(modo)) {
  console.error("Uso: node scripts/cloud-sql.mjs setup | update <nombre-de-migracion> | reset  [ruta-de-salida]");
  process.exit(1);
}
const nombreUpdate = modo === "update" ? process.argv[3] : undefined;
if (modo === "update" && !nombreUpdate) {
  console.error("Falta el nombre de la migración. Ej.: node scripts/cloud-sql.mjs update 20261017000000_comprador");
  process.exit(1);
}
const rutaSalida = modo === "update" ? process.argv[4] : process.argv[3];

const leer = (...partes) => readFileSync(join(raiz, ...partes), "utf8").replace(/\r\n/g, "\n").trim();
const migraciones = readdirSync(join(raiz, "supabase", "migrations")).filter((f) => f.endsWith(".sql")).sort();
const seed = leer("supabase", "seed.sql");

const partes = [];
if (modo === "setup") {
  partes.push(
    "-- =====================================================================",
    "-- Terracierta by Onyx — carga inicial en Supabase (proyecto NUEVO y VACÍO)",
    "-- Une las migraciones de supabase/migrations/ (en orden) y supabase/seed.sql.",
    "-- Pegar completo en SQL Editor y ejecutar UNA sola vez. Si algo falla, no queda nada a medias.",
    "-- =====================================================================",
    "",
    "begin;",
    "",
  );
  for (const f of migraciones) partes.push(`-- ---------- migración: ${f} ----------`, leer("supabase", "migrations", f), "");
  partes.push("-- ---------- datos de ejemplo: seed.sql ----------", seed, "", "commit;", "");
} else if (modo === "update") {
  const archivo = `${nombreUpdate}.sql`;
  if (!migraciones.includes(archivo)) {
    console.error(`No existe supabase/migrations/${archivo}. Disponibles:\n  ${migraciones.join("\n  ")}`);
    process.exit(1);
  }
  const datos = join("supabase", "seed-updates", archivo);
  partes.push(
    "-- =====================================================================",
    `-- Terracierta by Onyx — actualización de Supabase: ${nombreUpdate}`,
    "-- Aplica UNA migración nueva sobre un proyecto que ya tiene las anteriores (y sus datos de ejemplo, si hay).",
    "-- Pegar completo en SQL Editor y ejecutar UNA sola vez. Si algo falla, no queda nada a medias.",
    "-- =====================================================================",
    "",
    "begin;",
    "",
    `-- ---------- migración: ${archivo} ----------`,
    leer("supabase", "migrations", archivo),
    "",
  );
  if (existsSync(join(raiz, datos))) partes.push(`-- ---------- datos de ejemplo: ${archivo} ----------`, leer(datos), "");
  partes.push("commit;", "");
} else {
  partes.push(
    "-- =====================================================================",
    "-- Terracierta by Onyx — REINICIO de la demo en Supabase",
    "-- Borra TODOS los datos de las 7 tablas (pedidos, pagos, lotes, ofertas, productos creados al probar,",
    "-- cambios a perfiles y cooperativas) y vuelve a cargar los datos de ejemplo de supabase/seed.sql.",
    "-- NO borra el esquema, las políticas ni las fotos ya subidas a Storage (esas se limpian desde Storage).",
    "-- Úselo solo en el proyecto de la DEMO: elimina datos reales si los hubiera.",
    "-- =====================================================================",
    "",
    "begin;",
    "",
    "truncate table public.ofertas, public.pedidos, public.pagos, public.lotes,",
    "               public.productos, public.cooperativas, public.profiles cascade;",
    "",
    "-- ---------- datos de ejemplo: seed.sql ----------",
    seed,
    "",
    "commit;",
    "",
  );
}

const salida = rutaSalida ?? join(raiz, "supabase", ".temp", `cloud-${modo}.sql`);
mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, partes.join("\n"), "utf8");
console.log(`${modo}: ${partes.join("\n").split("\n").length} líneas -> ${salida}`);
