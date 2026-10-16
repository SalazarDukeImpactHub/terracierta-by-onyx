"use server";

import { redirect } from "next/navigation";
import { registrarDecisionMock } from "@/adapters/mocks/payments";
import { SITE_URL, USE_MOCKS } from "@/lib/env";

/** Mock: registra si el pagador autoriza o rechaza y lo devuelve a la página (ruta de retorno). */
export async function decidirPagoMock(formData: FormData) {
  if (!USE_MOCKS) redirect("/");
  const pagoId = String(formData.get("pago_id") ?? "");
  const retorno = String(formData.get("retorno") ?? "");
  const autoriza = formData.get("decision") === "autorizar";
  if (!/^[A-Za-z0-9_-]{6,120}$/.test(pagoId)) redirect("/");

  // Solo se vuelve a una URL de ESTA página (evita open redirect).
  let destino: URL;
  try {
    destino = new URL(retorno, SITE_URL);
  } catch {
    redirect("/");
  }
  if (destino.origin !== new URL(SITE_URL).origin) redirect("/");

  await registrarDecisionMock(pagoId, autoriza);
  destino.searchParams.set("pago_id", pagoId);
  redirect(`${destino.pathname}${destino.search}`);
}
