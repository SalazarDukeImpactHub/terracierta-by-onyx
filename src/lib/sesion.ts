import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { Perfil, Rol, Sesion } from "@/adapters/types";
import { hashContrasena, verificarContrasena } from "@/lib/contrasena";
import { clienteAdmin } from "@/lib/supabase/admin";

const COOKIE = "tc_sesion";
const MAX_AGE = 60 * 60 * 24 * 7;

export interface DatosRegistro {
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string;
  municipio: string;
  correo: string;
  contrasena: string;
  tiene_invima: boolean;
  rol: Rol;
}

export type ResultadoAcceso = { ok: true; rol: Rol } | { ok: false; error: string };

function esRol(valor: string): valor is Rol {
  return valor === "caficultor" || valor === "cooperativa" || valor === "comprador";
}

async function abrirSesion(usuarioId: string): Promise<void> {
  const id = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + MAX_AGE * 1000).toISOString();
  const { error } = await clienteAdmin().from("sesiones").insert({ id, usuario_id: usuarioId, expira_en: expiraEn });
  if (error) throw new Error("No se pudo abrir la sesión.");
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function cerrarSesionUsuario(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await clienteAdmin().from("sesiones").delete().eq("id", id);
  jar.delete(COOKIE);
}

export async function sesionActual(): Promise<Sesion | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;

  const db = clienteAdmin();
  const { data } = await db.from("sesiones").select("usuario_id, expira_en").eq("id", id).maybeSingle();
  if (!data) return null;
  if (new Date(data.expira_en).getTime() < Date.now()) {
    await db.from("sesiones").delete().eq("id", id);
    return null;
  }

  const { data: usuario } = await db.from("usuarios").select("id, rol").eq("id", data.usuario_id).maybeSingle();
  if (!usuario || !esRol(usuario.rol)) return null;
  return { userId: usuario.id, rol: usuario.rol };
}

export async function perfilActual(userId: string): Promise<Perfil | null> {
  const db = clienteAdmin();
  const { data } = await db
    .from("profiles")
    .select("id, rol, nombre, municipio, tiene_invima, wallet_address")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  const { data: usuario } = await db
    .from("usuarios")
    .select("token, tipo_documento, numero_documento")
    .eq("id", userId)
    .maybeSingle();
  return {
    ...(data as Perfil),
    token: usuario?.token ?? null,
    tipo_documento: usuario?.tipo_documento ?? null,
    numero_documento: usuario?.numero_documento ?? null,
  };
}

/** Crea la cuenta y el perfil. El token queda vacío para cargarlo a mano en la base. */
export async function registrarUsuario(datos: DatosRegistro): Promise<ResultadoAcceso> {
  const db = clienteAdmin();
  const id = randomUUID();
  const { error } = await db.from("usuarios").insert({
    id,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    tipo_documento: datos.tipo_documento,
    numero_documento: datos.numero_documento,
    fecha_nacimiento: datos.fecha_nacimiento,
    correo: datos.correo,
    contrasena_hash: hashContrasena(datos.contrasena),
    tiene_invima: datos.tiene_invima,
    rol: datos.rol,
  });
  if (error) {
    if (error.code === "23505") {
      const detalle = `${error.message} ${error.details ?? ""}`;
      if (detalle.includes("documento")) return { ok: false, error: "Ya hay una cuenta con ese documento." };
      return { ok: false, error: "Ya hay una cuenta con ese correo." };
    }
    if (error.code === "PGRST205") {
      return { ok: false, error: "La base todavía no tiene la tabla de usuarios, así que la cuenta no se guardó." };
    }
    return { ok: false, error: "No se pudo crear la cuenta." };
  }

  const { error: perfilError } = await db.from("profiles").insert({
    id,
    rol: datos.rol,
    nombre: `${datos.nombres} ${datos.apellidos}`,
    municipio: datos.municipio,
    tiene_invima: datos.tiene_invima,
    wallet_address: null,
  });
  if (perfilError) {
    await db.from("usuarios").delete().eq("id", id);
    return { ok: false, error: "No se pudo crear la cuenta." };
  }

  await abrirSesion(id);
  return { ok: true, rol: datos.rol };
}

export async function ingresarUsuario(correo: string, contrasena: string): Promise<ResultadoAcceso> {
  const { data, error } = await clienteAdmin()
    .from("usuarios")
    .select("id, rol, contrasena_hash")
    .eq("correo", correo)
    .maybeSingle();
  if (error?.code === "PGRST205") {
    return { ok: false, error: "La base todavía no tiene la tabla de usuarios, así que no se puede entrar." };
  }
  if (!data || !esRol(data.rol)) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }
  if (!verificarContrasena(contrasena, data.contrasena_hash)) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }
  await abrirSesion(data.id);
  return { ok: true, rol: data.rol };
}
