import { clienteAdmin } from "@/lib/supabase/admin";

const ORIGEN = "https://wallet.interledger-test.dev";

export interface TitularBilletera {
  correo: string;
  nombre: string;
  apellidos: string;
  direccion: string | null;
  necesitaBilletera: boolean;
  necesitaIdentidad: boolean;
  clienteId: string | null;
  tarjetasVisibles: boolean;
}

export interface CuentaBilletera {
  id: string;
  nombre: string;
  moneda: string;
  escala: number;
  saldo: string;
  saldoMenor: string;
  usuarioId: string;
  activoId: string;
  gateHub: string | null;
  creada: string;
  actualizada: string;
  tarjetaId: string | null;
  fondeada: boolean;
  oculta: boolean;
}

export interface LlaveBilletera {
  id: string;
  apodo: string | null;
  creada: string;
  publica: string;
}

export interface DireccionBilletera {
  id: string;
  url: string;
  nombrePublico: string | null;
  cuentaId: string;
  activa: boolean;
  creada: string;
  esTarjeta: boolean | null;
  servidorAuth: string | null;
  servidorRecursos: string | null;
  llaves: LlaveBilletera[];
}

export interface MovimientoBilletera {
  id: string;
  pagoId: string | null;
  descripcion: string | null;
  tipo: string;
  estado: string;
  monto: string;
  moneda: string;
  creado: string;
  contraparte: string | null;
  contraparteUrl: string | null;
  origen: string | null;
  cuenta: string | null;
  vence: string | null;
}

export interface AccesoAutorizacion {
  tipo: string;
  acciones: string;
  receptor: string | null;
  limite: string | null;
}

export interface AutorizacionBilletera {
  id: string;
  cliente: string;
  estado: string;
  motivo: string | null;
  creada: string;
  accesos: AccesoAutorizacion[];
}

export interface TasaBilletera {
  base: string;
  pares: { moneda: string; valor: string }[];
}

export interface InfoBilletera {
  titular: TitularBilletera | null;
  cuentas: CuentaBilletera[];
  direcciones: DireccionBilletera[];
  movimientos: MovimientoBilletera[];
  autorizaciones: AutorizacionBilletera[];
  tarjetas: unknown[];
  tasas: TasaBilletera[];
  error?: string;
}

interface CuentaApi {
  id: string;
  name: string;
  userId: string;
  assetId: string;
  assetCode: string;
  assetScale: number;
  balance: string;
  gateHubWalletId?: string | null;
  createdAt: string;
  updatedAt: string;
  cardId?: string | null;
  isFunded?: boolean;
  isHidden?: boolean;
}

interface DireccionApi {
  id: string;
  url: string;
  publicName: string | null;
  accountId: string;
  active: boolean;
  createdAt: string;
  isCard?: boolean | null;
}

interface LlaveApi {
  id: string;
  nickname?: string | null;
  createdAt: string;
  publicKey: string;
}

interface MovimientoApi {
  id: string;
  paymentId?: string | null;
  description?: string | null;
  type: string;
  status: string;
  value: string;
  assetCode: string;
  assetScale?: number;
  createdAt: string;
  secondParty?: string | null;
  secondPartyWA?: string | null;
  source?: string | null;
  accountName?: string | null;
  expiresAt?: string | null;
}

interface AccesoApi {
  type?: string;
  actions?: string[];
  limits?: {
    receiver?: string | null;
    debitAmount?: { value?: string; assetCode?: string; assetScale?: number } | null;
  } | null;
}

interface GrantApi {
  id: string;
  client: string;
  state: string;
  finalizationReason?: string | null;
  createdAt: string;
  access?: AccesoApi[];
}

function api(): string {
  return process.env.INTERLEDGER_API_URL || "https://api-wallet.interledger-test.dev";
}

function cookieDe(token: string): string {
  return token.includes("=") ? token : `testnet.cookie=${token}`;
}

export function saldo(balance: string, escala: number, moneda: string): string {
  const valor = Number(balance) / 10 ** escala;
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda }).format(valor);
  } catch {
    return `${valor.toLocaleString("es-CO")} ${moneda}`;
  }
}

