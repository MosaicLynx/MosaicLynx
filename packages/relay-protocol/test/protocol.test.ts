import { describe, expect, it } from 'vitest';

import {
  base64UrlEncode,
  decryptRelayJson,
  deriveRelayKeys,
  encryptRelayJson,
  hex,
  parseAppLink,
  parseRelaySigningRequest,
  relayRequestDigest,
  webCryptoDriver,
} from '../src/index.js';

describe('relay protocol', () => {
  it('parses an exact App Link and derives separate keys', () => {
    const sessionId = base64UrlEncode(new Uint8Array(16).fill(1));
    const secret = new Uint8Array(32).fill(2);
    const token = base64UrlEncode(new Uint8Array(32).fill(3));
    const parsed = parseAppLink(
      `https://link.mosaiclynx.app/v1/handoff/${sessionId}#s=${base64UrlEncode(secret)}&a=${token}`
    );
    expect(parsed.sessionId).toBe(sessionId);
    const keys = deriveRelayKeys(parsed.sessionSecret, sessionId);
    expect(hex(keys.requestKey)).toBe('504cef5d2c18b81979151a88663f56e245cf665cac18c8bb9a18b3eb557d58b1');
    expect(hex(keys.responseKey)).toBe('f68cde3c90af1900d29557fe99338d42c9e84c9a85ee2c77285c523c10af3f3e');
  });

  it('matches the shared JCS and AES-GCM fixed vector', async () => {
    const sessionId = base64UrlEncode(new Uint8Array(16).fill(1));
    const key = deriveRelayKeys(new Uint8Array(32).fill(2), sessionId).requestKey;
    const driver = { ...webCryptoDriver, randomBytes: (length: number) => new Uint8Array(length).fill(4) };
    const encrypted = await encryptRelayJson(driver, key, { b: 2, a: 1 }, { test: 'aad' });
    expect(encrypted).toEqual({
      algorithm: 'A256GCM',
      nonce: 'BAQEBAQEBAQEBAQE',
      ciphertextAndTag: 'E5Ptvck-Khx2pRh6ssidsX83LiKglC6unWEA90U',
    });
    await expect(decryptRelayJson(driver, key, encrypted, { test: 'aad' })).resolves.toEqual({ a: 1, b: 2 });
  });

  it('accepts Testnet requests and rejects Mainnet at the application boundary, not protocol parsing', () => {
    const createdAt = '2026-07-20T00:00:00Z';
    const request = parseRelaySigningRequest(
      {
        protocol: 'mosaiclynx.relay.v1',
        operation: 'signTransaction',
        requestId: base64UrlEncode(new Uint8Array(16).fill(4)),
        initiatorOrigin: 'https://dapp.example',
        chain: 'symbol',
        network: 'testnet',
        payload: '00',
        createdAt,
        expiresAt: '2026-07-20T00:05:00Z',
      },
      Date.parse(createdAt)
    );
    expect(relayRequestDigest(request)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects unknown fragment fields', () => {
    const id = base64UrlEncode(new Uint8Array(16).fill(1));
    const secret = base64UrlEncode(new Uint8Array(32).fill(2));
    const token = base64UrlEncode(new Uint8Array(32).fill(3));
    expect(() => parseAppLink(`https://link.mosaiclynx.app/v1/handoff/${id}#s=${secret}&a=${token}&x=1`)).toThrow();
  });
});
