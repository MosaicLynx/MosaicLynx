import type {
  MosaicLynxCosignature,
  SignMessageParams,
  SignedMessage,
  SignedTransaction,
} from '@mosaiclynx/provider-api';
import {
  RELAY_ORIGIN,
  RELAY_PROTOCOL,
  type RelayRequest,
  type RelayResponse,
  parseRelayResponse,
} from '@mosaiclynx/relay-protocol';

import { isActiveAccount } from './account-cache.js';
import { canonicalize } from './canonical.js';
import { verifyCosignature } from './cosignature.js';
import {
  type EncryptedRelayEnvelope,
  base64UrlEncode,
  decryptJson,
  deriveRelayKeys,
  encryptJson,
  hex,
  randomBytes,
  sha256,
  utf8,
} from './crypto.js';
import { verifySignedData } from './data-signing.js';
import { MosaicLynxSDKError, fail } from './errors.js';
import { getOriginProof } from './origin-proof.js';
import { normalizePublicKey, validateHexPayload, verifySignedTransaction } from './transaction.js';
import type {
  MosaicLynxActiveAccount,
  MosaicLynxCosignTransactionParams,
  MosaicLynxSDKErrorCode,
  MosaicLynxScope,
  MosaicLynxSignDataParams,
  MosaicLynxSignTransactionParams,
} from './types.js';

const PROTOCOL = RELAY_PROTOCOL;

const relayFetch = (path: string, init: RequestInit): Promise<Response> =>
  fetch(`${RELAY_ORIGIN}${path}`, {
    ...init,
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
  });

const rfc3339Seconds = (date: Date): string =>
  new Date(Math.floor(date.getTime() / 1000) * 1000).toISOString().replace('.000Z', 'Z');

const openAppLink = (url: string): void => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.rel = 'noreferrer';
  anchor.style.display = 'none';
  document.documentElement.append(anchor);
  anchor.click();
  anchor.remove();
};

const isEnvelope = (value: unknown): value is EncryptedRelayEnvelope => {
  const envelope = value as Partial<EncryptedRelayEnvelope> | undefined;
  return (
    envelope?.algorithm === 'A256GCM' &&
    typeof envelope.nonce === 'string' &&
    typeof envelope.ciphertextAndTag === 'string'
  );
};

const sleep = (milliseconds: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const id = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(fail('CONTEXT_CHANGED'));
      },
      { once: true }
    );
  });

