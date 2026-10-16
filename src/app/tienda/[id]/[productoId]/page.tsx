import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioCheckout } from "@/components/formulario-checkout";
import { FotoProducto } from "@/components/foto-producto";
import { obtenerProducto, obtenerTienda } from "@/lib/catalogo";
import { formatoCop } from "@/lib/validacion";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; productoId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, productoId } = await params;
  const producto = await obtenerProducto(id, productoId);
  return { title: producto ? producto.nombre : "Producto" };
}

export default async function DetalleProducto({ params }: { params: Params }) {
  const { id, productoId } = await params;
  const [tienda, producto] = await Promise.all([obtenerTienda(id), obtenerProducto(id, productoId)]);
  if (!tienda || !producto) notFound();

  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <Link href={`/tienda/${tienda.id}`} className="etiqueta hover:text-tinta">
        ← {tienda.nombre}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <FotoProducto url={producto.foto_url} alt={producto.nombre} className="aspect-[4/3] w-full border border-linea" />

        <div>
          <p className="etiqueta">{tienda.municipio}</p>
          <h1 className="mt-1 text-4xl">{producto.nombre}</h1>
          <p className="mt-4 whitespace-pre-line">{producto.descripcion}</p>
          <p className="mt-5 font-titulo text-4xl text-cobre-oscuro">{formatoCop(producto.precio_cop)}</p>

          <div className="rombo my-6" aria-hidden="true">
            ◆
          </div>

          <FormularioCheckout productoId={producto.id} precioCop={producto.precio_cop} />
        </div>
      </div>
    </section>
  );
}
