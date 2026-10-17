import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ayudantes PUROS del login simulado (modo demostración). No tocan la base ni las cookies: se prueban solos.
 * Nada de esto es autenticación real; existe para recorrer registro e ingreso mientras llega el módulo real.
 */

export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * El mismo correo da siempre el mismo id: así el ingreso simulado encuentra el perfil sin guardar el correo
 * en ninguna tabla (profiles no tiene correo: en el login real vive en Supabase Auth).
 */
export function uuidDesdeCorreo(correo: string): string {
  const hash = createHash("sha1").update(`terracierta-mock:${normalizarCorreo(correo)}`).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // versión 5
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Wallet de ejemplo para una cuenta nueva en modo demostración (dominio reservado .test: no es una wallet real). */
export function walletDeEjemplo(nombre: string, id: string): string {
  const slug =
    nombre
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "cuenta";
  return `https://wallet.example.test/${slug}-${id.slice(0, 8)}`;
}

/** Cookie de sesión simulada: `<id>.<firma>`. La firma (HMAC con un secreto del servidor) impide fabricarla a mano. */
export function firmarCookie(id: string, secreto: string): string {
  return `${id}.${createHmac("sha256", secreto).update(id).digest("base64url")}`;
}

/** Devuelve el id si la cookie está bien firmada y es un uuid; si no, null. Comparación en tiempo constante. */
export function verificarCookie(valor: string | undefined, secreto: string): string | null {
  if (!valor) return null;
  const corte = valor.lastIndexOf(".");
  if (corte < 1) return null;
  const id = valor.slice(0, corte);
  const firma = valor.slice(corte + 1);
  if (!FORMATO_UUID.test(id)) return null;
  const esperada = createHmac("sha256", secreto).update(id).digest("base64url");
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}
