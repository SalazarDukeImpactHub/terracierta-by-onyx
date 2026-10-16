import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { FotoProducto } from "@/components/foto-producto";
import { clienteAdmin } from "@/lib/supabase/admin";
import { formatoCop } from "@/lib/validacion";
import { alternarPublicado } from "./actions";

export const metadata: Metadata = { title: "Mi tienda" };
export const dynamic = "force-dynamic";

export default async function MiTienda() {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) redirect("/caficultor");

  const { data: productos } = await clienteAdmin()
    .from("productos")
    .select("id, nombre, descripcion, precio_cop, foto_url, publicado")
    .eq("dueno_id", perfil.id)
    .order("creado_en");

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <Link href="/caficultor" className="etiqueta hover:text-tinta">
        ← Mi espacio
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Mi tienda</h1>
          <p className="mt-1 text-apagado">Los productos publicados aparecen en tu tienda pública.</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/tienda/${perfil.id}`} className="btn btn-borde">
            Ver tienda pública
          </Link>
          <Link href="/caficultor/tienda/nuevo" className="btn btn-bosque">
            Nuevo producto
          </Link>
        </div>
      </div>

      <ul className="mt-8 grid gap-4">
        {(productos ?? []).map((p) => (
          <li key={p.id} className="grid grid-cols-[6rem_1fr] gap-4 border border-linea bg-crema-2 p-4 sm:grid-cols-[8rem_1fr_auto]">
            <FotoProducto url={p.foto_url} alt={p.nombre} className="aspect-square w-full" />
            <div>
              <h2 className="text-2xl">{p.nombre}</h2>
              <p className="font-titulo text-xl text-cobre-oscuro">{formatoCop(p.precio_cop)}</p>
              <p className={`etiqueta mt-1 ${p.publicado ? "!text-bosque" : ""}`}>{p.publicado ? "Publicado ✦" : "Borrador"}</p>
            </div>
            <div className="col-span-2 flex flex-wrap items-start gap-2 sm:col-span-1 sm:flex-col">
              <Link href={`/caficultor/tienda/${p.id}`} className="btn btn-borde">
                Editar
              </Link>
              <form action={alternarPublicado}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="btn btn-bosque">
                  {p.publicado ? "Ocultar" : "Publicar"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {(productos ?? []).length === 0 && (
        <p className="mt-8 border border-linea bg-crema-2 p-6 text-apagado">Todavía no tenés productos. Creá el primero.</p>
      )}
    </section>
  );
}
