"use client";

import Link from "next/link";
import { useState } from "react";
import type { Perfil, Rol } from "@/adapters/types";
import { FlujoPago } from "@/components/flujo-pago";
import { EscenarioCuantico, type DatosShor } from "./escenario-cuantico";
import { PruebaPostcuantica } from "./prueba-pqc";
import { ViajePqc } from "./viaje-pqc";
import { CanalPqcDemo } from "./canal-pqc-demo";
import styles from "./pasarela-visual.module.css";

const recorridos: Record<Rol, { titulo: string; descripcion: string; accion: string; ruta: string }> = {
  comprador: { titulo: "Paga tu café", descripcion: "Tú eliges el café. Tu wallet autoriza el pago.", accion: "Elegir café", ruta: "/tienda" },
  cooperativa: { titulo: "Paga tus ofertas", descripcion: "De tu cooperativa al caficultor, con autorización de tu wallet.", accion: "Ver mis ofertas", ruta: "/cooperativa" },
  caficultor: { titulo: "Recibe tus pagos", descripcion: "Comparte tu wallet y consulta tus cobros. La aprobación le corresponde a quien paga.", accion: "Ver mis cobros", ruta: "/caficultor" },
};

/** El selector presenta recorridos. La identidad comercial sigue viniendo del servidor. */
export function PasarelaVisual({ perfil, shor, simulado }: { perfil: Pick<Perfil, "nombre" | "rol" | "wallet_address"> | null; shor: DatosShor; simulado: boolean }) {
  const [rol, setRol] = useState<Rol>(perfil?.rol ?? "comprador");
  const propio = perfil?.rol === rol;
  const recorrido = recorridos[rol];
  return <section className={styles.shell}>
    <div className={styles.roleBar}>
      <p>Seguridad del pago · laboratorio</p>
      <div className={styles.roles} role="group" aria-label="Vista previa por rol">
        {(Object.keys(recorridos) as Rol[]).map((item) => <button key={item} type="button" aria-pressed={rol === item} onClick={() => setRol(item)}>{item === "comprador" ? "Comprador" : item === "cooperativa" ? "Cooperativa" : "Caficultor"}</button>)}
      </div>
    </div>
    <div className={styles.intro}>
      <div><h1>Seguridad del pago</h1><p>{recorrido.descripcion}</p></div>
      {propio ? <Link href={recorrido.ruta} className="btn btn-bosque">{recorrido.accion}</Link> : !perfil ? <Link href="/acceso?siguiente=%2Fpago%2Fpasarela" className="btn btn-bosque">Entrar con mi cuenta</Link> : <p className={styles.preview}>Vista previa · no cambia tu sesión de {perfil.rol}.</p>}
    </div>
    <div className={styles.account}>
      <div><p>{propio ? `${perfil.nombre} · ${perfil.rol}${simulado ? " · perfil de demostración" : ""}` : "Vista previa · sin identidad asignada"}</p>
        <p>{propio ? rol === "caficultor" ? "Tu wallet para cobrar" : "Tu wallet para pagar" : "La wallet se obtiene del perfil validado"}</p>
      </div>
      {propio && <code>{perfil.wallet_address ?? "Tu cuenta todavía no tiene una wallet asignada."}</code>}
    </div>
    <details className={styles.evidence}><summary>Ver el recorrido protegido</summary><FlujoPago fase="pendiente" simulado /></details>
    <ViajePqc key={`juego-${rol}`} rol={rol} />
    <CanalPqcDemo />
    <details className={styles.evidence}><summary>Ver Shor: circuito, mediciones y límites</summary><EscenarioCuantico key={rol} rol={rol} shor={shor} /></details>
    <PruebaPostcuantica />
    <div className={styles.footer}><Link href="/pago/pasarela">Volver a la pasarela</Link><Link href="/pago/pasarela?prueba=1">Prueba técnica de pago</Link></div>
  </section>;
}
