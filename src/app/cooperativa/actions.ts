"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { esUuid } from "@/lib/catalogo";
import { iniciarPagoDeOferta } from "@/lib/pagos-service";
import { aceptarOfertaDeCooperativa } from "@/lib/ruta-b";

const volver = (error?: string) => (error ? `/cooperativa?error=${encodeURIComponent(error)}` : "/cooperativa");

export async function aceptarOferta(formData: FormData) {
  const perfil = await requerirRol("cooperativa");
  const ofertaId = String(formData.get("ofertaId") ?? "");
  if (!esUuid(ofertaId)) redirect(volver("Oferta inválida"));

  const r = await aceptarOfertaDeCooperativa(ofertaId, perfil.id);
  revalidatePath("/cooperativa");
  redirect(volver(r.ok ? undefined : r.error));
}

/** Inicia el pago de una oferta aceptada: lleva a la billetera (consentimiento) y vuelve a /pago/retorno. */
export async function pagarOferta(formData: FormData) {
  const perfil = await requerirRol("cooperativa");
  const ofertaId = String(formData.get("ofertaId") ?? "");
  if (!esUuid(ofertaId)) redirect(volver("Oferta inválida"));

  const r = await iniciarPagoDeOferta(ofertaId, perfil.id);
  if (!r.ok) redirect(volver(r.error));
  redirect(r.redirectUrl);
}
