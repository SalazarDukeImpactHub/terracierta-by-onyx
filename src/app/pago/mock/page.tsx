import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { clienteAdmin } from "@/lib/supabase/admin";
import { USE_MOCKS } from "@/lib/env";
import { formatoCop } from "@/lib/validacion";
import { decidirPagoMock } from "./actions";

export const metadata: Metadata = { title: "Autorizar pago (simulado)" };
export const dynamic = "force-dynamic";

/**
 * Pantalla de consentimiento SIMULADA: hace el papel de la billetera del pagador (grant interactivo).
 * Solo existe con USE_MOCKS=true.
 */
export default async function ConsentimientoMock({
  searchParams,
}: {
  searchParams: Promise<{ pago_id?: string; retorno?: string }>;
}) {
  if (!USE_MOCKS) notFound();
  const { pago_id, retorno } = await searchParams;
  if (!pago_id || !retorno || !/^[A-Za-z0-9_-]{6,120}$/.test(pago_id)) notFound();

  const { data: pago } = await clienteAdmin()
    .from("pagos")
    .select("monto, wallet_pagador, wallet_receptor, estado")
    .eq("id", pago_id)
    .maybeSingle();
  if (!pago) notFound();

  return (
    <section className="mx-auto max-w-xl px-5 py-14">
      <p className="etiqueta !text-cereza">Billetera simulada · modo demostración</p>
      <h1 className="mt-2 text-4xl">¿Autorizas este pago?</h1>
      <p className="mt-3 text-apagado">
        Así se ve el consentimiento: tu billetera te muestra la cotización exacta y tú apruebas o rechazas antes de que se cobre.
      </p>

      <dl className="mt-6 grid gap-3 border border-linea bg-crema-2 p-6">
        <div>
          <dt className="etiqueta">Pagas</dt>
          <dd className="font-titulo text-3xl text-cobre-oscuro">{formatoCop(pago.monto)}</dd>
        </div>
        <div>
          <dt className="etiqueta">Desde</dt>
          <dd className="break-all">{pago.wallet_pagador}</dd>
        </div>
        <div>
          <dt className="etiqueta">Hacia</dt>
          <dd className="break-all">{pago.wallet_receptor}</dd>
        </div>
      </dl>

      {pago.estado === "pendiente" ? (
        <form action={decidirPagoMock} className="mt-6 flex flex-wrap gap-3">
          <input type="hidden" name="pago_id" value={pago_id} />
          <input type="hidden" name="retorno" value={retorno} />
          <button type="submit" name="decision" value="autorizar" className="btn">
            Autorizar pago
          </button>
          <button type="submit" name="decision" value="rechazar" className="btn btn-borde">
            Rechazar
          </button>
        </form>
      ) : (
        <p className="mt-6 text-apagado">Este pago ya fue procesado.</p>
      )}
    </section>
  );
}
