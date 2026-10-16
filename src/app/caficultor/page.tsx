import type { Metadata } from "next";
import Link from "next/link";
import { requerirRol } from "@/adapters/auth";
import { declararInvima } from "./tienda/actions";

export const metadata: Metadata = { title: "Mi espacio" };
export const dynamic = "force-dynamic";

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

      <h2 className="text-3xl">¿Tienes INVIMA?</h2>
      <p className="mt-2 max-w-2xl text-apagado">
        De eso depende tu camino para cobrar. Hoy figura: <strong>{perfil.tiene_invima ? "con INVIMA" : "sin INVIMA"}</strong>.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <article className="flex flex-col border border-linea bg-crema-2 p-6">
          <span className="font-titulo text-4xl text-cobre">I</span>
          <h3 className="mt-1 text-2xl">Sí, tengo INVIMA</h3>
          <p className="mt-2 flex-1 text-apagado">Abrí tu tienda, publicá tus productos y cobrá directo a tu wallet.</p>
          {perfil.tiene_invima ? (
            <Link href="/caficultor/tienda" className="btn btn-bosque mt-5 self-start">
              Ir a mi tienda
            </Link>
          ) : (
            <form action={declararInvima} className="mt-5">
              <input type="hidden" name="tiene" value="si" />
              <button type="submit" className="btn btn-bosque">
                Tengo INVIMA
              </button>
            </form>
          )}
        </article>

        <article className="flex flex-col border border-linea bg-crema-2 p-6">
          <span className="font-titulo text-4xl text-cobre">II</span>
          <h3 className="mt-1 text-2xl">No, todavía no</h3>
          <p className="mt-2 flex-1 text-apagado">Cargá tu lote y te mostramos las 3 cooperativas que mejor te calzan.</p>
          {!perfil.tiene_invima ? (
            <Link href="/caficultor/lote" className="btn btn-bosque mt-5 self-start">
              Cargar mi lote
            </Link>
          ) : (
            <form action={declararInvima} className="mt-5">
              <input type="hidden" name="tiene" value="no" />
              <button type="submit" className="btn btn-borde">
                No tengo INVIMA
              </button>
            </form>
          )}
        </article>
      </div>

      {perfil.tiene_invima && (
        <p className="mt-8">
          <Link href="/caficultor/pedidos" className="text-cobre-oscuro underline">
            Ver mis pedidos y pagos recibidos →
          </Link>
        </p>
      )}
    </section>
  );
}
