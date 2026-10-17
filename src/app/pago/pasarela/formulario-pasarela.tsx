"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { conectarCanal, cotizarCobro, confirmarCobro, type ChargeResult, type PreparedResult, type Mode } from "@/payments/gatewayClient";
import type { PublicBundle } from "@/payments/pqc/channel";
import type { WalletAmount } from "@/payments/settlement";
import { quotedDifference } from "@/payments/amounts";
import { ViajePago, type FaseViaje } from "./viaje-pago";
import { authorizationStorageKey as storageKey, readSavedAuthorization, saveAuthorization, type SavedAuthorization } from "@/payments/savedAuthorization";

const defaultReceiver = "$ilp.interledger-test.dev/921a6da8";
const defaultDescription = "Compra de café TerraCierta";
function needsWalletReview(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return ["CONFIRMATION_UNAVAILABLE", "SESSION_EXPIRED", "PAYMENT_NOT_SENT", "INVALID_PHASE"].includes(String(code))
    || (error instanceof Error && /guardar el estado/.test(error.message));
}
function mostrarImporte(amount: WalletAmount) {
  return `${new Intl.NumberFormat("es-CO", { minimumFractionDigits: amount.assetScale ?? 2, maximumFractionDigits: amount.assetScale ?? 2 }).format(Number(amount.value) / 10 ** (amount.assetScale ?? 0))} ${amount.assetCode}`;
}

