import { getSdkAdapter } from "@/payments/sdkAdapter";
import { getGateway } from "@/payments/gateway";

export const runtime = "nodejs";

export async function GET(request: Request) { return new URL(request.url).searchParams.has("checkoutState") ? getSdkAdapter().callback(request) : getGateway().callback(request); }