export function fecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fechaValor = new Date(iso);
  if (Number.isNaN(fechaValor.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(fechaValor);
}

async function entrarBilletera(): Promise<string | null> {
  const email = process.env.INTERLEDGER_EMAIL;
  const password = process.env.INTERLEDGER_PASSWORD;
  if (!email || !password) return null;
  const respuesta = await fetch(`${api()}/login`, {
    method: "POST",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: ORIGEN,
      referer: `${ORIGEN}/`,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!respuesta.ok) return null;
  const cookie = respuesta.headers.getSetCookie?.().find((c) => c.startsWith("testnet.cookie="));
  return cookie?.split(";")[0] ?? null;
}

async function pedir(cookie: string, ruta: string, init?: RequestInit): Promise<{ status: number; cuerpo: unknown }> {
  const respuesta = await fetch(`${api()}${ruta}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      cookie,
      origin: ORIGEN,
      referer: `${ORIGEN}/`,
      ...(init?.headers ?? {}),
    },
  });
  const texto = await respuesta.text();
  try {
    return { status: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
  } catch {
    return { status: respuesta.status, cuerpo: null };
  }
}

function resultado<T>(cuerpo: unknown): T | null {
  if (!cuerpo || typeof cuerpo !== "object" || !("result" in cuerpo)) return null;
  return (cuerpo as { result: T }).result;
}

function mapearCuenta(cuenta: CuentaApi): CuentaBilletera {
  return {
    id: cuenta.id,
    nombre: cuenta.name,
    moneda: cuenta.assetCode,
    escala: cuenta.assetScale,
    saldo: saldo(cuenta.balance, cuenta.assetScale, cuenta.assetCode),
    saldoMenor: cuenta.balance,
    usuarioId: cuenta.userId,
    activoId: cuenta.assetId,
    gateHub: cuenta.gateHubWalletId ?? null,
    creada: cuenta.createdAt,
    actualizada: cuenta.updatedAt,
    tarjetaId: cuenta.cardId ?? null,
    fondeada: Boolean(cuenta.isFunded),
    oculta: Boolean(cuenta.isHidden),
  };
}

function mapearMovimiento(item: MovimientoApi, escalaPorMoneda: Map<string, number>): MovimientoBilletera {
  const escala = item.assetScale ?? escalaPorMoneda.get(item.assetCode) ?? 2;
  return {
    id: item.id,
    pagoId: item.paymentId ?? null,
    descripcion: item.description ?? null,
    tipo: item.type,
    estado: item.status,
    monto: saldo(item.value, escala, item.assetCode),
    moneda: item.assetCode,
    creado: item.createdAt,
    contraparte: item.secondParty ?? null,
    contraparteUrl: item.secondPartyWA ?? null,
    origen: item.source ?? null,
    cuenta: item.accountName ?? null,
    vence: item.expiresAt ?? null,
  };
}

function mapearGrant(grant: GrantApi): AutorizacionBilletera {
  return {
    id: grant.id,
    cliente: grant.client,
    estado: grant.state,
    motivo: grant.finalizationReason ?? null,
    creada: grant.createdAt,
    accesos: (grant.access ?? []).map((acceso) => {
      const debito = acceso.limits?.debitAmount;
      return {
        tipo: acceso.type ?? "acceso",
        acciones: (acceso.actions ?? []).join(", "),
        receptor: acceso.limits?.receiver ?? null,
        limite: debito?.value
          ? saldo(debito.value, debito.assetScale ?? 2, debito.assetCode ?? "")
          : null,
      };
    }),
  };
}

async function documentoPublico(url: string): Promise<{ auth: string | null; recursos: string | null }> {
  try {
    const respuesta = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!respuesta.ok) return { auth: null, recursos: null };
    const cuerpo = (await respuesta.json()) as { authServer?: string; resourceServer?: string };
    return { auth: cuerpo.authServer ?? null, recursos: cuerpo.resourceServer ?? null };
  } catch {
    return { auth: null, recursos: null };
  }
}

async function leerTodo(cookie: string): Promise<InfoBilletera | null> {
  const [perfil, cuentasRes, direccionesRes, grantsRes, tarjetasRes] = await Promise.all([
    pedir(cookie, "/me"),
    pedir(cookie, "/accounts"),
    pedir(cookie, "/wallet-addresses"),
    pedir(cookie, "/grants"),
    pedir(cookie, "/cards"),
  ]);
  if ([perfil, cuentasRes, direccionesRes].some((item) => item.status === 401)) return null;
  if (cuentasRes.status !== 200) return { ...vacia(), error: "No se pudo leer la billetera de Interledger." };

  const cuentasApi = resultado<CuentaApi[]>(cuentasRes.cuerpo) ?? [];
  const cuentas = cuentasApi.map(mapearCuenta);
  const escalaPorMoneda = new Map(cuentas.map((cuenta) => [cuenta.moneda, cuenta.escala]));
  const direccionesApi = resultado<DireccionApi[]>(direccionesRes.cuerpo) ?? [];

  const movimientos: MovimientoApi[] = [];
  let total = Number.POSITIVE_INFINITY;
  for (let pagina = 0; movimientos.length < total && pagina < 20; pagina += 1) {
    const lote = await pedir(cookie, `/transactions?page=${pagina}&pageSize=100&orderByDate=DESC`);
    if (lote.status === 401) return null;
    if (lote.status !== 200) break;
    const paginaDatos = resultado<{ results?: MovimientoApi[]; total?: number }>(lote.cuerpo);
    const filas = paginaDatos?.results ?? [];
    total = paginaDatos?.total ?? filas.length;
    movimientos.push(...filas);
    if (filas.length === 0) break;
  }

  const direcciones = await Promise.all(
    direccionesApi.map(async (direccion) => {
      const [llavesRes, publico] = await Promise.all([
        pedir(cookie, `/accounts/${direccion.accountId}/wallet-addresses/${direccion.id}/keys`),
        documentoPublico(direccion.url),
      ]);
      const llaves = llavesRes.status === 200 ? (resultado<LlaveApi[]>(llavesRes.cuerpo) ?? []) : [];
      return {
        id: direccion.id,
        url: direccion.url,
        nombrePublico: direccion.publicName,
        cuentaId: direccion.accountId,
        activa: direccion.active,
        creada: direccion.createdAt,
        esTarjeta: direccion.isCard ?? null,
        servidorAuth: publico.auth,
        servidorRecursos: publico.recursos,
        llaves: llaves.map((llave) => ({
          id: llave.id,
          apodo: llave.nickname ?? null,
          creada: llave.createdAt,
          publica: llave.publicKey,
        })),
      } satisfies DireccionBilletera;
    }),
  );

  const monedas = [...new Set(cuentas.map((cuenta) => cuenta.moneda))];
  const tasas = (
    await Promise.all(
      monedas.map(async (base) => {
        const respuesta = await pedir(cookie, `/rates?base=${base}`);
        if (respuesta.status !== 200 || !respuesta.cuerpo || typeof respuesta.cuerpo !== "object") return null;
        const cuerpo = respuesta.cuerpo as { rates?: Record<string, number> };
        const pares = Object.entries(cuerpo.rates ?? {})
          .filter(([moneda]) => moneda !== base)
          .map(([moneda, valor]) => ({ moneda, valor: String(valor) }));
        return { base, pares };
      }),
    )
  ).filter((tasa): tasa is TasaBilletera => tasa !== null);

  const me = resultado<{
    email: string;
    firstName: string;
    lastName: string;
    address?: string | null;
    needsWallet: boolean;
    needsIDProof: boolean;
    customerId?: string | null;
    isCardsVisible: boolean;
  }>(perfil.cuerpo);

  return {
    titular: me
      ? {
          correo: me.email,
          nombre: me.firstName,
          apellidos: me.lastName,
          direccion: me.address ?? null,
          necesitaBilletera: me.needsWallet,
          necesitaIdentidad: me.needsIDProof,
          clienteId: me.customerId ?? null,
          tarjetasVisibles: me.isCardsVisible,
        }
      : null,
    cuentas,
    direcciones,
    movimientos: movimientos.map((item) => mapearMovimiento(item, escalaPorMoneda)),
    autorizaciones: (resultado<GrantApi[]>(grantsRes.cuerpo) ?? []).map(mapearGrant),
    tarjetas: resultado<unknown[]>(tarjetasRes.cuerpo) ?? [],
    tasas,
  };
}

function vacia(): InfoBilletera {
  return { titular: null, cuentas: [], direcciones: [], movimientos: [], autorizaciones: [], tarjetas: [], tasas: [] };
}

export class PagoInterledgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PagoInterledgerError";
  }
}

interface DireccionPago {
  id: string;
  url: string;
  accountId: string;
}

function normalizarWallet(url: string): string {
  const limpia = url.trim().replace(/\/$/, "");
  return limpia.startsWith("$") ? `https://${limpia.slice(1)}` : limpia;
}

function mensajeApi(cuerpo: unknown, respaldo: string): string {
  if (cuerpo && typeof cuerpo === "object" && "message" in cuerpo && typeof cuerpo.message === "string") {
    if (/not enough funds/i.test(cuerpo.message)) return "La billetera de origen no tiene saldo suficiente.";
    if (/invalid wallet/i.test(cuerpo.message)) return "Esa billetera no puede enviar el pago.";
  }
  return respaldo;
}

async function cookieValida(cookie: string | null): Promise<string | null> {
  if (cookie) {
    const prueba = await pedir(cookieDe(cookie), "/wallet-addresses");
    if (prueba.status === 200) return cookieDe(cookie);
  }
  const nueva = await entrarBilletera();
  return nueva ? cookieDe(nueva) : null;
}

/**
 * Mueve dinero de una billetera de la cuenta de Interledger a otra.
 * `monto` son pesos colombianos enteros (el precio del producto o de la oferta).
 * La API de la billetera pide el importe en unidades mayores de la billetera que envía,
 * así que un pago en euros se convierte con la tasa COP y se redondea hacia arriba.
 */
export async function pagarEntreBilleteras(params: {
  walletPagador: string;
  walletReceptor: string;
  monto: number;
  descripcion: string;
}): Promise<{ pagoId: string; descripcion: string; estado: "pendiente" | "completado" | "fallido" }> {
  const origen = normalizarWallet(params.walletPagador);
  const destino = normalizarWallet(params.walletReceptor);
  if (origen === destino) throw new PagoInterledgerError("El pago tiene que salir de una billetera y llegar a otra.");

  const { data: perfiles } = await clienteAdmin().from("profiles").select("id").eq("wallet_address", origen);
  const ids = (perfiles ?? []).map((p) => p.id);
  let token: string | null = null;
  if (ids.length) {
    const { data: usuarios } = await clienteAdmin().from("usuarios").select("id, token").in("id", ids);
    token = usuarios?.find((u) => u.token)?.token ?? null;
  }

  const cookie = await cookieValida(token);
  if (!cookie) throw new PagoInterledgerError("No se pudo entrar a la billetera que envía el pago.");
  if (ids.length) await clienteAdmin().from("usuarios").update({ token: cookie }).in("id", ids);

  const direcciones = resultado<DireccionPago[]>((await pedir(cookie, "/wallet-addresses")).cuerpo) ?? [];
  const emisora = direcciones.find((d) => normalizarWallet(d.url) === origen);
  if (!emisora) throw new PagoInterledgerError("La billetera de origen no está en esta cuenta de Interledger.");

  const documento = await fetch(origen, { headers: { accept: "application/json" }, cache: "no-store" });
  const publico = documento.ok ? ((await documento.json()) as { assetCode?: string; assetScale?: number }) : {};
  const moneda = publico.assetCode || "COP";
  const escala = typeof publico.assetScale === "number" ? publico.assetScale : 2;
  let mayor = params.monto;
  if (moneda !== "COP") {
    const tasas = await pedir(cookie, "/rates?base=COP");
    const cuerpo = tasas.cuerpo as { rates?: Record<string, number> } | null;
    const tasa = cuerpo?.rates?.[moneda];
    if (!tasa) throw new PagoInterledgerError("No hay tasa para convertir el precio a la moneda de la billetera.");
    mayor = params.monto * tasa;
  }
  const factor = 10 ** escala;
  const amount = Math.max(1 / factor, Math.ceil(mayor * factor - 1e-8) / factor);
  if (moneda === "EUR" && amount > 25) {
    throw new PagoInterledgerError("Este pago supera el tope de la cuenta de prueba (25 EUR).");
  }

  const cotizacion = await pedir(cookie, "/quotes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      walletAddressId: emisora.id,
      receiver: destino,
      amount,
      isReceive: true,
      description: params.descripcion,
    }),
  });
  const quote = resultado<{
    id?: string;
    debitAmount?: { assetCode?: string; assetScale?: number; value?: string };
    receiveAmount?: { assetCode?: string; assetScale?: number; value?: string };
  }>(cotizacion.cuerpo);
  if (cotizacion.status !== 200 || !quote?.id) {
    throw new PagoInterledgerError(mensajeApi(cotizacion.cuerpo, "No se pudo cotizar el pago entre las billeteras."));
  }
  const debito = Number(quote.debitAmount?.value ?? "0") / 10 ** (quote.debitAmount?.assetScale ?? 2);
  if (quote.debitAmount?.assetCode === "EUR" && debito > 30) {
    throw new PagoInterledgerError("La cotización debitaría más de 30 EUR. El pago no se envió.");
  }
  if (quote.receiveAmount?.assetCode === "COP") {
    const recibido = Number(quote.receiveAmount.value ?? "0") / 10 ** (quote.receiveAmount.assetScale ?? 2);
    if (recibido + 1 < params.monto) {
      throw new PagoInterledgerError("La cotización no alcanza a cubrir el precio en pesos. El pago no se envió.");
    }
  }

  const envio = await pedir(cookie, "/outgoing-payments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ quoteId: quote.id }),
  });
  if (envio.status !== 200) {
    throw new PagoInterledgerError(mensajeApi(envio.cuerpo, "La billetera no aceptó el envío."));
  }

  let estado: "pendiente" | "completado" | "fallido" = "pendiente";
  for (let intento = 0; intento < 6; intento += 1) {
    await new Promise((resolver) => setTimeout(resolver, 1500));
    estado = await estadoPagoInterledger(quote.id, params.descripcion, origen);
    if (estado !== "pendiente") break;
  }

  return { pagoId: quote.id, descripcion: params.descripcion, estado };
}

