import { NextResponse } from "next/server";
import { sincronizarPago } from "@/lib/pagos-service";

/** GET /api/pagos/:id — consulta el estado (la pantalla de retorno lo usa para refrescar). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,120}$/.test(id)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });

  const vista = await sincronizarPago(id);
  if (!vista) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  return NextResponse.json(vista, { headers: { "Cache-Control": "no-store" } });
}
