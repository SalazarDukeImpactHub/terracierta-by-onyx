import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Integración del sign up y el sign in SIMULADOS (modo demostración) contra la base local.
 * Se salta sola si no hay llaves en el entorno. Correr con `npm run test:db` (necesita `supabase start`).
 * Crea cuentas de prueba con correos @prueba.test y las borra al terminar.
 */
const HAY_DB = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

const ALVARO = "40088dae-afd2-4ec3-9946-dbb8b245e474";
const CAMILA = "6b1c0a11-7e2a-4c11-9a11-000000000001";
const COOPERATIVA = "33333333-3333-4333-8333-333333333333";

describe.skipIf(!HAY_DB)("Sign up y sign in simulados (integración con la base local)", () => {
  let mock: typeof import("@/adapters/mocks/auth");
  let sesion: typeof import("./sesion-mock");
  let db: ReturnType<typeof import("./supabase/admin").clienteAdmin>;
  const correosCreados: string[] = [];

  const datos = (correo: string, extra: Partial<import("@/adapters/types").DatosRegistro> = {}) => ({
    correo,
    contrasena: "clave-segura-1",
    rol: "comprador" as const,
    nombre: "  Persona de Prueba  ",
    municipio: "Medellín",
    tieneInvima: false,
    ...extra,
  });

  beforeAll(async () => {
    if (typeof WebSocket === "undefined") vi.stubGlobal("WebSocket", class {}); // Node < 22 (ver ruta-b.db.test.ts)
    vi.stubEnv("USE_MOCKS", "true");
    vi.resetModules();
    mock = await import("@/adapters/mocks/auth");
    sesion = await import("./sesion-mock");
    db = (await import("./supabase/admin")).clienteAdmin();
  });

  afterAll(async () => {
    if (db && correosCreados.length) {
      await db.from("profiles").delete().in("id", correosCreados.map((c) => sesion.uuidDesdeCorreo(c)));
    }
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function perfilDe(correo: string) {
    const { data } = await db.from("profiles").select("*").eq("id", sesion.uuidDesdeCorreo(correo)).maybeSingle();
    return data;
  }

  it("SIGN UP de un caficultor CON INVIMA: guarda el INVIMA, el rol, el nombre limpio y le asigna una wallet", async () => {
    const correo = "caficultor.con@prueba.test";
    correosCreados.push(correo);
    const r = await mock.registrarMock(datos(correo, { rol: "caficultor", tieneInvima: true }));
    expect(r).toMatchObject({ ok: true, rol: "caficultor" });

    expect(await perfilDe(correo)).toMatchObject({
      rol: "caficultor",
      nombre: "Persona de Prueba",
      municipio: "Medellín",
      tiene_invima: true,
    });
    expect((await perfilDe(correo))?.wallet_address).toMatch(/^https:\/\/wallet\.example\.test\/persona-de-prueba-[0-9a-f]{8}$/);
  });

  it("SIGN UP de un caficultor SIN INVIMA: queda en false", async () => {
    const correo = "caficultor.sin@prueba.test";
    correosCreados.push(correo);
    expect(await mock.registrarMock(datos(correo, { rol: "caficultor", tieneInvima: false }))).toMatchObject({ ok: true });
    expect(await perfilDe(correo)).toMatchObject({ rol: "caficultor", tiene_invima: false });
  });

  it("SIGN UP de un comprador: el INVIMA SIEMPRE queda en false, aunque el navegador mande true", async () => {
    const correo = "comprador@prueba.test";
    correosCreados.push(correo);
    expect(await mock.registrarMock(datos(correo, { rol: "comprador", tieneInvima: true }))).toMatchObject({ ok: true, rol: "comprador" });
    expect(await perfilDe(correo)).toMatchObject({ rol: "comprador", tiene_invima: false });
  });

  it("las cooperativas no se registran solas y no se crea ningún perfil", async () => {
    const correo = "cooperativa@prueba.test";
    const r = await mock.registrarMock(datos(correo, { rol: "cooperativa" }));
    expect(r.ok).toBe(false);
    expect(await perfilDe(correo)).toBeNull();
  });

  it("un correo ya registrado se rechaza (incluidos los de las cuentas de ejemplo)", async () => {
    expect(await mock.registrarMock(datos("comprador@prueba.test"))).toEqual({ ok: false, error: "Ese correo ya está registrado" });
    expect(await mock.registrarMock(datos("al.henao1256@gmail.com"))).toEqual({ ok: false, error: "Ese correo ya está registrado" });
    expect(await mock.registrarMock(datos("  COMPRADOR@Prueba.test "))).toEqual({ ok: false, error: "Ese correo ya está registrado" });
  });

  it("SIGN IN detecta el rol solo, a partir del correo (cuentas de ejemplo con su contraseña)", async () => {
    expect(await mock.autenticarMock("al.henao1256@gmail.com", "2026grupoonyX$")).toEqual({ id: ALVARO, rol: "caficultor" });
    expect(await mock.autenticarMock("cooperativa@terracierta.test", "Terracierta1")).toEqual({ id: COOPERATIVA, rol: "cooperativa" });
    expect(await mock.autenticarMock("  CAMILA.RESTREPO@terracierta.test ", "Terracierta1")).toEqual({ id: CAMILA, rol: "comprador" });
  });

  it("SIGN IN: una contraseña incorrecta de una cuenta de ejemplo, un correo desconocido o una contraseña vacía dan null", async () => {
    expect(await mock.autenticarMock("al.henao1256@gmail.com", "otra-clave")).toBeNull();
    expect(await mock.autenticarMock("nadie@prueba.test", "Terracierta1")).toBeNull();
    expect(await mock.autenticarMock("jairo@terracierta.test", "")).toBeNull();
  });

  it("SIGN IN con una cuenta creada en modo demostración la encuentra por su correo y detecta su rol e INVIMA", async () => {
    const encontrado = await mock.autenticarMock("caficultor.con@prueba.test", "cualquier-clave");
    expect(encontrado).toEqual({ id: sesion.uuidDesdeCorreo("caficultor.con@prueba.test"), rol: "caficultor" });
    const { data } = await db.from("profiles").select("tiene_invima").eq("id", encontrado!.id).single();
    expect(data?.tiene_invima).toBe(true); // el INVIMA se detecta del perfil: no se vuelve a preguntar
  });
});
