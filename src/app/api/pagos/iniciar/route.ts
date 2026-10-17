import { getCheckoutHandlers } from "@/payments/checkoutHandlers";

export const runtime = "nodejs";
/** Recibe producto/cantidad cifrados. El servicio conserva precio y wallets desde el servidor. */
export const POST = (request: Request) => getCheckoutHandlers().iniciar(request);
