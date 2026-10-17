import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { CONTRASENA_DEMO, PERFILES_DEMO } from "@/adapters/mocks/auth";
import { FormularioAcceso } from "@/components/formulario-acceso";
import { Marca } from "@/components/marca";
import { USE_MOCKS } from "@/lib/env";
import { rutaDeRol, rutaSegura } from "@/lib/roles";
import { entrarDemo } from "./actions";

export const metadata: Metadata = { title: "Iniciar sesión" };

/**
 * Sign in (iniciar sesión): correo y contraseña. La página no pregunta nada más: el rol, la wallet y el INVIMA se detectan
 * solos al entrar. `siguiente` (opcional, solo rutas internas) es a dónde volver; por ejemplo, el producto que se iba a pagar.
 */
export default async function Acceso({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente: crudo } = await searchParams;
  const siguiente = rutaSegura(crudo);

  const sesion = await auth.obtenerSesion().catch(() => null);
  if (sesion) redirect(siguiente ?? rutaDeRol(sesion.rol));

  const rutaRegistro = siguiente ? `/registro?siguiente=${encodeURIComponent(siguiente)}` : "/registro";

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <Marca tamano={56} className="mb-4" />
      <p className="etiqueta">{siguiente ? "Para pagar" : "Acceso"}</p>
      <h1 className="mt-2 text-4xl">{siguiente ? "Iniciá sesión para pagar" : "Iniciá sesión"}</h1>
      <p className="mt-3 text-apagado">
        {siguiente
          ? "Para pagar necesitás tu cuenta: así tu billetera queda asociada a tus compras y a cada pago."
          : "Con tu correo y contraseña entrás a tu espacio: tu rol, tu billetera y tus datos se cargan solos."}
      </p>

      <FormularioAcceso siguiente={siguiente} />

      <p className="mt-6 text-sm text-apagado">
        ¿Todavía no tenés cuenta?{" "}
        <Link href={rutaRegistro} className="text-cobre-oscuro underline">
          Registrate
        </Link>
      </p>

      {USE_MOCKS && (
        <div className="mt-10 border border-linea bg-crema-2 p-5">
          <p className="etiqueta !text-cereza">Modo demostración</p>
          <p className="mt-2 text-sm text-apagado">
            El acceso real llega con el módulo de autenticación. Mientras tanto podés iniciar sesión con una cuenta de ejemplo
            (contraseña <code className="font-semibold text-tinta">{CONTRASENA_DEMO}</code>) o entrar rápido con un clic. Las cuentas
            que crees acá no guardan la contraseña, así que no se verifica.
          </p>

          <ul className="mt-3 grid gap-1 text-sm">
            {PERFILES_DEMO.map((p) => (
              <li key={p.id}>
                <code className="text-tinta">{p.correo}</code> <span className="text-apagado">· {p.etiqueta}</span>
              </li>
            ))}
          </ul>

          <form action={entrarDemo} className="mt-5 grid gap-2">
            {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
            <p className="etiqueta">Entrar rápido</p>
            {PERFILES_DEMO.map((p) => (
              <button
                key={p.id}
                type="submit"
                name="perfil"
                value={p.id}
                className="flex items-center justify-between border border-tinta bg-crema px-4 py-2 text-left hover:bg-crema-2"
              >
                <span className="font-titulo text-lg">{p.etiqueta}</span>
                <span aria-hidden="true" className="text-cobre">
                  ✦
                </span>
              </button>
            ))}
          </form>
        </div>
      )}

      <p className="mt-8 text-sm text-apagado">
        ¿Solo querés mirar el café? El catálogo es público; la cuenta se pide cuando vas a pagar.{" "}
        <Link href="/tienda" className="text-cobre-oscuro underline">
          Ir a la tienda
        </Link>
      </p>
    </section>
  );
}
