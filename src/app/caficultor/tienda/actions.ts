"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/adapters/auth";
import { esUuid } from "@/lib/catalogo";
import { clienteAdmin } from "@/lib/supabase/admin";
import { esquemaProducto, MAX_FOTO_BYTES, primerError, TIPOS_FOTO } from "@/lib/validacion";

export interface EstadoFormulario {
  error?: string;
}

/** Comprueba la firma real del archivo (no solo el tipo que declara el navegador). */
function coincideFirma(bytes: Uint8Array, mime: string): boolean {
  const empieza = (...b: number[]) => b.every((v, i) => bytes[i] === v);
  if (mime === "image/jpeg") return empieza(0xff, 0xd8, 0xff);
  if (mime === "image/png") return empieza(0x89, 0x50, 0x4e, 0x47);
  if (mime === "image/webp") return empieza(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45;
  return false;
}

/** Crea o edita un producto del caficultor con sesión. El dueño sale de la sesión, nunca del formulario. */
export async function guardarProducto(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) return { error: "Para abrir tu tienda necesitas tener INVIMA." };

  const parsed = esquemaProducto.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") ?? "",
    precio_cop: formData.get("precio_cop"),
  });
  if (!parsed.success) return { error: primerError(parsed.error) };

  const id = String(formData.get("id") ?? "");
  const db = clienteAdmin();

  let fotoUrl: string | undefined;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const extension = TIPOS_FOTO[foto.type];
    if (!extension) return { error: "La foto debe ser JPG, PNG o WebP." };
    if (foto.size > MAX_FOTO_BYTES) return { error: "La foto pesa más de 2 MB." };
    const bytes = new Uint8Array(await foto.arrayBuffer());
    if (!coincideFirma(bytes, foto.type)) return { error: "El archivo no parece una imagen válida." };

    const ruta = `${perfil.id}/${randomUUID()}.${extension}`;
    const { error: errSubida } = await db.storage.from("productos-fotos").upload(ruta, bytes, { contentType: foto.type });
    if (errSubida) return { error: "No pudimos subir la foto. Intenta de nuevo." };
    fotoUrl = db.storage.from("productos-fotos").getPublicUrl(ruta).data.publicUrl;
  }

  if (id) {
    if (!esUuid(id)) return { error: "Producto inválido" };
    const cambios: Record<string, unknown> = { ...parsed.data };
    if (fotoUrl) cambios.foto_url = fotoUrl;
    const { data, error } = await db
      .from("productos")
      .update(cambios)
      .eq("id", id)
      .eq("dueno_id", perfil.id) // solo si el producto es suyo
      .select("id")
      .maybeSingle();
    if (error || !data) return { error: "No encontramos ese producto en tu tienda." };
  } else {
    const { error } = await db
      .from("productos")
      .insert({ ...parsed.data, dueno_id: perfil.id, foto_url: fotoUrl ?? null, publicado: false });
    if (error) return { error: "No pudimos guardar el producto." };
  }

  revalidatePath("/caficultor/tienda");
  redirect("/caficultor/tienda");
}

/** Publica u oculta un producto propio. */
export async function alternarPublicado(formData: FormData) {
  const perfil = await requerirRol("caficultor");
  if (!perfil.tiene_invima) redirect("/caficultor");
  const id = String(formData.get("id") ?? "");
  if (!esUuid(id)) return;

  const db = clienteAdmin();
  const { data: actual } = await db.from("productos").select("publicado").eq("id", id).eq("dueno_id", perfil.id).maybeSingle();
  if (!actual) return;
  await db.from("productos").update({ publicado: !actual.publicado }).eq("id", id).eq("dueno_id", perfil.id);
  revalidatePath("/caficultor/tienda");
}

// `tiene_invima` NO se escribe desde la página: lo registra el login al crear la cuenta y aquí solo se lee.
// (Antes había una acción que lo reescribía con un clic: cualquier caficultor podía "darse" el INVIMA.)
