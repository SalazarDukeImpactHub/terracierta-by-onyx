import { cookies } from "next/headers";
import { SITE_URL } from "@/lib/env";

const COOKIE = "tc_ilp";
const LOGIN = "https://wallet.interledger-test.dev/auth/login";

/**
 * Login de Interledger.
 * Sin `vuelta`, regresa al inicio de la billetera (una ruta que sí existe ahí).
 * Con `vuelta`, el regreso es la URL absoluta de Terracierta. Una ruta que empiece
 * por "//" la billetera la toma como página propia y responde 404.
 */
export function urlLoginInterledger(vuelta?: string): string {
  const destino = new URL(LOGIN);
  destino.searchParams.set("callbackUrl", vuelta ? new URL(vuelta, SITE_URL).href : "/");
  return destino.toString();
}

export async function leerCookieIlp(): Promise<string | null> {
  try {
    const valor = (await cookies()).get(COOKIE)?.value;
    if (!valor?.startsWith("testnet.cookie=")) return null;
    return valor;
  } catch (error) {
    if (error instanceof Error && error.message.includes("cookies")) return null;
    throw error;
  }
}

export async function guardarCookieIlp(cookie: string): Promise<void> {
  const valor = cookie.split(";")[0];
  if (!valor.startsWith("testnet.cookie=")) return;
  (await cookies()).set(COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function borrarCookieIlp(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
