import type { Metadata } from "next";
import Link from "next/link";
import { requerirRol } from "@/adapters/auth";

export const metadata: Metadata = { title: "Mi lote" };

/** Ruta B — se construye en el paso 5 del orden de construcción. Por ahora, solo el marcador. */
export default async function MiLote() {
  await requerirRol("caficultor");
  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/caficultor" className="etiqueta hover:text-tinta">
        ← Mi espacio
      </Link>
      <h1 className="mt-3 text-4xl">Cargar mi lote</h1>
      <p className="mt-4 border border-linea bg-crema-2 p-6 text-apagado">
        Acá vas a cargar tu lote (método, variedad, kilos y municipio) y vas a ver las 3 cooperativas recomendadas. Esta pantalla
        llega con la Ruta B.
      </p>
    </section>
  );
}