interface HandoffContext {
  readonly origin: string;
  readonly requestId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

const responseError = (result: RelayResponse): MosaicLynxSDKError | undefined => {
  if (result.outcome !== 'rejected' && result.outcome !== 'failed') return undefined;
  const allowed: readonly MosaicLynxSDKErrorCode[] = [
    'USER_REJECTED',
    'UNAVAILABLE',
    'NOT_CONNECTED',
    'VAULT_LOCKED',
    'REQUEST_EXPIRED',
    'INVALID_PARAMS',
    'INVALID_TRANSACTION',
    'UNSUPPORTED_TRANSACTION',
    'CHAIN_MISMATCH',
    'NETWORK_MISMATCH',
    'SIGNER_MISMATCH',
    'CONTEXT_CHANGED',
    'INTERNAL_ERROR',
  ];
  return fail(
    result.outcome === 'rejected'
      ? 'USER_REJECTED'
      : allowed.includes(result.errorCode as MosaicLynxSDKErrorCode)
        ? (result.errorCode as MosaicLynxSDKErrorCode)
        : 'INTERNAL_ERROR'
  );
};

const runMobileHandoff = async (
  buildRequest: (context: HandoffContext) => Promise<RelayRequest> | RelayRequest
): Promise<RelayResponse> => {
  if (window.top !== window || window.location.origin === 'null' || window.location.protocol !== 'https:')
    throw fail('UNAVAILABLE');
  const origin = window.location.origin;
  const created = new Date();
  const context: HandoffContext = {
    origin,
    requestId: base64UrlEncode(randomBytes(16)),
    createdAt: rfc3339Seconds(created),
    expiresAt: rfc3339Seconds(new Date(created.getTime() + 5 * 60_000)),
  };
  const sessionId = base64UrlEncode(randomBytes(16));
  const sessionSecret = randomBytes(32);
  const appTokenBytes = randomBytes(32);
  const webTokenBytes = randomBytes(32);
  const appToken = base64UrlEncode(appTokenBytes);
  const webToken = base64UrlEncode(webTokenBytes);
  try {
    const request = await buildRequest(context);
    const requestDigest = hex(sha256(utf8(canonicalize(request))));
    const keys = await deriveRelayKeys(sessionSecret, sessionId);
    const aad = (direction: 'request' | 'response') => ({
      protocol: PROTOCOL,
      sessionId,
      direction,
      expiresAt: context.expiresAt,
    });
    const encrypted = await encryptJson(keys.requestKey, request, aad('request'));
    const createResponse = await relayFetch('/v1/handoffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: canonicalize({
        protocol: PROTOCOL,
        sessionId,
        requestId: context.requestId,
        expiresAt: context.expiresAt,
        appTokenHash: hex(sha256(appTokenBytes)),
        webTokenHash: hex(sha256(webTokenBytes)),
        request: encrypted,
      }),
    });
    if (createResponse.status !== 201) throw fail('INTERNAL_ERROR');

    const controller = new AbortController();
    let consumed = false;
    const cancel = (): void => controller.abort();
    window.addEventListener('pagehide', cancel, { once: true });
    openAppLink(
      `https://link.mosaiclynx.app/v1/handoff/${sessionId}#s=${base64UrlEncode(sessionSecret)}&a=${appToken}`
    );
    try {
      let backoff = 1000;
      while (Date.now() < created.getTime() + 5 * 60_000) {
        if (window.location.origin !== origin) throw fail('CONTEXT_CHANGED');
        const response = await relayFetch(`/v1/handoffs/${sessionId}/response?wait=25`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${webToken}` },
          signal: controller.signal,
        });
        if (response.status === 204) {
          await sleep(backoff, controller.signal);
          backoff = Math.min(5000, backoff * 2);
          continue;
        }
        if (!response.ok) throw fail('INTERNAL_ERROR');
        const envelope: unknown = await response.json();
        if (!isEnvelope(envelope)) throw fail('INVALID_RESPONSE');
        let logical: unknown;
        try {
          logical = await decryptJson(keys.responseKey, envelope, aad('response'));
        } catch {
          throw fail('INVALID_RESPONSE');
        }
        let result: RelayResponse;
        try {
          result = parseRelayResponse(logical);
        } catch {
          throw fail('INVALID_RESPONSE');
        }
        if (
          result.protocol !== PROTOCOL ||
          result.requestId !== context.requestId ||
          result.requestDigest !== requestDigest
        )
          throw fail('INVALID_RESPONSE');
        const responseFailure = responseError(result);
        if (responseFailure) throw responseFailure;
        const ack = await relayFetch(`/v1/handoffs/${sessionId}/ack`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${webToken}` },
        });
        if (!ack.ok) throw fail('INTERNAL_ERROR');
        consumed = true;
        return result;
      }
      throw fail('REQUEST_EXPIRED');
    } catch (error) {
      if (!(error instanceof MosaicLynxSDKError)) throw fail('INTERNAL_ERROR');
      throw error;
    } finally {
      window.removeEventListener('pagehide', cancel);
      if (!consumed) {
        void relayFetch(`/v1/handoffs/${sessionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${webToken}` },
        }).catch(() => undefined);
      }
    }
  } finally {
    sessionSecret.fill(0);
    appTokenBytes.fill(0);
    webTokenBytes.fill(0);
  }
};

export const connectWithMobileRelay = async (params: MosaicLynxScope): Promise<MosaicLynxActiveAccount> => {
  const result = await runMobileHandoff(async (context) => {
    const originProof = await getOriginProof(context.origin, 'connect', params, context.requestId, context.expiresAt);
    return {
      protocol: PROTOCOL,
      operation: 'connect',
      requestId: context.requestId,
      initiatorOrigin: context.origin,
      ...(originProof ? { originProof } : {}),
      ...params,
      createdAt: context.createdAt,
      expiresAt: context.expiresAt,
    };
  });
  if (result.outcome !== 'connected' || !isActiveAccount(result.account)) throw fail('INVALID_RESPONSE');
  return { ...result.account, publicKey: result.account.publicKey.toUpperCase() };
};

export const refreshActiveAccountWithMobileRelay = async (
  params: MosaicLynxScope
): Promise<MosaicLynxActiveAccount | undefined> => {
  const result = await runMobileHandoff(async (context) => {
    const originProof = await getOriginProof(
      context.origin,
      'refreshActiveAccount',
      params,
      context.requestId,
      context.expiresAt
    );
    return {
      protocol: PROTOCOL,
      operation: 'refreshActiveAccount',
      requestId: context.requestId,
      initiatorOrigin: context.origin,
      ...params,
      ...(originProof ? { originProof } : {}),
      createdAt: context.createdAt,
      expiresAt: context.expiresAt,
    };
  });
  if (result.outcome !== 'activeAccountRefreshed') throw fail('INVALID_RESPONSE');
  if (result.account === undefined) return undefined;
  if (!isActiveAccount(result.account)) throw fail('INVALID_RESPONSE');
  return { ...result.account, publicKey: result.account.publicKey.toUpperCase() };
};

