import { USE_MOCKS } from "@/lib/env";
import * as mock from "@/adapters/mocks/payments";
import type { PagosAdapter } from "@/adapters/types";

function esBilleteraReal(wallet: string): boolean {
  return wallet.includes("interledger-test.dev") || wallet.includes("ilp.interledger");
}

/**
 * Las wallets de Interledger pagan de verdad, aunque USE_MOCKS siga simulando el resto de la demo.
 */
export const pagos: PagosAdapter = {
  async iniciarPago(input) {
    if (esBilleteraReal(input.walletPagador) && esBilleteraReal(input.walletReceptor)) {
      return (await import("@/payments")).iniciarPago(input);
    }
    if (USE_MOCKS) return mock.iniciarPago(input);
    return (await import("@/payments")).iniciarPago(input);
  },
  async consultarPago(pagoId) {
    if (pagoId.startsWith("mock_")) return mock.consultarPago(pagoId);
    return (await import("@/payments")).consultarPago(pagoId);
  },
};
