import { expect, it } from "vitest";
import { faseDelPago } from "./paymentProgress";

it("no inventa progreso si el proveedor no informa la fase", () => {
  expect(faseDelPago({ estado: "pendiente", detalle: {} })).toBe("pendiente");
  expect(faseDelPago({ estado: "pendiente", detalle: { paso: "desconocido" } })).toBe("pendiente");
  expect(faseDelPago({ estado: "pendiente", detalle: { paso: "ejecucion" } })).toBe("ejecucion");
});
it("el resultado terminal prevalece sobre una fase anterior", () => {
  expect(faseDelPago({ estado: "fallido", detalle: { paso: "autorizacion" } })).toBe("fallido");
  expect(faseDelPago({ estado: "completado", detalle: { paso: "autorizacion" } })).toBe("completado");
});
