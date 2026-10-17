import { NextResponse } from "next/server";
import { auth } from "@/adapters/auth";
import { iniciarPagoDePedido } from "@/lib/pagos-service";
import { rutaSegura } from "@/lib/roles";

/**
 * POST /api/pagos/iniciar — checkout de la tienda. Exige sesión de comprador o cooperativa: la wallet con
 * la que se paga sale del perfil. Body: { productoId, cantidad }. El monto y la wallet del caficultor se
 * calculan en el servidor; el navegador solo elige producto y cantidad.
 */
export async function POST(request: Request) {
  if (request.method !== "POST" || !request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Se esperaba JSON" }, { status: 415 });
  }

  const perfil = await auth.obtenerPerfil().catch(() => null);
  if (!perfil) return NextResponse.json({ error: "Entra con tu cuenta para pagar" }, { status: 401 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const referido = request.headers.get("referer");
  let volver = "/tienda";
  if (referido) {
    try {
      const url = new URL(referido);
      volver = rutaSegura(`${url.pathname}${url.search}`) ?? volver;
    } catch {
      volver = "/tienda";
    }
  }

  const resultado = await iniciarPagoDePedido(cuerpo, perfil, volver);
  if (!resultado.ok) {
    if (resultado.login) return NextResponse.json({ redirectUrl: resultado.login });
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({ pagoId: resultado.pagoId, redirectUrl: resultado.redirectUrl });
}
