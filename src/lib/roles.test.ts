import { describe, expect, it } from "vitest";
import { rutaDeRol, rutaSegura } from "./roles";

describe("rutaDeRol", () => {
  it("cada rol tiene su home", () => {
    expect(rutaDeRol("caficultor")).toBe("/caficultor");
    expect(rutaDeRol("cooperativa")).toBe("/cooperativa");
    expect(rutaDeRol("comprador")).toBe("/comprador");
  });
});

describe("rutaSegura (a dónde volver tras iniciar sesión)", () => {
  it.each(["/tienda", "/tienda/11111111-1111-4111-8111-111111111111/bbbbbbbb-0001-4000-8000-000000000001", "/comprador", "/pago/retorno?tipo=pedido&ref=abc"])(
    "acepta la ruta interna %s",
    (ruta) => {
      expect(rutaSegura(ruta)).toBe(ruta);
    },
  );

  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "javascript:alert(1)",
    "evil.test/tienda",
    "tienda",
    "/ruta\nconsalto",
    "/a\\b",
    "http://localhost:3000/tienda",
    "",
  ])("rechaza %j (open redirect)", (ruta) => {
    expect(rutaSegura(ruta)).toBeNull();
  });

  it("rechaza vacíos, nulos y rutas demasiado largas", () => {
    expect(rutaSegura(null)).toBeNull();
    expect(rutaSegura(undefined)).toBeNull();
    expect(rutaSegura("/" + "a".repeat(400))).toBeNull();
  });
});
