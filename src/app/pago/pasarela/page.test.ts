import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { Perfil } from "@/adapters/types";

const { profile } = vi.hoisted(() => ({ profile: vi.fn() }));
vi.mock("@/adapters/auth", () => ({ auth: { obtenerPerfil: profile } }));
vi.mock("./formulario-pasarela", () => ({ FormularioPasarela: ({ compacto, maxAmount, maxDebit }: { compacto?: boolean; maxAmount: number; maxDebit: number }) => createElement("div", { "data-compacto": String(!!compacto), "data-max-amount": maxAmount, "data-max-debit": maxDebit }, "Formulario técnico") }));
vi.mock("@/payments/settlement", () => ({ limiteCobro: () => 4.25 }));
vi.mock("@/payments/openPayments", () => ({ limiteDebitoSdk: () => 5.25 }));
import Page from "./page";

afterEach(() => vi.resetAllMocks());

it.each([
  ["comprador", "Elegir café para pagar", "/tienda"],
  ["cooperativa", "Ver mis ofertas para pagar", "/cooperativa"],
  ["caficultor", "Ver mis cobros", "/caficultor"],
] as const)("muestra wallet y recorrido de %s desde el perfil", async (rol, label, href) => {
  const perfil: Perfil = { id: crypto.randomUUID(), rol, nombre: "Cuenta de prueba", municipio: "Marsella", tiene_invima: false, wallet_address: `https://example.invalid/${crypto.randomUUID()}` };
  profile.mockResolvedValue(perfil);
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  expect(html).toContain(perfil.wallet_address);
  expect(html).toContain(label);
  expect(html).toContain(`href="${href}"`);
  expect(html).not.toContain("Formulario técnico");
  expect(html).toContain('aria-label="Vista por rol"');
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
  expect(html).toContain("Comprador");
  expect(html).toContain("Cooperativa");
  expect(html).toContain("Caficultor");
  if (rol === "caficultor") {
    expect(html).not.toContain("para pagar");
    expect(html).toContain("sin aprobar pagos entrantes");
  }
});

it("sin perfil permite el pago de prueba rotulado, sin inventar una cuenta", async () => {
  profile.mockResolvedValue(null);
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Entrar con mi cuenta");
  expect(html).toContain("Formulario técnico");
  expect(html).toContain("Pago de prueba");
  expect(html).toContain("wallet configurada en el servidor");
  expect(html).toContain("No corresponde a un pedido ni a una oferta de tu cuenta");
  expect(html).toContain('data-compacto="true"');
  expect(html).toContain('data-max-amount="4.25"');
  expect(html).toContain('data-max-debit="5.25"');
  expect(html).toContain('href="/pago/seguridad"');
  expect(html).not.toContain("Shor");
  expect(html).not.toContain("Prueba PQC verificada");
  expect(html).not.toContain("Copia alterada");
});

it.each([{ autorizacion: "test-reference" }, { prueba: "1" }])("conserva la prueba y su retorno técnico: %j", async (params) => {
  profile.mockResolvedValue(null);
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve(params) }));
  expect(html).toContain("Formulario técnico");
  expect(html).toContain("Prueba técnica de pago");
  expect(html).toContain('data-compacto="false"');
  expect(html).toContain("independientemente de la cuenta de TerraCierta");
  expect(html).not.toContain('aria-label="Vista por rol"');
});
