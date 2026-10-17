import { describe, expect, it } from "vitest";
import { hashContrasena, verificarContrasena } from "./contrasena";

describe("contrasena", () => {
  it("verifica la contraseña correcta y rechaza otra", () => {
    const hash = hashContrasena("clave-segura");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(hash).not.toContain("clave-segura");
    expect(verificarContrasena("clave-segura", hash)).toBe(true);
    expect(verificarContrasena("otra-clave", hash)).toBe(false);
  });

  it("rechaza un hash mal formado", () => {
    expect(verificarContrasena("clave-segura", "texto-plano")).toBe(false);
  });
});
