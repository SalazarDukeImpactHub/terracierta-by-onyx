import Link from "next/link";
import { redirect } from "next/navigation";
import { leerCookieIlp, urlLoginInterledger } from "@/lib/login-interledger";
import { rutaSegura } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** Si Interledger devolvió a la app con sesión, sigue el camino. Si no, pide el login de nuevo. */
export default async function ListoInterledger({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente } = await searchParams;
  const destino = rutaSegura(siguiente) ?? "/";
  if (await leerCookieIlp()) redirect(destino);

  return (
    <section className="mx-auto max-w-lg px-5 py-16">
      <p className="etiqueta">Billetera</p>
      <h1 className="mt-2 text-4xl">Entra a Interledger</h1>
      <p className="mt-3 text-apagado">
        Terracierta no guarda la cookie de la billetera. Para pagar hay que iniciar sesión en Interledger.
      </p>
      <a href={urlLoginInterledger()} className="btn mt-6">
        Ir al login de Interledger
      </a>
      <p className="mt-6 text-sm">
        <Link href={destino} className="text-cobre-oscuro underline">
          Volver
        </Link>
      </p>
    </section>
  );
}
