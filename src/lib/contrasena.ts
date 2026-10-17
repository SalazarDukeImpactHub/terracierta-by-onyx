import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LARGO = 64;

/** Hash scrypt. El resultado nunca es la contraseña en claro. */
export function hashContrasena(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, LARGO).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verificarContrasena(plain: string, almacenada: string): boolean {
  const partes = almacenada.split(":");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;
  const salt = partes[1];
  const hash = partes[2];
  if (!salt || !hash) return false;
  const actual = scryptSync(plain, salt, LARGO);
  const esperado = Buffer.from(hash, "hex");
  if (actual.length !== esperado.length) return false;
  return timingSafeEqual(actual, esperado);
}
