import {
  RELAY_ORIGIN,
  RELAY_PROTOCOL,
  type RelaySigningRequest,
  type RelaySigningResponse,
  type SignedTransaction,
  base64UrlDecode,
  canonicalize,
  decryptRelayJson,
  deriveRelayKeys,
  encryptRelayJson,
  hex,
  isEncryptedRelayEnvelope,
  parseAppLink,
  parseRelaySigningRequest,
  relayAad,
  relayRequestDigest,
  sha256,
  utf8,
} from '@mosaiclynx/relay-protocol';
import { randomUUID } from 'expo-crypto';

import { mobileCryptoDriver } from './crypto';
import type { RelayHandoffPort } from './ports';

interface SecretSession {
  readonly sessionId: string;
  readonly appToken: string;
  readonly responseKey: Uint8Array;
  readonly request: RelaySigningRequest;
  readonly requestDigest: string;
  readonly expiresAt: string;
}

export interface PendingHandoff {
  readonly handle: string;
  readonly request: RelaySigningRequest;
  readonly requestDigest: string;
}

const sessions = new Map<string, SecretSession>();

const seconds = (): string => new Date(Math.floor(Date.now() / 1000) * 1000).toISOString().replace('.000Z', 'Z');

const clear = (handle: string): void => {
  const session = sessions.get(handle);
  session?.responseKey.fill(0);
  sessions.delete(handle);
};

const relayFetch = (path: string, init: RequestInit): Promise<Response> =>
  fetch(`${RELAY_ORIGIN}${path}`, {
    ...init,
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
  });

type ResponseSession = Pick<SecretSession, 'sessionId' | 'appToken' | 'responseKey' | 'expiresAt'>;

const putResponse = async (session: ResponseSession, response: RelaySigningResponse): Promise<void> => {
  const encrypted = await encryptRelayJson(
    mobileCryptoDriver,
    session.responseKey,
    response,
    relayAad(session.sessionId, 'response', session.expiresAt)
  );
  const result = await relayFetch(`/v1/handoffs/${session.sessionId}/response`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${session.appToken}`, 'If-None-Match': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify(encrypted),
  });
  if (result.status !== 204) throw new Error(result.status === 409 ? 'HANDOFF_ALREADY_COMPLETED' : 'RELAY_UNAVAILABLE');
};

export const openHandoff = async (rawUrl: string): Promise<PendingHandoff> => {
  const link = parseAppLink(rawUrl);
  let pendingResponseKey: Uint8Array | undefined;
  try {
    const response = await relayFetch(`/v1/handoffs/${link.sessionId}/request`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${link.appToken}` },
    });
    if (!response.ok) throw new Error('HANDOFF_NOT_FOUND');
    const body = (await response.json()) as {
      protocol?: unknown;
      sessionId?: unknown;
      expiresAt?: unknown;
      request?: unknown;
    };
    if (
      body.protocol !== RELAY_PROTOCOL ||
      body.sessionId !== link.sessionId ||
      typeof body.expiresAt !== 'string' ||
      !isEncryptedRelayEnvelope(body.request)
    )
      throw new Error('INVALID_RELAY_RESPONSE');
    const keys = deriveRelayKeys(link.sessionSecret, link.sessionId);
    pendingResponseKey = keys.responseKey;
    let logical: unknown;
    try {
      logical = await decryptRelayJson(
        mobileCryptoDriver,
        keys.requestKey,
        body.request,
        relayAad(link.sessionId, 'request', body.expiresAt)
      );
    } finally {
      keys.requestKey.fill(0);
    }
    let request: RelaySigningRequest;
    try {
      request = parseRelaySigningRequest(logical);
    } catch (error) {
      if (
        typeof logical === 'object' &&
        logical !== null &&
        'protocol' in logical &&
        logical.protocol === RELAY_PROTOCOL &&
        'requestId' in logical &&
        typeof logical.requestId === 'string' &&
        'expiresAt' in logical &&
        logical.expiresAt === body.expiresAt
      ) {
        base64UrlDecode(logical.requestId, 16);
        await putResponse(
          {
            sessionId: link.sessionId,
            appToken: link.appToken,
            responseKey: keys.responseKey,
            expiresAt: body.expiresAt,
          },
          {
            protocol: RELAY_PROTOCOL,
            requestId: logical.requestId,
            requestDigest: hex(sha256(utf8(canonicalize(logical)))),
            outcome: 'failed',
            errorCode: Date.parse(body.expiresAt) < Date.now() ? 'REQUEST_EXPIRED' : 'INVALID_REQUEST',
            completedAt: seconds(),
          }
        );
      }
      throw error;
    }
    if (request.expiresAt !== body.expiresAt) throw new Error('INVALID_RELAY_RESPONSE');
    const session: SecretSession = {
      sessionId: link.sessionId,
      appToken: link.appToken,
      responseKey: keys.responseKey,
      request,
      requestDigest: relayRequestDigest(request),
      expiresAt: body.expiresAt,
    };
    if (request.network === 'mainnet') {
      try {
        await putResponse(session, {
          protocol: RELAY_PROTOCOL,
          requestId: request.requestId,
          requestDigest: session.requestDigest,
          outcome: 'failed',
          errorCode: 'UNAVAILABLE',
          completedAt: seconds(),
        });
      } finally {
        session.responseKey.fill(0);
      }
      throw new Error('MAINNET_DISABLED');
    }
    const handle = randomUUID();
    sessions.set(handle, session);
    pendingResponseKey = undefined;
    return { handle, request, requestDigest: session.requestDigest };
  } finally {
    pendingResponseKey?.fill(0);
    link.sessionSecret.fill(0);
  }
};

export const completeSignedHandoff = async (handle: string, signedTransaction: SignedTransaction): Promise<void> => {
  const session = sessions.get(handle);
  if (!session) throw new Error('HANDOFF_NOT_FOUND');
  try {
    await putResponse(session, {
      protocol: RELAY_PROTOCOL,
      requestId: session.request.requestId,
      requestDigest: session.requestDigest,
      outcome: 'signed',
      signedTransaction,
      completedAt: seconds(),
    });
  } finally {
    clear(handle);
  }
};

export const failHandoff = async (handle: string, errorCode: string, rejected = false): Promise<void> => {
  const session = sessions.get(handle);
  if (!session) return;
  try {
    await putResponse(session, {
      protocol: RELAY_PROTOCOL,
      requestId: session.request.requestId,
      requestDigest: session.requestDigest,
      outcome: rejected ? 'rejected' : 'failed',
      errorCode,
      completedAt: seconds(),
    });
  } finally {
    clear(handle);
  }
};

export const abandonHandoff = (handle: string): void => clear(handle);

export const relayHandoffPort: RelayHandoffPort = {
  open: openHandoff,
  complete: completeSignedHandoff,
  fail: failHandoff,
  abandon: abandonHandoff,
};
