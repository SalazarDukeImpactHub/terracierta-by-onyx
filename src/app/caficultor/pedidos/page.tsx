import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { clienteAdmin } from "@/lib/supabase/admin";
import { formatoCop } from "@/lib/validacion";
import { ListaVentas, type VentaVista } from "./lista-ventas";

export const metadata: Metadata = { title: "Ventas" };
export const dynamic = "force-dynamic";

const ROL: Record<string, string> = {
  comprador: "Comprador",
  cooperativa: "Cooperativa",
  caficultor: "Caficultor",
};

export default async function PedidosYPagos() {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) redirect("/caficultor");

  const { data } = await clienteAdmin()
    .from("pedidos")
    .select("id, cantidad, monto, estado, creado_en, pago_id, comprador_id, productos!inner(nombre, dueno_id)")
    .eq("productos.dueno_id", perfil.id)
    .order("creado_en", { ascending: false });
  const pedidos = data ?? [];

  const ids = [...new Set(pedidos.map((p) => p.comprador_id).filter((id): id is string => Boolean(id)))];
  const { data: perfiles } = ids.length
    ? await clienteAdmin().from("profiles").select("id, nombre, rol").in("id", ids)
    : { data: [] as { id: string; nombre: string; rol: string }[] };
  const quien = new Map((perfiles ?? []).map((p) => [p.id, p]));

  const ventas: VentaVista[] = pedidos.map((p) => {
    const persona = p.comprador_id ? quien.get(p.comprador_id) : undefined;
    const estado = p.estado === "pagado" || p.estado === "fallido" ? p.estado : "pendiente";
    return {
      id: p.id,
      fecha: new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(p.creado_en)),
      producto: (p.productos as unknown as { nombre: string }).nombre,
      cantidad: p.cantidad,
      monto: p.monto,
      estado,
      cliente: persona?.nombre ?? "Cliente",
      rolCliente: ROL[persona?.rol ?? ""] ?? "Cliente",
      pagoId: p.pago_id,
    };
  });

  const pagadas = ventas.filter((v) => v.estado === "pagado");
  const cobrado = pagadas.reduce((s, v) => s + v.monto, 0);
  const clientes = agruparClientes(ventas);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta">Tienda</p>
          <h1 className="mt-1 text-4xl">Ventas y clientes</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-linea bg-[#fbf8f1] p-5">
          <p className="font-titulo text-3xl text-cobre-oscuro">{formatoCop(cobrado)}</p>
          <p className="mt-1 text-sm text-apagado">cobrado</p>
        </div>
        <div className="border border-linea bg-[#fbf8f1] p-5">
          <p className="font-titulo text-3xl text-cobre-oscuro">{pagadas.length}</p>
          <p className="mt-1 text-sm text-apagado">ventas pagadas</p>
        </div>
        <div className="border border-linea bg-[#fbf8f1] p-5">
          <p className="font-titulo text-3xl text-cobre-oscuro">{clientes.length}</p>
          <p className="mt-1 text-sm text-apagado">clientes</p>
        </div>
      </div>

      <h2 className="mt-10 text-3xl">Clientes</h2>
      {clientes.length === 0 ? (
        <p className="mt-4 border border-linea bg-[#fbf8f1] p-6 text-apagado">Todavía no hay compras pagadas.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <li key={c.clave} className="border border-linea bg-[#fbf8f1] p-5">
              <p className="font-titulo text-2xl">{c.nombre}</p>
              <p className="etiqueta mt-1">{c.rol}</p>
              <p className="mt-3 text-sm text-apagado">
                {c.compras} {c.compras === 1 ? "compra" : "compras"} · {formatoCop(c.total)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-3xl">Historial</h2>
      <div className="mt-4">
        {ventas.length === 0 ? (
          <p className="border border-linea bg-[#fbf8f1] p-6 text-apagado">Cuando alguien compre en tu tienda, el pedido aparece acá.</p>
        ) : (
          <ListaVentas ventas={ventas} />
        )}
      </div>
    </div>
  );
}

function agruparClientes(ventas: VentaVista[]) {
  const mapa = new Map<string, { clave: string; nombre: string; rol: string; compras: number; total: number }>();
  for (const venta of ventas) {
    if (venta.estado !== "pagado") continue;
    const clave = `${venta.cliente}-${venta.rolCliente}`;
    const actual = mapa.get(clave) ?? { clave, nombre: venta.cliente, rol: venta.rolCliente, compras: 0, total: 0 };
    actual.compras += 1;
    actual.total += venta.monto;
    mapa.set(clave, actual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}
