import type { SignMessageParams, SignedMessage, StructuredMessage } from '@mosaiclynx/provider-api';
import { PublicKey, Signature } from '@nemnesia/symbol-sdk';
import { NemFacade } from '@nemnesia/symbol-sdk/nem';
import { SymbolFacade } from '@nemnesia/symbol-sdk/symbol';

import { fail } from './errors.js';
import { normalizePublicKey } from './transaction.js';
import type { MosaicLynxSignDataParams } from './types.js';

const encoder = new TextEncoder();
const PREFIX = encoder.encode('MOSAICLYNX\0MESSAGE\0V1\0');

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
  throw fail('INVALID_MESSAGE');
};

const base64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

const rfc3339Seconds = (date: Date): string =>
  new Date(Math.floor(date.getTime() / 1000) * 1000).toISOString().replace('.000Z', 'Z');

/** SDKが安全なnonceと短い有効期限を補完したProvider要求を作成します。 */
export const createDataSigningRequest = (params: MosaicLynxSignDataParams, now = new Date()): SignMessageParams => {
  if (!/^[a-z0-9][a-z0-9._:-]{0,63}$/.test(params.purpose)) throw fail('INVALID_MESSAGE');
  if (params.data.encoding === 'utf8') {
    if (
      params.data.value.normalize('NFC') !== params.data.value ||
      encoder.encode(params.data.value).length > 16 * 1024
    )
      throw fail('INVALID_MESSAGE');
  } else if (
    params.data.encoding !== 'hex' ||
    !/^(?:[0-9a-f]{2})*$/.test(params.data.value) ||
    params.data.value.length / 2 > 16 * 1024
  )
    throw fail('INVALID_MESSAGE');
  if (params.expectedSignerPublicKey) normalizePublicKey(params.expectedSignerPublicKey);
  return {
    chain: params.chain,
    network: params.network,
    purpose: params.purpose,
    nonce: base64Url(crypto.getRandomValues(new Uint8Array(24))),
    issuedAt: rfc3339Seconds(now),
    expiresAt: rfc3339Seconds(new Date(now.getTime() + 5 * 60_000)),
    payload: params.data,
  };
};

const signingBytes = (message: StructuredMessage): Uint8Array => {
  const body = encoder.encode(canonicalize(message));
  const bytes = new Uint8Array(PREFIX.length + body.length);
  bytes.set(PREFIX);
  bytes.set(body, PREFIX.length);
  return bytes;
};

const digest = async (bytes: Uint8Array): Promise<string> => {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice().buffer));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/** Provider/Relayから返された構造化データ署名を独立検証します。 */
export const verifySignedData = async (
  params: MosaicLynxSignDataParams,
  request: SignMessageParams,
  result: SignedMessage,
  origin: string
): Promise<SignedMessage> => {
  const expectedMessage: StructuredMessage = {
    domain: 'mosaiclynx.message.v1',
    origin: new URL(origin).origin,
    chain: request.chain,
    network: request.network,
    purpose: request.purpose,
    nonce: request.nonce,
    issuedAt: request.issuedAt,
    expiresAt: request.expiresAt,
    payload: request.payload,
  };
  if (JSON.stringify(result.message) !== JSON.stringify(expectedMessage)) throw fail('INVALID_RESPONSE');
  const bytes = signingBytes(expectedMessage);
  if ((await digest(bytes)) !== result.signingDigest.toLowerCase()) throw fail('INVALID_RESPONSE');
  const signer = normalizePublicKey(result.signerPublicKey);
  if (params.expectedSignerPublicKey && signer !== normalizePublicKey(params.expectedSignerPublicKey))
    throw fail('SIGNER_MISMATCH');
  try {
    const Verifier =
      params.chain === 'symbol'
        ? new SymbolFacade(params.network).static.Verifier
        : new NemFacade(params.network).static.Verifier;
    if (!new Verifier(new PublicKey(signer)).verify(bytes, new Signature(result.signature)))
      throw fail('INVALID_RESPONSE');
  } catch (error) {
    if (error instanceof Error && 'code' in error) throw error;
    throw fail('INVALID_RESPONSE');
  }
  return { ...result, signerPublicKey: signer };
};
