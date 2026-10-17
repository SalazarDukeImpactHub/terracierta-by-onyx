import { getCheckoutHandlers } from "@/payments/checkoutHandlers";

export const runtime = "nodejs";
/** El estado financiero requiere sesión, autorización por wallet y POST cifrado. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getCheckoutHandlers().estado(request, id);
}
export function GET() {
  return Response.json({ error: "Consulta el pago desde la pantalla protegida con tu sesión." }, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}
