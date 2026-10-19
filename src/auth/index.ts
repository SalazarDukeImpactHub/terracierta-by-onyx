/**
 * Login real: correo y contraseña contra public.usuarios, sesión en cookie httpOnly.
 * La sesión de Interledger no se guarda en esta tabla: si falta, la app redirige a su login.
 * El registro pide documento, fecha de nacimiento y municipio, y guarda el INVIMA solo si es caficultor.
 */
import type { CredencialesInicio, DatosRegistro, Perfil, ResultadoAuth, Sesion } from "@/adapters/types";
import { cerrarSesionUsuario, ingresarUsuario, perfilActual, registrarUsuario, sesionActual } from "@/lib/sesion";

export async function iniciarSesion(credenciales: CredencialesInicio): Promise<ResultadoAuth> {
  return ingresarUsuario(credenciales.correo, credenciales.contrasena);
}

export async function registrarse(datos: DatosRegistro): Promise<ResultadoAuth> {
  const nombres = datos.nombres?.trim() || datos.nombre.trim().split(/\s+/)[0] || "";
  const apellidos = datos.apellidos?.trim() || datos.nombre.trim().split(/\s+/).slice(1).join(" ") || "—";
  if (!datos.tipo_documento || !datos.numero_documento || !datos.fecha_nacimiento) {
    return { ok: false, error: "Faltan el documento o la fecha de nacimiento." };
  }
  return registrarUsuario({
    nombres,
    apellidos,
    tipo_documento: datos.tipo_documento,
    numero_documento: datos.numero_documento,
    fecha_nacimiento: datos.fecha_nacimiento,
    municipio: datos.municipio,
    correo: datos.correo,
    contrasena: datos.contrasena,
    tiene_invima: datos.tieneInvima,
    rol: datos.rol,
  });
}

export async function obtenerSesion(): Promise<Sesion | null> {
  return sesionActual();
}

export async function obtenerPerfil(): Promise<Perfil | null> {
  const sesion = await sesionActual();
  if (!sesion) return null;
  return perfilActual(sesion.userId);
}

export async function cerrarSesion(): Promise<void> {
  await cerrarSesionUsuario();
}
