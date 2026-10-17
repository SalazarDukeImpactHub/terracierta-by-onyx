import { expect, it } from "vitest";
import { quotedDifference } from "./amounts";

const receive = { value: "5", assetCode: "EUR", assetScale: 2 };
it("separa el adicional del proveedor sin reducir el importe del vendedor", () => {
  expect(quotedDifference({ ...receive, value: "105" }, receive)).toEqual({ ...receive, value: "100" });
  expect(receive.value).toBe("5");
  expect(quotedDifference(receive, receive)).toEqual({ ...receive, value: "0" });
});
it("no calcula una comisión restando monedas distintas, escalas distintas o datos inválidos", () => {
  for (const debit of [{ ...receive, assetCode: "COP" }, { ...receive, assetScale: 0 }, { ...receive, value: "4" }, { ...receive, value: "NaN" }, {}]) {
    expect(quotedDifference(debit, receive)).toBeNull();
  }
  expect(quotedDifference(receive, null)).toBeNull();
});
it("calcula unidades menores sin perder precisión de enteros grandes", () => {
  expect(quotedDifference({ ...receive, value: "9007199254740995" }, { ...receive, value: "9007199254740993" })?.value).toBe("2");
});
