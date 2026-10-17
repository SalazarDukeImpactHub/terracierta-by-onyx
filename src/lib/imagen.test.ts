import { describe, expect, it } from "vitest";
import { MAX_BYTES_IMAGEN, MAX_LADO_IMAGEN, medidasAjustadas, nombreConTipo, TIPOS_IMAGEN_ADMITIDOS } from "./imagen";
import { MAX_FOTO_BYTES, TIPOS_FOTO } from "./validacion";

describe("medidasAjustadas", () => {
  it("no toca una imagen que ya cabe", () => {
    expect(medidasAjustadas(800, 600, 1600)).toEqual({ ancho: 800, alto: 600 });
  });
  it("reduce el lado mayor al máximo y conserva la proporción", () => {
    expect(medidasAjustadas(4000, 2000, 1600)).toEqual({ ancho: 1600, alto: 800 });
    expect(medidasAjustadas(1000, 3000, 1500)).toEqual({ ancho: 500, alto: 1500 });
  });
  it("nunca devuelve un lado de cero", () => {
    expect(medidasAjustadas(10000, 1, 100)).toEqual({ ancho: 100, alto: 1 });
  });
});

describe("nombreConTipo", () => {
  it("cambia la extensión al tipo nuevo", () => {
    expect(nombreConTipo("logo final.PNG", "image/webp")).toBe("logo final.webp");
    expect(nombreConTipo("foto.jpeg", "image/jpeg")).toBe("foto.jpg");
  });
  it("funciona sin extensión", () => {
    expect(nombreConTipo("logo", "image/png")).toBe("logo.png");
  });
});

describe("límites del navegador y del servidor", () => {
  it("coinciden: lo que el navegador deja pasar, el servidor lo acepta", () => {
    expect(MAX_BYTES_IMAGEN).toBe(MAX_FOTO_BYTES);
    expect([...TIPOS_IMAGEN_ADMITIDOS].sort()).toEqual(Object.keys(TIPOS_FOTO).sort());
    expect(MAX_LADO_IMAGEN).toBeGreaterThan(0);
  });
});
