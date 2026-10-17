import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { requerirEnv } from "@/lib/env";

const COOKIE = "tc_cobro";

export interface CobroPendiente {
  tipo: "pedido" | "oferta";
  productoId?: string;
  cantidad?: number;
  ofertaId?: string;
  monto: number;
  receptor: string;
  descripcion: string;
  pagadorId: string;
  volver: string;
  exp: number;
}

function firmar(cuerpo: string): string {
  return createHmac("sha256", requerirEnv("SUPABASE_SERVICE_ROLE_KEY")).update(cuerpo).digest("base64url");
}

export async function guardarCobro(cobro: Omit<CobroPendiente, "exp">): Promise<void> {
  const payload: CobroPendiente = { ...cobro, exp: Date.now() + 15 * 60 * 1000 };
  const cuerpo = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(COOKIE, `${cuerpo}.${firmar(cuerpo)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function leerCobro(): Promise<CobroPendiente | null> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return null;
  const punto = valor.lastIndexOf(".");
  if (punto <= 0) return null;
  const cuerpo = valor.slice(0, punto);
  const firma = valor.slice(punto + 1);
  const esperada = firmar(cuerpo);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString()) as CobroPendiente;
    if (!datos.exp || datos.exp < Date.now()) return null;
    if (datos.tipo !== "pedido" && datos.tipo !== "oferta") return null;
    if (!Number.isInteger(datos.monto) || datos.monto <= 0) return null;
    return datos;
  } catch {
    return null;
  }
}

export async function borrarCobro(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
