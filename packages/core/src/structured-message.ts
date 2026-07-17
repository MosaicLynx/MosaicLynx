import type { ChainKind, NetworkKind } from './domain.js';
import { MosaicLynxError } from './domain.js';

export interface StructuredMessageInput {
  readonly chain: ChainKind;
  readonly network: NetworkKind;
  readonly purpose: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payload: { readonly encoding: 'utf8' | 'hex'; readonly value: string };
}

export interface StructuredMessage extends StructuredMessageInput {
  readonly domain: 'mosaiclynx.message.v1';
  readonly origin: string;
}

const encoder = new TextEncoder();
const PREFIX = encoder.encode('MOSAICLYNX\0MESSAGE\0V1\0');
const RFC3339_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const canonicalize = (value: unknown): string => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number')
    return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(',')}}`;
  }
  throw new MosaicLynxError('INVALID_MESSAGE', 'Structured message is not JSON-compatible.');
};

const decodedBase64UrlLength = (value: string): number => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return -1;
  const remainder = value.length % 4;
  if (remainder === 1) return -1;
  return Math.floor((value.length * 3) / 4);
};

export const createStructuredMessage = (
  origin: string,
  input: StructuredMessageInput,
  now = new Date()
): { readonly message: StructuredMessage; readonly signingBytes: Uint8Array } => {
  let canonicalOrigin: string;
  try {
    canonicalOrigin = new URL(origin).origin;
  } catch {
    throw new MosaicLynxError('INVALID_MESSAGE', 'Origin is invalid.');
  }
  if (!/^https?:\/\//.test(canonicalOrigin)) throw new MosaicLynxError('INVALID_MESSAGE', 'Origin is unsupported.');
  if (!/^[a-z0-9][a-z0-9._:-]{0,63}$/.test(input.purpose))
    throw new MosaicLynxError('INVALID_MESSAGE', 'Purpose is invalid.');
  const nonceLength = decodedBase64UrlLength(input.nonce);
  if (nonceLength < 16 || nonceLength > 32)
    throw new MosaicLynxError('INVALID_MESSAGE', 'Nonce must contain 16 to 32 random bytes.');
  if (!RFC3339_SECONDS.test(input.issuedAt) || !RFC3339_SECONDS.test(input.expiresAt))
    throw new MosaicLynxError('INVALID_MESSAGE', 'Timestamps must be UTC RFC 3339 seconds.');
  const issuedAt = Date.parse(input.issuedAt);
  const expiresAt = Date.parse(input.expiresAt);
  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    Math.abs(issuedAt - now.getTime()) > 5 * 60_000 ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > 10 * 60_000 ||
    expiresAt <= now.getTime()
  )
    throw new MosaicLynxError('REQUEST_EXPIRED', 'Structured message timestamps are outside the allowed window.');
  if (input.payload.encoding === 'utf8') {
    if (input.payload.value.normalize('NFC') !== input.payload.value)
      throw new MosaicLynxError('INVALID_MESSAGE', 'UTF-8 payload must already be NFC normalized.');
    if (encoder.encode(input.payload.value).length > 16 * 1024)
      throw new MosaicLynxError('INVALID_MESSAGE', 'Message payload exceeds 16 KiB.');
  } else if (input.payload.encoding === 'hex') {
    if (!/^(?:[0-9a-f]{2})*$/.test(input.payload.value) || input.payload.value.length / 2 > 16 * 1024)
      throw new MosaicLynxError('INVALID_MESSAGE', 'Hex payload is invalid or too large.');
  } else {
    throw new MosaicLynxError('INVALID_MESSAGE', 'Payload encoding is unsupported.');
  }
  const message: StructuredMessage = {
    domain: 'mosaiclynx.message.v1',
    origin: canonicalOrigin,
    ...input,
  };
  const body = encoder.encode(canonicalize(message));
  const signingBytes = new Uint8Array(PREFIX.length + body.length);
  signingBytes.set(PREFIX);
  signingBytes.set(body, PREFIX.length);
  return { message, signingBytes };
};

export const structuredMessageDigest = async (signingBytes: Uint8Array): Promise<string> => {
  const copy = new Uint8Array(signingBytes.length);
  copy.set(signingBytes);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', copy.buffer));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
};
