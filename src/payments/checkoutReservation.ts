import "server-only";
import { clienteAdmin } from "@/lib/supabase/admin";
import { auth } from "@/adapters/auth";
import type { IniciarPagoInput } from "@/adapters/types";
import { PaymentError } from "./settlement";

/** Un grant preparado no basta: antes de enviar debe seguir siendo el pago activo del pedido/oferta. */
export async function assertActiveCheckoutPayment(input: IniciarPagoInput, pagoId: string) {
  // La cookie del retorno enlaza el flujo; no sustituye la sesión actual de TerraCierta.
  const perfil = await auth.obtenerPerfil().catch(() => null);
  if (!perfil) throw new PaymentError("Entra con la cuenta que inició este pago antes de continuar.", 401, "SESSION_EXPIRED");
  const expectedRole = input.tipo === "pedido" ? "comprador" : "cooperativa";
  if (perfil.rol !== expectedRole || !perfil.wallet_address || perfil.wallet_address !== input.walletPagador) {
    throw new PaymentError("La cuenta actual no corresponde al pagador de este pago.", 403, "PAYER_IDENTITY_MISMATCH");
  }
  const db = clienteAdmin();
  const [{ data: pago, error: pagoError }, { data: reference, error: referenceError }] = await Promise.all([
    db.from("pagos").select("estado, tipo, referencia_id, monto, wallet_pagador, wallet_receptor").eq("id", pagoId).maybeSingle(),
    db.from(input.tipo === "pedido" ? "pedidos" : "ofertas").select(input.tipo === "pedido" ? "pago_id, estado, comprador_id" : "pago_id, estado, cooperativas!inner(perfil_id)").eq("id", input.referenciaId).maybeSingle(),
  ]);
  const allowedReferenceStates = input.tipo === "pedido" ? ["pendiente"] : ["aceptada", "fallida"];
  if (pagoError || referenceError || !pago || !reference || pago.estado !== "pendiente" || reference.pago_id !== pagoId || !allowedReferenceStates.includes(reference.estado) || pago.tipo !== input.tipo || pago.referencia_id !== input.referenciaId || pago.monto !== input.montoCop || pago.wallet_pagador !== input.walletPagador || pago.wallet_receptor !== input.walletReceptor) {
    throw new PaymentError("Este pago no está activo para el pedido u oferta. Consulta su estado antes de volver a pagar.", 409);
  }
  const owner = reference as unknown as { comprador_id?: string; cooperativas?: { perfil_id?: string } };
  if ((input.tipo === "pedido" ? owner.comprador_id : owner.cooperativas?.perfil_id) !== perfil.id) {
    throw new PaymentError("El pedido u oferta no pertenece a la cuenta actual.", 403, "PAYER_IDENTITY_MISMATCH");
  }
}
