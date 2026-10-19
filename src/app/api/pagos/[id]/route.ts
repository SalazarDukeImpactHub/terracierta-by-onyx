import { NextResponse } from "next/server";
import { auth } from "@/adapters/auth";
import { getCheckoutHandlers } from "@/payments/checkoutHandlers";
import { sincronizarPago } from "@/lib/pagos-service";

type Context = { params: Promise<{ id: string }> };

/** GET /api/pagos/:id — consulta el estado para el retorno del pago. */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,120}$/.test(id)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });

  const perfil = await auth.obtenerPerfil().catch(() => null);
  if (!perfil?.wallet_address) return NextResponse.json({ error: "Entra con la cuenta que participa en este pago." }, { status: 401 });

  const vista = await sincronizarPago(id, perfil.wallet_address);
  if (!vista) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  return NextResponse.json(vista, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/pagos/:id — consulta cifrada y valida el recibo de Open Payments. */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  return getCheckoutHandlers().estado(request, id);
}
