"use server";

import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { borrarCobro, leerCobro } from "@/lib/cobro-pendiente";
import { sesionDeBilletera } from "@/lib/interledger";
import { guardarCookieIlp, leerCookieIlp } from "@/lib/login-interledger";
import { iniciarPagoDeOferta, iniciarPagoDePedido } from "@/lib/pagos-service";
import { clienteAdmin } from "@/lib/supabase/admin";
import { rutaSegura } from "@/lib/roles";

export async function aceptarPago() {
  const cobro = await leerCobro();
  const perfil = await auth.obtenerPerfil().catch(() => null);
  if (!cobro || !perfil || cobro.pagadorId !== perfil.id) redirect("/");

  const db = clienteAdmin();
  if (cobro.tipo === "pedido") {
    const { data } = await db.from("productos").select("precio_cop").eq("id", cobro.productoId ?? "").maybeSingle();
    if (!data || !cobro.cantidad || data.precio_cop * cobro.cantidad !== cobro.monto) redirect(cobro.volver);
  } else {
    const { data } = await db.from("ofertas").select("total").eq("id", cobro.ofertaId ?? "").maybeSingle();
    if (!data || data.total !== cobro.monto) redirect(cobro.volver);
  }

  if (!(await leerCookieIlp())) await guardarCookieIlp(await sesionDeBilletera());

  const resultado =
    cobro.tipo === "pedido"
      ? await iniciarPagoDePedido({ productoId: cobro.productoId, cantidad: cobro.cantidad }, perfil, cobro.volver, true)
      : await iniciarPagoDeOferta(cobro.ofertaId ?? "", perfil.id, cobro.volver, true);

  if (!resultado.ok) redirect(resultado.login ?? `${cobro.volver}${cobro.volver.includes("?") ? "&" : "?"}error=${encodeURIComponent(resultado.error)}`);
  await borrarCobro();
  redirect(resultado.redirectUrl);
}

export async function rechazarPago() {
  const cobro = await leerCobro();
  await borrarCobro();
  redirect(rutaSegura(cobro?.volver) ?? "/");
}
