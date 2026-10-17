import { redirect } from "next/navigation";
import type { AuthAdapter, Perfil, Rol } from "@/adapters/types";
import { rutaDeRol } from "@/lib/roles";

/**
 * Punto único de acceso a sesión y perfil. El login vive en /src/auth
 * (correo, contraseña y cookie). USE_MOCKS solo sigue aplicando a los pagos.
 */
export const auth: AuthAdapter = {
  async iniciarSesion(credenciales) {
    return (await import("@/auth")).iniciarSesion(credenciales);
  },
  async registrarse(datos) {
    return (await import("@/auth")).registrarse(datos);
  },
  async obtenerSesion() {
    return (await import("@/auth")).obtenerSesion();
  },
  async obtenerPerfil() {
    return (await import("@/auth")).obtenerPerfil();
  },
  async cerrarSesion() {
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
