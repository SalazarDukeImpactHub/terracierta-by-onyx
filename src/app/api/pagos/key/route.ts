import { getCheckoutHandlers } from "@/payments/checkoutHandlers";

export const runtime = "nodejs";
export const GET = (request: Request) => getCheckoutHandlers().key(request);
