import "server-only";
import { z } from "zod";
import { auth } from "@/adapters/auth";
import { iniciarPagoDePedido, iniciarPagoDeOferta, sincronizarPago } from "@/lib/pagos-service";
import type { Perfil } from "@/adapters/types";
import { getCheckoutChannel, type createCheckoutChannel } from "./checkoutChannel";

const pedido = z.strictObject({ productoId: z.uuid(), cantidad: z.number().int().min(1).max(20) });
const oferta = z.strictObject({ ofertaId: z.uuid() });
const empty = z.strictObject({});
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
type Dependencies = {
  perfil(): Promise<Perfil | null>;
  iniciarPedido: typeof iniciarPagoDePedido;
  iniciarOferta: typeof iniciarPagoDeOferta;
  consultar(pagoId: string, wallet?: string): Promise<Awaited<ReturnType<typeof sincronizarPago>>>;
};

export function createCheckoutHandlers(deps: Dependencies, channel: ReturnType<typeof createCheckoutChannel> = getCheckoutChannel()) {
  async function profile() { try { return await deps.perfil(); } catch { return null; } }
  return {
    async key(request: Request) {
      const perfil = await profile();
      return perfil ? channel.key(request, perfil.id) : json({ error: "Entra con tu cuenta para establecer el canal." }, 401);
    },
    iniciar: (request: Request) => channel.handle(request, "/api/pagos/iniciar", async (payload) => {
      const perfil = await profile();
      if (!perfil) return json({ error: "Entra con tu cuenta para pagar." }, 401);
      if (perfil.rol !== "comprador" && perfil.rol !== "cooperativa") return json({ error: "Para comprar necesitas entrar como comprador o como cooperativa." }, 403);
      channel.limitUser(perfil.id, "start");
      const input = pedido.safeParse(payload);
      if (!input.success) return json({ error: "Producto o cantidad inválidos. El precio y las wallets se obtienen del servidor." }, 400);
      const result = await deps.iniciarPedido(input.data, perfil);
      return result.ok ? json({ pagoId: result.pagoId, redirectUrl: result.redirectUrl, canalPqc: true }) : json({ error: result.error }, result.status);
    }),
    oferta: (request: Request) => channel.handle(request, "/api/pagos/oferta", async (payload) => {
      const perfil = await profile();
      if (!perfil) return json({ error: "Entra con tu cuenta para pagar." }, 401);
      if (perfil.rol !== "cooperativa") return json({ error: "Esta operación requiere una cuenta de cooperativa." }, 403);
      channel.limitUser(perfil.id, "start");
      const input = oferta.safeParse(payload);
      if (!input.success) return json({ error: "Oferta inválida." }, 400);
      const result = await deps.iniciarOferta(input.data.ofertaId, perfil.id);
      return result.ok ? json({ pagoId: result.pagoId, redirectUrl: result.redirectUrl, canalPqc: true }) : json({ error: result.error }, result.status);
    }),
    estado: (request: Request, id: string) => channel.handle(request, `/api/pagos/${id}`, async (payload) => {
      const perfil = await profile();
      if (!perfil) return json({ error: "Entra con tu cuenta para consultar el pago." }, 401);
      channel.limitUser(perfil.id, "status");
      if (!perfil.wallet_address || !/^[A-Za-z0-9_-]{6,120}$/.test(id) || !empty.safeParse(payload).success) return json({ error: "Pago no disponible para esta cuenta." }, 404);
      const result = await deps.consultar(id, perfil.wallet_address);
      return result ? json(result) : json({ error: "Pago no disponible para esta cuenta." }, 404);
    }),
  };
}
export const getCheckoutHandlers = () => createCheckoutHandlers({ perfil: () => auth.obtenerPerfil(), iniciarPedido: iniciarPagoDePedido, iniciarOferta: iniciarPagoDeOferta, consultar: (id) => sincronizarPago(id) });
