import { describe, expect, it } from "vitest";
import { esquemaCheckout, esquemaProducto, formatoCop, urlSegura, walletAddress } from "./validacion";

describe("walletAddress", () => {
  it("acepta una URL https", () => {
    expect(walletAddress.parse("https://wallet.example.test/marta")).toBe("https://wallet.example.test/marta");
  });
  it("normaliza un payment pointer ($) a https", () => {
    expect(walletAddress.parse("$wallet.example.test/marta")).toBe("https://wallet.example.test/marta");
  });
  it.each(["javascript:alert(1)", "http://wallet.example.test/x", "data:text/html,<script>", "no es url", "https://localhost/", ""])(
    "rechaza %s",
    (valor) => {
      expect(walletAddress.safeParse(valor).success).toBe(false);
    },
  );
});

describe("urlSegura (escape de fotos contra XSS)", () => {
  it("deja pasar http(s)", () => {
    expect(urlSegura("https://x.test/a.jpg")).toBe("https://x.test/a.jpg");
  });
  it.each(["javascript:alert(1)", "data:image/svg+xml,<svg onload=alert(1)>", "vbscript:x", "", null, undefined])(
    "bloquea %s",
    (valor) => {
      expect(urlSegura(valor as string | null | undefined)).toBeNull();
    },
  );
});

describe("esquemaProducto", () => {
  it("acepta un producto válido y convierte el precio a entero", () => {
    const r = esquemaProducto.parse({ nombre: "Café lavado 500 g", descripcion: "Rico", precio_cop: "38000" });
    expect(r.precio_cop).toBe(38000);
  });
  it("rechaza precios bajos, decimales y nombres cortos", () => {
    expect(esquemaProducto.safeParse({ nombre: "Café", precio_cop: 500 }).success).toBe(false);
    expect(esquemaProducto.safeParse({ nombre: "Café lavado", precio_cop: 1500.5 }).success).toBe(false);
    expect(esquemaProducto.safeParse({ nombre: "ab", precio_cop: 5000 }).success).toBe(false);
  });
  it("no guarda el HTML como código: lo deja como texto (el escape lo hace React al pintar)", () => {
    const r = esquemaProducto.parse({ nombre: "<img src=x onerror=alert(1)> café", descripcion: "", precio_cop: 5000 });
    expect(r.nombre).toContain("<img");
  });
});

describe("esquemaCheckout", () => {
  const base = { productoId: "bbbbbbbb-0001-4000-8000-000000000001", cantidad: 2 };
  it("ignora una wallet que mande el navegador: el pago sale con la wallet del perfil", () => {
    const r = esquemaCheckout.parse({ ...base, walletComprador: "https://evil.test/yo", monto: 1 });
    expect(r).toEqual({ productoId: base.productoId, cantidad: 2 });
    expect("walletComprador" in r).toBe(false);
  });
  it("acepta un checkout válido", () => {
    expect(esquemaCheckout.safeParse(base).success).toBe(true);
  });
  it("rechaza cantidad fuera de rango y producto que no es uuid", () => {
    expect(esquemaCheckout.safeParse({ ...base, cantidad: 0 }).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...base, cantidad: 21 }).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...base, productoId: "1 OR 1=1" }).success).toBe(false);
  });
});

describe("formatoCop", () => {
  it("formatea pesos sin decimales", () => {
    expect(formatoCop(38000).replace(/\s/g, " ")).toMatch(/38\.000/);
  });
});
