/** Pagos con el SDK oficial de Open Payments y consentimiento GNAP. El login es un módulo aparte. */
import "server-only";
import type { ConsultarPagoOutput, IniciarPagoInput, IniciarPagoOutput } from "@/adapters/types";
import { getSdkAdapter, iniciarPagoSdk } from "./sdkAdapter";
import { assertOfficialRail } from "./settlement";

export async function iniciarPago(input: IniciarPagoInput): Promise<IniciarPagoOutput> {
  assertOfficialRail();
  return iniciarPagoSdk(input);
}

export async function consultarPago(pagoId: string): Promise<ConsultarPagoOutput> {
  return getSdkAdapter().consultar(pagoId);
}
