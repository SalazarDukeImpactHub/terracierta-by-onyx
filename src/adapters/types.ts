/**
 * Contratos de integración (brief §7). La interfaz de usuario SOLO habla con estos tipos;
 * nunca importa de /src/payments ni de /src/auth. Si un compañero propone otra forma,
 * se acuerda con Jennifer ANTES de cambiar este archivo.
 */

// ---------- 7.1 Pagos (lo entrega el compañero de pagos) ----------

export type TipoPago = "pedido" | "oferta";
export type EstadoPago = "pendiente" | "completado" | "fallido";

export interface IniciarPagoInput {
  tipo: TipoPago;
  referenciaId: string;
  /** Pesos colombianos, entero. Por confirmar con el compañero: moneda y unidades menores. */
  montoCop: number;
  walletReceptor: string;
  walletPagador: string;
  /** Adónde vuelve el pagador tras dar su consentimiento. */
  urlRetorno: string;
}

export interface IniciarPagoOutput {
  pagoId: string;
  /** Pantalla de la billetera donde el pagador autoriza. null = no hace falta consentimiento interactivo. */
  redirectUrl: string | null;
  estado: EstadoPago;
}

export interface ConsultarPagoOutput {
  estado: EstadoPago;
  detalle: Record<string, unknown>;
}

export interface PagosAdapter {
  iniciarPago(input: IniciarPagoInput): Promise<IniciarPagoOutput>;
  consultarPago(pagoId: string): Promise<ConsultarPagoOutput>;
}

// ---------- 7.2 Login y wallets (lo entrega el compañero de login) ----------

export type Rol = "caficultor" | "cooperativa";

export interface Sesion {
  userId: string;
  rol: Rol;
}

export interface Perfil {
  id: string;
  rol: Rol;
  nombre: string;
  municipio: string;
  tiene_invima: boolean;
  wallet_address: string | null;
}

export interface AuthAdapter {
  obtenerSesion(): Promise<Sesion | null>;
  obtenerPerfil(): Promise<Perfil | null>;
  cerrarSesion(): Promise<void>;
}
