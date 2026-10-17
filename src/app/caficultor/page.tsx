import type { Metadata } from "next";
import Link from "next/link";
import { requerirRol } from "@/adapters/auth";
import type { Perfil } from "@/adapters/types";
import { clienteAdmin } from "@/lib/supabase/admin";
import { formatoCop } from "@/lib/validacion";

export const metadata: Metadata = { title: "Mi espacio" };
export const dynamic = "force-dynamic";

const ESTADO_LOTE: Record<string, string> = {
  registrado: "Sin oferta todavía",
  con_ofertas: "Con oferta en curso",
  vendido: "Vendido ✦",
};

/**
 * Inicio del caficultor. El INVIMA ya se conoce al ingresar (viene en el perfil, registrado con la cuenta),
 * así que NO se pregunta: la pantalla muestra el camino que corresponde y sus accesos directos.
 */
export default async function InicioCaficultor() {
  const perfil = await requerirRol("caficultor");

  return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <p className="etiqueta">Caficultor · {perfil.municipio}</p>
      <h1 className="mt-2 text-4xl">Hola, {perfil.nombre}</h1>

      <div className="mt-6 border border-linea bg-crema-2 p-5">
        <p className="etiqueta">Tu wallet para cobrar</p>
        {perfil.wallet_address ? (
          <p className="mt-1 break-all font-medium">{perfil.wallet_address}</p>
        ) : (
          <p className="mt-1 text-apagado">Todavía no tenés una wallet asignada.</p>
        )}
      </div>

      <div className="rombo my-10" aria-hidden="true">
        ◆
      </div>

      <p className="etiqueta">Tu camino para cobrar</p>
      {perfil.tiene_invima ? <CaminoConInvima perfil={perfil} /> : <CaminoSinInvima perfil={perfil} />}

      <p className="mt-8 text-sm text-apagado">
        Tu situación con el INVIMA se registró con tu cuenta. Si ese dato no es correcto, avisale al equipo de Terracierta.
      </p>
    </section>
  );
}

/** Ruta A: tiene INVIMA -> su tienda. */
async function CaminoConInvima({ perfil }: { perfil: Perfil }) {
  const db = clienteAdmin();
  const [{ data: productos }, { data: pedidos }] = await Promise.all([
    db.from("productos").select("id, publicado").eq("dueno_id", perfil.id),
    db.from("pedidos").select("monto, estado, productos!inner(dueno_id)").eq("productos.dueno_id", perfil.id),
  ]);

  const total = productos?.length ?? 0;
  const publicados = (productos ?? []).filter((p) => p.publicado).length;
  const pagados = (pedidos ?? []).filter((p) => p.estado === "pagado");
  const cobrado = pagados.reduce((s, p) => s + p.monto, 0);

  return (
    <>
      <h2 className="mt-1 text-3xl">
        Con INVIMA: vendés en tu tienda <span className="text-cobre">✦</span>
      </h2>
      <p className="mt-2 max-w-2xl text-apagado">
        Publicá tus productos y cada comprador te paga directo a tu wallet.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="bg-bosque p-5 text-crema">
          <p className="font-titulo text-4xl">
            {publicados}
            <span className="text-2xl text-crema/70"> / {total}</span>
          </p>
          <p className="mt-1 text-sm text-crema/80">productos publicados</p>
        </div>
        <div className="bg-bosque p-5 text-crema">
          <p className="font-titulo text-4xl">{pagados.length}</p>
          <p className="mt-1 text-sm text-crema/80">pagos completados</p>
        </div>
        <div className="bg-bosque p-5 text-crema">
          <p className="font-titulo text-4xl">{formatoCop(cobrado)}</p>
          <p className="mt-1 text-sm text-crema/80">cobrado en tu wallet</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/caficultor/tienda" className="btn btn-bosque">
          Ir a mi tienda
        </Link>
        <Link href="/caficultor/pedidos" className="btn btn-borde">
          Pedidos y pagos recibidos
        </Link>
        {publicados > 0 && (
          <Link href={`/tienda/${perfil.id}`} className="btn btn-borde">
            Ver mi tienda pública
          </Link>
        )}
      </div>
    </>
  );
}

/** Ruta B: sin INVIMA -> vender el lote a una cooperativa. */
async function CaminoSinInvima({ perfil }: { perfil: Perfil }) {
  const { data: lotes } = await clienteAdmin()
    .from("lotes")
    .select("id, metodo, variedad, kg, municipio, estado")
    .eq("caficultor_id", perfil.id)
    .order("creado_en", { ascending: false })
    .limit(3);

  return (
    <>
      <h2 className="mt-1 text-3xl">Sin INVIMA: vendés tu lote a una cooperativa</h2>
      <p className="mt-2 max-w-2xl text-apagado">
        Cargá tu lote y te mostramos las 3 cooperativas que mejor te calzan. Elegís una y ella te paga directo a tu wallet.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/caficultor/lote" className="btn btn-bosque">
          Cargar mi lote
        </Link>
      </div>

      <h3 className="mt-10 text-2xl">Mis lotes</h3>
      {(lotes ?? []).length === 0 ? (
        <p className="mt-3 border border-linea bg-crema-2 p-5 text-apagado">
          Todavía no cargaste ningún lote. Empezá con el botón de arriba.
        </p>
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
    </>
  );
}
