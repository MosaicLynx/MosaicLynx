import {
  type MosaicAccount,
  type MosaicLynxProvider,
  ProviderRpcError,
  type SignedTransaction,
  isSupportedApiVersion,
} from '@mosaiclynx/provider-api';

import { canonicalize } from './canonical.js';
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
import { normalizePublicKey, validateHexPayload, verifySignedTransaction } from './transaction.js';

export type MosaicLynxChain = 'symbol' | 'nem';
export type MosaicLynxNetwork = 'mainnet' | 'testnet';

export interface MosaicLynxSignTransactionParams {
  readonly chain: MosaicLynxChain;
  readonly network: MosaicLynxNetwork;
  readonly payload: string;
  readonly expectedSignerPublicKey?: string;
}

export { type SignedTransaction } from '@mosaiclynx/provider-api';

export type MosaicLynxSDKErrorCode =
  | 'USER_REJECTED'
  | 'UNAVAILABLE'
  | 'APP_NOT_INSTALLED'
  | 'VAULT_LOCKED'
  | 'REQUEST_EXPIRED'
  | 'INVALID_PARAMS'
  | 'INVALID_TRANSACTION'
  | 'UNSUPPORTED_TRANSACTION'
  | 'CHAIN_MISMATCH'
  | 'NETWORK_MISMATCH'
  | 'SIGNER_MISMATCH'
  | 'CONTEXT_CHANGED'
  | 'INVALID_RESPONSE'
  | 'INTERNAL_ERROR';

export class MosaicLynxSDKError extends Error {
  public constructor(
    public readonly code: MosaicLynxSDKErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'MosaicLynxSDKError';
  }
}

export interface MosaicLynxDiagnosticEvent {
  readonly phase: 'transport_selected' | 'approval_requested' | 'response_received' | 'completed' | 'failed';
  readonly transport: 'extension' | 'mobile-relay';
  readonly timestamp: string;
  readonly errorCode?: MosaicLynxSDKErrorCode;
}

export interface MosaicLynxSDKOptions {
  readonly diagnostics?: {
    readonly enabled: boolean;
    readonly onEvent?: (event: MosaicLynxDiagnosticEvent) => void;
  };
}

export interface MosaicLynxSDK {
  readonly version: string;
  isAvailable(): Promise<boolean>;
  signTransaction(params: MosaicLynxSignTransactionParams): Promise<SignedTransaction>;
}

declare global {
  interface Window {
    mosaicLynx?: MosaicLynxProvider;
  }
}

const SDK_VERSION = '1.0.0';
const RELAY_ORIGIN = 'https://relay.mosaiclynx.app';
const PROTOCOL = 'mosaiclynx.relay.v1' as const;

const publicMessage: Record<MosaicLynxSDKErrorCode, string> = {
  USER_REJECTED: 'The signing request was rejected.',
  UNAVAILABLE: 'MosaicLynx is not available in this browser.',
  APP_NOT_INSTALLED: 'The MosaicLynx app is not installed.',
  VAULT_LOCKED: 'The MosaicLynx vault is locked.',
  REQUEST_EXPIRED: 'The signing request expired.',
  INVALID_PARAMS: 'The signing request parameters are invalid.',
  INVALID_TRANSACTION: 'The transaction is invalid.',
  UNSUPPORTED_TRANSACTION: 'The transaction type or version is unsupported.',
  CHAIN_MISMATCH: 'The transaction chain does not match the request.',
  NETWORK_MISMATCH: 'The transaction network does not match the request.',
  SIGNER_MISMATCH: 'The transaction signer does not match the request.',
  CONTEXT_CHANGED: 'The page context changed while signing.',
  INVALID_RESPONSE: 'MosaicLynx returned an invalid response.',
  INTERNAL_ERROR: 'MosaicLynx could not complete the request.',
};

const fail = (code: MosaicLynxSDKErrorCode): MosaicLynxSDKError => new MosaicLynxSDKError(code, publicMessage[code]);

const isProviderShape = (value: unknown): value is MosaicLynxProvider => {
  const provider = value as Partial<MosaicLynxProvider> | undefined;
  return (
    typeof provider?.apiVersion === 'string' &&
    typeof provider.getAccounts === 'function' &&
    typeof provider.connect === 'function' &&
    typeof provider.signTransaction === 'function'
  );
};

const providerState = (): 'none' | 'supported' | 'unsupported' => {
  if (typeof window === 'undefined' || window.mosaicLynx === undefined) return 'none';
  return isProviderShape(window.mosaicLynx) && isSupportedApiVersion(window.mosaicLynx.apiVersion)
    ? 'supported'
    : 'unsupported';
};

