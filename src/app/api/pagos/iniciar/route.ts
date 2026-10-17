import { NextResponse } from "next/server";
import { auth } from "@/adapters/auth";
import { iniciarPagoDePedido } from "@/lib/pagos-service";

/**
 * POST /api/pagos/iniciar — checkout de la tienda. Exige sesión de COMPRADOR: la wallet con la que se paga sale
 * de su perfil. Body: { productoId, cantidad }. El monto y la wallet del caficultor se calculan en el servidor
 * desde la base; lo que mande el navegador solo se usa para elegir producto y cantidad.
 */
export async function POST(request: Request) {
  if (request.method !== "POST" || !request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Se esperaba JSON" }, { status: 415 });
  }

  const perfil = await auth.obtenerPerfil().catch(() => null);
  if (!perfil) return NextResponse.json({ error: "Entrá con tu cuenta para pagar" }, { status: 401 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const resultado = await iniciarPagoDePedido(cuerpo, perfil);
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  return NextResponse.json({ pagoId: resultado.pagoId, redirectUrl: resultado.redirectUrl });
}
