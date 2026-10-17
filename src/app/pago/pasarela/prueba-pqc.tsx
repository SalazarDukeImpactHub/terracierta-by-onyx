"use client";

import { useRef, useState } from "react";
import { comprobarPqc, type PruebaPqc } from "@/payments/pqcProof";

export function PruebaPostcuantica() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PruebaPqc | null>(null);
  const [error, setError] = useState("");
  async function comprobar() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setResult(null);
    try { setResult(await comprobarPqc()); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo completar la comprobación."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <details className="mt-9 border-t border-linea pt-5">
    <summary className="cursor-pointer text-cobre-oscuro underline underline-offset-4">Ver cómo se protege la comunicación</summary>
    <p className="mt-4 text-sm text-apagado">Comprueba el cifrado postcuántico y el rechazo de una alteración con un mensaje de prueba. No crea cotizaciones ni envía dinero.</p>
    <button type="button" className="btn btn-borde mt-4" disabled={busy} onClick={comprobar}>{busy ? "Comprobando…" : "Comprobar protección PQC"}</button>
    <div aria-live="polite" aria-busy={busy}>
      {error && <p role="alert" className="mt-4 text-cereza">{error}</p>}
      {result && <>
        <ul className="mt-5 space-y-2 text-sm text-bosque">
          <li>Solicitud y respuesta cifradas verificadas: ML-KEM-768 + AES-256-GCM.</li>
          <li>Mensaje alterado rechazado por el servidor.</li>
          <li>Firmas del canal verificadas: Ed25519 + ML-DSA-65.</li>
          <li>Datos firmados alterados rechazados por el verificador.</li>
        </ul>
        <dl className="mt-4 space-y-2 break-all text-xs text-apagado">
          <div><dt>Referencia de esta prueba</dt><dd>{result.requestId}</dd></div>
          <div><dt>Contenido cifrado · {result.bytesCifrados} bytes</dt><dd><code>{result.muestraCifrada}…</code></dd></div>
        </dl>
        <p className="mt-4 text-xs text-apagado">Protección del navegador al servidor TerraCierta. La confianza inicial depende del origen y HTTPS. Esta prueba no acredita un pago ni certificación FIPS.</p>
      </>}
    </div>
  </details>;
}
