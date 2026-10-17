import { getGateway } from "@/payments/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) { return getGateway().key(request); }
