import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';

export const RELAY_PROTOCOL = 'mosaiclynx.relay.v1' as const;
export const RELAY_ORIGIN = 'https://relay.mosaiclynx.app';
export const APP_LINK_ORIGIN = 'https://link.mosaiclynx.app';
export const MAX_TRANSACTION_BYTES = 256 * 1024;

const encoder = new TextEncoder();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const exactKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
): boolean => {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => key in value) && Object.keys(value).every((key) => allowed.has(key));
};

export const canonicalize = (value: unknown): string => {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('JCS rejects non-finite numbers.');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (!isRecord(value)) throw new TypeError('JCS rejects unsupported values.');
  return `{${Object.keys(value)
    .filter((key) => value[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(',')}}`;
};

export const utf8 = (value: string): Uint8Array => encoder.encode(value);

export const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

export const base64UrlDecode = (value: string, expectedLength?: number): Uint8Array => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new TypeError('Invalid base64url value.');
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (base64UrlEncode(bytes) !== value || (expectedLength !== undefined && bytes.length !== expectedLength))
    throw new TypeError('Invalid base64url value.');
  return bytes;
};

export const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

export const sha256 = (bytes: Uint8Array): Uint8Array => nobleSha256(bytes);

export const deriveRelayKeys = (
  secret: Uint8Array,
  sessionId: string
): { readonly requestKey: Uint8Array; readonly responseKey: Uint8Array } => {
  if (secret.length !== 32) throw new TypeError('Relay secret must be 32 bytes.');
  base64UrlDecode(sessionId, 16);
  const salt = sha256(utf8(`${RELAY_PROTOCOL}\0${sessionId}`));
  return {
    requestKey: hkdf(nobleSha256, secret, salt, utf8('request'), 32),
    responseKey: hkdf(nobleSha256, secret, salt, utf8('response'), 32),
  };
};

export interface EncryptedRelayEnvelope {
  readonly algorithm: 'A256GCM';
  readonly nonce: string;
  readonly ciphertextAndTag: string;
}

export interface RelayCryptoDriver {
  randomBytes(length: number): Uint8Array;
  encryptAesGcm(key: Uint8Array, plaintext: Uint8Array, nonce: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  decryptAesGcm(key: Uint8Array, ciphertextAndTag: Uint8Array, nonce: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
}

const arrayBuffer = (bytes: Uint8Array): ArrayBuffer => bytes.slice().buffer as ArrayBuffer;

/** Web Crypto adapter used by the browser SDK and Extension. */
export const webCryptoDriver: RelayCryptoDriver = {
  randomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  },
  async encryptAesGcm(key, plaintext, nonce, aad) {
    const imported = await crypto.subtle.importKey('raw', arrayBuffer(key), 'AES-GCM', false, ['encrypt']);
    return new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: arrayBuffer(nonce), additionalData: arrayBuffer(aad), tagLength: 128 },
        imported,
        arrayBuffer(plaintext)
      )
    );
  },
  async decryptAesGcm(key, ciphertextAndTag, nonce, aad) {
    const imported = await crypto.subtle.importKey('raw', arrayBuffer(key), 'AES-GCM', false, ['decrypt']);
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: arrayBuffer(nonce), additionalData: arrayBuffer(aad), tagLength: 128 },
        imported,
        arrayBuffer(ciphertextAndTag)
      )
    );
  },
};

export const relayAad = (sessionId: string, direction: 'request' | 'response', expiresAt: string) => ({
  protocol: RELAY_PROTOCOL,
  sessionId,
  direction,
  expiresAt,
});

export const encryptRelayJson = async (
  driver: RelayCryptoDriver,
  key: Uint8Array,
  value: unknown,
  aad: unknown
): Promise<EncryptedRelayEnvelope> => {
  const nonce = driver.randomBytes(12);
  const ciphertextAndTag = await driver.encryptAesGcm(key, utf8(canonicalize(value)), nonce, utf8(canonicalize(aad)));
  return { algorithm: 'A256GCM', nonce: base64UrlEncode(nonce), ciphertextAndTag: base64UrlEncode(ciphertextAndTag) };
};

export const decryptRelayJson = async (
  driver: RelayCryptoDriver,
  key: Uint8Array,
  envelope: EncryptedRelayEnvelope,
  aad: unknown
): Promise<unknown> => {
  if (!isEncryptedRelayEnvelope(envelope)) throw new TypeError('Invalid relay envelope.');
  const plaintext = await driver.decryptAesGcm(
    key,
    base64UrlDecode(envelope.ciphertextAndTag),
    base64UrlDecode(envelope.nonce, 12),
    utf8(canonicalize(aad))
  );
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext)) as unknown;
};

export const isEncryptedRelayEnvelope = (value: unknown): value is EncryptedRelayEnvelope =>
  isRecord(value) &&
  exactKeys(value, ['algorithm', 'nonce', 'ciphertextAndTag']) &&
  value.algorithm === 'A256GCM' &&
  typeof value.nonce === 'string' &&
  typeof value.ciphertextAndTag === 'string';

