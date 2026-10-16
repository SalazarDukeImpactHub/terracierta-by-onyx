import type { Metadata } from "next";
import { requerirRol } from "@/adapters/auth";

export const metadata: Metadata = { title: "Cooperativa" };

/** Ruta B — las ofertas y el pago llegan en el paso 5 del orden de construcción. */
export default async function InicioCooperativa() {
  const perfil = await requerirRol("cooperativa");
  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="etiqueta">Cooperativa · {perfil.municipio}</p>
      <h1 className="mt-2 text-4xl">{perfil.nombre}</h1>
      <p className="mt-4 border border-linea bg-crema-2 p-6 text-apagado">
        Acá vas a ver las ofertas por lotes, aceptarlas, pagarlas y consultar tu historial. Llega con la Ruta B.
      </p>
    </section>
  );
}
