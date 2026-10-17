import styles from "./flujo-pago.module.css";

export type FasePago = "solicitud" | "canal" | "autorizacion" | "ejecucion" | "comprobante" | "completado" | "pendiente" | "fallido";
const stages = ["Solicitud", "Wallet", "Pago", "Comprobante"];
const index: Record<FasePago, number> = { solicitud: 0, canal: 0, autorizacion: 1, ejecucion: 2, comprobante: 3, completado: 4, pendiente: -1, fallido: -1 };

/** El avance depende del estado conocido por el llamador, nunca de un temporizador. */
export function FlujoPago({ fase, simulado = false }: { fase: FasePago; simulado?: boolean }) {
  const current = index[fase];
  return <figure className={styles.flow} aria-label={`Flujo ${simulado ? "simulado" : "del pago"}: ${fase}`}>
    <ol className={styles.stages}>
      {stages.map((stage, i) => <li key={stage} data-state={current > i ? "done" : current === i ? "active" : "waiting"} aria-current={current === i ? "step" : undefined}>
        <div className={styles.object} aria-hidden="true"><span /><span /><span /><b>{i === 0 ? "PQC" : i === 1 ? "GNAP" : i === 2 ? "OP" : "2 firmas"}</b></div>
        <span className={styles.label}>{stage}</span>
      </li>)}
    </ol>
    <figcaption className={styles.caption}>{simulado ? "Flujo ilustrativo · no se mueve dinero" : fase === "completado" ? "Resultado recibido y comprobado" : fase === "pendiente" ? "Estado pendiente de confirmar; no se supone progreso" : fase === "fallido" ? "El pago no se completó" : fase === "canal" ? "Protegiendo la solicitud con ML-KEM-768" : "El avance refleja el estado conocido de la operación"}</figcaption>
  </figure>;
}