const hasMobilePlatform = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (!globalThis.crypto?.subtle || typeof fetch !== 'function' || typeof document.visibilityState !== 'string')
    return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const mapProviderError = (error: unknown): MosaicLynxSDKError => {
  if (!(error instanceof ProviderRpcError) && !(typeof error === 'object' && error && 'code' in error))
    return fail('INTERNAL_ERROR');
  const code = String((error as { code: unknown }).code);
  const allowed: readonly MosaicLynxSDKErrorCode[] = [
    'USER_REJECTED',
    'VAULT_LOCKED',
    'INVALID_PARAMS',
    'INVALID_TRANSACTION',
    'UNSUPPORTED_TRANSACTION',
    'CHAIN_MISMATCH',
    'NETWORK_MISMATCH',
    'CONTEXT_CHANGED',
    'REQUEST_EXPIRED',
  ];
  return fail(
    allowed.includes(code as MosaicLynxSDKErrorCode)
      ? (code as MosaicLynxSDKErrorCode)
      : code === 'ACCOUNT_NOT_FOUND'
        ? 'SIGNER_MISMATCH'
        : code === 'UNSUPPORTED_CHAIN'
          ? 'UNAVAILABLE'
          : 'INTERNAL_ERROR'
  );
};

const matchingAccounts = (
  accounts: readonly MosaicAccount[],
  params: MosaicLynxSignTransactionParams
): readonly MosaicAccount[] =>
  accounts.filter((account) => account.scope.chain === params.chain && account.scope.network === params.network);

const signWithExtension = async (
  provider: MosaicLynxProvider,
  params: MosaicLynxSignTransactionParams
): Promise<SignedTransaction> => {
  let accounts: readonly MosaicAccount[];
  try {
    accounts = matchingAccounts(await provider.getAccounts(), params);
    if (accounts.length === 0)
      accounts = matchingAccounts(await provider.connect({ chain: params.chain, network: params.network }), params);
  } catch (error) {
    throw mapProviderError(error);
  }

  let accountId: string | undefined;
  if (params.expectedSignerPublicKey) {
    const expected = normalizePublicKey(params.expectedSignerPublicKey);
    accountId = accounts.find((account) => account.publicKey.toUpperCase() === expected)?.id;
    if (!accountId) throw fail('SIGNER_MISMATCH');
  }

  try {
    const result = await provider.signTransaction({
      chain: params.chain,
      network: params.network,
      payload: params.payload,
      ...(accountId ? { accountId } : {}),
    });
    return verifySignedTransaction(params, result);
  } catch (error) {
    if (error instanceof MosaicLynxSDKError) throw error;
    if (error instanceof TypeError) throw fail('INVALID_RESPONSE');
    if (error instanceof Error && error.message === 'Signed transaction validation failed.')
      throw fail('INVALID_RESPONSE');
    throw mapProviderError(error);
  }
};

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

