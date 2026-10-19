import { pagos } from "@/adapters/payments";
import type { EstadoPago, Perfil, TipoPago } from "@/adapters/types";
import { SITE_URL } from "@/lib/env";
import { LoginInterledgerError, PagoInterledgerError } from "@/lib/interledger";
import { guardarCobro } from "@/lib/cobro-pendiente";
import { urlLoginInterledger } from "@/lib/login-interledger";
import { clienteAdmin } from "@/lib/supabase/admin";
import { esquemaCheckout, primerError } from "@/lib/validacion";

/**
 * Lógica de pagos de la PÁGINA (no del compañero): arma el pago a partir de datos confirmados
 * en la base (el monto y la wallet receptora NUNCA vienen del navegador), guarda el registro en
 * `pagos` y sincroniza `pedidos` / `ofertas` con el estado. Habla con el módulo de pagos solo
 * por el adaptador.
 */

export type ResultadoInicio =
  | { ok: true; pagoId: string; redirectUrl: string }
  | { ok: false; error: string; status: number; login?: string };

/**
 * Checkout de la tienda. Paga el COMPRADOR con sesión: su wallet sale de su perfil (asignada al registrarse),
 * nunca de lo que mande el navegador. El navegador solo elige producto y cantidad.
 */
function esBilleteraInterledger(wallet: string): boolean {
  return wallet.includes("interledger-test.dev") || wallet.includes("ilp.interledger");
}

async function confirmarEnLaApp(datos: {
  tipo: "pedido" | "oferta";
  productoId?: string;
  cantidad?: number;
  ofertaId?: string;
  monto: number;
  receptor: string;
  descripcion: string;
  pagadorId: string;
  volver: string;
}): Promise<ResultadoInicio> {
  await guardarCobro(datos);
  return { ok: false, error: "Entra a Interledger para pagar.", status: 401, login: urlLoginInterledger("/pago/decidir") };
}

export async function iniciarPagoDePedido(
  entrada: unknown,
  comprador: Pick<Perfil, "id" | "rol" | "wallet_address">,
  volver = "/tienda",
  directo = false,
): Promise<ResultadoInicio> {
  if (comprador.rol !== "comprador" && comprador.rol !== "cooperativa") {
    return { ok: false, error: "Para comprar necesitas entrar como comprador o como cooperativa", status: 403 };
  }
  const walletComprador = comprador.wallet_address;
  if (!walletComprador) {
    return { ok: false, error: "Tu cuenta todavía no tiene una wallet asignada", status: 409 };
  }

  const parsed = esquemaCheckout.safeParse(entrada);
  if (!parsed.success) return { ok: false, error: primerError(parsed.error), status: 400 };
  const { productoId, cantidad } = parsed.data;

  const db = clienteAdmin();
  const { data: producto } = await db
    .from("productos")
    .select("id, nombre, precio_cop, publicado, dueno_id")
    .eq("id", productoId)
    .maybeSingle();
  if (!producto || !producto.publicado) return { ok: false, error: "Ese producto no está disponible", status: 404 };

  const { data: vendedor } = await db
    .from("profiles")
    .select("wallet_address, tiene_invima, rol")
    .eq("id", producto.dueno_id)
    .maybeSingle();
  if (!vendedor || vendedor.rol !== "caficultor" || !vendedor.tiene_invima || !vendedor.wallet_address) {
    return { ok: false, error: "Esta tienda todavía no puede recibir pagos", status: 409 };
  }
  if (vendedor.wallet_address === walletComprador) {
    return { ok: false, error: "No puedes pagarte a ti mismo", status: 400 };
  }

  const monto = producto.precio_cop * cantidad;
  const descripcion = `Terracierta · ${producto.nombre} · ${monto} COP`;
  if (!directo && esBilleteraInterledger(walletComprador) && esBilleteraInterledger(vendedor.wallet_address)) {
    return confirmarEnLaApp({
      tipo: "pedido",
      productoId: producto.id,
      cantidad,
      monto,
      receptor: vendedor.wallet_address,
      descripcion,
      pagadorId: comprador.id,
      volver,
    });
  }
  const { data: pedido, error: errPedido } = await db
    .from("pedidos")
    .insert({ producto_id: producto.id, comprador_id: comprador.id, wallet_comprador: walletComprador, cantidad, monto })
    .select("id")
    .single();
  if (errPedido || !pedido) return { ok: false, error: "No pudimos crear el pedido", status: 500 };

  const urlRetorno = `${SITE_URL}/pago/retorno?tipo=pedido&ref=${pedido.id}`;
  return iniciarYRegistrar({
    tipo: "pedido",
    referenciaId: pedido.id,
    montoCop: monto,
    walletReceptor: vendedor.wallet_address,
    walletPagador: walletComprador,
    urlRetorno,
  });
}

