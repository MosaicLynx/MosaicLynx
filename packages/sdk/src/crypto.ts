import { canonicalize } from "./canonical.js";

const encoder = new TextEncoder();

const arrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

export const utf8 = (value: string): Uint8Array => encoder.encode(value);

export const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

export const base64UrlDecode = (value: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new TypeError("Invalid base64url value.");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const randomBytes = (length: number): Uint8Array =>
  crypto.getRandomValues(new Uint8Array(length));

export const sha256 = async (bytes: Uint8Array): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest("SHA-256", arrayBuffer(bytes)));

export const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const deriveRelayKeys = async (
  secret: Uint8Array,
  sessionId: string,
): Promise<{ requestKey: CryptoKey; responseKey: CryptoKey }> => {
  const salt = await sha256(utf8(`mosaiclynx.relay.v1\0${sessionId}`));
  const material = await crypto.subtle.importKey("raw", arrayBuffer(secret), "HKDF", false, ["deriveKey"]);
  const derive = (info: string): Promise<CryptoKey> => crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: arrayBuffer(salt), info: arrayBuffer(utf8(info)) },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const [requestKey, responseKey] = await Promise.all([derive("request"), derive("response")]);
  return { requestKey, responseKey };
};

export interface EncryptedRelayEnvelope {
  readonly algorithm: "A256GCM";
  readonly nonce: string;
  readonly ciphertextAndTag: string;
}

export const encryptJson = async (
  key: CryptoKey,
  value: unknown,
  aad: unknown,
): Promise<EncryptedRelayEnvelope> => {
  const nonce = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: arrayBuffer(nonce), additionalData: arrayBuffer(utf8(canonicalize(aad))), tagLength: 128 },
    key,
    arrayBuffer(utf8(canonicalize(value))),
  );
  return {
    algorithm: "A256GCM",
    nonce: base64UrlEncode(nonce),
    ciphertextAndTag: base64UrlEncode(new Uint8Array(encrypted)),
  };
};

export const decryptJson = async (
  key: CryptoKey,
  envelope: EncryptedRelayEnvelope,
  aad: unknown,
): Promise<unknown> => {
  if (envelope.algorithm !== "A256GCM") throw new TypeError("Unsupported relay cipher.");
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: arrayBuffer(base64UrlDecode(envelope.nonce)),
      additionalData: arrayBuffer(utf8(canonicalize(aad))),
      tagLength: 128,
    },
    key,
    arrayBuffer(base64UrlDecode(envelope.ciphertextAndTag)),
  );
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decrypted)) as unknown;
};
