import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { clienteAdmin } from "@/lib/supabase/admin";
import { formatoCop } from "@/lib/validacion";

export const metadata: Metadata = { title: "Pedidos y pagos" };
export const dynamic = "force-dynamic";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  pagado: { texto: "Pagado ✦", clase: "text-bosque" },
  pendiente: { texto: "Pendiente", clase: "text-apagado" },
  fallido: { texto: "Fallido", clase: "text-cereza" },
};

export default async function PedidosYPagos() {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) redirect("/caficultor");

  const { data } = await clienteAdmin()
    .from("pedidos")
    .select("id, cantidad, monto, estado, wallet_comprador, creado_en, pago_id, productos!inner(nombre, dueno_id)")
    .eq("productos.dueno_id", perfil.id)
    .order("creado_en", { ascending: false });
  const pedidos = data ?? [];

  const cobrado = pedidos.filter((p) => p.estado === "pagado").reduce((s, p) => s + p.monto, 0);
  const pagados = pedidos.filter((p) => p.estado === "pagado").length;
  const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <Link href="/caficultor" className="etiqueta hover:text-tinta">
        ← Mi cuenta
      </Link>
      <h1 className="mt-3 text-4xl">Pedidos y pagos recibidos</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-cafe-claro p-5 text-crema">
          <p className="font-titulo text-4xl">{formatoCop(cobrado)}</p>
          <p className="mt-1 text-sm text-crema/80">cobrado en tu wallet</p>
        </div>
        <div className="bg-cafe-claro p-5 text-crema">
          <p className="font-titulo text-4xl">{pagados}</p>
          <p className="mt-1 text-sm text-crema/80">pagos completados</p>
        </div>
        <div className="bg-cafe-claro p-5 text-crema">
          <p className="font-titulo text-4xl">{pendientes}</p>
          <p className="mt-1 text-sm text-crema/80">pendientes de autorización</p>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <p className="mt-8 border border-linea bg-crema-2 p-6 text-apagado">
          Todavía no recibiste pedidos. Cuando alguien compre en tu tienda, aparece acá.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-linea">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="bg-crema-2">
              <tr className="etiqueta">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Comprador (wallet)</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const est = ETIQUETA_ESTADO[p.estado] ?? ETIQUETA_ESTADO.pendiente;
                const producto = (p.productos as unknown as { nombre: string }).nombre;
                return (
                  <tr key={p.id} className="border-t border-linea align-top">
                    <td className="px-4 py-3 text-sm">
                      {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(
                        new Date(p.creado_en),
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.cantidad} × {producto}
                    </td>
                    <td className="max-w-[14rem] break-all px-4 py-3 text-sm">{p.wallet_comprador}</td>
                    <td className="px-4 py-3 text-right font-titulo text-xl text-cobre-oscuro">{formatoCop(p.monto)}</td>
                    <td className={`px-4 py-3 font-semibold ${est.clase}`}>
                      {est.texto}
                      {p.pago_id && (
                        <Link href={`/pago/retorno?pago_id=${encodeURIComponent(p.pago_id)}`} className="mt-1 block text-xs font-normal text-cobre-oscuro underline">
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
      )}
    </section>
  );
}
