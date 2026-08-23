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

export interface RelayPublicAccount {
  readonly chain: 'symbol' | 'nem';
  readonly network: 'mainnet' | 'testnet';
  readonly address: string;
  readonly publicKey: string;
}

export interface RelayOriginProof {
  readonly version: 'mosaiclynx.origin.v1';
  readonly keyId: string;
  readonly algorithm: 'Ed25519';
  readonly signature: string;
}

interface RelayRequestBase {
  readonly protocol: typeof RELAY_PROTOCOL;
  readonly requestId: string;
  readonly initiatorOrigin: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface RelayConnectRequest extends RelayRequestBase {
  readonly operation: 'connect';
  readonly chain: 'symbol' | 'nem';
  readonly network: 'mainnet' | 'testnet';
  readonly originProof?: RelayOriginProof;
}

export interface RelayRefreshActiveAccountRequest extends RelayRequestBase {
  readonly operation: 'refreshActiveAccount';
  readonly chain: 'symbol' | 'nem';
  readonly network: 'mainnet' | 'testnet';
  readonly originProof?: RelayOriginProof;
}

export interface RelaySigningRequest extends RelayRequestBase {
  readonly operation: 'signTransaction';
  readonly chain: 'symbol' | 'nem';
  readonly network: 'mainnet' | 'testnet';
  readonly payload: string;
  readonly expectedSignerPublicKey?: string;
  readonly originProof?: RelayOriginProof;
}

export interface RelayDisconnectRequest extends RelayRequestBase {
  readonly operation: 'disconnect';
}

export interface RelayDataSigningRequest extends RelayRequestBase {
  readonly operation: 'signData';
  readonly chain: 'symbol' | 'nem';
  readonly network: 'mainnet' | 'testnet';
  readonly purpose: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly messageExpiresAt: string;
  readonly payload: { readonly encoding: 'utf8' | 'hex'; readonly value: string };
  readonly expectedSignerPublicKey?: string;
  readonly originProof?: RelayOriginProof;
}

export type RelayCosignRequest =
  | (RelayRequestBase & {
      readonly operation: 'cosignTransaction';
      readonly chain: 'symbol';
      readonly network: 'mainnet' | 'testnet';
      readonly parentPayload: string;
      readonly detached: boolean;
      readonly expectedSignerPublicKey?: string;
      readonly originProof?: RelayOriginProof;
    })
  | (RelayRequestBase & {
      readonly operation: 'cosignTransaction';
      readonly chain: 'nem';
      readonly network: 'mainnet' | 'testnet';
      readonly payload: string;
      readonly parentPayload: string;
      readonly expectedSignerPublicKey?: string;
      readonly originProof?: RelayOriginProof;
    });

export type RelayRequest =
  | RelayConnectRequest
  | RelayRefreshActiveAccountRequest
  | RelaySigningRequest
  | RelayDataSigningRequest
  | RelayCosignRequest
  | RelayDisconnectRequest;

const rfc3339Seconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const parseOriginProof = (value: unknown): RelayOriginProof | undefined => {
  if (value === undefined) return undefined;
  if (
    !isRecord(value) ||
    !exactKeys(value, ['version', 'keyId', 'algorithm', 'signature']) ||
    value.version !== 'mosaiclynx.origin.v1' ||
    value.algorithm !== 'Ed25519' ||
    typeof value.keyId !== 'string' ||
    !value.keyId ||
    typeof value.signature !== 'string' ||
    !/^[A-Za-z0-9_-]+$/.test(value.signature)
  )
    throw new TypeError('Invalid Origin Proof.');
  return value as unknown as RelayOriginProof;
};

const parseRequestBase = (value: Record<string, unknown>, now: number): Omit<RelayRequestBase, 'protocol'> => {
  if (typeof value.requestId !== 'string') throw new TypeError('Invalid request ID.');
  base64UrlDecode(value.requestId, 16);
  if (typeof value.initiatorOrigin !== 'string' || new URL(value.initiatorOrigin).origin !== value.initiatorOrigin)
    throw new TypeError('Invalid initiator Origin.');
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
    throw new TypeError('Relay request expired.');
  return {
    requestId: value.requestId,
    initiatorOrigin: value.initiatorOrigin,
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
  };
};

export const parseRelayRequest = (value: unknown, now = Date.now()): RelayRequest => {
  const operations = new Set([
    'connect',
    'refreshActiveAccount',
    'disconnect',
    'signTransaction',
    'signData',
    'cosignTransaction',
  ]);
  if (
    !isRecord(value) ||
    value.protocol !== RELAY_PROTOCOL ||
    typeof value.operation !== 'string' ||
    !operations.has(value.operation)
  )
    throw new TypeError('Invalid Relay request schema.');
  const base = parseRequestBase(value, now);
  if (value.operation === 'disconnect') {
    if (!exactKeys(value, ['protocol', 'operation', 'requestId', 'initiatorOrigin', 'createdAt', 'expiresAt']))
      throw new TypeError('Invalid Relay disconnect request schema.');
    return { protocol: RELAY_PROTOCOL, operation: 'disconnect', ...base };
  }
  if (value.chain !== 'symbol' && value.chain !== 'nem') throw new TypeError('Invalid chain.');
  if (value.network !== 'mainnet' && value.network !== 'testnet') throw new TypeError('Invalid network.');
  if (value.operation === 'connect' || value.operation === 'refreshActiveAccount') {
    if (
      !exactKeys(
        value,
        ['protocol', 'operation', 'requestId', 'initiatorOrigin', 'chain', 'network', 'createdAt', 'expiresAt'],
        ['originProof']
      )
    )
      throw new TypeError('Invalid Relay account request schema.');
    const originProof = parseOriginProof(value.originProof);
    return {
      protocol: RELAY_PROTOCOL,
      operation: value.operation,
      ...base,
      chain: value.chain,
      network: value.network,
      ...(originProof ? { originProof } : {}),
    };
  }
  const validateHexPayload = (payload: unknown): payload is string =>
    typeof payload === 'string' && /^(?:[0-9a-fA-F]{2})+$/.test(payload) && payload.length / 2 <= MAX_TRANSACTION_BYTES;
  const optionalSigner = (): string | undefined => {
    if (
      value.expectedSignerPublicKey !== undefined &&
      (typeof value.expectedSignerPublicKey !== 'string' || !/^[0-9a-fA-F]{64}$/.test(value.expectedSignerPublicKey))
    )
      throw new TypeError('Invalid expected signer.');
    return typeof value.expectedSignerPublicKey === 'string' ? value.expectedSignerPublicKey.toUpperCase() : undefined;
  };
  if (value.operation === 'signData') {
    if (
      !exactKeys(
        value,
        [
          'protocol',
          'operation',
          'requestId',
          'initiatorOrigin',
          'chain',
          'network',
          'purpose',
          'nonce',
          'issuedAt',
          'messageExpiresAt',
          'payload',
          'createdAt',
          'expiresAt',
        ],
        ['expectedSignerPublicKey', 'originProof']
      ) ||
      typeof value.purpose !== 'string' ||
      typeof value.nonce !== 'string' ||
      typeof value.issuedAt !== 'string' ||
      typeof value.messageExpiresAt !== 'string' ||
      !isRecord(value.payload) ||
      !exactKeys(value.payload, ['encoding', 'value']) ||
      (value.payload.encoding !== 'utf8' && value.payload.encoding !== 'hex') ||
      typeof value.payload.value !== 'string'
    )
      throw new TypeError('Invalid Relay data signing request schema.');
    const signer = optionalSigner();
    const originProof = parseOriginProof(value.originProof);
    return {
      protocol: RELAY_PROTOCOL,
      operation: 'signData',
      ...base,
      chain: value.chain,
      network: value.network,
      purpose: value.purpose,
      nonce: value.nonce,
      issuedAt: value.issuedAt,
      messageExpiresAt: value.messageExpiresAt,
      payload: { encoding: value.payload.encoding, value: value.payload.value },
      ...(signer ? { expectedSignerPublicKey: signer } : {}),
      ...(originProof ? { originProof } : {}),
    };
  }
  if (value.operation === 'cosignTransaction') {
    const commonRequired = [
      'protocol',
      'operation',
      'requestId',
      'initiatorOrigin',
      'chain',
      'network',
      'parentPayload',
      'createdAt',
      'expiresAt',
    ];
    const required = value.chain === 'nem' ? [...commonRequired, 'payload'] : [...commonRequired, 'detached'];
    if (
      !exactKeys(value, required, ['expectedSignerPublicKey', 'originProof']) ||
      !validateHexPayload(value.parentPayload) ||
      (value.chain === 'nem' && !validateHexPayload(value.payload)) ||
      (value.chain === 'symbol' && typeof value.detached !== 'boolean')
    )
      throw new TypeError('Invalid Relay cosignature request schema.');
    const signer = optionalSigner();
    const originProof = parseOriginProof(value.originProof);
    return value.chain === 'symbol'
      ? {
          protocol: RELAY_PROTOCOL,
          operation: 'cosignTransaction',
          ...base,
          chain: 'symbol',
          network: value.network,
          parentPayload: value.parentPayload,
          detached: value.detached as boolean,
          ...(signer ? { expectedSignerPublicKey: signer } : {}),
          ...(originProof ? { originProof } : {}),
        }
      : {
          protocol: RELAY_PROTOCOL,
          operation: 'cosignTransaction',
          ...base,
          chain: 'nem',
          network: value.network,
          payload: value.payload as string,
          parentPayload: value.parentPayload,
          ...(signer ? { expectedSignerPublicKey: signer } : {}),
          ...(originProof ? { originProof } : {}),
        };
  }
  if (
    value.operation !== 'signTransaction' ||
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
    ) ||
    !validateHexPayload(value.payload)
  )
    throw new TypeError('Invalid Relay transaction signing request schema.');
  const signer = optionalSigner();
  const originProof = parseOriginProof(value.originProof);
  return {
    protocol: RELAY_PROTOCOL,
    operation: 'signTransaction',
    ...base,
    chain: value.chain,
    network: value.network,
    payload: value.payload,
    ...(signer ? { expectedSignerPublicKey: signer } : {}),
    ...(originProof ? { originProof } : {}),
  };
};

