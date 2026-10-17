import type { Metadata } from "next";
import Link from "next/link";
import { requerirRol } from "@/adapters/auth";
import type { Perfil } from "@/adapters/types";
import { FotoProducto } from "@/components/foto-producto";
import { clienteAdmin } from "@/lib/supabase/admin";
import { formatoCop } from "@/lib/validacion";

export const metadata: Metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

const ESTADO_LOTE: Record<string, string> = {
  registrado: "Sin oferta",
  con_ofertas: "Oferta en curso",
  vendido: "Vendido",
};

const ESTADO_PEDIDO: Record<string, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  fallido: "Fallido",
};

export default async function InicioCaficultor() {
  const perfil = await requerirRol("caficultor");
  return perfil.tiene_invima ? <ResumenTienda perfil={perfil} /> : <ResumenLote perfil={perfil} />;
}

async function ResumenTienda({ perfil }: { perfil: Perfil }) {
  const db = clienteAdmin();
  const [{ data: ficha }, { data: productos }, { data: resumen }, { data: pedidos }] = await Promise.all([
    db.from("profiles").select("tienda_nombre, tienda_logo_url").eq("id", perfil.id).maybeSingle(),
    db.from("productos").select("id, publicado").eq("dueno_id", perfil.id),
    db.from("pedidos").select("monto, estado, comprador_id, productos!inner(dueno_id)").eq("productos.dueno_id", perfil.id),
    db
      .from("pedidos")
      .select("id, cantidad, monto, estado, creado_en, comprador_id, productos!inner(nombre, dueno_id)")
      .eq("productos.dueno_id", perfil.id)
      .order("creado_en", { ascending: false })
      .limit(4),
  ]);

  const total = productos?.length ?? 0;
  const publicados = (productos ?? []).filter((p) => p.publicado).length;
  const pagados = (resumen ?? []).filter((p) => p.estado === "pagado");
  const cobrado = pagados.reduce((s, p) => s + p.monto, 0);
  const clientes = new Set(pagados.map((p) => p.comprador_id).filter(Boolean)).size;
  const nombres = await nombresPorId((pedidos ?? []).map((p) => p.comprador_id).filter((id): id is string => Boolean(id)));
  const tiendaLista = Boolean(ficha?.tienda_nombre && ficha.tienda_logo_url);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra href="/caficultor/pedidos" valor={formatoCop(cobrado)} texto="cobrado" />
        <Cifra href="/caficultor/pedidos" valor={String(pagados.length)} texto="ventas pagadas" />
        <Cifra href="/caficultor/tienda" valor={`${publicados}/${total}`} texto="productos publicados" />
        <Cifra href="/caficultor/pedidos" valor={String(clientes)} texto="clientes" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-linea bg-[#fbf8f1] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="etiqueta">Tu tienda</p>
              <h1 className="mt-1 text-3xl">{ficha?.tienda_nombre || "Todavía sin nombre"}</h1>
              <p className="mt-2 text-sm text-apagado">
                {tiendaLista
                  ? "El nombre y el logo ya están listos. Publicá productos para que te compren."
                  : "Definí el nombre y el logo para poder publicar."}
              </p>
            </div>
            <FotoProducto
              url={ficha?.tienda_logo_url ?? null}
              alt={ficha?.tienda_nombre || "Logo de la tienda"}
              className="h-16 w-16 shrink-0 border border-linea"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/caficultor/tienda" className="btn">
              Gestionar tienda
            </Link>
            {publicados > 0 && (
              <Link href={`/tienda/${perfil.id}`} className="btn btn-borde">
                Ver catálogo
              </Link>
            )}
          </div>
        </section>

        <section className="border border-linea bg-[#fbf8f1] p-6">
          <p className="etiqueta">Cobro</p>
          <h2 className="mt-1 text-3xl">Billetera</h2>
          {perfil.wallet_address ? (
            <p className="mt-3 break-all text-sm">{perfil.wallet_address}</p>
          ) : (
            <p className="mt-3 text-sm text-apagado">Todavía no tenés una billetera asignada.</p>
          )}
          <p className="mt-3 text-sm text-apagado">El dinero de cada venta entra directo acá. Terracierta no lo guarda.</p>
        </section>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl">Últimas ventas</h2>
          <Link href="/caficultor/pedidos" className="text-sm text-cobre-oscuro underline">
            Ver todas
          </Link>
        </div>
        {(pedidos ?? []).length === 0 ? (
          <p className="mt-4 border border-linea bg-[#fbf8f1] p-6 text-apagado">
            Cuando alguien compre en tu tienda, la venta aparece acá con el nombre del cliente.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-linea border border-linea bg-[#fbf8f1]">
            {(pedidos ?? []).map((p) => {
              const producto = (p.productos as unknown as { nombre: string }).nombre;
              const cliente = (p.comprador_id && nombres.get(p.comprador_id)) || "Cliente";
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium">
                      {cliente}
                      <span className="text-apagado"> · {p.cantidad} × {producto}</span>
                    </p>
                    <p className="text-sm text-apagado">{fechaCorta(p.creado_en)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-titulo text-2xl text-cobre-oscuro">{formatoCop(p.monto)}</p>
                    <p className={`text-sm ${p.estado === "pagado" ? "text-bosque" : p.estado === "fallido" ? "text-cereza" : "text-apagado"}`}>
                      {ESTADO_PEDIDO[p.estado] ?? p.estado}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

async function ResumenLote({ perfil }: { perfil: Perfil }) {
  const { data: lotes } = await clienteAdmin()
    .from("lotes")
    .select("id, metodo, variedad, kg, municipio, estado")
    .eq("caficultor_id", perfil.id)
    .order("creado_en", { ascending: false })
    .limit(4);

  return (
    <div className="grid gap-8">
      <section className="border border-linea bg-[#fbf8f1] p-6">
        <p className="etiqueta">Tu camino</p>
        <h1 className="mt-1 text-3xl">Vendé el lote a una cooperativa</h1>
        <p className="mt-2 max-w-2xl text-apagado">
          Cargá el café que tenés. Te mostramos las 3 cooperativas que mejor calzan, cuál es la mejor y por qué.
        </p>
        <Link href="/caficultor/lote" className="btn mt-6">
          Cargar un lote
        </Link>
      </section>

      <section>
        <h2 className="text-3xl">Lotes recientes</h2>
        {(lotes ?? []).length === 0 ? (
          <p className="mt-4 border border-linea bg-[#fbf8f1] p-6 text-apagado">Todavía no cargaste ningún lote.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {(lotes ?? []).map((l) => (
              <li key={l.id}>
                <Link href={`/caficultor/lote/${l.id}`} className="block border border-linea bg-[#fbf8f1] p-5 transition-colors hover:border-cobre">
                  <p className="font-titulo text-2xl">
                    {l.kg} kg · {l.variedad}
                  </p>
                  <p className="mt-1 text-sm capitalize text-apagado">
                    {l.metodo} · {l.municipio}
                  </p>
                  <p className="etiqueta mt-3 !text-cobre-oscuro">{ESTADO_LOTE[l.estado] ?? l.estado}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Cifra({ href, valor, texto }: { href: string; valor: string; texto: string }) {
  return (
    <Link href={href} className="border border-linea bg-[#fbf8f1] p-5 transition-colors hover:border-cobre">
      <p className="font-titulo text-3xl text-cobre-oscuro">{valor}</p>
      <p className="mt-1 text-sm text-apagado">{texto}</p>
    </Link>
  );
}

async function nombresPorId(ids: string[]) {
  const unicos = [...new Set(ids)];
  const mapa = new Map<string, string>();
  if (unicos.length === 0) return mapa;
  const { data } = await clienteAdmin().from("profiles").select("id, nombre").in("id", unicos);
  for (const fila of data ?? []) mapa.set(fila.id, fila.nombre);
  return mapa;
}

function fechaCorta(iso: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
}