export interface RelaySigningRequest {
  readonly protocol: typeof RELAY_PROTOCOL;
  readonly operation: 'signTransaction';
  readonly requestId: string;
  readonly initiatorOrigin: string;
  readonly chain: 'symbol' | 'nem';
  readonly network: 'mainnet' | 'testnet';
  readonly payload: string;
  readonly expectedSignerPublicKey?: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

const rfc3339Seconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export const parseRelaySigningRequest = (value: unknown, now = Date.now()): RelaySigningRequest => {
  if (
    !isRecord(value) ||
    !exactKeys(
      value,
      [
        'protocol',
        'operation',
        'requestId',
        'initiatorOrigin',
        'chain',
        'network',
        'payload',
        'createdAt',
        'expiresAt',
      ],
      ['expectedSignerPublicKey', 'originProof']
    )
  )
    throw new TypeError('Invalid Relay signing request schema.');
  if (value.protocol !== RELAY_PROTOCOL || value.operation !== 'signTransaction')
    throw new TypeError('Unsupported Relay operation.');
  if (typeof value.requestId !== 'string') throw new TypeError('Invalid request ID.');
  base64UrlDecode(value.requestId, 16);
  if (typeof value.initiatorOrigin !== 'string' || new URL(value.initiatorOrigin).origin !== value.initiatorOrigin)
    throw new TypeError('Invalid initiator Origin.');
  if (value.chain !== 'symbol' && value.chain !== 'nem') throw new TypeError('Invalid chain.');
  if (value.network !== 'mainnet' && value.network !== 'testnet') throw new TypeError('Invalid network.');
  if (
    typeof value.payload !== 'string' ||
    !/^(?:[0-9a-fA-F]{2})+$/.test(value.payload) ||
    value.payload.length / 2 > MAX_TRANSACTION_BYTES
  )
    throw new TypeError('Invalid transaction payload.');
  if (
    value.expectedSignerPublicKey !== undefined &&
    (typeof value.expectedSignerPublicKey !== 'string' || !/^[0-9a-fA-F]{64}$/.test(value.expectedSignerPublicKey))
  )
    throw new TypeError('Invalid expected signer.');
  if (
    typeof value.createdAt !== 'string' ||
    typeof value.expiresAt !== 'string' ||
    !rfc3339Seconds.test(value.createdAt) ||
    !rfc3339Seconds.test(value.expiresAt)
  )
    throw new TypeError('Invalid Relay timestamps.');
  const created = Date.parse(value.createdAt);
  const expires = Date.parse(value.expiresAt);
  if (!Number.isFinite(created) || !Number.isFinite(expires) || expires !== created + 300_000 || now > expires)
    throw new TypeError('Relay signing request expired.');
  return {
    protocol: RELAY_PROTOCOL,
    operation: 'signTransaction',
    requestId: value.requestId,
    initiatorOrigin: value.initiatorOrigin,
    chain: value.chain,
    network: value.network,
    payload: value.payload,
    ...(typeof value.expectedSignerPublicKey === 'string'
      ? { expectedSignerPublicKey: value.expectedSignerPublicKey.toUpperCase() }
      : {}),
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
  };
};

export interface ParsedAppLink {
  readonly sessionId: string;
  readonly sessionSecret: Uint8Array;
  readonly appToken: string;
}

export const parseAppLink = (rawUrl: string): ParsedAppLink => {
  const url = new URL(rawUrl);
  const path = /^\/v1\/handoff\/([A-Za-z0-9_-]{22})$/.exec(url.pathname);
  if (url.origin !== APP_LINK_ORIGIN || url.search || !path?.[1]) throw new TypeError('Invalid MosaicLynx App Link.');
  const fragment = url.hash.slice(1);
  const pairs = fragment.split('&');
  if (pairs.length !== 2) throw new TypeError('Invalid MosaicLynx App Link fragment.');
  const values = new Map<string, string>();
  for (const pair of pairs) {
    const [key, value, extra] = pair.split('=');
    if (!key || !value || extra !== undefined || values.has(key) || (key !== 's' && key !== 'a'))
      throw new TypeError('Invalid MosaicLynx App Link fragment.');
    values.set(key, value);
  }
  const sessionId = path[1];
  base64UrlDecode(sessionId, 16);
  const sessionSecret = base64UrlDecode(values.get('s') ?? '', 32);
  const appToken = values.get('a') ?? '';
  base64UrlDecode(appToken, 32);
  return { sessionId, sessionSecret, appToken };
};

export const relayRequestDigest = (request: RelaySigningRequest): string => hex(sha256(utf8(canonicalize(request))));

export interface SignedTransaction {
  readonly payload: string;
  readonly hash: string;
  readonly signerPublicKey: string;
}

export type RelaySigningResponse =
  | {
      readonly protocol: typeof RELAY_PROTOCOL;
      readonly requestId: string;
      readonly requestDigest: string;
      readonly outcome: 'signed';
      readonly signedTransaction: SignedTransaction;
      readonly completedAt: string;
    }
  | {
      readonly protocol: typeof RELAY_PROTOCOL;
      readonly requestId: string;
      readonly requestDigest: string;
      readonly outcome: 'rejected' | 'failed';
      readonly errorCode: string;
      readonly completedAt: string;
    };