/**
 * Pago de una oferta de la Ruta B: paga la COOPERATIVA (su wallet de perfil) a la wallet del caficultor
 * dueño del lote. El monto sale de la oferta guardada, nunca del navegador. Solo se paga una oferta
 * aceptada (o una cuyo pago anterior falló, para reintentar).
 */
export async function iniciarPagoDeOferta(
  ofertaId: string,
  perfilCooperativaId: string,
  volver = "/cooperativa",
  directo = false,
): Promise<ResultadoInicio> {
  const db = clienteAdmin();
  const { data: oferta } = await db
    .from("ofertas")
    .select("id, estado, total, cooperativas!inner(perfil_id), lotes!inner(caficultor_id)")
    .eq("id", ofertaId)
    .eq("cooperativas.perfil_id", perfilCooperativaId) // solo ofertas de su cooperativa
    .maybeSingle();
  if (!oferta) return { ok: false, error: "No encontramos esa oferta", status: 404 };
  if (oferta.estado !== "aceptada" && oferta.estado !== "fallida") {
    return { ok: false, error: oferta.estado === "pagada" ? "Esta oferta ya está pagada" : "Primero hay que aceptar la oferta", status: 409 };
  }

  const caficultorId = (oferta.lotes as unknown as { caficultor_id: string }).caficultor_id;
  const [{ data: pagador }, { data: receptor }] = await Promise.all([
    db.from("profiles").select("wallet_address").eq("id", perfilCooperativaId).maybeSingle(),
    db.from("profiles").select("wallet_address").eq("id", caficultorId).maybeSingle(),
  ]);
  if (!pagador?.wallet_address) return { ok: false, error: "Tu cooperativa no tiene una wallet asignada", status: 409 };
  if (!receptor?.wallet_address) return { ok: false, error: "El caficultor todavía no tiene wallet para cobrar", status: 409 };
  const descripcion = `Terracierta · lote · ${oferta.total} COP`;
  if (!directo && esBilleteraInterledger(pagador.wallet_address) && esBilleteraInterledger(receptor.wallet_address)) {
    return confirmarEnLaApp({
      tipo: "oferta",
      ofertaId: oferta.id,
      monto: oferta.total,
      receptor: receptor.wallet_address,
      descripcion,
      pagadorId: perfilCooperativaId,
      volver,
    });
  }

  return iniciarYRegistrar({
    tipo: "oferta",
    referenciaId: oferta.id,
    montoCop: oferta.total,
    walletReceptor: receptor.wallet_address,
    walletPagador: pagador.wallet_address,
    urlRetorno: `${SITE_URL}/pago/retorno?tipo=oferta&ref=${oferta.id}`,
  });
}

async function iniciarYRegistrar(input: {
  tipo: TipoPago;
  referenciaId: string;
  montoCop: number;
  walletReceptor: string;
  walletPagador: string;
  urlRetorno: string;
}): Promise<ResultadoInicio> {
  const db = clienteAdmin();
  const tablaReferencia = input.tipo === "pedido" ? "pedidos" : "ofertas";
  const estadoFallido = input.tipo === "pedido" ? "fallido" : "fallida";

  let resultado;
  try {
    resultado = await pagos.iniciarPago(input);
  } catch (e) {
    if (e instanceof LoginInterledgerError) {
      await db.from(tablaReferencia).delete().eq("id", input.referenciaId);
      return { ok: false, error: e.message, status: 401, login: e.login };
    }
    console.error("[pagos] iniciarPago falló:", e instanceof Error ? e.message : e);
    await db.from(tablaReferencia).update({ estado: estadoFallido }).eq("id", input.referenciaId);
    const mensaje = e instanceof Error && e.name === "PagoInterledgerError" ? e.message : "No pudimos iniciar el pago. Intenta de nuevo en un momento.";
    return { ok: false, error: mensaje, status: 502 };
  }

  const { error } = await db.from("pagos").insert({
    id: resultado.pagoId,
    tipo: input.tipo,
    referencia_id: input.referenciaId,
    monto: input.montoCop,
    wallet_pagador: input.walletPagador,
    wallet_receptor: input.walletReceptor,
    estado: resultado.estado,
    detalle_json: resultado.detalle ?? {},
  });
  if (error) return { ok: false, error: "No pudimos registrar el pago", status: 500 };
  if (resultado.estado === "completado" || resultado.estado === "fallido") {
    await aplicarAReferencia(input.tipo, input.referenciaId, resultado.estado);
  }

  await db.from(tablaReferencia).update({ pago_id: resultado.pagoId }).eq("id", input.referenciaId);

  const destino = resultado.redirectUrl ?? `${input.urlRetorno}&pago_id=${encodeURIComponent(resultado.pagoId)}`;
  return { ok: true, pagoId: resultado.pagoId, redirectUrl: destino };
}

