import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { FormularioProducto } from "@/components/formulario-producto";
import { esUuid } from "@/lib/catalogo";
import { clienteAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Editar producto" };
export const dynamic = "force-dynamic";

export default async function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) redirect("/caficultor");
  const { id } = await params;
  if (!esUuid(id)) notFound();

  const { data: producto } = await clienteAdmin()
    .from("productos")
    .select("id, nombre, descripcion, precio_cop")
    .eq("id", id)
    .eq("dueno_id", perfil.id) // solo productos propios
    .maybeSingle();
  if (!producto) notFound();

  return (
    <section>
      <p className="etiqueta">Mi tienda</p>
      <h1 className="mt-1 mb-8 text-4xl">Editar producto</h1>
      <FormularioProducto valores={producto} />
    </section>
  );
}
