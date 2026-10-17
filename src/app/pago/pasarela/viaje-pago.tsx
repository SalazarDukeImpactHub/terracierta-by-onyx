import styles from "./viaje-pago.module.css";

export type FaseViaje = "listo" | "preparando" | "cotizado" | "autorizacion" | "pendiente" | "completado" | "incierto";
const pasos: Record<FaseViaje, { posicion: number; texto: string }> = {
  listo: { posicion: 0, texto: "Listo para revisar el total" },
  preparando: { posicion: 0, texto: "Preparando la solicitud" },
  cotizado: { posicion: 1, texto: "Total disponible para revisar" },
  autorizacion: { posicion: 2, texto: "Autoriza el pago en tu wallet" },
  pendiente: { posicion: 2, texto: "Esperando confirmación del pago" },
  completado: { posicion: 3, texto: "Pago confirmado" },
  incierto: { posicion: 1, texto: "Revisa el estado antes de volver a pagar" },
};

/** Animación de presentación: la posición procede del estado conocido, no de un reloj. */
export function ViajePago({ fase }: { fase: FaseViaje }) {
  const paso = pasos[fase];
  return <figure className={styles.flow} aria-label="Recorrido de tu pago">
    <div className={styles.track} aria-hidden="true">
      <div className={styles.path} />
      <div className={styles.parcel} style={{ left: `calc(${paso.posicion / 3 * 100}% - ${paso.posicion / 3 * 32}px)` }} data-waiting={fase === "preparando" || fase === "pendiente"}><span>TC</span></div>
      <span className={styles.start}>Solicitud</span><span className={styles.middle}>Wallet</span><span className={styles.end}>Recibo</span>
    </div>
    <figcaption aria-live="polite">{paso.texto}</figcaption>
  </figure>;
}
