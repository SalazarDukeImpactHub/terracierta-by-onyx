import { afterEach, describe, expect, it, vi } from "vitest";

async function siteUrlCon(entorno: Record<string, string | undefined>) {
  vi.resetModules();
  for (const clave of ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL"]) {
    vi.stubEnv(clave, entorno[clave] ?? "");
  }
  return (await import("./env")).SITE_URL;
}

afterEach(() => vi.unstubAllEnvs());

describe("SITE_URL", () => {
  it("usa localhost en desarrollo local", async () => {
    expect(await siteUrlCon({})).toBe("http://localhost:3000");
  });
  it("respeta NEXT_PUBLIC_SITE_URL y quita la barra final", async () => {
    expect(await siteUrlCon({ NEXT_PUBLIC_SITE_URL: "https://terracierta.example/" })).toBe("https://terracierta.example");
  });
  it("en un preview de Vercel usa la URL de ese despliegue", async () => {
    expect(await siteUrlCon({ VERCEL_ENV: "preview", VERCEL_URL: "terracierta-git-x.vercel.app" })).toBe(
      "https://terracierta-git-x.vercel.app",
    );
  });
  it("en producción de Vercel usa el dominio de producción", async () => {
    expect(
      await siteUrlCon({
        VERCEL_ENV: "production",
        VERCEL_URL: "terracierta-abc123.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "terracierta.vercel.app",
      }),
    ).toBe("https://terracierta.vercel.app");
  });
});
