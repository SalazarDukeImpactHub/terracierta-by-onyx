// Lectura central de variables de entorno. Solo servidor, salvo las NEXT_PUBLIC_*.

/**
 * Los mocks se activan SOLO con USE_MOCKS=true. Si la variable falta, se usan los
 * módulos reales: un despliegue olvidado no debe simular pagos en silencio.
 */
export const USE_MOCKS = process.env.USE_MOCKS === "true";

/**
 * URL pública de esta página (se usa para armar la urlRetorno del pago). Orden:
 *  1. NEXT_PUBLIC_SITE_URL, si se define a mano (dominio propio);
 *  2. variables del sistema de Vercel: dominio de producción, o la URL de ESTE despliegue en previews;
 *  3. localhost para desarrollo local.
 * Sin (2), un despliegue en Vercel mandaría al pagador de vuelta a localhost.
 */
function resolverSiteUrl(): string {
  const manual = process.env.NEXT_PUBLIC_SITE_URL;
  if (manual) return manual.replace(/\/$/, "");
  const host = process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
  if (host) return `https://${host}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolverSiteUrl();

export function requerirEnv(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  return valor;
}

/** Llave pública: la anon clásica o la publishable nueva del panel de Supabase. */
export function clavePublicaSupabase(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || requerirEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

/** Llave de servidor: service_role clásica o secret key nueva. Nunca va al navegador. */
export function claveServidorSupabase(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || requerirEnv("SUPABASE_SECRET_KEY");
}
