import { USE_MOCKS } from "@/lib/env";
import * as mock from "@/adapters/mocks/payments";
import type { PagosAdapter } from "@/adapters/types";

/**
 * Punto único de acceso a pagos. USE_MOCKS=true -> simulación; false -> módulo real de /src/payments.
 * La interfaz y los servicios solo importan `pagos` de aquí.
 */
export const pagos: PagosAdapter = {
  async iniciarPago(input) {
    if (USE_MOCKS) return mock.iniciarPago(input);
    return (await import("@/payments")).iniciarPago(input);
  },
  async consultarPago(pagoId) {
    if (USE_MOCKS) return mock.consultarPago(pagoId);
    return (await import("@/payments")).consultarPago(pagoId);
  },
};
