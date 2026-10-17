import type { Metadata } from "next";
import Link from "next/link";
import { FotoProducto } from "@/components/foto-producto";
import { listarTiendas } from "@/lib/catalogo";

export const metadata: Metadata = { title: "Tienda" };
export const dynamic = "force-dynamic";

export default async function Tiendas() {
  const tiendas = await listarTiendas();

  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <p className="etiqueta">Tienda</p>
      <h1 className="mt-2 text-4xl">Café con nombre propio</h1>
      <p className="mt-3 max-w-2xl text-apagado">
        Cada tienda es de un caficultor con INVIMA. Miras el catálogo sin cuenta. Para pagar, entra como comprador
        o como cooperativa: el dinero sale de tu billetera y llega a la del caficultor.
      </p>

      {tiendas.length === 0 ? (
        <p className="mt-10 border border-linea bg-crema-2 p-6 text-apagado">Todavía no hay tiendas publicadas.</p>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tiendas.map((t, i) => (
            <li key={t.id}>
              <Link href={`/tienda/${t.id}`} className="block border border-linea bg-crema-2 hover:border-tinta">
                <FotoProducto url={t.logo_url} alt="" className="aspect-[4/3] w-full" />
                <div className="p-6">
                  <span className="font-titulo text-4xl text-cobre">{["I", "II", "III", "IV", "V", "VI"][i] ?? "◆"}</span>
                  <h2 className="mt-2 text-2xl">{t.nombre}</h2>
                  <p className="etiqueta mt-1">{t.municipio}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
