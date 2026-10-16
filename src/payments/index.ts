/**
 * STUB — esta carpeta es del compañero de pagos (Open Payments).
 * El Dev System solo dejó este punto de enchufe; NO implementa pagos reales.
 *
 * Contrato que espera la página (brief §7.1, ver src/adapters/types.ts):
 *   iniciarPago({ tipo, referenciaId, montoCop, walletReceptor, walletPagador, urlRetorno })
 *     -> { pagoId, redirectUrl | null, estado }
 *   consultarPago(pagoId) -> { estado: pendiente | completado | fallido, detalle }
 *
 * Para integrar: reemplazar el cuerpo de estas dos funciones y poner USE_MOCKS=false.
 * Las llaves de Open Payments se leen SOLO en el servidor (variables sin NEXT_PUBLIC_).
 */
import type { ConsultarPagoOutput, IniciarPagoInput, IniciarPagoOutput } from "@/adapters/types";

/* eslint-disable @typescript-eslint/no-unused-vars -- stub: los parámetros documentan el contrato */
export async function iniciarPago(_input: IniciarPagoInput): Promise<IniciarPagoOutput> {
  throw new Error("src/payments no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.");
}

export async function consultarPago(_pagoId: string): Promise<ConsultarPagoOutput> {
  throw new Error("src/payments no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.");
}
