"use client";

import { useRef, useState } from "react";
import type { Rol } from "@/adapters/types";
import type { demostrarCompromisoClasico } from "@/payments/pqcQuantumDemo";
import styles from "./pasarela-visual.module.css";

export type DatosShor = { number: number; factors: number[]; order: number; shots: number; totalQubits: number; counts: Record<string, number>; seed: number; generatedAt: string };

export function EscenarioCuantico({ rol, shor }: { rol: Rol; shor: DatosShor }) {
  const locked = useRef(false);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<ReturnType<typeof demostrarCompromisoClasico> | null>(null);
  const [error, setError] = useState("");
  async function simulate() {
    if (locked.current) return;
    locked.current = true; setPhase("running"); setResult(null); setError("");
    try {
      const { demostrarCompromisoClasico } = await import("@/payments/pqcQuantumDemo");
      const proof = demostrarCompromisoClasico(rol);
      if (!proof.originalVerificado || !proof.clasicaAceptaAlteracion || proof.pqcAceptaAlteracion || proof.hibridaAceptaAlteracion) throw new Error("El experimento no produjo el resultado esperado; revisa la evidencia.");
      setResult(proof); setPhase("done");
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo ejecutar la prueba."); setPhase("idle"); }
    finally { locked.current = false; }
  }
  return <section className={styles.quantum} aria-labelledby="quantum-heading">
    <div className={styles.sectionHead}><div><h2 id="quantum-heading">¿Y si la firma clásica dejara de bastar?</h2><p>Un escenario futuro. Dos formas de proteger el comprobante.</p></div><button type="button" className="btn btn-bosque" disabled={phase === "running"} onClick={simulate}>{phase === "running" ? "Verificando…" : phase === "done" ? "Repetir demostración" : "Simular escenario"}</button></div>
    <div className={styles.comparison} data-phase={phase} aria-live="polite">
      <div className={styles.path} data-outcome={result?.clasicaAceptaAlteracion ? "unsafe" : "idle"}>
        <p className={styles.pathTitle}>Solo firma clásica</p>
        <div className={styles.paperStage} aria-hidden="true"><div className={styles.paper}><span /><span /><span /><b>Ed25519</b></div><div className={styles.ray} /><div className={styles.stamp}>{result ? "PASA" : "1 firma"}</div></div>
        <p className={styles.outcome}>{result ? "La falsificación pasa" : "Confía en una sola firma"}</p>
      </div>
      <div className={styles.path} data-outcome={result && !result.hibridaAceptaAlteracion ? "safe" : "idle"}>
        <p className={styles.pathTitle}>Con firma postcuántica</p>
        <div className={styles.paperStage} aria-hidden="true"><div className={`${styles.paper} ${styles.backPaper}`} /><div className={styles.paper}><span /><span /><span /><b>Ed25519 + ML-DSA</b></div><div className={styles.ray} /><div className={styles.stamp}>{result ? "BLOQUEADA" : "2 firmas"}</div></div>
        <p className={styles.outcome}>{result ? "La falsificación se rechaza" : "Exige las dos firmas válidas"}</p>
      </div>
    </div>
    {error && <p role="alert" className="text-cereza">{error}</p>}
    <p className={styles.disclaimer}>Simulación de clave clásica comprometida; verificación criptográfica real. No ejecuta un ataque cuántico contra la app.</p>
    <details className={styles.evidence}><summary>Ver el experimento de Shor y la evidencia</summary>
      <div className={styles.shorHead}><h3>Shor en Python · Qiskit</h3><strong>{shor.number} = {shor.factors.join(" × ")}</strong></div>
      <p>Mediciones de una ejecución local: {shor.totalQubits} qubits, {shor.shots.toLocaleString("es-CO")} shots, período {shor.order}. No es hardware cuántico.</p>
      <div className={styles.histogram} role="img" aria-label={`Resultados medidos por Qiskit: ${Object.entries(shor.counts).map(([bits, n]) => `${bits}: ${n}`).join(", ")}`}>
        {Object.entries(shor.counts).map(([bits, n]) => <div key={bits}><span>{n}</span><div style={{ height: `${n / Math.max(...Object.values(shor.counts)) * 76}px` }} /><code>{bits}</code></div>)}
      </div>
      <p>Factorizar este número ilustra el problema de RSA. Ed25519 usa logaritmo discreto, también amenazado por Shor; este circuito no lo ataca. ML-DSA usa retículas y no se evalúa con esta factorización.</p>
      <p>En la comparación se genera un documento sintético y se concede únicamente su clave Ed25519 de prueba al atacante. Modificamos el receptor y volvemos a firmar con esa clave; el verificador real rechaza la firma ML-DSA conservada. Las claves públicas se fijan antes del intento.</p>
      <p>Riesgo R06: integridad de comprobantes a largo plazo. La simulación no prueba resistencia absoluta, custodia histórica ni seguridad de todo Interledger.</p>
      {result && <pre className={styles.proof}>{JSON.stringify({ referencia: result.original.payload.id, rol: result.original.payload.rol, original: result.originalVerificado, ed25519Alterada: result.clasicaAceptaAlteracion, mlDsa65Alterada: result.pqcAceptaAlteracion, aceptacionHibrida: result.hibridaAceptaAlteracion }, null, 2)}</pre>}
      <p><a href="https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm" target="_blank" rel="noreferrer">Tutorial IBM</a> · <a href="/pqc/shor-demo.json" target="_blank" rel="noreferrer">Mediciones y procedencia</a> · <a href="https://csrc.nist.gov/pubs/fips/204/final" target="_blank" rel="noreferrer">FIPS 204</a></p>
    </details>
  </section>;
}
