"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { esUuid } from "@/lib/catalogo";
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

// El pago de ofertas pasa por POST /api/pagos/oferta con canal PQC obligatorio.
