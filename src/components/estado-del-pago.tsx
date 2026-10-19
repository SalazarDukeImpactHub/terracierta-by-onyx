"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatoCop } from "@/lib/validacion";
import { CheckoutError, consultarCheckoutProtegido, type VerifiedPayment } from "@/payments/checkoutClient";

type Vista = VerifiedPayment;

const PASOS = ["Solicitud", "Autorización", "Ejecución", "Finalización"];

/** Índice del paso en curso (0-3). Si el módulo real no informa `paso`, pendiente = esperando autorización. */
function pasoActual(v: Vista): number {
  if (v.estado === "completado") return 4;
  switch (v.detalle.paso) {
    case "ejecucion":
      return 2;
    case "finalizacion":
      return 3;
    default:
      return 1;
  }
}

export function EstadoDelPago({ pagoId, volverA }: { pagoId: string; volverA: string }) {
  const [vista, setVista] = useState<Vista | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    async function consultar() {
      try {
        const datos = await consultarCheckoutProtegido(pagoId);
        if (!activo) return;
        setVista(datos);
        setError(null);
        if (datos.estado === "pendiente") temporizador = setTimeout(consultar, 1500);
      } catch (e) {
        if (!activo) return;
        setError(e instanceof CheckoutError ? e.message : "Error al consultar el pago");
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

  const actual = pasoActual(vista);
  const fallo = vista.estado === "fallido";

  return (
    <div>
      <ol className="grid gap-3 sm:grid-cols-4" aria-label="Avance del pago">
        {PASOS.map((nombre, i) => {
          const hecho = i < actual;
          const enCurso = i === actual && vista.estado === "pendiente";
          const roto = fallo && i === Math.min(actual, 3);
          return (
            <li
              key={nombre}
              aria-current={enCurso ? "step" : undefined}
              className={`border p-3 ${
                roto ? "border-cereza text-cereza" : hecho ? "border-bosque bg-bosque text-crema" : enCurso ? "border-cobre-oscuro" : "border-linea text-apagado"
              }`}
            >
              <span className="font-titulo text-2xl">{["I", "II", "III", "IV"][i]}</span>
              <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.16em]">{nombre}</span>
              <span className="text-xs">{roto ? "Falló" : hecho ? "Listo" : enCurso ? "En curso…" : "Pendiente"}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 border border-linea bg-crema-2 p-6">
        {vista.estado === "completado" && (
          <>
            <p className="etiqueta !text-bosque">Pago completado · recibo verificado ✦</p>
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
            <dt className="etiqueta">Wallet de destino</dt>
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
      </div>

      <Link href={vista.tipo === "oferta" ? "/cooperativa" : volverA} className="btn btn-borde mt-6">
        {vista.tipo === "oferta" ? "Volver a mis ofertas" : fallo ? "Volver a intentar" : "Seguir mirando café"}
      </Link>
    </div>
  );
}
