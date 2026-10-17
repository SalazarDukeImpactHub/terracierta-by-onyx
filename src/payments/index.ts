/**
 * Pagos reales contra la billetera de prueba de Interledger.
 * El dinero sale de la wallet del pagador y entra en la del receptor.
 * La cookie de sesión vive en usuarios.token; nunca se manda al navegador.
 */
import type { ConsultarPagoOutput, IniciarPagoInput, IniciarPagoOutput } from "@/adapters/types";
import { clienteAdmin } from "@/lib/supabase/admin";
import { estadoPagoInterledger, pagarEntreBilleteras } from "@/lib/interledger";

export async function iniciarPago(input: IniciarPagoInput): Promise<IniciarPagoOutput> {
  const descripcion = `Terracierta ${input.tipo} ${input.referenciaId}`;
  const envio = await pagarEntreBilleteras({
    walletPagador: input.walletPagador,
    walletReceptor: input.walletReceptor,
    monto: input.montoCop,
    descripcion,
  });
  return {
    pagoId: envio.pagoId,
    redirectUrl: null,
    estado: envio.estado === "fallido" ? "fallido" : envio.estado,
    detalle: {
      descripcion,
      paso: envio.estado === "completado" ? "finalizacion" : "ejecucion",
      simulado: false,
      motivo: envio.estado === "fallido" ? "la billetera rechazó el envío" : undefined,
    },
  };
}

export async function consultarPago(pagoId: string): Promise<ConsultarPagoOutput> {
  const { data: pago } = await clienteAdmin()
    .from("pagos")
    .select("wallet_pagador, detalle_json")
    .eq("id", pagoId)
    .maybeSingle();
  const detalle = (pago?.detalle_json ?? {}) as { descripcion?: string; simulado?: boolean };
  if (!pago?.wallet_pagador || !detalle.descripcion) {
    return { estado: "fallido", detalle: { motivo: "No hay datos para confirmar este pago", simulado: false } };
  }
  const estado = await estadoPagoInterledger(pagoId, detalle.descripcion, pago.wallet_pagador);
  return {
    estado,
    detalle: {
      descripcion: detalle.descripcion,
      paso: estado === "completado" ? "finalizacion" : estado === "fallido" ? "ejecucion" : "ejecucion",
      recibo: estado === "completado" ? `ILP-${pagoId.slice(0, 8).toUpperCase()}` : undefined,
      motivo: estado === "fallido" ? "la billetera rechazó el envío" : undefined,
      simulado: false,
    },
  };
}
