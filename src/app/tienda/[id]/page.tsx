import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FotoProducto } from "@/components/foto-producto";
import { listarProductos, obtenerTienda } from "@/lib/catalogo";
import { formatoCop } from "@/lib/validacion";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const tienda = await obtenerTienda((await params).id);
  return { title: tienda ? tienda.nombre : "Tienda" };
}

export default async function Tienda({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tienda = await obtenerTienda(id);
  if (!tienda) notFound();
  const productos = await listarProductos(tienda.id);

  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <Link href="/tienda" className="etiqueta hover:text-tinta">
        ← Todas las tiendas
      </Link>
      <div className="mt-6 flex flex-wrap items-end gap-5">
        <FotoProducto url={tienda.logo_url} alt="" className="h-24 w-24 border border-linea" />
        <div>
          <h1 className="text-5xl">{tienda.nombre}</h1>
          <p className="etiqueta mt-1">{tienda.municipio}</p>
        </div>
      </div>
      <div className="rombo my-8" aria-hidden="true">
        ◆
      </div>

      {productos.length === 0 ? (
        <p className="border border-linea bg-crema-2 p-6 text-apagado">Esta tienda aún no tiene productos publicados.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((p) => (
            <li key={p.id}>
              <Link href={`/tienda/${tienda.id}/${p.id}`} className="group block border border-linea bg-crema-2 hover:border-tinta">
                <FotoProducto url={p.foto_url} alt={p.nombre} className="aspect-[4/3] w-full" />
                <div className="p-5">
                  <h2 className="text-2xl group-hover:text-cobre-oscuro">{p.nombre}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-apagado">{p.descripcion}</p>
                  <p className="mt-3 font-titulo text-2xl text-cobre-oscuro">{formatoCop(p.precio_cop)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
