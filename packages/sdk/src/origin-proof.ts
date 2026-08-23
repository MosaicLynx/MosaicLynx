import { canonicalize } from './canonical.js';
import { hex, sha256 } from './crypto.js';
import { MosaicLynxSDKError, fail } from './errors.js';
import { validateHexPayload } from './transaction.js';
import type { MosaicLynxScope } from './types.js';

/** dApp のオリジンが署名要求を承認したことを示す証明。 */
interface OriginProof {
  readonly version: 'mosaiclynx.origin.v1';
  readonly keyId: string;
  readonly algorithm: 'Ed25519';
  readonly signature: string;
}

const isOriginProof = (value: unknown): value is OriginProof => {
  const proof = value as Partial<OriginProof> | undefined;
  return (
    proof?.version === 'mosaiclynx.origin.v1' &&
    proof.algorithm === 'Ed25519' &&
    typeof proof.keyId === 'string' &&
    proof.keyId.length > 0 &&
    typeof proof.signature === 'string' &&
    /^[A-Za-z0-9_-]+$/.test(proof.signature)
  );
};

/**
 * mainnet で許可する公開 HTTPS オリジンか検証します。
 * localhost とプライベート IPv4 帯は、外部公開を前提とする Origin Proof の取得先から除外します。
 */
const validMainnetOrigin = (origin: URL): boolean => {
  if (origin.protocol !== 'https:' || origin.port !== '') return false;
  const host = origin.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
  if (/^(?:10|127|169\.254|192\.168)\./.test(host)) return false;
  const private172 = /^172\.(\d+)\./.exec(host);
  return !(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
};

/**
 * mainnet の署名要求に必要な Origin Proof を dApp から取得します。
 * testnet は Origin Proof を要求しないため `undefined` を返します。
 */
export const getOriginProof = async (
  origin: string,
  operation: 'connect' | 'refreshActiveAccount' | 'signTransaction' | 'signData' | 'cosignTransaction',
  params: MosaicLynxScope & { readonly payload?: string; readonly payloadHash?: string },
  requestId: string,
  expiresAt: string
): Promise<OriginProof | undefined> => {
  if (params.network !== 'mainnet') return undefined;
  const parsed = new URL(origin);
  if (!validMainnetOrigin(parsed)) throw fail('INVALID_PARAMS');
  const input = {
    version: 'mosaiclynx.origin.v1',
    operation,
    requestId,
    initiatorOrigin: origin,
    chain: params.chain,
    network: 'mainnet',
    ...(params.payloadHash
      ? { payloadHash: params.payloadHash }
      : params.payload
        ? { payloadHash: hex(sha256(validateHexPayload(params.payload))) }
        : {}),
    expiresAt,
  } as const;
  try {
    const response = await fetch(`${origin}/.well-known/mosaiclynx/sign-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: canonicalize(input),
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
    });
    if (!response.ok) throw fail('UNAVAILABLE');
    const proof: unknown = await response.json();
    if (!isOriginProof(proof)) throw fail('INVALID_RESPONSE');
    return proof;
  } catch (error) {
    if (error instanceof MosaicLynxSDKError) throw error;
    throw fail('UNAVAILABLE');
  }
};
