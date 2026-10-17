import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { esUuid } from "@/lib/catalogo";
import { PESOS } from "@/lib/match";
import { obtenerLoteDe, ofertasDelLote, ofertaVigente, recomendacionesDelLote } from "@/lib/ruta-b";
import { formatoCop } from "@/lib/validacion";
import { elegirCooperativa } from "../actions";

export const metadata: Metadata = { title: "Cooperativas para mi lote" };
export const dynamic = "force-dynamic";

const NUMERAL = ["I", "II", "III"];

const ESTADO_OFERTA: Record<string, { texto: string; ayuda: string; clase: string }> = {
  propuesta: { texto: "Solicitud enviada", ayuda: "La cooperativa ya recibió esta solicitud de venta. Si la acepta, paga el lote y el dinero entra en tu billetera.", clase: "text-apagado" },
  aceptada: { texto: "Solicitud aceptada ✦", ayuda: "La cooperativa aceptó la compra. Falta que pague el lote.", clase: "text-bosque" },
  pagada: { texto: "Pagada ✦", ayuda: "El pago llegó a tu wallet.", clase: "text-bosque" },
  fallida: { texto: "Pago fallido", ayuda: "El pago no se completó. La cooperativa puede reintentarlo.", clase: "text-cereza" },
};

export default async function CooperativasParaMiLote({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const perfil = await requerirRol("caficultor");
  const { id } = await params;
  const { error } = await searchParams;
  if (!esUuid(id)) notFound();

  const lote = await obtenerLoteDe(id, perfil.id);
  if (!lote) notFound();

  const ofertas = await ofertasDelLote(lote.id);
  const vigente = ofertaVigente(ofertas);
  const ultima = vigente ?? ofertas[0] ?? null;
  const recomendaciones = vigente ? [] : await recomendacionesDelLote(lote);

  return (
    <section>
      <Link href="/caficultor/lote" className="etiqueta hover:text-tinta">
        ← Mis lotes
      </Link>
      <p className="etiqueta mt-4">Tu lote · {lote.municipio}</p>
      <h1 className="mt-1 text-4xl">
        {lote.kg} kg · {lote.variedad} {lote.metodo}
      </h1>

      {error && (
        <p role="alert" className="mt-6 border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {error}
        </p>
      )}

      {ultima && (
        <div className="mt-8 border border-linea bg-crema-2 p-6">
          <p className={`etiqueta ${ESTADO_OFERTA[ultima.estado]?.clase ?? ""}`}>{ESTADO_OFERTA[ultima.estado]?.texto ?? ultima.estado}</p>
          <h2 className="mt-1 text-3xl">{ultima.cooperativas.nombre}</h2>
          <p className="mt-1 text-apagado">{ESTADO_OFERTA[ultima.estado]?.ayuda}</p>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <dt className="etiqueta">Precio por kg</dt>
              <dd className="font-titulo text-2xl text-cobre-oscuro">{formatoCop(ultima.precio_kg)}</dd>
            </div>
            <div>
              <dt className="etiqueta">Total del lote</dt>
              <dd className="font-titulo text-2xl text-cobre-oscuro">{formatoCop(ultima.total)}</dd>
            </div>
            <div>
              <dt className="etiqueta">Cobro a tu wallet</dt>
              <dd className="break-all text-sm">{perfil.wallet_address ?? "sin wallet asignada"}</dd>
            </div>
          </dl>
          {ultima.pago_id && (
            <Link href={`/pago/retorno?pago_id=${encodeURIComponent(ultima.pago_id)}`} className="btn btn-borde mt-5">
              Ver recibo del pago
            </Link>
          )}
        </div>
      )}

      {!vigente && (
        <>
          <div className="rombo my-10" aria-hidden="true">
            ◆
          </div>
          <h2 className="text-3xl">Las 3 cooperativas que mejor te calzan</h2>
          <p className="mt-2 max-w-2xl text-apagado">
            El análisis mira precio, cercanía, método, variedad y capacidad. La primera es la mejor opción para este lote.
          </p>
          {recomendaciones[0]?.elegible && (
            <div className="mt-6 border border-cobre bg-crema-2 p-5">
              <p className="etiqueta text-cobre-oscuro">La mejor opción</p>
              <h3 className="mt-1 text-3xl">{recomendaciones[0].nombre}</h3>
              <p className="mt-2">{recomendaciones[0].motivo}</p>
              <p className="mt-2 font-titulo text-2xl text-cobre-oscuro">{formatoCop(recomendaciones[0].total)}</p>
            </div>
          )}

          <ol className="mt-6 grid gap-5 lg:grid-cols-3">
            {recomendaciones.map((r, i) => (
              <li key={r.cooperativaId} className={`flex flex-col border bg-crema-2 p-5 ${i === 0 && r.elegible ? "border-cobre" : "border-linea"} ${r.elegible ? "" : "opacity-80"}`}>
                <div className="flex items-start justify-between">
                  <span className="font-titulo text-4xl text-cobre">{i === 0 && r.elegible ? "Mejor" : NUMERAL[i]}</span>
                  <span className="text-right">
                    <span className="block font-titulo text-3xl leading-none">{r.puntaje}</span>
                    <span className="etiqueta">de 100</span>
                  </span>
                </div>
                <h3 className="mt-2 text-2xl">{r.nombre}</h3>
                <p className="etiqueta mt-1">{r.municipio}</p>
                <p className="mt-3 flex-1">{r.motivo}</p>

                <p className="mt-4 text-sm text-apagado">
                  Precio {r.desglose.precio}/{PESOS.precio} · Cercanía {r.desglose.cercania}/{PESOS.cercania} · Método {r.desglose.metodo}/
                  {PESOS.metodo} · Variedad {r.desglose.variedad}/{PESOS.variedad} · Capacidad {r.desglose.capacidad}/{PESOS.capacidad}
                </p>
                <p className="mt-3 font-titulo text-2xl text-cobre-oscuro">{formatoCop(r.total)}</p>
                <p className="text-sm text-apagado">{formatoCop(r.precioKg)} por kg</p>

                {r.elegible ? (
                  <form action={elegirCooperativa} className="mt-4">
                    <input type="hidden" name="loteId" value={lote.id} />
                    <input type="hidden" name="cooperativaId" value={r.cooperativaId} />
                    <button type="submit" className="btn">
                      Enviar solicitud de venta
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 border border-cereza px-3 py-2 text-sm text-cereza">No puede comprar este lote.</p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
