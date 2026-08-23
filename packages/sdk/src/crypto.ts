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

/** Web Crypto を使って暗号学的に安全な乱数列を生成します。 */
export const randomBytes = (length: number): Uint8Array => crypto.getRandomValues(new Uint8Array(length));

/** 値を Relay 用の AES-GCM 暗号文へ変換します。 */
export const encryptJson = (key: Uint8Array, value: unknown, aad: unknown): Promise<EncryptedRelayEnvelope> =>
  encryptRelayJson(webCryptoDriver, key, value, aad);

/** Relay の AES-GCM 暗号文を復号します。 */
export const decryptJson = (key: Uint8Array, envelope: EncryptedRelayEnvelope, aad: unknown): Promise<unknown> =>
  decryptRelayJson(webCryptoDriver, key, envelope, aad);

export { type EncryptedRelayEnvelope, base64UrlDecode, base64UrlEncode, deriveRelayKeys, hex, sha256, utf8 };
