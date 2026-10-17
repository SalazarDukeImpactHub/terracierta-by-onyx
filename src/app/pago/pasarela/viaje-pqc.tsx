"use client";

import { useRef, useState } from "react";
import type { Rol } from "@/adapters/types";
import type { demostrarCompromisoClasico } from "@/payments/pqcQuantumDemo";
import styles from "./viaje-pqc.module.css";

/** Laboratorio aislado: compromete solo su propia clave clásica, nunca una clave del pago. */
export function ViajePqc({ rol }: { rol: Rol }) {
  const locked = useRef(false);
  const [estado, setEstado] = useState<"listo" | "comprobando" | "viajando" | "completado">("listo");
  const [error, setError] = useState("");
  const [escudo, setEscudo] = useState(true);
  const [prueba, setPrueba] = useState<ReturnType<typeof demostrarCompromisoClasico> | null>(null);
  const [huella, setHuella] = useState("");
  const ocupado = estado === "comprobando" || estado === "viajando";
  async function jugar(nueva = false) {
    if (locked.current) return;
    locked.current = true; setEstado("comprobando"); setError("");
    try {
      const { demostrarCompromisoClasico } = await import("@/payments/pqcQuantumDemo");
      const evidencia = nueva || !prueba ? demostrarCompromisoClasico(rol) : prueba;
      if (!evidencia.originalVerificado) throw new Error("El documento original no verifica.");
      const publicKey = Uint8Array.from(atob(evidencia.original.publicKeys.ed25519), (byte) => byte.charCodeAt(0));
      const fingerprint = new Uint8Array(await crypto.subtle.digest("SHA-256", publicKey));
      setHuella(Array.from(fingerprint, (byte) => byte.toString(16).padStart(2, "0")).join(""));
      setPrueba(evidencia);
      // La animación ilustra un resultado ya comprobado: su duración no mide la red.
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setEstado(reducir ? "completado" : "viajando");
      if (reducir) locked.current = false;
    } catch {
      setError("No se pudo completar el experimento. Puedes intentarlo de nuevo.");
      setEstado("listo"); locked.current = false;
    }
  }
  const aceptado = prueba ? escudo ? prueba.hibridaAceptaAlteracion : prueba.clasicaAceptaAlteracion : null;
  return <figure className={styles.game} aria-label="Experimento de firma clásica comprometida">
    <div className={styles.header}><button type="button" aria-pressed={escudo} disabled={ocupado} onClick={() => { setEscudo(!escudo); setEstado("listo"); setError(""); }}>{escudo ? "Escudo PQC activo" : "Solo firma clásica"}</button><button type="button" onClick={() => jugar()} disabled={ocupado}>{ocupado ? "Verificando…" : "Enviar comprobante de prueba"}</button></div>
    <p className={styles.assumption}>Escenario controlado: clave clásica comprometida y receptor modificado. Solo datos sintéticos.</p>
    <dl className={styles.context}>
      <div><dt>Amenaza cuántica</dt><dd>Shor · variante de logaritmo discreto para Ed25519. No se ejecuta aquí contra esa clave.</dd></div>
      <div><dt>Prueba ejecutada</dt><dd>Falsificación del receptor con la clave Ed25519 de laboratorio.</dd></div>
      <div><dt>Defensa evaluada</dt><dd>{escudo ? "Ed25519 + ML-DSA-65: deben verificar ambas." : "Ed25519: se acepta únicamente la firma clásica."}</dd></div>
    </dl>
    {prueba && <div className={styles.target}>
      <p>Objetivo aleatorio · Ed25519, clave pública de {prueba.parametros.ed25519.clavePublicaBytes} bytes</p>
      <p>Huella SHA-256: <code>{huella}</code></p>
      <button type="button" disabled={ocupado} onClick={() => jugar(true)}>Generar otra clave y probar</button>
    </div>}
    <div className={styles.world} data-state={estado} data-shield={escudo} data-accepted={aceptado} aria-hidden="true" onAnimationEnd={(event) => {
      if (event.target !== event.currentTarget) return;
      setEstado("completado"); locked.current = false;
    }}>
      <div className={styles.road} />
      <span className={styles.start}>Comprobante de prueba</span><span className={styles.finish}>Verificador</span>
      <div className={styles.copy}><span>!</span></div>
      <div className={styles.shield}><svg viewBox="0 0 48 56" fill="none"><path d="M24 3 43 11v17c0 11-9 20-19 25C14 48 5 39 5 28V11L24 3Z" fill="currentColor" /><path d="m15 27 6 6 12-14" stroke="var(--crema)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <span className={styles.blocked}>{prueba ? aceptado ? "Falsificación aceptada" : "Falsificación rechazada" : ""}</span>
    </div>
    <figcaption className={styles.caption} aria-live="polite">{error || (estado === "completado" ? aceptado ? "La firma clásica permite esta falsificación al disponer de su clave privada." : "La firma ML-DSA-65 no coincide: el verificador híbrido la rechaza." : "La animación reproduce verificaciones reales; no es un ataque cuántico ni un pago.")}</figcaption>
    {prueba && <details className={styles.evidence}><summary>Ver resultado calculado</summary><pre>{JSON.stringify({ referencia: prueba.original.payload.id, rol, huellaSha256: huella, parametrosReales: prueba.parametros, amenaza: "Shor (hipótesis futura, no ejecutada contra Ed25519)", prueba: "Clave clásica concedida y receptor sustituido", originalValido: prueba.originalVerificado, clasicaAlteradaValida: prueba.clasicaAceptaAlteracion, mlDsa65AlteradaValida: prueba.pqcAceptaAlteracion, politica: escudo ? "Ed25519 Y ML-DSA-65" : "Solo Ed25519", falsificacionAceptada: aceptado }, null, 2)}</pre></details>}
  </figure>;
}
