import { describe, expect, it } from "vitest";
import {
  esquemaCheckout,
  esquemaInicioSesion,
  esquemaProducto,
  esquemaRegistro,
  formatoCop,
  urlSegura,
  walletAddress,
} from "./validacion";

describe("esquemaInicioSesion (sign in)", () => {
  it("acepta correo y contraseña, y normaliza el correo", () => {
    expect(esquemaInicioSesion.parse({ correo: "  Ana@Example.TEST ", contrasena: "x" })).toEqual({
      correo: "ana@example.test",
      contrasena: "x",
    });
  });
  it("rechaza un correo inválido y una contraseña vacía", () => {
    expect(esquemaInicioSesion.safeParse({ correo: "no-es-correo", contrasena: "x" }).success).toBe(false);
    expect(esquemaInicioSesion.safeParse({ correo: "a@b.co", contrasena: "" }).success).toBe(false);
  });
  it("no deja pasar campos de más (p. ej. un rol): el rol se detecta solo, no lo manda el navegador", () => {
    const r = esquemaInicioSesion.parse({ correo: "a@b.co", contrasena: "x", rol: "cooperativa", tieneInvima: "si" });
    expect(Object.keys(r).sort()).toEqual(["contrasena", "correo"]);
  });
});

describe("esquemaRegistro (sign up)", () => {
  const base = {
    nombres: "Ana",
    apellidos: "Gómez",
    tipo_documento: "CC",
    numero_documento: "1020304050",
    fecha_nacimiento: "1990-04-12",
    municipio: "Marsella",
    correo: "ana@example.test",
    contrasena: "clave-segura-1",
  };

  it("un caficultor DEBE contestar si tiene INVIMA", () => {
    const r = esquemaRegistro.safeParse({ ...base, rol: "caficultor" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Contanos si tenés INVIMA");
  });
  it("un caficultor con INVIMA queda con tieneInvima = true", () => {
    expect(esquemaRegistro.parse({ ...base, rol: "caficultor", tieneInvima: "si" }).tieneInvima).toBe(true);
  });
  it("un caficultor sin INVIMA queda con tieneInvima = false", () => {
    expect(esquemaRegistro.parse({ ...base, rol: "caficultor", tieneInvima: "no" }).tieneInvima).toBe(false);
  });
  it("un comprador no responde INVIMA, y aunque el navegador lo mande queda en false", () => {
    expect(esquemaRegistro.parse({ ...base, rol: "comprador" }).tieneInvima).toBe(false);
    expect(esquemaRegistro.parse({ ...base, rol: "comprador", tieneInvima: "si" }).tieneInvima).toBe(false);
  });
  it("las cooperativas no se registran solas (están precargadas)", () => {
    expect(esquemaRegistro.safeParse({ ...base, rol: "cooperativa" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...base, rol: "administrador" }).success).toBe(false);
  });
  it("exige contraseña de 8+ caracteres, correo válido, nombres y municipio", () => {
    expect(esquemaRegistro.safeParse({ ...base, rol: "comprador", contrasena: "corta" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...base, rol: "comprador", correo: "x" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...base, rol: "comprador", nombres: "" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...base, rol: "comprador", municipio: " " }).success).toBe(false);
  });
  it("normaliza el correo, arma el nombre completo y rechaza un documento inválido", () => {
    const r = esquemaRegistro.parse({ ...base, rol: "comprador", correo: " ANA@Example.test ", nombres: "  Ana  " });
    expect(r.correo).toBe("ana@example.test");
    expect(r.nombre).toBe("Ana Gómez");
    expect(esquemaRegistro.safeParse({ ...base, rol: "comprador", tipo_documento: "DNI" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...base, rol: "comprador", numero_documento: "12" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...base, rol: "comprador", fecha_nacimiento: "2999-01-01" }).success).toBe(false);
  });
});

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
