import "server-only";

export type WalletAmount = { value?: string; assetCode?: string; assetScale?: number };
export type ChargeInput = { amount: number; receiver: string; description: string; expectedReceiveAssetCode?: string };
export type Settlement = {
  estado: "completado" | "pendiente";
  rail: "open-payments" | "mock";
  quoteId: string;
  debitAmount: WalletAmount;
  receiveAmount: WalletAmount | null;
  debitAssetCode: string;
  outgoingId: string | null;
  isReceive: true;
  simulado: boolean;
  evidencia: "simulacion" | "envio-y-recepcion-sdk" | null;
};

export class PaymentError extends Error {
  constructor(message: string, public readonly status = 502) { super(message); }
}

export function limiteCobro(): number {
  const value = Number(process.env.OPEN_PAYMENTS_MAX_RECEIVE ?? "0.05");
  return Number.isFinite(value) && value > 0 ? value : 0.05;
}

/** La API web con cookies está retirada; una configuración antigua falla sin enviar solicitudes. */
export function assertOfficialRail() {
  const rail = process.env.PAYMENTS_RAIL?.trim() || "open-payments";
  if (rail !== "open-payments") throw new PaymentError("La pasarela utiliza el SDK oficial de Open Payments. Configura PAYMENTS_RAIL=open-payments; el adaptador web con cookies está retirado.", 503);
}

export function assertExecutionEnabled() {
  if (process.env.PAYMENTS_EXECUTION_ENABLED === "false") throw new PaymentError("La ejecución de pagos está deshabilitada. Puedes consultar el total.", 409);
}

/** Simulación explícita: no importa clientes externos ni utiliza credenciales de la wallet. */
export async function prepararSimulacion(input: ChargeInput) {
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > limiteCobro()) throw new PaymentError("El monto supera el límite de la demo.", 400);
  const debitAmount = { value: String(Math.round(input.amount * 100)), assetCode: "EUR", assetScale: 2 };
  const quote: Settlement = { rail: "mock", estado: "pendiente", quoteId: `mock_quote_${crypto.randomUUID()}`, debitAmount, receiveAmount: debitAmount, debitAssetCode: "EUR", outgoingId: null, isReceive: true, simulado: true, evidencia: null };
  let used = false;
  return {
    quote,
    clear() {},
    async confirm(): Promise<Settlement> {
      assertExecutionEnabled();
      if (used) throw new PaymentError("La confirmación ya fue utilizada.", 409);
      used = true;
      return { ...quote, estado: "completado", evidencia: "simulacion", outgoingId: `mock_outgoing_${crypto.randomUUID()}` };
    },
  };
}