export function FormularioPasarela({ maxAmount, maxDebit, simulado, compacto = false }: { maxAmount: number; maxDebit: number; simulado: boolean; compacto?: boolean }) {
  const [bundle, setBundle] = useState<PublicBundle | null>(null);
  const [channelError, setChannelError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<Mode>("protegido");
  const [amount, setAmount] = useState(String(Math.min(0.05, maxAmount)));
  const [receiver, setReceiver] = useState(defaultReceiver);
  const [description, setDescription] = useState(defaultDescription);
  const [sending, setSending] = useState(true);
  const [started, setStarted] = useState(false);
  const [expired, setExpired] = useState(false);
  const [prepared, setPrepared] = useState<PreparedResult | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ChargeResult | null>(null);
  const [reviewRequired, setReviewRequired] = useState(false);
  const [walletReviewed, setWalletReviewed] = useState(false);
  const locked = useRef(false);
  const connection = useRef<Promise<PublicBundle> | null>(null);
  const resumption = useRef<Promise<ChargeResult> | null>(null);

  useEffect(() => {
    let active = true;
    connection.current ??= conectarCanal();
    connection.current.then(async (key) => {
      if (!active) return;
      setBundle(key);
      let saved: SavedAuthorization | null = null;
      let blocked = false;
      const authorizationId = new URLSearchParams(window.location.search).get("autorizacion");
      try {
        saved = readSavedAuthorization(sessionStorage);
        if (saved || authorizationId) setStarted(true);
        if (saved) {
          setPrepared(saved.prepared); setMode(saved.mode);
          setAmount(String(saved.prepared.amount)); setReceiver(saved.prepared.receiver); setDescription(saved.prepared.description);
        }
        if (authorizationId && saved?.authorizationId !== authorizationId) throw new Error("No encontramos este pago en este navegador. Vuelve al navegador donde lo iniciaste y revisa tu wallet.");
        if (saved && (!saved.phase || saved.phase === "awaiting")) {
          if (Date.parse(saved.prepared.expiresAt) <= Date.now()) throw new Error("La cotización de esta autorización venció. No se intentará enviar el pago. Revisa tu wallet antes de iniciar otro.");
          if (!authorizationId) throw new Error("Tienes una autorización pendiente. Regresa desde la wallet donde la iniciaste o revisa su estado antes de iniciar otro pago.");
        }
      } catch (err) {
        blocked = true; setStarted(true); setReviewRequired(true);
        setError(err instanceof Error ? err.message : "No pudimos recuperar tu pago. Revisa tu wallet.");
      }
      try {
        if (blocked || !saved) return;
        const attempt = saved;
        // Solo el primer retorno verificado puede finalizar. Guardar ANTES del POST
        // evita repetir un envío al recargar, cambiar de vista o perder la respuesta.
        resumption.current ??= (async () => {
          const action = attempt.phase === "sent" || attempt.phase === "finalizing" ? "consultar" : "finalizar";
          if (action === "finalizar") saveAuthorization(sessionStorage, { ...attempt, phase: "finalizing" });
          const payment = await confirmarCobro(attempt.prepared, attempt.mode, key, action);
          if (payment.estado === "completado") sessionStorage.removeItem(storageKey);
          else saveAuthorization(sessionStorage, { ...attempt, phase: "sent" });
          return payment;
        })();
        const payment = await resumption.current;
        if (active) {
          setResult(payment);
          if (payment.estado === "completado") window.history.replaceState(null, "", "/pago/pasarela");
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No pudimos confirmar tu pago. Revisa tu wallet antes de repetirlo.");
          if (needsWalletReview(err)) setReviewRequired(true);
        }
      }
      finally { if (active) setSending(false); }
    }).catch((err: unknown) => {
      if (active) { setChannelError(err instanceof Error ? err.message : "No pudimos establecer una conexión segura."); setSending(false); }
    });
    return () => { active = false; };
  }, [attempt, maxAmount]);

  useEffect(() => {
    if (!prepared || started) return;
    const timeout = window.setTimeout(() => setExpired(true), Math.max(0, Date.parse(prepared.expiresAt) - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [prepared, started]);

  function invalidate() { setPrepared(null); setResult(null); setStarted(false); setExpired(false); setError(""); }
  function reconectar() { setChannelError(""); setBundle(null); setSending(true); connection.current = null; setAttempt((value) => value + 1); }

  async function cotizar(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (locked.current || started || reviewRequired) return;
    locked.current = true; setSending(true); invalidate();
    try { setPrepared(await cotizarCobro({ amount: Number(amount), receiver: receiver.trim(), description: description.trim() }, mode, bundle)); }
    catch (err) { setError(err instanceof Error ? err.message : "No pudimos calcular el total. Intenta de nuevo."); }
    finally { setSending(false); locked.current = false; }
  }

  async function confirmar(action: "confirmar" | "consultar" = "confirmar") {
    if (locked.current || !prepared || (action === "confirmar" && (started || Date.parse(prepared.expiresAt) <= Date.now()))) return;
    locked.current = true; setSending(true); setError("");
    if (action === "confirmar") setStarted(true);
    try {
      const payment = await confirmarCobro(prepared, mode, bundle, action);
      if (payment.redirectUrl && payment.authorizationId) {
        const redirect = new URL(payment.redirectUrl);
        if (redirect.protocol !== "https:" || !redirect.hostname.endsWith(".interledger-test.dev")) throw new Error("El destino de autorización no es válido.");
        saveAuthorization(sessionStorage, { prepared, mode, authorizationId: payment.authorizationId, phase: "awaiting" });
        window.location.assign(redirect.href);
        return;
      }
      setResult(payment);
      if (payment.estado === "completado") { sessionStorage.removeItem(storageKey); window.history.replaceState(null, "", "/pago/pasarela"); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos confirmar el pago. Revisa tu billetera antes de repetirlo.");
      if (needsWalletReview(err)) setReviewRequired(true);
    }
    finally { setSending(false); locked.current = false; }
  }

  const summary = result ?? prepared;
  const additional = summary ? quotedDifference(summary.debitAmount, summary.receiveAmount) : null;
  const completed = result?.estado === "completado";
  const pending = started && !completed;
  const fase: FaseViaje = completed ? "completado" : error ? "incierto" : result?.estado === "pendiente" ? "pendiente" : started ? "autorizacion" : prepared ? "cotizado" : sending ? "preparando" : "listo";

  return (
    <>
      <div className="mt-8 border-y border-linea py-6" aria-live="polite" aria-busy={sending}>
        {result ? (
          <div className="mb-6">
            <h2 className="text-3xl">{completed ? "Gracias por tu compra" : "Tu pago está en proceso"}</h2>
            <p className="mt-2 text-apagado">{completed ? result.simulado ? "La prueba se completó sin mover fondos reales." : "El pago se completó. Puedes consultar tu comprobante abajo." : "Estamos comprobando el pago. No necesitas volver a pagar."}</p>
          </div>
        ) : <h2 className="text-2xl">Resumen de tu compra</h2>}

        <div className="mt-5 flex items-baseline justify-between gap-5">
          <p>{summary?.description ?? defaultDescription}</p>
          <span className="shrink-0 text-sm text-apagado">{simulado ? "Simulación" : "Prueba testnet"}</span>
        </div>
        {summary?.receiveAmount && <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt>Para el vendedor</dt><dd className="shrink-0 tabular-nums">{mostrarImporte(summary.receiveAmount)}</dd></div>
          {additional && <div className="flex justify-between gap-4"><dt>Adicional cotizado por la wallet</dt><dd className="shrink-0 tabular-nums">{mostrarImporte(additional)}</dd></div>}
        </dl>}
        <dl className="mt-6 flex items-baseline justify-between gap-4">
          <dt className="text-lg">{completed ? "Total pagado" : "Total a pagar"}</dt>
          <dd className="font-titulo text-4xl tabular-nums">{summary ? mostrarImporte(summary.debitAmount) : <span className="text-xl text-apagado">{sending ? "Calculando…" : "Por calcular"}</span>}</dd>
        </dl>
        {summary && additional && BigInt(additional.value!) > BigInt(0) && <p className="mt-2 text-sm text-apagado">La wallet cotiza este adicional por encima del importe del vendedor. TerraCierta no lo fija ni lo descuenta al vendedor.</p>}
        {summary?.receiveAmount && !additional && <p className="mt-2 text-sm text-apagado">Los importes no permiten calcular un adicional en una misma moneda. Revisa ambas cantidades antes de autorizar.</p>}

        <ViajePago fase={fase} />

        {!completed && !reviewRequired && <div className="mt-7">
          {channelError ? <button type="button" onClick={reconectar} className="btn btn-bosque w-full" disabled={sending}>Reintentar conexión</button>
            : pending ? <button type="button" onClick={() => confirmar("consultar")} className="btn btn-bosque w-full" disabled={sending}>{sending ? "Comprobando pago…" : "Consultar mi pago"}</button>
            : <button type="button" onClick={() => prepared && !expired ? confirmar() : cotizar()} className="btn btn-bosque w-full" disabled={sending || (mode === "protegido" && !bundle) || (!!prepared && !prepared.canConfirm)}>{sending ? "Preparando tu pago…" : expired ? "Actualizar total" : prepared ? `Pagar ${mostrarImporte(prepared.debitAmount)}` : "Ver total para pagar"}</button>}
          <p className="mt-3 text-center text-sm text-apagado">{pending ? "Revisa tu billetera antes de iniciar otro pago." : simulado ? "Esta es una compra de prueba, sin fondos reales." : "Confirmarás el pago en tu billetera."}</p>
        </div>}
        {(error || channelError) && <p role="alert" className="mt-5 text-cereza">{error || channelError}</p>}
        {reviewRequired && <div className="mt-5 border-t border-linea pt-4 text-sm">
          <p>No iniciaremos otro cobro automáticamente. Este navegador no puede confirmar el resultado de este intento.</p>
          <a href="https://wallet.interledger-test.dev/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-cobre-oscuro underline underline-offset-4">Revisar mi wallet</a>
          <details className="mt-4">
            <summary className="cursor-pointer text-apagado">Cerrar la revisión de esta prueba</summary>
            <p className="mt-3 text-apagado">Cerrar esta revisión no cancela ni devuelve un pago. Comprueba primero los movimientos de la wallet para evitar pagar dos veces.</p>
            <label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={walletReviewed} onChange={event => setWalletReviewed(event.target.checked)} className="mt-1 accent-bosque" />Ya revisé y concilié el resultado en mi wallet.</label>
            <button type="button" disabled={!walletReviewed || sending} className="btn btn-borde mt-4" onClick={() => {
              try { sessionStorage.removeItem(storageKey); window.history.replaceState(null, "", "/pago/pasarela"); resumption.current = null; setReviewRequired(false); setWalletReviewed(false); invalidate(); }
              catch { setError("No pudimos cerrar la revisión en este navegador. No inicies otro pago sin revisar tu wallet."); }
            }}>Cerrar revisión</button>
          </details>
        </div>}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        {!compacto && <Link href="/tienda" className="text-cobre-oscuro underline underline-offset-4">Volver a la tienda</Link>}
        {bundle && mode === "protegido" && <span className="inline-flex items-center gap-1.5 text-apagado"><svg aria-hidden="true" width="14" height="16" viewBox="0 0 16 18" fill="none"><path d="M4 7V5a4 4 0 0 1 8 0v2M3 7h10v9H3z" stroke="currentColor" strokeWidth="1.4" /></svg>Pago protegido</span>}
      </div>

      {result && <details className="mt-7 border-t border-linea pt-4">
        <summary className="cursor-pointer text-sm text-cobre-oscuro underline underline-offset-4">Ver comprobante</summary>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="font-semibold">Receptor</dt><dd className="break-all">{result.receiver}</dd></div>
          <div><dt className="font-semibold">Referencia</dt><dd className="break-all">{result.outgoingId ?? result.quoteId}</dd></div>
          <div><dt className="font-semibold">Verificación</dt><dd>{result.reciboVerificado ? "Recibo protegido verificado." : result.estado === "pendiente" ? "La entrega aún está pendiente de confirmación." : "Pago sin recibo post-cuántico."}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-apagado">{result.evidencia === "envio-y-recepcion-sdk" ? "Envío y recepción comprobados con Open Payments." : result.simulado ? "Comprobante de simulación." : "La verificación sigue pendiente."}</p>
        {!compacto && result.reciboPqc && <details className="mt-4"><summary className="cursor-pointer text-sm text-apagado">Datos técnicos del recibo</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(result.reciboPqc, null, 2)}</pre></details>}
      </details>}

      {!compacto && !started && <details className="mt-10 text-sm">
        <summary className="cursor-pointer text-apagado underline underline-offset-4">Ajustes de la demo</summary>
        <form onSubmit={cotizar} className="mt-5 grid gap-4">
          <p className="text-apagado">Datos temporales de prueba: el importe de esta pantalla no es el precio de un pedido. La protección está activada por defecto.</p>
          <fieldset disabled={sending} className="grid min-w-0 gap-4">
            <div><label htmlFor="monto" className="etiqueta">Importe para el vendedor</label><input id="monto" name="amount" type="number" inputMode="decimal" min="0.01" max={maxAmount} step="0.01" required value={amount} onChange={(event) => { setAmount(event.target.value); invalidate(); }} className="campo mt-1" /></div>
            <div><label htmlFor="receptor" className="etiqueta">Billetera del vendedor</label><input id="receptor" name="receiver" type="text" required maxLength={160} spellCheck={false} autoCapitalize="none" value={receiver} onChange={(event) => { setReceiver(event.target.value); invalidate(); }} className="campo mt-1" /></div>
            <div><label htmlFor="descripcion" className="etiqueta">Descripción</label><input id="descripcion" name="description" type="text" required maxLength={120} value={description} onChange={(event) => { setDescription(event.target.value); invalidate(); }} className="campo mt-1" /></div>
            <fieldset className="grid gap-2"><legend className="etiqueta mb-2">Protección del pago</legend>
              <label className="flex items-center gap-2"><input type="radio" name="modo" value="protegido" checked={mode === "protegido"} onChange={() => { setMode("protegido"); invalidate(); }} className="accent-bosque" />Con post-cuántica</label>
              <label className="flex items-center gap-2"><input type="radio" name="modo" value="claro" checked={mode === "claro"} onChange={() => { setMode("claro"); invalidate(); }} className="accent-bosque" />Sin post-cuántica</label>
            </fieldset>
          </fieldset>
          <p className="text-apagado">Límite receptor: {maxAmount}. Límite de débito: {maxDebit}. {bundle ? "Canal ML-KEM-768 y firma ML-DSA-65 verificados." : "Comprobando el canal protegido."} Para comparar ambos modos, filtra «cobrar» en Network.</p>
          {prepared && <p className="break-all text-apagado">Cotización: {prepared.quoteId}</p>}
          <button type="submit" className="btn btn-borde" disabled={sending || (mode === "protegido" && !bundle)}>Actualizar pago</button>
        </form>
      </details>}
    </>
  );
}
