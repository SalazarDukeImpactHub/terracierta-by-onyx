import type { Metadata } from "next";
import Link from "next/link";
import { EstadoDelPago } from "@/components/estado-del-pago";
import { esUuid } from "@/lib/catalogo";
import { pagoIdDeReferencia } from "@/lib/pagos-service";

export const metadata: Metadata = { title: "Estado del pago" };
export const dynamic = "force-dynamic";

type Busqueda = Promise<{ pago_id?: string; tipo?: string; ref?: string }>;

/**
 * Ruta de retorno del pagador (brief §7.1): /pago/retorno?pago_id=...
 * Si la billetera vuelve sin pago_id, se resuelve por la referencia (tipo + ref) que armamos nosotros.
 */
export default async function RetornoDePago({ searchParams }: { searchParams: Busqueda }) {
  const { pago_id, tipo, ref } = await searchParams;

  let pagoId: string | null = pago_id && /^[A-Za-z0-9_-]{6,120}$/.test(pago_id) ? pago_id : null;
  if (!pagoId && (tipo === "pedido" || tipo === "oferta") && ref && esUuid(ref)) {
    pagoId = await pagoIdDeReferencia(tipo, ref);
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="etiqueta">Pago</p>
      <h1 className="mt-2 text-4xl">Estado de tu pago</h1>
      <div className="mt-8">
        {pagoId ? (
          <EstadoDelPago pagoId={pagoId} volverA={tipo === "oferta" ? "/cooperativa" : "/tienda"} />
        ) : (
          <>
            <p className="border border-linea bg-crema-2 p-5 text-apagado">
              No encontramos el pago al que volviste. Si ya aprobaste el pago, revisá tu billetera.
            </p>
            <Link href="/tienda" className="btn btn-borde mt-6">
              Ir a la tienda
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
