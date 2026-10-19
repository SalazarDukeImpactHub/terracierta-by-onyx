/**
 * Pagos reales contra Open Payments. El pagador autoriza o rechaza cada pago
 * en su billetera antes de que se envíen fondos.
 */
import type { ConsultarPagoOutput, IniciarPagoInput, IniciarPagoOutput } from "@/adapters/types";
import { getSdkAdapter, iniciarPagoSdk } from "./sdkAdapter";

export async function iniciarPago(input: IniciarPagoInput): Promise<IniciarPagoOutput> {
  const authorization = await iniciarPagoSdk(input);
  return {
    pagoId: authorization.pagoId,
    redirectUrl: authorization.redirectUrl,
    estado: authorization.estado,
    detalle: {
      rail: "open-payments",
      paso: "autorizacion",
      simulado: false,
      canalPqc: authorization.canalPqc,
    },
  };
}

export async function consultarPago(pagoId: string): Promise<ConsultarPagoOutput> {
  return getSdkAdapter().consultar(pagoId);
}
