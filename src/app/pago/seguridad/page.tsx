import type { Metadata } from "next";
import { auth } from "@/adapters/auth";
import { USE_MOCKS } from "@/lib/env";
import { PasarelaVisual } from "../pasarela/pasarela-visual";
import shor from "../../../../public/pqc/shor-demo.json";

export const metadata: Metadata = { title: "Seguridad de los pagos" };
export const dynamic = "force-dynamic";

export default async function SeguridadDelPago() {
  const perfil = await auth.obtenerPerfil().catch(() => null);
  return <PasarelaVisual perfil={perfil ? { nombre: perfil.nombre, rol: perfil.rol, wallet_address: perfil.wallet_address } : null} shor={shor} simulado={USE_MOCKS} />;
}
