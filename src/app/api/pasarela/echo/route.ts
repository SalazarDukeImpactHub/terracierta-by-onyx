import { getGateway } from "@/payments/gateway";

export const runtime = "nodejs";

export async function POST(request: Request) { return getGateway().echo(request); }
