"use client";

import Link from "next/link";
import { useState } from "react";
import type { Perfil, Rol } from "@/adapters/types";
import { FormularioPasarela } from "./formulario-pasarela";

const recorridos: Record<Rol, { nombre: string; titulo: string; descripcion: string; accion: string; ruta: string }> = {
  comprador: { nombre: "Comprador", titulo: "Paga tu café", descripcion: "Revisa tu compra y autoriza desde tu wallet.", accion: "Elegir café para pagar", ruta: "/tienda" },
  cooperativa: { nombre: "Cooperativa", titulo: "Paga tus ofertas", descripcion: "Revisa tus ofertas y paga al caficultor desde tu wallet.", accion: "Ver mis ofertas para pagar", ruta: "/cooperativa" },
  caficultor: { nombre: "Caficultor", titulo: "Recibe tus pagos", descripcion: "El dinero llega a tu wallet. Consulta tus cobros sin aprobar pagos entrantes.", accion: "Ver mis cobros", ruta: "/caficultor" },
};

export function ResumenPasarela({ perfil, maxAmount, maxDebit, simulado }: { perfil: Perfil | null; maxAmount: number; maxDebit: number; simulado: boolean }) {
  const [rol, setRol] = useState<Rol>(perfil?.rol ?? "comprador");
  const recorrido = recorridos[rol];
  const propia = perfil?.rol === rol;

  return <>
    <div className="mb-8 grid grid-cols-3 border-b border-linea" role="group" aria-label="Vista por rol">
      {(Object.keys(recorridos) as Rol[]).map((opcion) => <button key={opcion} type="button" aria-pressed={rol === opcion} onClick={() => setRol(opcion)} className={`min-h-11 border-b-2 px-1 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bosque ${rol === opcion ? "border-bosque text-bosque" : "border-transparent text-apagado hover:text-bosque"}`}>{recorridos[opcion].nombre}</button>)}
    </div>
    <h1 className="text-4xl">{recorrido.titulo}</h1>
    <p className="mt-3 text-apagado">{recorrido.descripcion}</p>
    {perfil && <div className="mt-6 border-y border-linea py-4">
      <p className="text-sm text-apagado">{perfil.nombre} · {recorridos[perfil.rol].nombre}{simulado ? " · demostración" : ""}</p>
      <p className="mt-1 break-all text-sm">{perfil.wallet_address ?? "Tu cuenta todavía no tiene una wallet asignada."}</p>
    </div>}
    {perfil && !propia && <p className="mt-5 text-sm text-apagado">Vista previa de {recorrido.nombre.toLowerCase()}. Tu sesión y tu wallet no cambian.</p>}
    {propia ? <Link href={recorrido.ruta} className="btn btn-bosque mt-6 w-full">{recorrido.accion}</Link> : !perfil && rol !== "caficultor" ? <div className="mt-6">
      <p className="text-sm text-apagado">Pago de prueba · wallet configurada en el servidor. No corresponde a un pedido ni a una oferta de tu cuenta.</p>
      <FormularioPasarela key={rol} maxAmount={maxAmount} maxDebit={maxDebit} simulado={simulado} compacto />
    </div> : !perfil ? <div className="mt-6 border-y border-linea py-5">
      <p className="text-sm text-apagado">Tu wallet y tus cobros aparecerán cuando entres con tu cuenta de caficultor.</p>
      <Link href="/caficultor" className="btn btn-bosque mt-5 w-full">Ver mis cobros</Link>
    </div> : null}
    <div className="mt-6 flex flex-wrap justify-between gap-x-5 gap-y-3 text-sm text-apagado">
      {!perfil ? <Link href="/acceso?siguiente=%2Fpago%2Fpasarela" className="underline underline-offset-4">Entrar con mi cuenta</Link> : <Link href="/tienda" className="underline underline-offset-4">Volver a la tienda</Link>}
      <Link href="/pago/seguridad" className="underline underline-offset-4">Seguridad del pago</Link>
    </div>
  </>;
}
