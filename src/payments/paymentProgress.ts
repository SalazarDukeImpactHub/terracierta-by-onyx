/** Solo refleja información recibida; pendiente sin detalle no implica autorización. */
export function faseDelPago(vista: { estado: "pendiente" | "completado" | "fallido"; detalle: { paso?: string } }) {
  if (vista.estado !== "pendiente") return vista.estado;
  switch (vista.detalle.paso) {
    case "solicitud": return "solicitud";
    case "autorizacion": return "autorizacion";
    case "ejecucion": return "ejecucion";
    case "finalizacion": return "comprobante";
    default: return "pendiente";
  }
}
