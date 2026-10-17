import { redirect } from "next/navigation";
import { USE_MOCKS } from "@/lib/env";
import { rutaDeRol } from "@/lib/roles";
import * as mock from "@/adapters/mocks/auth";
import type { AuthAdapter, Perfil, Rol } from "@/adapters/types";

/**
 * Punto único de acceso a sesión y perfil. USE_MOCKS=true -> perfiles de ejemplo; false -> /src/auth real.
 */
export const auth: AuthAdapter = {
  async obtenerSesion() {
    if (USE_MOCKS) return mock.obtenerSesion();
    return (await import("@/auth")).obtenerSesion();
  },
  async obtenerPerfil() {
    if (USE_MOCKS) return mock.obtenerPerfil();
    return (await import("@/auth")).obtenerPerfil();
  },
  async cerrarSesion() {
    if (USE_MOCKS) return mock.cerrarSesion();
    return (await import("@/auth")).cerrarSesion();
  },
};

/**
 * Protege una página por rol. Sin sesión -> /acceso. Con otro rol -> a su propia home.
 * Devuelve el perfil (con la wallet asignada) para pintarlo.
 */
export async function requerirRol(rol: Rol): Promise<Perfil> {
  const sesion = await auth.obtenerSesion();
  if (!sesion) redirect("/acceso");
  if (sesion.rol !== rol) redirect(rutaDeRol(sesion.rol));
  const perfil = await auth.obtenerPerfil();
  if (!perfil) redirect("/acceso");
  return perfil;
}
