import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { PERFILES_DEMO } from "@/adapters/mocks/auth";
import { USE_MOCKS } from "@/lib/env";
import { rutaDeRol, rutaSegura } from "@/lib/roles";
import { entrarDemo } from "./actions";

export const metadata: Metadata = { title: "Acceso" };

/**
 * Acceso para todos los roles: caficultor, cooperativa y comprador. `siguiente` (opcional, solo rutas internas)
 * es a dónde volver al entrar; por ejemplo, el producto que la persona iba a pagar.
 */
export default async function Acceso({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente: crudo } = await searchParams;
  const siguiente = rutaSegura(crudo);

  const sesion = await auth.obtenerSesion().catch(() => null);
  if (sesion) redirect(siguiente ?? rutaDeRol(sesion.rol));

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <p className="etiqueta">Acceso</p>
      <h1 className="mt-2 text-4xl">{siguiente ? "Entrá para pagar" : "Entrá a tu espacio"}</h1>
      <p className="mt-3 text-apagado">
        {siguiente
          ? "Para pagar necesitás una cuenta: así tu billetera queda asociada a tus compras y a cada pago."
          : "Cada persona tiene su cuenta y su billetera: caficultores, cooperativas y compradores."}
      </p>

      {USE_MOCKS ? (
        <>
          <p className="mt-3 text-apagado">
            El acceso real llega con el login de Supabase. Mientras tanto, entrá con uno de estos perfiles de ejemplo
            para recorrer la demostración.
          </p>
          <form action={entrarDemo} className="mt-8 grid gap-3">
            {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
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
        ¿Solo querés mirar el café? El catálogo es público; la cuenta se pide cuando vas a pagar.{" "}
        <Link href="/tienda" className="text-cobre-oscuro underline">
          Ir a la tienda
        </Link>
      </p>
    </section>
  );
}
