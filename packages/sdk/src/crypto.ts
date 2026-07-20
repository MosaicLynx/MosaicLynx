import {
  type EncryptedRelayEnvelope,
  base64UrlDecode,
  base64UrlEncode,
  decryptRelayJson,
  deriveRelayKeys,
  encryptRelayJson,
  hex,
  sha256,
  utf8,
  webCryptoDriver,
} from '@mosaiclynx/relay-protocol';

export const randomBytes = (length: number): Uint8Array => crypto.getRandomValues(new Uint8Array(length));

export const encryptJson = (key: Uint8Array, value: unknown, aad: unknown): Promise<EncryptedRelayEnvelope> =>
  encryptRelayJson(webCryptoDriver, key, value, aad);

export const decryptJson = (key: Uint8Array, envelope: EncryptedRelayEnvelope, aad: unknown): Promise<unknown> =>
  decryptRelayJson(webCryptoDriver, key, envelope, aad);

export { type EncryptedRelayEnvelope, base64UrlDecode, base64UrlEncode, deriveRelayKeys, hex, sha256, utf8 };
