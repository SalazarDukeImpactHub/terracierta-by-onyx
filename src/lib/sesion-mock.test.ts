import { describe, expect, it } from "vitest";
import { firmarCookie, normalizarCorreo, uuidDesdeCorreo, verificarCookie, walletDeEjemplo } from "./sesion-mock";

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SECRETO = "secreto-de-prueba-del-servidor";
const ID = "11111111-1111-4111-8111-111111111111";

describe("uuidDesdeCorreo", () => {
  it("devuelve un uuid válido (versión 5)", () => {
    expect(uuidDesdeCorreo("ana@example.test")).toMatch(FORMATO_UUID);
  });
  it("el mismo correo da siempre el mismo id, sin importar mayúsculas ni espacios", () => {
    expect(uuidDesdeCorreo("  Ana@Example.TEST ")).toBe(uuidDesdeCorreo("ana@example.test"));
  });
  it("correos distintos dan ids distintos", () => {
    expect(uuidDesdeCorreo("ana@example.test")).not.toBe(uuidDesdeCorreo("luis@example.test"));
  });
});

describe("normalizarCorreo", () => {
  it("recorta y pasa a minúsculas", () => {
    expect(normalizarCorreo("  Ana@Example.TEST ")).toBe("ana@example.test");
  });
});

describe("walletDeEjemplo", () => {
  it("arma una URL https del dominio reservado .test con el nombre sin tildes ni símbolos", () => {
    expect(walletDeEjemplo("María José Ñandú", ID)).toBe("https://wallet.example.test/maria-jose-nandu-11111111");
  });
  it("dos personas con el mismo nombre tienen wallets distintas (por el id)", () => {
    const a = walletDeEjemplo("Ana", uuidDesdeCorreo("a@x.test"));
    const b = walletDeEjemplo("Ana", uuidDesdeCorreo("b@x.test"));
    expect(a).not.toBe(b);
  });
  it("nunca devuelve un nombre vacío", () => {
    expect(walletDeEjemplo("***", ID)).toBe("https://wallet.example.test/cuenta-11111111");
  });
});

describe("cookie de sesión firmada", () => {
  it("una cookie firmada se verifica y devuelve el id", () => {
    expect(verificarCookie(firmarCookie(ID, SECRETO), SECRETO)).toBe(ID);
  });
  it("no se puede fabricar a mano: el id suelto, sin firma, se rechaza", () => {
    expect(verificarCookie(ID, SECRETO)).toBeNull();
  });
  it("una firma inventada se rechaza", () => {
    expect(verificarCookie(`${ID}.firma-falsa`, SECRETO)).toBeNull();
  });
  it("cambiar el id conservando la firma de otro se rechaza (nadie puede suplantar a otra cuenta)", () => {
    const otro = "22222222-2222-4222-8222-222222222222";
    const firmaDeId = firmarCookie(ID, SECRETO).slice(ID.length);
    expect(verificarCookie(`${otro}${firmaDeId}`, SECRETO)).toBeNull();
  });
  it("una cookie firmada con otro secreto se rechaza", () => {
    expect(verificarCookie(firmarCookie(ID, "otro-secreto"), SECRETO)).toBeNull();
  });
  it.each([undefined, "", ".", "sin-punto", `${ID}.`, `.abc`, "no-es-uuid.abc"])("rechaza el valor inválido %j", (valor) => {
    expect(verificarCookie(valor, SECRETO)).toBeNull();
  });
});
