import { utils } from '@nemnesia/symbol-sdk';

/** SDK のネットワーク名を Catapult 系ペイロードのネットワーク識別子へ変換します。 */
export const expectedNetworkIdentifier = (network: 'mainnet' | 'testnet'): number =>
  network === 'mainnet' ? 0x68 : 0x98;

/** バイト列を長さと内容の両方で比較します。 */
export const equalBytes = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

/**
 * 署名対象 payload を検証してバイト列に変換します。
 * Relay 経由でも過大な入力を処理しないよう、256 KiB の上限を設けています。
 */
export const validateHexPayload = (payload: unknown): Uint8Array => {
  if (typeof payload !== 'string' || payload.length === 0 || payload.length % 2 !== 0 || !utils.isHexString(payload))
    throw new TypeError('Transaction payload must be non-empty, even-length hexadecimal.');
  const bytes = utils.hexToUint8(payload);
  if (bytes.length > 256 * 1024) throw new TypeError('Transaction payload exceeds 256 KiB.');
  return bytes;
};

/** 32 バイトの 16 進公開鍵を検証し、大文字表記へ正規化します。 */
export const normalizePublicKey = (value: string): string => {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new TypeError('Public key must be 32-byte hexadecimal.');
  return value.toUpperCase();
};