export const parseRelaySigningRequest = (value: unknown, now = Date.now()): RelaySigningRequest => {
  const request = parseRelayRequest(value, now);
  if (request.operation !== 'signTransaction') throw new TypeError('Unsupported Relay operation.');
  return request;
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

export const relayRequestDigest = (request: RelayRequest): string => hex(sha256(utf8(canonicalize(request))));

export interface SignedTransaction {
  readonly payload: string;
  readonly hash: string;
  readonly signerPublicKey: string;
}

export interface RelaySignedData {
  readonly signature: string;
  readonly signerPublicKey: string;
  readonly signingDigest: string;
  readonly message: {
    readonly domain: 'mosaiclynx.message.v1';
    readonly origin: string;
    readonly chain: 'symbol' | 'nem';
    readonly network: 'mainnet' | 'testnet';
    readonly purpose: string;
    readonly nonce: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly payload: { readonly encoding: 'utf8' | 'hex'; readonly value: string };
  };
}

export type RelayCosignature =
  | {
      readonly chain: 'symbol';
      readonly parentHash: string;
      readonly signature: string;
      readonly signerPublicKey: string;
      readonly detached: boolean;
      readonly payload: string;
    }
  | { readonly chain: 'nem'; readonly payload: string; readonly hash: string; readonly signerPublicKey: string };

export type RelayResponse =
  | {
      readonly protocol: typeof RELAY_PROTOCOL;
      readonly requestId: string;
      readonly requestDigest: string;
      readonly outcome: 'connected';
      readonly account: RelayPublicAccount;
      readonly completedAt: string;
    }
  | {
      readonly protocol: typeof RELAY_PROTOCOL;
      readonly requestId: string;
      readonly requestDigest: string;
      readonly outcome: 'activeAccountRefreshed';
      readonly account?: RelayPublicAccount;
      readonly completedAt: string;
    }
  | {
      readonly protocol: typeof RELAY_PROTOCOL;
      readonly requestId: string;
      readonly requestDigest: string;
      readonly outcome: 'disconnected';
      readonly completedAt: string;
    }
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
      readonly outcome: 'dataSigned';
      readonly signedData: RelaySignedData;
      readonly completedAt: string;
    }
  | {
      readonly protocol: typeof RELAY_PROTOCOL;
      readonly requestId: string;
      readonly requestDigest: string;
      readonly outcome: 'cosigned';
      readonly cosignature: RelayCosignature;
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

export type RelaySigningResponse = RelayResponse;

/** Relayから復号した応答をoperation別の厳密schemaで検証します。 */
export const parseRelayResponse = (value: unknown): RelayResponse => {
  if (
    !isRecord(value) ||
    value.protocol !== RELAY_PROTOCOL ||
    typeof value.requestId !== 'string' ||
    typeof value.requestDigest !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.requestDigest) ||
    typeof value.completedAt !== 'string' ||
    !rfc3339Seconds.test(value.completedAt) ||
    typeof value.outcome !== 'string'
  )
    throw new TypeError('Invalid Relay response schema.');
  base64UrlDecode(value.requestId, 16);
  const common = ['protocol', 'requestId', 'requestDigest', 'outcome', 'completedAt'];
  if (value.outcome === 'rejected' || value.outcome === 'failed') {
    if (!exactKeys(value, [...common, 'errorCode']) || typeof value.errorCode !== 'string')
      throw new TypeError('Invalid Relay failure response schema.');
    return value as unknown as RelayResponse;
  }
  if (value.outcome === 'disconnected') {
    if (!exactKeys(value, common)) throw new TypeError('Invalid Relay disconnect response schema.');
    return value as unknown as RelayResponse;
  }
  if (value.outcome === 'connected' || value.outcome === 'activeAccountRefreshed') {
    const required = value.outcome === 'connected' ? [...common, 'account'] : common;
    if (!exactKeys(value, required, value.outcome === 'activeAccountRefreshed' ? ['account'] : []))
      throw new TypeError('Invalid Relay account response schema.');
    if (value.account !== undefined) {
      if (
        !isRecord(value.account) ||
        !exactKeys(value.account, ['chain', 'network', 'address', 'publicKey']) ||
        (value.account.chain !== 'symbol' && value.account.chain !== 'nem') ||
        (value.account.network !== 'mainnet' && value.account.network !== 'testnet') ||
        typeof value.account.address !== 'string' ||
        typeof value.account.publicKey !== 'string' ||
        !/^[0-9a-fA-F]{64}$/.test(value.account.publicKey)
      )
        throw new TypeError('Invalid Relay public account.');
    }
    return value as unknown as RelayResponse;
  }
  const resultKey =
    value.outcome === 'signed'
      ? 'signedTransaction'
      : value.outcome === 'dataSigned'
        ? 'signedData'
        : value.outcome === 'cosigned'
          ? 'cosignature'
          : undefined;
  if (!resultKey || !exactKeys(value, [...common, resultKey]) || !isRecord(value[resultKey]))
    throw new TypeError('Invalid Relay signing response schema.');
  const result = value[resultKey];
  if (resultKey === 'signedTransaction') {
    if (
      !exactKeys(result, ['payload', 'hash', 'signerPublicKey']) ||
      !validateResponseHex(result.payload) ||
      typeof result.hash !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(result.hash) ||
      typeof result.signerPublicKey !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(result.signerPublicKey)
    )
      throw new TypeError('Invalid Relay transaction response.');
  } else if (resultKey === 'signedData') {
    if (
      !exactKeys(result, ['signature', 'signerPublicKey', 'signingDigest', 'message']) ||
      typeof result.signature !== 'string' ||
      !/^[0-9a-fA-F]{128}$/.test(result.signature) ||
      typeof result.signerPublicKey !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(result.signerPublicKey) ||
      typeof result.signingDigest !== 'string' ||
      !/^[0-9a-f]{64}$/.test(result.signingDigest) ||
      !isRecord(result.message)
    )
      throw new TypeError('Invalid Relay data response.');
  } else {
    if (
      (result.chain !== 'symbol' && result.chain !== 'nem') ||
      typeof result.signerPublicKey !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(result.signerPublicKey)
    )
      throw new TypeError('Invalid Relay cosignature response.');
    const fields =
      result.chain === 'symbol'
        ? ['chain', 'parentHash', 'signature', 'signerPublicKey', 'detached', 'payload']
        : ['chain', 'payload', 'hash', 'signerPublicKey'];
    if (!exactKeys(result, fields) || !validateResponseHex(result.payload))
      throw new TypeError('Invalid Relay cosignature response.');
  }
  return value as unknown as RelayResponse;
};

function validateResponseHex(value: unknown): value is string {
  return typeof value === 'string' && /^(?:[0-9a-fA-F]{2})+$/.test(value) && value.length / 2 <= MAX_TRANSACTION_BYTES;
}
