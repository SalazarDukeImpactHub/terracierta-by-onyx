import type { Metadata } from "next";
import Link from "next/link";
import { requerirRol } from "@/adapters/auth";
import { leerCookieIlp, urlLoginInterledger } from "@/lib/login-interledger";
import { ofertasRecibidas, type OfertaRecibida } from "@/lib/ruta-b";
import { formatoCop } from "@/lib/validacion";
import { aceptarOferta, pagarOferta } from "./actions";

export const metadata: Metadata = { title: "Cooperativa" };
export const dynamic = "force-dynamic";

function TarjetaOferta({ o }: { o: OfertaRecibida }) {
  const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(
    new Date(o.creado_en),
  );
  return (
    <li className="border border-linea bg-crema-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="etiqueta">
            {o.lotes.profiles.nombre} · {o.lotes.profiles.municipio} · {fecha}
          </p>
          <h3 className="mt-1 text-2xl">
            {o.lotes.kg} kg · {o.lotes.variedad} {o.lotes.metodo}
          </h3>
          <p className="text-sm text-apagado">
            {formatoCop(o.precio_kg)} por kg · lote en {o.lotes.municipio}
          </p>
        </div>
        <p className="font-titulo text-3xl text-cobre-oscuro">{formatoCop(o.total)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {o.estado === "propuesta" && (
          <form action={aceptarOferta}>
            <input type="hidden" name="ofertaId" value={o.id} />
            <button type="submit" className="btn">
              Aceptar solicitud de venta
            </button>
          </form>
        )}
        {(o.estado === "aceptada" || o.estado === "fallida") && (
          <form action={pagarOferta} data-vuelta-pago="">
            <input type="hidden" name="ofertaId" value={o.id} />
            <button type="submit" className="btn">
              {o.estado === "fallida" ? "Reintentar el pago" : "Pagar y completar la compra"}
            </button>
          </form>
        )}
        {o.estado === "fallida" && <span className="etiqueta !text-cereza">El último pago falló</span>}
        {o.estado === "pagada" && <span className="etiqueta !text-bosque">Pagada ✦</span>}
        {o.pago_id && (
          <Link href={`/pago/retorno?pago_id=${encodeURIComponent(o.pago_id)}`} className="text-sm text-cobre-oscuro underline">
            ver recibo
          </Link>
        )}
      </div>
    </li>
  );
}

function Seccion({ titulo, vacio, ofertas }: { titulo: string; vacio: string; ofertas: OfertaRecibida[] }) {
  return (
    <div className="mt-10">
      <h2 className="text-3xl">{titulo}</h2>
      {ofertas.length === 0 ? (
        <p className="mt-3 border border-linea bg-crema-2 p-5 text-apagado">{vacio}</p>
      ) : (
        <ul className="mt-3 grid gap-4">
          {ofertas.map((o) => (
            <TarjetaOferta key={o.id} o={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Ruta B, lado cooperativa: ofertas recibidas -> aceptar -> pagar -> historial. */
export default async function InicioCooperativa({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requerirRol("cooperativa");
  const { error } = await searchParams;
  const ofertas = await ofertasRecibidas(perfil.id);

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <p className="etiqueta">Cooperativa · {perfil.municipio}</p>
      <h1 className="mt-2 text-4xl">{perfil.nombre}</h1>
      <div className="mt-4 border border-linea bg-crema-2 p-4">
        <p className="etiqueta">Tu wallet para pagar</p>
        <p className="mt-1 break-all text-sm">{perfil.wallet_address ?? "Todavía no tienes una wallet asignada."}</p>
        {(await leerCookieIlp()) ? null : (
          <a href={urlLoginInterledger()} className="btn mt-4">
            Entrar a Interledger
          </a>
        )}
      </div>
      <p className="mt-6">
        <Link href="/tienda" className="btn">
          Comprar café en la tienda
        </Link>
      </p>

      {error && (
        <p role="alert" className="mt-6 border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {error}
        </p>
      )}

      <Seccion
        titulo="Por responder"
        vacio="No tienes solicitudes nuevas. Cuando un caficultor te elija, la solicitud de venta aparece aquí."
        ofertas={ofertas.filter((o) => o.estado === "propuesta")}
      />
      <Seccion
        titulo="Por pagar"
        vacio="No tienes ofertas aceptadas pendientes de pago."
        ofertas={ofertas.filter((o) => o.estado === "aceptada" || o.estado === "fallida")}
      />
      <Seccion titulo="Historial" vacio="Todavía no has pagado ningún lote." ofertas={ofertas.filter((o) => o.estado === "pagada")} />
    </section>
  );
}