const validMainnetOrigin = (origin: URL): boolean => {
  if (origin.protocol !== 'https:' || origin.port !== '') return false;
  const host = origin.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
  if (/^(?:10|127|169\.254|192\.168)\./.test(host)) return false;
  const private172 = /^172\.(\d+)\./.exec(host);
  return !(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
};

const getOriginProof = async (
  origin: string,
  params: MosaicLynxSignTransactionParams,
  requestId: string,
  expiresAt: string
): Promise<OriginProof | undefined> => {
  if (params.network !== 'mainnet') return undefined;
  const parsed = new URL(origin);
  if (!validMainnetOrigin(parsed)) throw fail('INVALID_PARAMS');
  const input = {
    version: 'mosaiclynx.origin.v1',
    requestId,
    initiatorOrigin: origin,
    chain: params.chain,
    network: 'mainnet',
    payloadHash: hex(await sha256(validateHexPayload(params.payload))),
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

const signWithMobileRelay = async (params: MosaicLynxSignTransactionParams): Promise<SignedTransaction> => {
  if (window.top !== window || window.location.origin === 'null' || !/^https?:$/.test(window.location.protocol))
    throw fail('UNAVAILABLE');
  const initialOrigin = window.location.origin;
  const created = new Date();
  const createdAt = rfc3339Seconds(created);
  const expiresAt = rfc3339Seconds(new Date(created.getTime() + 5 * 60_000));
  const requestId = base64UrlEncode(randomBytes(16));
  const sessionId = base64UrlEncode(randomBytes(16));
  const sessionSecret = randomBytes(32);
  const appTokenBytes = randomBytes(32);
  const webTokenBytes = randomBytes(32);
  const appToken = base64UrlEncode(appTokenBytes);
  const webToken = base64UrlEncode(webTokenBytes);
  try {
    const originProof = await getOriginProof(initialOrigin, params, requestId, expiresAt);
    const request = {
      protocol: PROTOCOL,
      operation: 'signTransaction',
      requestId,
      initiatorOrigin: initialOrigin,
      ...(originProof ? { originProof } : {}),
      chain: params.chain,
      network: params.network,
      payload: params.payload,
      ...(params.expectedSignerPublicKey
        ? { expectedSignerPublicKey: normalizePublicKey(params.expectedSignerPublicKey) }
        : {}),
      createdAt,
      expiresAt,
    } as const;
    const requestDigest = hex(await sha256(utf8(canonicalize(request))));
    const keys = await deriveRelayKeys(sessionSecret, sessionId);
    const aad = (direction: 'request' | 'response') => ({ protocol: PROTOCOL, sessionId, direction, expiresAt });
    const encrypted = await encryptJson(keys.requestKey, request, aad('request'));
    const createResponse = await relayFetch('/v1/handoffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: canonicalize({
        protocol: PROTOCOL,
        sessionId,
        requestId,
        expiresAt,
        appTokenHash: hex(await sha256(appTokenBytes)),
        webTokenHash: hex(await sha256(webTokenBytes)),
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
        if (window.location.origin !== initialOrigin) throw fail('CONTEXT_CHANGED');
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
        const result = logical as {
          protocol?: unknown;
          requestId?: unknown;
          requestDigest?: unknown;
          outcome?: unknown;
          signedTransaction?: SignedTransaction;
          errorCode?: MosaicLynxSDKErrorCode;
        };
        if (result.protocol !== PROTOCOL || result.requestId !== requestId || result.requestDigest !== requestDigest)
          throw fail('INVALID_RESPONSE');
        if (result.outcome === 'rejected' || result.outcome === 'failed') {
          const responseCodes: readonly MosaicLynxSDKErrorCode[] = [
            'USER_REJECTED',
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
          const code =
            result.outcome === 'rejected'
              ? 'USER_REJECTED'
              : responseCodes.includes(result.errorCode as MosaicLynxSDKErrorCode)
                ? (result.errorCode as MosaicLynxSDKErrorCode)
                : 'INTERNAL_ERROR';
          throw fail(code);
        }
        if (result.outcome !== 'signed' || !result.signedTransaction) throw fail('INVALID_RESPONSE');
        let verified: SignedTransaction;
        try {
          verified = verifySignedTransaction(params, result.signedTransaction);
        } catch {
          throw fail('INVALID_RESPONSE');
        }
        const ack = await relayFetch(`/v1/handoffs/${sessionId}/ack`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${webToken}` },
        });
        if (!ack.ok) throw fail('INTERNAL_ERROR');
        consumed = true;
        return verified;
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

class DefaultMosaicLynxSDK implements MosaicLynxSDK {
  public readonly version = SDK_VERSION;

  public constructor(private readonly options: MosaicLynxSDKOptions) {}

  public async isAvailable(): Promise<boolean> {
    const state = providerState();
    if (state !== 'none') return state === 'supported';
    return hasMobilePlatform();
  }

  public async signTransaction(params: MosaicLynxSignTransactionParams): Promise<SignedTransaction> {
    let transport: MosaicLynxDiagnosticEvent['transport'] = 'extension';
    try {
      this.validate(params);
      const state = providerState();
      if (state === 'unsupported') throw fail('UNAVAILABLE');
      if (state === 'supported') {
        this.emit('transport_selected', transport);
        this.emit('approval_requested', transport);
        const result = await signWithExtension(window.mosaicLynx!, params);
        this.emit('response_received', transport);
        this.emit('completed', transport);
        return result;
      }
      if (!hasMobilePlatform()) throw fail('UNAVAILABLE');
      transport = 'mobile-relay';
      this.emit('transport_selected', transport);
      this.emit('approval_requested', transport);
      const result = await signWithMobileRelay(params);
      this.emit('response_received', transport);
      this.emit('completed', transport);
      return result;
    } catch (error) {
      const normalized =
        error instanceof MosaicLynxSDKError
          ? error
          : error instanceof TypeError
            ? fail('INVALID_PARAMS')
            : fail('INTERNAL_ERROR');
      this.emit('failed', transport, normalized.code);
      throw normalized;
    }
  }

  private validate(params: MosaicLynxSignTransactionParams): void {
    if (
      !params ||
      (params.chain !== 'symbol' && params.chain !== 'nem') ||
      (params.network !== 'mainnet' && params.network !== 'testnet')
    )
      throw fail('INVALID_PARAMS');
    validateHexPayload(params.payload);
    if (params.expectedSignerPublicKey) normalizePublicKey(params.expectedSignerPublicKey);
  }

  private emit(
    phase: MosaicLynxDiagnosticEvent['phase'],
    transport: MosaicLynxDiagnosticEvent['transport'],
    errorCode?: MosaicLynxSDKErrorCode
  ): void {
    if (!this.options.diagnostics?.enabled) return;
    try {
      this.options.diagnostics.onEvent?.({
        phase,
        transport,
        timestamp: new Date().toISOString(),
        ...(errorCode ? { errorCode } : {}),
      });
    } catch {
      // Diagnostics must never affect the signing flow.
    }
  }
}

export const createMosaicLynxSDK = (options: MosaicLynxSDKOptions = {}): MosaicLynxSDK =>
  new DefaultMosaicLynxSDK(options);
