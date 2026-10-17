import { clientSeal, clientOpen, verifyChannelKey, type PublicBundle } from "./pqc/channel";
import { verifyReceipt, type HybridReceipt } from "./pqc/hybridReceipt";
import type { VistaPago } from "@/lib/pagos-service";

export class CheckoutError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
type Start = { pagoId: string; redirectUrl: string; canalPqc: true };
export type VerifiedPayment = VistaPago & { canalVerificado: true; reciboVerificado: boolean };
export type CheckoutProgress = "canal-verificado" | "solicitud-cifrada" | "respuesta-verificada" | "autorizacion";
type Observe = (event: CheckoutProgress) => void;

export function createCheckoutClient(fetcher: typeof fetch = (...args) => fetch(...args)) {
  let connection: Promise<PublicBundle> | undefined;
  async function connect(): Promise<PublicBundle> {
    const keyResponse = await fetcher("/api/pagos/key", { cache: "no-store", credentials: "same-origin" });
    const bundle = await keyResponse.json();
    if (!keyResponse.ok) throw new CheckoutError(bundle.error ?? "No se pudo establecer el canal protegido.", keyResponse.status);
    if (!verifyChannelKey(bundle)) throw new CheckoutError("No se pudo verificar la llave del canal protegido.", 502);
    return bundle;
  }
  // No se reintenta automáticamente un inicio: un fallo de red no prueba que no ocurrió.
  async function request<T>(path: string, value: unknown, observe?: Observe): Promise<{ data: T; bundle: PublicBundle }> {
    connection ??= connect().catch((error) => { connection = undefined; throw error; });
    const bundle = await connection;
    observe?.("canal-verificado");
    const sealed = await clientSeal(bundle, value, path);
    observe?.("solicitud-cifrada");
    const response = await fetcher(path, { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sealed.envelope) });
    const envelope = await response.json();
    if (!envelope.ciphertext) {
      if (response.status === 400) connection = undefined;
      throw new CheckoutError("El servidor no devolvió una respuesta protegida. Revisa el pago antes de repetirlo.", response.status);
    }
    const data = await clientOpen(sealed, envelope) as T & { error?: string };
    if (!response.ok) throw new CheckoutError(data.error ?? "No se pudo confirmar la operación. Revisa tu wallet antes de repetir el pago.", response.status);
    observe?.("respuesta-verificada");
    return { data, bundle };
  }
  async function start(path: string, payload: unknown, observe?: Observe): Promise<Start> {
    const { data } = await request<Start>(path, payload, observe);
    if (!data.canalPqc || !/^[A-Za-z0-9_-]{6,120}$/.test(data.pagoId) || !data.redirectUrl) throw new CheckoutError("La respuesta de inicio no coincide con el checkout protegido.", 502);
    // El servidor limita el origen de retorno; el navegador impide esquemas ejecutables.
    const url = new URL(data.redirectUrl, typeof window === "undefined" ? "http://127.0.0.1:3100" : window.location.origin);
    const localOrigin = typeof window === "undefined" ? "http://127.0.0.1:3100" : window.location.origin;
    const internal = url.origin === localOrigin && ["/pago/mock", "/pago/retorno"].includes(url.pathname);
    if (url.username || url.password || !(internal || (url.protocol === "https:" && url.hostname.endsWith(".interledger-test.dev")))) throw new CheckoutError("El destino de autorización no es válido.", 502);
    observe?.("autorizacion");
    return data;
  }
  return {
    iniciarPedido: (input: { productoId: string; cantidad: number }, observe?: Observe) => start("/api/pagos/iniciar", input, observe),
    iniciarOferta: (ofertaId: string, observe?: Observe) => start("/api/pagos/oferta", { ofertaId }, observe),
    async consultar(id: string): Promise<VerifiedPayment> {
      if (!/^[A-Za-z0-9_-]{6,120}$/.test(id)) throw new CheckoutError("Identificador de pago inválido.", 400);
      const { data, bundle } = await request<VistaPago>(`/api/pagos/${id}`, {});
      if (data.pagoId !== id || !["pendiente", "completado", "fallido"].includes(data.estado)) throw new CheckoutError("La respuesta no corresponde al pago solicitado.", 502);
      let verified = false;
      if (data.estado === "completado" && !data.detalle.simulado) {
        const receipt = data.detalle.reciboPqc as HybridReceipt<Record<string, unknown>> | null;
        const payload = receipt?.payload;
        verified = !!receipt && verifyReceipt(receipt, bundle.signature.publicKeys).valid && payload?.pagoId === id && payload.estado === "completado" && payload.amount === data.monto && payload.receiver === data.walletReceptor && payload.canalPqc === data.detalle.canalPqc;
        if (!verified) throw new CheckoutError("No se pudo verificar el comprobante del pago. Revisa tu wallet antes de repetirlo.", 502);
      }
      return { ...data, canalVerificado: true, reciboVerificado: verified };
    },
  };
}
const client = createCheckoutClient();
export const iniciarCheckoutProtegido = client.iniciarPedido;
export const iniciarOfertaProtegida = client.iniciarOferta;
export const consultarCheckoutProtegido = client.consultar;
