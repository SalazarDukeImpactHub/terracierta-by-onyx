import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAuthenticatedClient, OpenPaymentsClientError, isFinalizedGrantWithAccessToken, isPendingGrant, type AuthenticatedClient, type OutgoingPayment, type GrantWithAccessToken, type PendingGrant } from "@interledger/open-payments";
import { limiteCobro, assertOfficialRail, assertExecutionEnabled, PaymentError, type ChargeInput, type Settlement, type WalletAmount } from "./settlement";

/** La demo solo descubre recursos en la testnet oficial; no acepta destinos de red arbitrarios. */
export function testnetUrl(value: string): string {
  const url = new URL(value.startsWith("$") ? `https://${value.slice(1)}` : value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".interledger-test.dev") || url.port || url.username || url.password || url.hash) throw new PaymentError("La wallet o el recurso no pertenece a la testnet permitida.", 400);
  return url.href;
}

export function limiteDebitoSdk(): number {
  const value = Number(process.env.OPEN_PAYMENTS_MAX_DEBIT ?? "0.05");
  return Number.isFinite(value) && value > 0 ? value : 0.05;
}

export function paymentOrigin(): string {
  const url = new URL(process.env.OPEN_PAYMENTS_REDIRECT_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3100");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) throw new PaymentError("Configura un origen HTTPS o loopback para el retorno.", 503);
  return url.origin;
}

export function verifyInteractionHash(values: { clientNonce: string; serverNonce: string; interactRef: string; authServer: string }, received: string): boolean {
  // Rafiki devuelve SHA-256 en Base64 con '='; el vector de Open Payments usa
  // Base64URL sin relleno. Solo cambia la representación de los mismos 32 bytes.
  if (!/^[A-Za-z0-9+/]{43}=?$/.test(received) && !/^[A-Za-z0-9_-]{43}$/.test(received)) return false;
  const canonical = received.replace(/\+/g, "-").replace(/\//g, "_").replace(/=$/, "");
  const actual = Buffer.from(canonical, "base64url");
  // Buffer tolera entradas no canónicas; rechazamos bits de relleno alterados.
  if (actual.length !== 32 || actual.toString("base64url") !== canonical) return false;
  const expected = createHash("sha256").update([values.clientNonce, values.serverNonce, values.interactRef, values.authServer].join("\n"), "utf8").digest();
  return timingSafeEqual(expected, actual);
}

function units(amount: number, scale: number): string {
  const value = amount * 10 ** scale;
  const rounded = Math.round(value);
  if (!Number.isSafeInteger(rounded) || rounded <= 0 || Math.abs(value - rounded) > 0.000001) throw new PaymentError("El monto no se puede representar en la moneda de esta wallet.", 400);
  return String(rounded);
}

function assertMerchantAmount(actual: WalletAmount | undefined | null, expected: WalletAmount) {
  if (!actual || actual.value !== expected.value || actual.assetCode !== expected.assetCode || actual.assetScale !== expected.assetScale) throw new PaymentError("El importe para el vendedor no coincide con el solicitado. No se confirma este pago.");
}

export function createOpenPaymentsRail(client: AuthenticatedClient, senderUrl: string) {
  return {
    async prepare(input: ChargeInput) {
      if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > limiteCobro()) throw new PaymentError("El monto supera el límite de la demo.", 400);
      const sender = await client.walletAddress.get({ url: testnetUrl(senderUrl) });
      const receiver = await client.walletAddress.get({ url: testnetUrl(input.receiver) });
      if (input.expectedReceiveAssetCode && receiver.assetCode !== input.expectedReceiveAssetCode) throw new PaymentError("La moneda de la wallet receptora no corresponde a la moneda del pedido. Se requiere conversión explícita.", 400);
      for (const wallet of [sender, receiver]) {
        testnetUrl(wallet.id); testnetUrl(wallet.authServer); testnetUrl(wallet.resourceServer);
      }
      const incomingGrant = await client.grant.request({ url: receiver.authServer }, { access_token: { access: [{ type: "incoming-payment", actions: ["create", "read"], identifier: receiver.id }] } });
      if (!isFinalizedGrantWithAccessToken(incomingGrant)) throw new PaymentError("La wallet no concedió permiso para crear el cobro.");
      const incomingAccessToken = incomingGrant.access_token.value;
      const requestedReceive = { value: units(input.amount, receiver.assetScale), assetCode: receiver.assetCode, assetScale: receiver.assetScale };
      const incoming = await client.incomingPayment.create({ url: receiver.resourceServer, accessToken: incomingAccessToken }, {
        walletAddress: receiver.id,
        incomingAmount: requestedReceive,
        expiresAt: new Date(Date.now() + 10 * 60000).toISOString(), metadata: { description: input.description },
      });
      testnetUrl(incoming.id);
      assertMerchantAmount(incoming.incomingAmount, requestedReceive);
      const quoteGrant = await client.grant.request({ url: sender.authServer }, { access_token: { access: [{ type: "quote", actions: ["create"] }] } });
      if (!isFinalizedGrantWithAccessToken(quoteGrant)) throw new PaymentError("La wallet no concedió permiso para cotizar.");
      // El SDK fija explícitamente el importe recibido; no utiliza el endpoint de la API web.
      const quote = await client.quote.create({ url: sender.resourceServer, accessToken: quoteGrant.access_token.value }, { walletAddress: sender.id, receiver: incoming.id, method: "ilp", receiveAmount: requestedReceive });
      testnetUrl(quote.id);
      assertMerchantAmount(quote.receiveAmount, requestedReceive);
      const debit = quote.debitAmount;
      if (debit.assetCode !== sender.assetCode || debit.assetScale !== sender.assetScale || !/^\d+$/.test(debit.value) || BigInt(debit.value) <= BigInt(0) || BigInt(debit.value) > BigInt(units(limiteDebitoSdk(), sender.assetScale))) throw new PaymentError("El débito cotizado supera OPEN_PAYMENTS_MAX_DEBIT. Revisa el importe y el límite de la demo.");
      if (quote.expiresAt && Date.parse(quote.expiresAt) <= Date.now()) throw new PaymentError("La cotización ya venció.", 409);
      const result: Settlement = { rail: "open-payments", estado: "pendiente", quoteId: quote.id, debitAmount: { ...debit }, receiveAmount: { ...quote.receiveAmount }, debitAssetCode: debit.assetCode, outgoingId: null, isReceive: true, simulado: false, evidencia: null };
      let pending: PendingGrant | undefined;
      let grant: GrantWithAccessToken | undefined;
      let nonce = "";
      let ref = "";
      let sent = false;
      let outgoing: OutgoingPayment | undefined;
      let cleared = false;
      function fresh() {
        if (cleared || (quote.expiresAt && Date.parse(quote.expiresAt) <= Date.now())) throw new PaymentError("La cotización venció; crea una nueva sin repetir pagos ya enviados.", 409);
      }
      async function state(): Promise<Settlement> {
        if (!outgoing) return result;
        if (outgoing.failed) throw new PaymentError("La wallet informó un pago fallido. Revisa los movimientos antes de volver a pagar.");
        assertMerchantAmount(outgoing.receiveAmount, requestedReceive);
        if (outgoing.debitAmount.value !== debit.value || outgoing.debitAmount.assetCode !== debit.assetCode || outgoing.debitAmount.assetScale !== debit.assetScale) throw new PaymentError("El pago no coincide con el débito autorizado.");
        const received = await client.incomingPayment.get({ url: incoming.id, accessToken: incomingAccessToken });
        assertMerchantAmount(received.incomingAmount, requestedReceive);
        const delivered = received.completed && received.receivedAmount.assetCode === receiver.assetCode && received.receivedAmount.assetScale === receiver.assetScale && BigInt(received.receivedAmount.value) >= BigInt(requestedReceive.value);
        // sentAmount excluye costos; no debe compararse por igualdad con el débito total.
        // La recepción completa del incoming es la evidencia final, junto con envío positivo y sin fallo.
        const sent = outgoing.sentAmount.assetCode === debit.assetCode && outgoing.sentAmount.assetScale === debit.assetScale && BigInt(outgoing.sentAmount.value) > BigInt(0) && BigInt(outgoing.sentAmount.value) <= BigInt(debit.value);
        return { ...result, outgoingId: outgoing.id, estado: sent && delivered ? "completado" : "pendiente", evidencia: sent && delivered ? "envio-y-recepcion-sdk" : null };
      }
      return {
        quote: result,
        expiresAt: quote.expiresAt,
        clear() { cleared = true; pending = undefined; grant = undefined; ref = ""; },
        async authorize(callback: string) {
          assertExecutionEnabled();
          fresh();
          if (pending || sent) throw new PaymentError("La autorización ya fue iniciada.", 409);
          nonce = randomBytes(32).toString("base64url");
          const response = await client.grant.request({ url: sender.authServer }, {
            access_token: { access: [{ type: "outgoing-payment", actions: ["create", "read"], identifier: sender.id, limits: { debitAmount: debit, receiver: incoming.id } }] },
            interact: { start: ["redirect"], finish: { method: "redirect", uri: callback, nonce } },
          });
          if (!isPendingGrant(response)) throw new PaymentError("Se requiere consentimiento interactivo de la wallet.");
          testnetUrl(response.continue.uri);
          pending = response;
          return { redirectUrl: testnetUrl(response.interact.redirect) };
        },
        async authorizeReturn(interactRef: string, hash: string) {
          fresh();
          if (!pending || ref || !interactRef || interactRef.length > 512 || !verifyInteractionHash({ clientNonce: nonce, serverNonce: pending.interact.finish, interactRef, authServer: sender.authServer }, hash)) throw new PaymentError("El retorno de autorización no es válido.", 403);
          ref = interactRef;
        },
        async confirm(): Promise<Settlement> {
          assertExecutionEnabled();
          fresh();
          if (!pending || !ref || sent) throw new PaymentError("Falta autorización verificada o el pago ya fue enviado.", 409);
          sent = true;
          const continued = await client.grant.continue({ url: pending.continue.uri, accessToken: pending.continue.access_token.value }, { interact_ref: ref });
          if (!isFinalizedGrantWithAccessToken(continued)) throw new PaymentError("La wallet no confirmó la autorización del pago.", 403);
          grant = continued;
          outgoing = await client.outgoingPayment.create({ url: sender.resourceServer, accessToken: grant.access_token.value }, { walletAddress: sender.id, quoteId: quote.id, metadata: { description: input.description } });
          testnetUrl(outgoing.id);
          try { return await state(); }
          catch (error) {
            if (error instanceof PaymentError) throw error;
            // Un fallo al observar la recepción no deshace el outgoing ya creado.
            return { ...result, outgoingId: outgoing.id, estado: "pendiente" };
          }
        },
        async poll(): Promise<Settlement> {
          if (cleared || !outgoing || !grant) throw new PaymentError("No hay un pago autorizado para consultar.", 409);
          outgoing = await client.outgoingPayment.get({ url: outgoing.id, accessToken: grant.access_token.value });
          try { return await state(); }
          catch (error) {
            if (error instanceof PaymentError) throw error;
            // Un fallo al observar la recepción no deshace el outgoing ya creado.
            return { ...result, outgoingId: outgoing.id, estado: "pendiente" };
          }
        },
      };
    },
  };
}

export async function prepararOpenPayment(input: ChargeInput, payerWallet?: string) {
  assertOfficialRail();
  const wallet = process.env.OPEN_PAYMENTS_CLIENT_WALLET?.trim();
  const keyId = process.env.OPEN_PAYMENTS_KEY_ID?.trim();
  const privateKey = process.env.OPEN_PAYMENTS_PRIVATE_KEY_PATH?.trim() || process.env.OPEN_PAYMENTS_PRIVATE_KEY;
  if (!wallet || !keyId || !privateKey) throw new PaymentError("Configura la wallet de cliente, el key ID y la llave privada del SDK en el servidor.", 503);
  try {
    const client = await createAuthenticatedClient({ walletAddressUrl: testnetUrl(wallet), keyId, privateKey, requestTimeoutMs: 15000, logLevel: "silent", validateResponses: true });
    // La wallet cliente identifica a TerraCierta; la wallet pagadora proviene del
    // perfil validado por checkout y su titular debe otorgar consentimiento GNAP.
    return await createOpenPaymentsRail(client, payerWallet ?? (process.env.OPEN_PAYMENTS_SENDER_WALLET?.trim() || wallet)).prepare(input);
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    if (process.env.NODE_ENV === "development") console.warn("[TerraCierta SDK] preparación fallida", {
      clase: error instanceof Error ? error.name : "Error",
      estado: error instanceof OpenPaymentsClientError ? error.status : undefined,
      codigo: error instanceof OpenPaymentsClientError ? error.code : (error as NodeJS.ErrnoException)?.code,
      especificacionNoEncontrada: error instanceof Error && /ENOENT|\.yaml/.test(error.message),
      erroresDeEsquema: error instanceof OpenPaymentsClientError ? error.validationErrors : undefined,
    });
    throw new PaymentError("No se pudo preparar el pago con Open Payments. Revisa la configuración del SDK y la wallet.");
  }
}
