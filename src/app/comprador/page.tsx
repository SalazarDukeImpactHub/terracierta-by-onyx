import type { Metadata } from "next";
import Link from "next/link";
import { requerirRol } from "@/adapters/auth";
import { clienteAdmin } from "@/lib/supabase/admin";
import { formatoCop } from "@/lib/validacion";

export const metadata: Metadata = { title: "Mis compras" };
export const dynamic = "force-dynamic";

const ESTADO: Record<string, { texto: string; clase: string }> = {
  pagado: { texto: "Pagado ✦", clase: "text-bosque" },
  pendiente: { texto: "Pendiente", clase: "text-apagado" },
  fallido: { texto: "Fallido", clase: "text-cereza" },
};

/** Espacio del comprador: su wallet (asignada con la cuenta) y sus compras. */
export default async function MisCompras() {
  const perfil = await requerirRol("comprador");

  const { data } = await clienteAdmin()
    .from("pedidos")
    .select("id, cantidad, monto, estado, creado_en, pago_id, productos(nombre, dueno_id)")
    .eq("comprador_id", perfil.id) // solo las compras de esta cuenta
    .order("creado_en", { ascending: false });
  const compras = data ?? [];

  const pagado = compras.filter((c) => c.estado === "pagado").reduce((s, c) => s + c.monto, 0);

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <p className="etiqueta">Comprador · {perfil.municipio}</p>
      <h1 className="mt-2 text-4xl">Hola, {perfil.nombre}</h1>
      {perfil.tipo_documento && perfil.numero_documento && (
        <p className="mt-2 text-apagado">
          {perfil.tipo_documento} {perfil.numero_documento}
        </p>
      )}

      <div className="mt-6 border border-linea bg-crema-2 p-5">
        <p className="etiqueta">Tu wallet para pagar</p>
        {perfil.wallet_address ? (
          <p className="mt-1 break-all font-medium">{perfil.wallet_address}</p>
        ) : (
          <p className="mt-1 text-apagado">Todavía no tenés una wallet asignada.</p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl">Mis compras</h2>
        <Link href="/tienda" className="btn">
          Ver la tienda
        </Link>
      </div>

      {compras.length === 0 ? (
        <p className="mt-4 border border-linea bg-crema-2 p-6 text-apagado">
          Todavía no hiciste compras. Elegí un café en la tienda y pagá con tu wallet.
        </p>
      ) : (
        <>
          <p className="mt-2 text-apagado">
            Pagaste en total <strong className="font-titulo text-xl text-cobre-oscuro">{formatoCop(pagado)}</strong>.
          </p>
          <div className="mt-4 overflow-x-auto border border-linea">
            <table className="w-full min-w-[34rem] text-left">
              <thead className="bg-crema-2">
                <tr className="etiqueta">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 text-right font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => {
                  const est = ESTADO[c.estado] ?? ESTADO.pendiente;
                  const producto = (c.productos as unknown as { nombre: string } | null)?.nombre ?? "Producto";
                  return (
                    <tr key={c.id} className="border-t border-linea align-top">
                      <td className="px-4 py-3 text-sm">
                        {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(
                          new Date(c.creado_en),
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.cantidad} × {producto}
                      </td>
                      <td className="px-4 py-3 text-right font-titulo text-xl text-cobre-oscuro">{formatoCop(c.monto)}</td>
                      <td className={`px-4 py-3 font-semibold ${est.clase}`}>
                        {est.texto}
                        {c.pago_id && (
                          <Link href={`/pago/retorno?pago_id=${encodeURIComponent(c.pago_id)}`} className="mt-1 block text-xs font-normal text-cobre-oscuro underline">
                            ver recibo
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
