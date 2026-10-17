"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatoCop } from "@/lib/validacion";
import { consultarCheckoutProtegido, CheckoutError } from "@/payments/checkoutClient";
import { faseDelPago } from "@/payments/paymentProgress";
import { FlujoPago } from "./flujo-pago";

interface Vista {
  pagoId: string;
  tipo: "pedido" | "oferta";
  estado: "pendiente" | "completado" | "fallido";
  monto: number;
  walletReceptor: string;
  concepto: string;
  detalle: { paso?: string; recibo?: string; motivo?: string; simulado?: boolean; canalPqc?: boolean };
  canalVerificado?: boolean;
  reciboVerificado?: boolean;
}

export function EstadoDelPago({ pagoId, volverA }: { pagoId: string; volverA: string }) {
  const [vista, setVista] = useState<Vista | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let erroresTransitorios = 0;

    async function consultar() {
      try {
        const datos = await consultarCheckoutProtegido(pagoId);
        if (!activo) return;
        setVista(datos);
        erroresTransitorios = 0;
        setError(null);
        if (datos.estado === "pendiente") temporizador = setTimeout(consultar, 1500);
      } catch (e) {
        if (!activo) return;
        setError(e instanceof Error ? e.message : "Error al consultar el pago");
        // Solo se reintenta la consulta; nunca el inicio ni la ejecución del pago.
        if (!(e instanceof CheckoutError) || [400, 429].includes(e.status) || e.status >= 500) {
          erroresTransitorios++;
          temporizador = setTimeout(consultar, Math.min(60000, 3000 * 2 ** Math.min(erroresTransitorios, 5)));
        }
      }
    }
    consultar();
    return () => {
      activo = false;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [pagoId]);

  if (error) {
    return (
      <p role="alert" className="border border-cereza bg-cereza/10 p-4 text-cereza">
        {error}
      </p>
    );
  }
  if (!vista) return <p className="text-apagado">Consultando el estado del pago…</p>;

  const fallo = vista.estado === "fallido";

  return (
    <div>
      <FlujoPago fase={faseDelPago(vista)} simulado={vista.detalle.simulado} />

      <div className="mt-8 border border-linea bg-crema-2 p-6">
        {vista.estado === "completado" && (
          <>
            <p className="etiqueta !text-bosque">Pago completado ✦</p>
            <h2 className="mt-1 text-3xl">Recibo</h2>
          </>
        )}
        {vista.estado === "pendiente" && (
          <>
            <p className="etiqueta">Pago pendiente</p>
            <h2 className="mt-1 text-3xl">Esperando la confirmación</h2>
          </>
        )}
        {fallo && (
          <>
            <p className="etiqueta !text-cereza">Pago no completado</p>
            <h2 className="mt-1 text-3xl text-cereza">No se pudo completar</h2>
            {vista.detalle.motivo && <p className="mt-1">Motivo: {vista.detalle.motivo}.</p>}
          </>
        )}

        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="etiqueta">Concepto</dt>
            <dd>{vista.concepto}</dd>
          </div>
          <div>
            <dt className="etiqueta">Monto</dt>
            <dd className="font-titulo text-2xl text-cobre-oscuro">{formatoCop(vista.monto)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="etiqueta">Wallet de destino (caficultor)</dt>
            <dd className="break-all">{vista.walletReceptor}</dd>
          </div>
          <div>
            <dt className="etiqueta">Referencia del pago</dt>
            <dd className="break-all text-sm">{vista.pagoId}</dd>
          </div>
          {vista.detalle.recibo && (
            <div>
              <dt className="etiqueta">N.º de recibo</dt>
              <dd>{vista.detalle.recibo}</dd>
            </div>
          )}
        </dl>

        {vista.detalle.simulado && (
          <p className="mt-5 text-sm text-apagado">Pago simulado (modo demostración): no se movió dinero real.</p>
        )}
        {vista.canalVerificado && <p className="mt-5 text-sm text-apagado">Consulta protegida con postcuántica.</p>}
        {vista.reciboVerificado && <p className="mt-2 text-sm text-bosque">Comprobante verificado con Ed25519 y ML-DSA-65.</p>}
      </div>

      <Link href={vista.tipo === "oferta" ? "/cooperativa" : volverA} className="btn btn-borde mt-6">
        {vista.tipo === "oferta" ? "Volver a mis ofertas" : fallo ? "Volver a intentar" : "Seguir mirando café"}
      </Link>
    </div>
  );
}
