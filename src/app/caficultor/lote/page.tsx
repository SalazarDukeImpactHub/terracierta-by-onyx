import type { Metadata } from "next";
import Link from "next/link";
import { requerirRol } from "@/adapters/auth";
import { FormularioLote } from "@/components/formulario-lote";
import { clienteAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Mi lote" };
export const dynamic = "force-dynamic";

const ESTADO_LOTE: Record<string, string> = {
  registrado: "Sin oferta todavía",
  con_ofertas: "Con oferta en curso",
  vendido: "Vendido ✦",
};

/** Ruta B: el caficultor carga su lote y ve sus lotes anteriores. */
export default async function MiLote() {
  const perfil = await requerirRol("caficultor");

  const { data: lotes } = await clienteAdmin()
    .from("lotes")
    .select("id, metodo, variedad, kg, municipio, estado, creado_en")
    .eq("caficultor_id", perfil.id)
    .order("creado_en", { ascending: false });

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <Link href="/caficultor" className="etiqueta hover:text-tinta">
        ← Mi espacio
      </Link>
      <h1 className="mt-3 text-4xl">Cargar mi lote</h1>
      <p className="mt-2 max-w-2xl text-apagado">
        Contanos qué café tenés y te mostramos las 3 cooperativas que mejor te calzan. Vos elegís; la cooperativa te paga directo a
        tu wallet.
      </p>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <FormularioLote municipioInicial={perfil.municipio} />

        <div>
          <h2 className="text-2xl">Mis lotes</h2>
          {(lotes ?? []).length === 0 ? (
            <p className="mt-3 border border-linea bg-crema-2 p-5 text-apagado">Todavía no cargaste ningún lote.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {(lotes ?? []).map((l) => (
                <li key={l.id}>
                  <Link href={`/caficultor/lote/${l.id}`} className="block border border-linea bg-crema-2 p-4 hover:border-tinta">
                    <p className="font-titulo text-xl">
                      {l.kg} kg · {l.variedad} {l.metodo}
                    </p>
                    <p className="etiqueta mt-1">
                      {l.municipio} · {ESTADO_LOTE[l.estado] ?? l.estado}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
