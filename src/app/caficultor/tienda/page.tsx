import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { CampoArchivo } from "@/components/campo-archivo";
import { FotoProducto } from "@/components/foto-producto";
import { clienteAdmin } from "@/lib/supabase/admin";
import { formatoCop } from "@/lib/validacion";
import { alternarPublicado, guardarTienda } from "./actions";
import { BotonPublicar } from "./boton-publicar";

export const metadata: Metadata = { title: "Mi tienda" };
export const dynamic = "force-dynamic";

const ERROR_TIENDA: Record<string, string> = {
  nombre: "El nombre de la tienda debe tener entre 3 y 80 caracteres.",
  logo: "El logo debe ser JPG, PNG o WebP, de hasta 2 MB.",
  guardar: "No pudimos guardar la tienda. Intenta de nuevo.",
  tienda: "Para publicar necesitas el nombre y el logo de la tienda.",
};

export default async function MiTienda({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) redirect("/caficultor");
  const { error } = await searchParams;

  const db = clienteAdmin();
  const { data: ficha } = await db.from("profiles").select("tienda_nombre, tienda_logo_url").eq("id", perfil.id).maybeSingle();
  const lista = Boolean(ficha?.tienda_nombre && ficha.tienda_logo_url);

  const { data: productos } = await db
    .from("productos")
    .select("id, nombre, descripcion, precio_cop, foto_url, publicado")
    .eq("dueno_id", perfil.id)
    .order("creado_en");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta">Catálogo</p>
          <h1 className="mt-1 text-4xl">Mi tienda</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {lista && (
            <Link href={`/tienda/${perfil.id}`} className="btn btn-borde">
              Ver catálogo
            </Link>
          )}
          <Link href="/caficultor/tienda/nuevo" className="btn">
            Nuevo producto
          </Link>
        </div>
      </div>

      {error && ERROR_TIENDA[error] && (
        <p role="alert" className="mt-6 border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {ERROR_TIENDA[error]}
        </p>
      )}

      <form action={guardarTienda} className="mt-8 grid gap-6 border border-linea bg-[#fbf8f1] p-6 md:grid-cols-[7.5rem_1fr] md:items-start">
        <FotoProducto url={ficha?.tienda_logo_url ?? null} alt="Logo de la tienda" className="aspect-square w-full border border-linea" />
        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl">Ficha pública</h2>
            <p className="mt-1 text-sm text-apagado">El nombre y el logo son lo que ve quien entra a comprar. Hacen falta los dos para publicar.</p>
          </div>
          <div>
            <label htmlFor="tienda_nombre" className="etiqueta">
              Nombre de la tienda
            </label>
            <input
              id="tienda_nombre"
              name="tienda_nombre"
              required
              minLength={3}
              maxLength={80}
              defaultValue={ficha?.tienda_nombre ?? ""}
              className="campo mt-1"
            />
          </div>
          <CampoArchivo id="logo" name="logo" accept="image/jpeg,image/png,image/webp" etiqueta="Cambiar logo" ayuda="JPG, PNG o WebP · hasta 2 MB" />
          <button type="submit" className="btn self-start">
            Guardar ficha
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-3xl">Productos</h2>
      {!lista && <p className="mt-2 text-sm text-apagado">Guarda el nombre y el logo antes de publicar.</p>}

      {(productos ?? []).length === 0 ? (
        <div className="mt-4 border border-dashed border-cobre bg-[#fbf8f1] p-8 text-center">
          <p className="font-titulo text-2xl">Todavía no hay productos</p>
          <p className="mt-2 text-apagado">Crea el primero y decide cuándo publicarlo.</p>
          <Link href="/caficultor/tienda/nuevo" className="btn mt-5">
            Nuevo producto
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(productos ?? []).map((p) => (
            <li key={p.id} className="flex flex-col border border-linea bg-[#fbf8f1] transition-colors hover:border-cobre">
              <FotoProducto url={p.foto_url} alt={p.nombre} className="aspect-[4/3] w-full" />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl">{p.nombre}</h3>
                  <span className={`etiqueta shrink-0 ${p.publicado ? "!text-bosque" : ""}`}>{p.publicado ? "Publicado" : "Borrador"}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-apagado">{p.descripcion}</p>
                <p className="mt-3 font-titulo text-2xl text-cobre-oscuro">{formatoCop(p.precio_cop)}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link href={`/caficultor/tienda/${p.id}`} className="btn btn-borde w-full">
                    Editar
                  </Link>
                  <form action={alternarPublicado}>
                    <input type="hidden" name="id" value={p.id} />
                    <BotonPublicar publicado={p.publicado} />
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
