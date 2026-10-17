"use client";

import { useRef, useState } from "react";
import { demostrarCanalPqc, type ResultadoCanalPqc } from "@/payments/pqcChannelDemo";
import styles from "./canal-pqc-demo.module.css";

/** Cambia únicamente la vista del laboratorio; nunca la política de cobro. */
export function CanalPqcDemo() {
  const [shield, setShield] = useState(true);
  const [result, setResult] = useState<ResultadoCanalPqc>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState(0);
  const lock = useRef(false);

  async function test(fresh = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError("");
    try {
      if (!result || fresh) setResult(await demostrarCanalPqc());
      setRun((value) => value + 1);
    } catch {
      setError("No se pudo ejecutar WebCrypto. Abre el laboratorio en HTTPS o en localhost y vuelve a intentarlo.");
    } finally { setBusy(false); lock.current = false; }
  }

  const evidence = shield ? result?.pqc : result?.clasico;
  return <section className={styles.lab} aria-labelledby="canal-demo-titulo">
    <div className={styles.heading}><h2 id="canal-demo-titulo">Un mensaje, dos canales</h2>
      <button type="button" role="switch" aria-checked={shield} disabled={busy} onClick={() => setShield((value) => !value)} className={styles.toggle}>
        <span className={styles.switch} aria-hidden="true"><span /></span>Escudo de canal PQC
      </button>
    </div>
    <p className={styles.description}>{shield ? "ML-KEM-768 protege el secreto del canal de aplicación." : "ECDH P-256 establece un canal clásico cifrado."} Ambos usan AES-256-GCM.</p>
    <div key={`${run}-${shield}`} className={styles.route} data-tested={Boolean(evidence)} data-pqc={shield} aria-hidden="true">
      <div className={styles.track} />
      <span className={styles.endpoint}>Navegador</span><span className={styles.endpoint}>Pasarela</span>
      <div className={styles.packet}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></div>
      <span className={styles.capture}>Captura cifrada</span>
      <span className={styles.algorithm}>{shield ? "ML-KEM-768" : "ECDH P-256"}</span>
    </div>
    <div className={styles.actions}>
      <button type="button" className="btn btn-bosque" disabled={busy} onClick={() => void test()}>{busy ? "Comprobando criptografía…" : result ? "Repetir recorrido" : "Probar canal"}</button>
      {result && <button type="button" disabled={busy} className={styles.secondary} onClick={() => void test(true)}>Generar otras claves</button>}
    </div>
    <div aria-live="polite" className={styles.result}>
      {error && <p role="alert">{error}</p>}
      {evidence && <>
        <p className={styles.measured}>Medido: ida y vuelta {evidence.idaVueltaVerificada ? "verificadas" : "fallidas"} · alteraciones de solicitud y respuesta {evidence.alteracionRechazada && evidence.alteracionRespuestaRechazada ? "rechazadas" : "aceptadas: resultado inesperado"}.</p>
        <p><strong>Supuesto: un atacante obtiene la clave ECDH de esta prueba.</strong> {shield ? result?.compromisoModelado.claveClasicaAbrePqc ? "Esa clave abrió el mensaje PQC: resultado inesperado." : "Esa clave clásica no abre el mensaje PQC." : result?.compromisoModelado.clasicoPuedeLeer ? "Puede descifrar la captura clásica guardada." : "No pudo abrir la captura: resultado inesperado."}</p>
        <p className={styles.reference}>Mismo mensaje al cambiar el escudo · referencia <code>{result?.documento.id}</code></p>
      </>}
    </div>
    <p className={styles.note}>Laboratorio local con claves nuevas y datos sintéticos. No cambia la seguridad de tus pagos ni mueve dinero.</p>
    <details className={styles.details}>
      <summary>Qué demuestra y qué no demuestra</summary>
      <p>Ejecutamos ECDH y el mismo canal ML-KEM usado por la pasarela, ciframos en ambas direcciones y alteramos un bit. Las dos partes se simulan en este navegador; esta animación no mide tráfico de red.</p>
      <p>Shor amenaza RSA y ECDH en un futuro con computadoras cuánticas suficientes. Aquí concedemos deliberadamente una clave ECDH efímera propia; no ejecutamos ese ataque. Probar una clave ajena y recibir un rechazo no demuestra por sí solo la resistencia cuántica de ML-KEM.</p>
      <p>HTTPS protege hoy. El riesgo de guardar tráfico para descifrarlo después depende del intercambio de claves y del tiempo de confidencialidad requerido, no solo de decir “TLS 1.2”. La capa PQC de la app complementa HTTPS y termina en la pasarela; no convierte todo Open Payments en un canal PQC.</p>
      {result && <><p>Huella SHA-256 de la clave pública ML-KEM: <code className={styles.fingerprint}>{result.huellaClavePqc}</code></p><pre>{JSON.stringify({ parametros: result.parametros, clasico: { idaVueltaVerificada: result.clasico.idaVueltaVerificada, alteracionSolicitudRechazada: result.clasico.alteracionRechazada, alteracionRespuestaRechazada: result.clasico.alteracionRespuestaRechazada }, pqc: { idaVueltaVerificada: result.pqc.idaVueltaVerificada, alteracionSolicitudRechazada: result.pqc.alteracionRechazada, alteracionRespuestaRechazada: result.pqc.alteracionRespuestaRechazada }, compromisoModelado: result.compromisoModelado }, null, 2)}</pre></>}
    </details>
  </section>;
}
