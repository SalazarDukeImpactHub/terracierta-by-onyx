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
  /** Se guarda en pagos.detalle_json para confirmar el envío después. */
  detalle?: Record<string, unknown>;
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

/**
 * "comprador" es la persona que compra en la tienda. También inicia sesión: su wallet sale de su perfil
 * (asignada al registrarse, igual que las de caficultores y cooperativas), no de un formulario.
 * CAMBIO DE CONTRATO con el módulo de login: profiles.rol admite 'comprador' (migración 20261017000000).
 */
export type Rol = "caficultor" | "cooperativa" | "comprador";

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
  tipo_documento?: string | null;
  numero_documento?: string | null;
}

/**
 * Datos del SIGN IN (iniciar sesión). Solo correo y contraseña: con eso el módulo de autenticación detecta
 * solo el rol, el perfil, la wallet y el INVIMA (después los devuelven obtenerSesion y obtenerPerfil).
 */
export interface CredencialesInicio {
  correo: string;
  contrasena: string;
}

/**
 * Datos del SIGN UP (registro): es quien SOLICITA los datos de la persona. Los captura la pantalla /registro.
 * `tieneInvima` solo se pregunta (y solo se guarda) cuando el rol es "caficultor"; para los demás es false.
 * Las cooperativas están precargadas (cuenta demo), así que la pantalla de registro solo ofrece caficultor y comprador.
 */
export interface DatosRegistro {
  correo: string;
  contrasena: string;
  rol: Rol;
  nombre: string;
  municipio: string;
  tieneInvima: boolean;
  /** El registro real los pide aparte del nombre completo. */
  nombres?: string;
  apellidos?: string;
  tipo_documento?: string;
  numero_documento?: string;
  fecha_nacimiento?: string;
}

/**
 * Resultado de iniciarSesion y registrarse. Con `ok: true` YA HAY SESIÓN iniciada y `rol` dice dónde ir.
 * `error` es un texto para mostrarle a la persona, en español. En el sign in debe ser genérico
 * ("Correo o contraseña incorrectos"): no revela si el correo existe.
 */
export type ResultadoAuth = { ok: true; rol: Rol } | { ok: false; error: string };

export interface AuthAdapter {
  /** Sign in: correo + contraseña. Detecta rol, perfil, wallet e INVIMA automáticamente. */
  iniciarSesion(credenciales: CredencialesInicio): Promise<ResultadoAuth>;
  /** Sign up: crea la cuenta, asigna la wallet, guarda el perfil (con tiene_invima si es caficultor) e inicia sesión. */
  registrarse(datos: DatosRegistro): Promise<ResultadoAuth>;
  obtenerSesion(): Promise<Sesion | null>;
  obtenerPerfil(): Promise<Perfil | null>;
  cerrarSesion(): Promise<void>;
}
