export const RELAY_PROTOCOL = 'mosaiclynx.relay.v1' as const;
export const MAX_BODY_BYTES = 512 * 1024;

export interface EncryptedRelayEnvelope {
  readonly algorithm: 'A256GCM';
  readonly nonce: string;
  readonly ciphertextAndTag: string;
}

export interface CreateHandoffRequest {
  readonly protocol: typeof RELAY_PROTOCOL;
  readonly sessionId: string;
  readonly requestId: string;
  readonly expiresAt: string;
  readonly appTokenHash: string;
  readonly webTokenHash: string;
  readonly request: EncryptedRelayEnvelope;
}

export interface StoredSession {
  readonly status: 'pending' | 'response_available';
  readonly expiresAtMs: number;
  readonly appTokenHash: string;
  readonly webTokenHash: string;
  readonly request: string;
  readonly response?: string;
  readonly responseFingerprint?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, required: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...required].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const decodeBase64Url = (value: string): Buffer | undefined => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return undefined;
  try {
    const decoded = Buffer.from(value, 'base64url');
    return decoded.toString('base64url') === value ? decoded : undefined;
  } catch {
    return undefined;
  }
};

export const isId128 = (value: unknown): value is string =>
  typeof value === 'string' && value.length === 22 && decodeBase64Url(value)?.byteLength === 16;

export const isToken256 = (value: unknown): value is string =>
  typeof value === 'string' && value.length === 43 && decodeBase64Url(value)?.byteLength === 32;

export const isSha256Hex = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

export const parseEnvelope = (value: unknown): EncryptedRelayEnvelope | undefined => {
  if (!isRecord(value) || !hasExactKeys(value, ['algorithm', 'nonce', 'ciphertextAndTag'])) return undefined;
  if (value.algorithm !== 'A256GCM' || typeof value.nonce !== 'string' || typeof value.ciphertextAndTag !== 'string')
    return undefined;
  const nonce = decodeBase64Url(value.nonce);
  const ciphertext = decodeBase64Url(value.ciphertextAndTag);
  if (nonce?.byteLength !== 12 || !ciphertext || ciphertext.byteLength < 16) return undefined;
  return {
    algorithm: value.algorithm,
    nonce: value.nonce,
    ciphertextAndTag: value.ciphertextAndTag,
  };
};

export const canonicalEnvelope = (envelope: EncryptedRelayEnvelope): string =>
  JSON.stringify({
    algorithm: envelope.algorithm,
    nonce: envelope.nonce,
    ciphertextAndTag: envelope.ciphertextAndTag,
  });

export const parseExpiresAt = (value: unknown, nowMs: number): number | undefined => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return undefined;
  const expiresAtMs = Date.parse(value);
  if (!Number.isFinite(expiresAtMs)) return undefined;
  if (new Date(expiresAtMs).toISOString().replace('.000Z', 'Z') !== value) return undefined;
  return expiresAtMs > nowMs && expiresAtMs <= nowMs + 300_000 ? expiresAtMs : undefined;
};

export const parseCreateHandoff = (value: unknown, nowMs: number): CreateHandoffRequest | undefined => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'protocol',
      'sessionId',
      'requestId',
      'expiresAt',
      'appTokenHash',
      'webTokenHash',
      'request',
    ]) ||
    value.protocol !== RELAY_PROTOCOL ||
    !isId128(value.sessionId) ||
    !isId128(value.requestId) ||
    !isSha256Hex(value.appTokenHash) ||
    !isSha256Hex(value.webTokenHash) ||
    value.appTokenHash === value.webTokenHash
  )
    return undefined;
  const request = parseEnvelope(value.request);
  const expiresAtMs = parseExpiresAt(value.expiresAt, nowMs);
  if (!request || expiresAtMs === undefined) return undefined;
  return {
    protocol: RELAY_PROTOCOL,
    sessionId: value.sessionId,
    requestId: value.requestId,
    expiresAt: value.expiresAt as string,
    appTokenHash: value.appTokenHash,
    webTokenHash: value.webTokenHash,
    request,
  };
};

export const parseJsonBuffer = (
  body: unknown
): { readonly value: unknown; readonly byteLength: number } | undefined => {
  if (!Buffer.isBuffer(body)) return undefined;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body);
    return { value: JSON.parse(text) as unknown, byteLength: body.byteLength };
  } catch {
    return undefined;
  }
};