export const disconnectWithMobileRelay = async (): Promise<void> => {
  const result = await runMobileHandoff((context) => ({
    protocol: PROTOCOL,
    operation: 'disconnect',
    requestId: context.requestId,
    initiatorOrigin: context.origin,
    createdAt: context.createdAt,
    expiresAt: context.expiresAt,
  }));
  if (result.outcome !== 'disconnected') throw fail('INVALID_RESPONSE');
};

export const signWithMobileRelay = async (params: MosaicLynxSignTransactionParams): Promise<SignedTransaction> => {
  const result = await runMobileHandoff(async (context) => {
    const originProof = await getOriginProof(
      context.origin,
      'signTransaction',
      params,
      context.requestId,
      context.expiresAt
    );
    return {
      protocol: PROTOCOL,
      operation: 'signTransaction',
      requestId: context.requestId,
      initiatorOrigin: context.origin,
      ...(originProof ? { originProof } : {}),
      chain: params.chain,
      network: params.network,
      payload: params.payload,
      ...(params.expectedSignerPublicKey
        ? { expectedSignerPublicKey: normalizePublicKey(params.expectedSignerPublicKey) }
        : {}),
      createdAt: context.createdAt,
      expiresAt: context.expiresAt,
    };
  });
  if (result.outcome !== 'signed') throw fail('INVALID_RESPONSE');
  try {
    return verifySignedTransaction(params, result.signedTransaction);
  } catch {
    throw fail('INVALID_RESPONSE');
  }
};

export const signDataWithMobileRelay = async (
  params: MosaicLynxSignDataParams,
  request: SignMessageParams
): Promise<SignedMessage> => {
  const result = await runMobileHandoff(async (context) => {
    const payloadHash = hex(sha256(utf8(canonicalize(request))));
    const originProof = await getOriginProof(
      context.origin,
      'signData',
      { ...params, payloadHash },
      context.requestId,
      context.expiresAt
    );
    return {
      protocol: PROTOCOL,
      operation: 'signData',
      requestId: context.requestId,
      initiatorOrigin: context.origin,
      chain: params.chain,
      network: params.network,
      purpose: request.purpose,
      nonce: request.nonce,
      issuedAt: request.issuedAt,
      messageExpiresAt: request.expiresAt,
      payload: request.payload,
      ...(params.expectedSignerPublicKey
        ? { expectedSignerPublicKey: normalizePublicKey(params.expectedSignerPublicKey) }
        : {}),
      ...(originProof ? { originProof } : {}),
      createdAt: context.createdAt,
      expiresAt: context.expiresAt,
    };
  });
  if (result.outcome !== 'dataSigned') throw fail('INVALID_RESPONSE');
  return verifySignedData(params, request, result.signedData, window.location.origin);
};

export const cosignWithMobileRelay = async (
  params: MosaicLynxCosignTransactionParams
): Promise<MosaicLynxCosignature> => {
  validateHexPayload(params.parentPayload);
  if (params.chain === 'nem') validateHexPayload(params.payload);
  const result = await runMobileHandoff(async (context) => {
    const payloadHash = hex(sha256(validateHexPayload(params.parentPayload)));
    const originProof = await getOriginProof(
      context.origin,
      'cosignTransaction',
      { ...params, payloadHash },
      context.requestId,
      context.expiresAt
    );
    const common = {
      protocol: PROTOCOL,
      operation: 'cosignTransaction' as const,
      requestId: context.requestId,
      initiatorOrigin: context.origin,
      network: params.network,
      parentPayload: params.parentPayload,
      ...(params.expectedSignerPublicKey
        ? { expectedSignerPublicKey: normalizePublicKey(params.expectedSignerPublicKey) }
        : {}),
      ...(originProof ? { originProof } : {}),
      createdAt: context.createdAt,
      expiresAt: context.expiresAt,
    };
    return params.chain === 'symbol'
      ? { ...common, chain: 'symbol' as const, detached: params.detached }
      : { ...common, chain: 'nem' as const, payload: params.payload };
  });
  if (result.outcome !== 'cosigned' || result.cosignature.chain !== params.chain) throw fail('INVALID_RESPONSE');
  return verifyCosignature(params, result.cosignature);
};
