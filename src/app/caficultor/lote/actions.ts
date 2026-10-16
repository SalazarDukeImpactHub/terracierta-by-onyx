"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { esUuid } from "@/lib/catalogo";
import { elegirCooperativaParaLote } from "@/lib/ruta-b";
import { clienteAdmin } from "@/lib/supabase/admin";
import { esquemaLote, primerError } from "@/lib/validacion";

export interface EstadoFormulario {
  error?: string;
}

/** Registra un lote del caficultor con sesión (el dueño sale de la sesión, no del formulario). */
export async function crearLote(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const perfil = await requerirRol("caficultor");

  const parsed = esquemaLote.safeParse({
    metodo: formData.get("metodo"),
    variedad: formData.get("variedad"),
    kg: formData.get("kg"),
    municipio: formData.get("municipio"),
  });
  if (!parsed.success) return { error: primerError(parsed.error) };

  const { data, error } = await clienteAdmin()
    .from("lotes")
    .insert({ ...parsed.data, caficultor_id: perfil.id })
    .select("id")
    .single();
  if (error || !data) return { error: "No pudimos guardar tu lote. Probá de nuevo." };

  revalidatePath("/caficultor/lote");
  redirect(`/caficultor/lote/${data.id}`);
}

/** El caficultor elige una de las cooperativas recomendadas: recién ahí se crea la oferta. */
export async function elegirCooperativa(formData: FormData) {
  const perfil = await requerirRol("caficultor");
  const loteId = String(formData.get("loteId") ?? "");
  const cooperativaId = String(formData.get("cooperativaId") ?? "");
  if (!esUuid(loteId) || !esUuid(cooperativaId)) redirect("/caficultor/lote");

  const resultado = await elegirCooperativaParaLote(loteId, cooperativaId, perfil.id);
  revalidatePath(`/caficultor/lote/${loteId}`);
  redirect(resultado.ok ? `/caficultor/lote/${loteId}` : `/caficultor/lote/${loteId}?error=${encodeURIComponent(resultado.error)}`);
}
