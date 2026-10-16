// Lectura central de variables de entorno. Solo servidor, salvo las NEXT_PUBLIC_*.

/**
 * Los mocks se activan SOLO con USE_MOCKS=true. Si la variable falta, se usan los
 * módulos reales: un despliegue olvidado no debe simular pagos en silencio.
 */
export const USE_MOCKS = process.env.USE_MOCKS === "true";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function requerirEnv(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  return valor;
}
