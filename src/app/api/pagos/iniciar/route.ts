import { getCheckoutHandlers } from "@/payments/checkoutHandlers";

export const runtime = "nodejs";
export const POST = (request: Request) => getCheckoutHandlers().iniciar(request);