export interface VistaPago {
  pagoId: string;
  tipo: TipoPago;
  estado: EstadoPago;
  monto: number;
  walletReceptor: string;
  concepto: string;
  detalle: { paso?: string; recibo?: string; motivo?: string; simulado?: boolean; canalPqc?: boolean; reciboPqc?: unknown };
}

/**
 * Consulta el estado al módulo de pagos y, si cambió de pendiente a final, actualiza `pagos` y la
 * referencia (pedido u oferta). Es idempotente: la transición solo se aplica una vez.
 */
export async function sincronizarPago(pagoId: string): Promise<VistaPago | null> {
  const db = clienteAdmin();
  const { data: pago } = await db.from("pagos").select("*").eq("id", pagoId).maybeSingle();
  if (!pago) return null;

  let estado = pago.estado as EstadoPago;
  let detalle = (pago.detalle_json ?? {}) as Record<string, unknown>;

  if (estado === "pendiente") {
    try {
      const consulta = await pagos.consultarPago(pagoId);
      detalle = { ...detalle, ...consulta.detalle };
      if (consulta.estado !== "pendiente") {
        const { data: actualizado } = await db
          .from("pagos")
          .update({ estado: consulta.estado, detalle_json: detalle, actualizado_en: new Date().toISOString() })
          .eq("id", pagoId)
          .eq("estado", "pendiente")
          .select("id")
          .maybeSingle();
        if (actualizado) await aplicarAReferencia(pago.tipo, pago.referencia_id, consulta.estado);
        estado = consulta.estado;
      }
    } catch (e) {
      console.error("[pagos] consultarPago falló:", e instanceof Error ? e.message : e);
    }
  }

  return {
    pagoId,
    tipo: pago.tipo,
    estado,
    monto: pago.monto,
    walletReceptor: pago.wallet_receptor,
    concepto: await nombreConcepto(pago.tipo, pago.referencia_id),
    detalle: {
      paso: detalle.paso as string | undefined,
      recibo: detalle.recibo as string | undefined,
      motivo: detalle.motivo as string | undefined,
      simulado: detalle.simulado as boolean | undefined,
    },
  };
}

async function aplicarAReferencia(tipo: TipoPago, referenciaId: string, estado: EstadoPago) {
  const db = clienteAdmin();
  if (tipo === "pedido") {
    await db.from("pedidos").update({ estado: estado === "completado" ? "pagado" : "fallido" }).eq("id", referenciaId);
  } else {
    const { data: oferta } = await db
      .from("ofertas")
      .update({ estado: estado === "completado" ? "pagada" : "fallida" })
      .eq("id", referenciaId)
      .select("lote_id")
      .maybeSingle();
    // Pagada la oferta, el lote queda vendido
    if (estado === "completado" && oferta) await db.from("lotes").update({ estado: "vendido" }).eq("id", oferta.lote_id);
  }
}

async function nombreConcepto(tipo: TipoPago, referenciaId: string): Promise<string> {
  const db = clienteAdmin();
  if (tipo === "pedido") {
    const { data } = await db.from("pedidos").select("cantidad, productos(nombre)").eq("id", referenciaId).maybeSingle();
    const producto = (data?.productos as unknown as { nombre: string } | null)?.nombre;
    return producto ? `${data?.cantidad} × ${producto}` : "Pedido";
  }
  const { data } = await db.from("ofertas").select("lotes(kg, variedad, metodo)").eq("id", referenciaId).maybeSingle();
  const lote = data?.lotes as unknown as { kg: number; variedad: string; metodo: string } | null;
  return lote ? `Lote de ${lote.kg} kg · ${lote.variedad} ${lote.metodo}` : "Compra de lote";
}

/** Resuelve el pago de un pedido u oferta cuando la vuelta de la billetera no trae pago_id. */
export async function pagoIdDeReferencia(tipo: TipoPago, referenciaId: string): Promise<string | null> {
  const db = clienteAdmin();
  const { data } = await db
    .from(tipo === "pedido" ? "pedidos" : "ofertas")
    .select("pago_id")
    .eq("id", referenciaId)
    .maybeSingle();
  return data?.pago_id ?? null;
}
