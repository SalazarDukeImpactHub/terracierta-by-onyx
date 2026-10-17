/** Codificación compartida entre navegador y servidor, sin Buffer ni secretos en texto. */
export function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
}

export function fromBase64(text: unknown, length?: number): Uint8Array<ArrayBuffer> {
  if (typeof text !== "string" || !text || text.length > 65536 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) {
    throw new Error("Codificación inválida");
  }
  const bytes = Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
  if (length !== undefined && bytes.length !== length) throw new Error("Longitud inválida");
  return bytes;
}

export const utf8 = (text: string) => new TextEncoder().encode(text);
