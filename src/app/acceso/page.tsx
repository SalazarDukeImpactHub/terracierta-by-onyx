import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { PERFILES_DEMO } from "@/adapters/mocks/auth";
import { USE_MOCKS } from "@/lib/env";
import { entrarDemo } from "./actions";

export const metadata: Metadata = { title: "Acceso" };

export default async function Acceso() {
  const sesion = await auth.obtenerSesion().catch(() => null);
  if (sesion) redirect(sesion.rol === "cooperativa" ? "/cooperativa" : "/caficultor");

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <p className="etiqueta">Acceso</p>
      <h1 className="mt-2 text-4xl">Entrá a tu espacio</h1>

      {USE_MOCKS ? (
        <>
          <p className="mt-3 text-apagado">
            El acceso real llega con el login de Supabase. Mientras tanto, entrá con uno de estos perfiles de ejemplo
            para recorrer la demostración.
          </p>
          <form action={entrarDemo} className="mt-8 grid gap-3">
            {PERFILES_DEMO.map((p) => (
              <button
                key={p.id}
                type="submit"
                name="perfil"
                value={p.id}
                className="flex items-center justify-between border border-tinta bg-crema-2 px-5 py-4 text-left hover:bg-crema"
              >
                <span className="font-titulo text-xl">{p.etiqueta}</span>
                <span aria-hidden="true" className="text-cobre">
                  ✦
                </span>
              </button>
            ))}
          </form>
        </>
      ) : (
        <p className="mt-3 text-apagado">
          El formulario de acceso lo entrega el módulo de login (<code>src/auth</code>).
        </p>
      )}

      <p className="mt-8 text-sm text-apagado">
        ¿Solo querés comprar café? No necesitás cuenta.{" "}
        <Link href="/tienda" className="text-cobre-oscuro underline">
          Ir a la tienda
        </Link>
      </p>
    </section>
  );
}