/** Confirma en los movimientos si el envío ya se completó. */
export async function estadoPagoInterledger(pagoId: string, descripcion: string, walletPagador: string): Promise<"pendiente" | "completado" | "fallido"> {
  const origen = normalizarWallet(walletPagador);
  const { data: perfiles } = await clienteAdmin().from("profiles").select("id").eq("wallet_address", origen);
  const ids = (perfiles ?? []).map((p) => p.id);
  const { data: usuarios } = ids.length
    ? await clienteAdmin().from("usuarios").select("token").in("id", ids)
    : { data: [] as { token: string | null }[] };
  const cookie = await cookieValida(usuarios?.find((u) => u.token)?.token ?? null);
  if (!cookie) return "pendiente";

  const movimientos = await pedir(cookie, "/transactions?page=0&pageSize=20&orderByDate=DESC");
  const filas = resultado<{ results?: { id: string; description?: string | null; status?: string; paymentId?: string }[] }>(movimientos.cuerpo)?.results ?? [];
  const coinciden = filas.filter(
    (f) => f.description === descripcion || (f.description?.includes(descripcion) ?? false) || f.paymentId === pagoId || f.id === pagoId,
  );
  const reciente = coinciden[0];
  if (!reciente?.status) return "pendiente";
  if (reciente.status === "COMPLETED") return "completado";
  if (reciente.status === "FAILED" || reciente.status === "REJECTED") return "fallido";
  return "pendiente";
}

/** Lee la billetera de Interledger con la cookie de usuarios.token. Si venció, entra de nuevo y la actualiza. */
export async function infoInterledger(usuarioId: string, token: string | null): Promise<InfoBilletera | null> {
  if (!token && !process.env.INTERLEDGER_EMAIL) return null;
  try {
    if (token) {
      const info = await leerTodo(cookieDe(token));
      if (info) return info;
    }
    const nueva = await entrarBilletera();
    if (!nueva) return { ...vacia(), error: "No se pudo entrar a la billetera de Interledger." };
    await clienteAdmin().from("usuarios").update({ token: nueva }).eq("id", usuarioId);
    return (await leerTodo(nueva)) ?? { ...vacia(), error: "No se pudo leer la billetera de Interledger." };
  } catch {
    return { ...vacia(), error: "No se pudo leer la billetera de Interledger." };
  }
}
