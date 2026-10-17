import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { FormularioProducto } from "@/components/formulario-producto";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProducto() {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) redirect("/caficultor");

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <p className="etiqueta">Mi tienda</p>
      <h1 className="mt-2 mb-8 text-4xl">Nuevo producto</h1>
      <FormularioProducto />
    </section>
  );
}
