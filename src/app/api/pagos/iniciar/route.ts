import { NextResponse } from "next/server";
import { iniciarPagoDePedido } from "@/lib/pagos-service";

/**
 * POST /api/pagos/iniciar — checkout de la tienda pública (comprador sin registro).
 * Body: { productoId, cantidad, walletComprador }. El monto y la wallet receptora se calculan
 * en el servidor desde la base; lo que mande el navegador solo se usa para elegir producto y cantidad.
 */
export async function POST(request: Request) {
  if (request.method !== "POST" || !request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Se esperaba JSON" }, { status: 415 });
  }
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const resultado = await iniciarPagoDePedido(cuerpo);
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  return NextResponse.json({ pagoId: resultado.pagoId, redirectUrl: resultado.redirectUrl });
}
