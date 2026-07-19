import { describe, expect, it } from 'vitest';

import { isId128, isToken256, parseEnvelope, parseExpiresAt } from '../src/types.js';

describe('Relay validators', () => {
  it('requires canonical base64url values with exact decoded lengths', () => {
    expect(isId128(Buffer.alloc(16).toString('base64url'))).toBe(true);
    expect(isId128(Buffer.alloc(15).toString('base64url'))).toBe(false);
    expect(isId128('++++++++++++++++++++++')).toBe(false);
    expect(isToken256(Buffer.alloc(32).toString('base64url'))).toBe(true);
    expect(isToken256(`${Buffer.alloc(32).toString('base64url')}=`)).toBe(false);
  });

  it('requires an exact, authenticated envelope shape', () => {
    const valid = {
      algorithm: 'A256GCM',
      nonce: Buffer.alloc(12).toString('base64url'),
      ciphertextAndTag: Buffer.alloc(16).toString('base64url'),
    };
    expect(parseEnvelope(valid)).toEqual(valid);
    expect(parseEnvelope({ ...valid, extra: true })).toBeUndefined();
    expect(parseEnvelope({ ...valid, nonce: Buffer.alloc(11).toString('base64url') })).toBeUndefined();
    expect(parseEnvelope({ ...valid, ciphertextAndTag: Buffer.alloc(15).toString('base64url') })).toBeUndefined();
  });

  it('accepts only second-precision expiries within five minutes', () => {
    const now = Date.parse('2026-07-20T00:00:00Z');
    expect(parseExpiresAt('2026-07-20T00:05:00Z', now)).toBe(now + 300_000);
    expect(parseExpiresAt('2026-07-20T00:05:01Z', now)).toBeUndefined();
    expect(parseExpiresAt('2026-07-20T00:00:00Z', now)).toBeUndefined();
    expect(parseExpiresAt('2026-07-20T00:01:00.000Z', now)).toBeUndefined();
  });
});
