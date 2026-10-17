import { randomBytes } from "node:crypto";
import { clienteAdmin } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";
import type { ConsultarPagoOutput, IniciarPagoInput, IniciarPagoOutput } from "@/adapters/types";

/**
 * MOCK de pagos (USE_MOCKS=true). Simula el ciclo del brief: solicitud -> autorización ->
 * ejecución -> finalización. NO mueve dinero ni habla con Interledger.
 *
 *  - iniciarPago devuelve una pantalla de consentimiento simulada (/pago/mock).
 *  - Al autorizar, el pago queda "pendiente" unos segundos (ejecución) y luego "completado".
 *  - Gancho de prueba: si la wallet del pagador contiene "fail", el pago termina "fallido".
 *  - El estado de autorización se guarda en pagos.detalle_json.mock para sobrevivir entre peticiones.
 */

const SEGUNDOS_EJECUCION = 3;

interface EstadoMock {
  autorizado_en?: string;
  rechazado?: boolean;
}

export async function iniciarPago(input: IniciarPagoInput): Promise<IniciarPagoOutput> {
  const fallara = input.walletPagador.toLowerCase().includes("fail");
  const pagoId = `mock_${fallara ? "fail" : "ok"}_${randomBytes(6).toString("hex")}`;
  const redirectUrl = `${SITE_URL}/pago/mock?pago_id=${encodeURIComponent(pagoId)}&retorno=${encodeURIComponent(
    input.urlRetorno,
  )}`;
  return { pagoId, redirectUrl, estado: "pendiente" };
}

export async function consultarPago(pagoId: string): Promise<ConsultarPagoOutput> {
  const db = clienteAdmin();
  const { data: pago } = await db.from("pagos").select("monto, detalle_json").eq("id", pagoId).maybeSingle();
  if (!pago) return { estado: "fallido", detalle: { simulado: true, motivo: "pago no encontrado" } };

  const mock: EstadoMock = (pago.detalle_json as { mock?: EstadoMock } | null)?.mock ?? {};
  const base = { simulado: true, cotizacion: { monto_cop: pago.monto, comision_cop: 0 } };

  if (mock.rechazado) return { estado: "fallido", detalle: { ...base, paso: "autorizacion", motivo: "el pagador rechazó el consentimiento" } };
  if (!mock.autorizado_en) return { estado: "pendiente", detalle: { ...base, paso: "autorizacion" } };

  const transcurrido = (Date.now() - new Date(mock.autorizado_en).getTime()) / 1000;
  if (transcurrido < SEGUNDOS_EJECUCION) {
    return { estado: "pendiente", detalle: { ...base, paso: "ejecucion", autorizado_en: mock.autorizado_en } };
  }
  if (pagoId.startsWith("mock_fail_")) {
    return { estado: "fallido", detalle: { ...base, paso: "ejecucion", motivo: "fondos insuficientes (simulado)" } };
  }
  return {
    estado: "completado",
    detalle: { ...base, paso: "finalizacion", autorizado_en: mock.autorizado_en, recibo: `RCB-${pagoId.slice(-8).toUpperCase()}` },
  };
}

/** Solo para la pantalla de consentimiento simulada: registra la decisión del pagador. */
export async function registrarDecisionMock(pagoId: string, autoriza: boolean): Promise<void> {
  const db = clienteAdmin();
  const { data: pago } = await db.from("pagos").select("detalle_json, estado").eq("id", pagoId).maybeSingle();
  if (!pago || pago.estado !== "pendiente") return;
  const previo = (pago.detalle_json as Record<string, unknown>) ?? {};
  const mock: EstadoMock = autoriza ? { autorizado_en: new Date().toISOString() } : { rechazado: true };
  await db
    .from("pagos")
    .update({ detalle_json: { ...previo, mock }, actualizado_en: new Date().toISOString() })
    .eq("id", pagoId)
    .eq("estado", "pendiente");
}
