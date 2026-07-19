import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import type { RelayStore } from './store.js';
import {
  MAX_BODY_BYTES,
  RELAY_PROTOCOL,
  type StoredSession,
  canonicalEnvelope,
  isId128,
  isToken256,
  parseCreateHandoff,
  parseEnvelope,
  parseJsonBuffer,
} from './types.js';

const ERROR_BODY = { error: 'RELAY_REQUEST_REJECTED' } as const;
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Authorization, Content-Type, If-None-Match';

export interface RelayAppOptions {
  readonly store: RelayStore;
  readonly hmacKey: Buffer;
  readonly now?: () => number;
  readonly trustProxyHops?: number;
  readonly createCountLimit?: number;
  readonly createByteLimit?: number;
}

const reject = (reply: FastifyReply, statusCode: number): FastifyReply => reply.code(statusCode).send(ERROR_BODY);

const sha256Hex = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');

const safeEqualHex = (expected: string, actual: string): boolean => {
  if (!/^[0-9a-f]{64}$/.test(expected) || !/^[0-9a-f]{64}$/.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
};

const bearerTokenHash = (request: FastifyRequest): string | undefined => {
  const authorization = request.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return undefined;
  const token = authorization.slice('Bearer '.length);
  return isToken256(token) ? sha256Hex(Buffer.from(token, 'base64url')) : undefined;
};

const pathId = (request: FastifyRequest): string | undefined => {
  const id = (request.params as { readonly id?: unknown }).id;
  return isId128(id) ? id : undefined;
};

const waitSeconds = (request: FastifyRequest): number | undefined => {
  const query = request.query as Record<string, unknown>;
  const keys = Object.keys(query);
  if (keys.some((key) => key !== 'wait')) return undefined;
  if (query.wait === undefined) return 0;
  if (typeof query.wait !== 'string' || !/^(?:0|[1-9]|1\d|2[0-5])$/.test(query.wait)) return undefined;
  return Number(query.wait);
};

export const buildRelayApp = (options: RelayAppOptions): FastifyInstance => {
  const now = options.now ?? Date.now;
  const countLimit = options.createCountLimit ?? 10;
  const byteLimit = options.createByteLimit ?? 4 * 1024 * 1024;
  const app = Fastify({
    logger: false,
    trustProxy: options.trustProxyHops && options.trustProxyHops > 0 ? options.trustProxyHops : false,
    bodyLimit: MAX_BODY_BYTES,
  });

  const opaqueKey = (domain: 'session' | 'ip', value: string): string =>
    createHmac('sha256', options.hmacKey).update(domain).update('\0').update(value).digest('hex');

  app.removeAllContentTypeParsers();
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer', bodyLimit: MAX_BODY_BYTES },
    (_request, body, done) => {
      done(null, body);
    }
  );

  app.addHook('onSend', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', ALLOWED_METHODS);
    reply.header('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  });

  app.setNotFoundHandler(async (_request, reply) => reject(reply, 404));
  app.setErrorHandler(async (error, _request, reply) => {
    const statusCode =
      typeof error === 'object' && error !== null && 'code' in error && error.code === 'FST_ERR_CTP_BODY_TOO_LARGE'
        ? 413
        : 400;
    return reject(reply, statusCode);
  });

  app.options('*', async (_request, reply) => reply.code(204).send());

  app.get('/healthz', async (_request, reply) => reply.code(200).send({ status: 'ok' }));
  app.get('/readyz', async (_request, reply) => {
    try {
      return (await options.store.isReady())
        ? reply.code(200).send({ status: 'ok' })
        : reply.code(503).send({ status: 'unavailable' });
    } catch {
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  app.post('/v1/handoffs', async (request, reply) => {
    const bodyBytes = Buffer.isBuffer(request.body) ? request.body.byteLength : 0;
    const ipKey = opaqueKey('ip', request.ip);
    let withinRate: boolean;
    try {
      withinRate = await options.store.consumeCreateRate(ipKey, now(), bodyBytes, countLimit, byteLimit);
    } catch {
      return reject(reply, 503);
    }
    if (!withinRate) {
      reply.header('Retry-After', '60');
      return reject(reply, 429);
    }

    const parsedJson = parseJsonBuffer(request.body);
    const input = parsedJson ? parseCreateHandoff(parsedJson.value, now()) : undefined;
    if (!input) return reject(reply, 400);
    const session: StoredSession = {
      status: 'pending',
      expiresAtMs: Date.parse(input.expiresAt),
      appTokenHash: input.appTokenHash,
      webTokenHash: input.webTokenHash,
      request: canonicalEnvelope(input.request),
    };
    try {
      const created = await options.store.create(opaqueKey('session', input.sessionId), session);
      if (created === 'exists') return reject(reply, 409);
      if (created === 'expired') return reject(reply, 400);
    } catch {
      return reject(reply, 503);
    }
    return reply.code(201).send({ protocol: RELAY_PROTOCOL, sessionId: input.sessionId, expiresAt: input.expiresAt });
  });

  app.get('/v1/handoffs/:id/request', async (request, reply) => {
    const id = pathId(request);
    const tokenHash = bearerTokenHash(request);
    if (!id || !tokenHash) return reject(reply, 404);
    try {
      const session = await options.store.get(opaqueKey('session', id));
      if (!session || !safeEqualHex(session.appTokenHash, tokenHash)) return reject(reply, 404);
      return reply.code(200).send({
        protocol: RELAY_PROTOCOL,
        sessionId: id,
        expiresAt: new Date(session.expiresAtMs).toISOString().replace('.000Z', 'Z'),
        request: JSON.parse(session.request) as unknown,
      });
    } catch {
      return reject(reply, 503);
    }
  });

  app.put('/v1/handoffs/:id/response', async (request, reply) => {
    const id = pathId(request);
    const tokenHash = bearerTokenHash(request);
    if (!id || !tokenHash) return reject(reply, 404);
    if (request.headers['if-none-match'] !== '*') return reject(reply, 400);
    const parsedJson = parseJsonBuffer(request.body);
    const envelope = parsedJson ? parseEnvelope(parsedJson.value) : undefined;
    if (!envelope) return reject(reply, 400);
    const key = opaqueKey('session', id);
    const response = canonicalEnvelope(envelope);
    try {
      const session = await options.store.get(key);
      if (!session || !safeEqualHex(session.appTokenHash, tokenHash)) return reject(reply, 404);
      const result = await options.store.putResponse(key, tokenHash, response, sha256Hex(response));
      if (result === 'missing') return reject(reply, 404);
      if (result === 'different') return reject(reply, 409);
      return reply.code(204).send();
    } catch {
      return reject(reply, 503);
    }
  });

  app.get('/v1/handoffs/:id/response', async (request, reply) => {
    const id = pathId(request);
    const tokenHash = bearerTokenHash(request);
    const seconds = waitSeconds(request);
    if (!id || !tokenHash || seconds === undefined) return reject(reply, 404);
    const key = opaqueKey('session', id);
    const deadline = now() + seconds * 1000;
    try {
      while (true) {
        const session = await options.store.get(key);
        if (!session || !safeEqualHex(session.webTokenHash, tokenHash)) return reject(reply, 404);
        if (session.status === 'response_available' && session.response)
          return reply.code(200).send(JSON.parse(session.response) as unknown);
        const remaining = deadline - now();
        if (remaining <= 0) return reply.code(204).send();
        await options.store.waitForChange(key, Math.min(remaining, 1000));
      }
    } catch {
      return reject(reply, 503);
    }
  });

  app.post('/v1/handoffs/:id/ack', async (request, reply) => {
    const id = pathId(request);
    const tokenHash = bearerTokenHash(request);
    if (id && tokenHash) {
      const key = opaqueKey('session', id);
      try {
        const session = await options.store.get(key);
        if (session && safeEqualHex(session.webTokenHash, tokenHash)) await options.store.acknowledge(key, tokenHash);
      } catch {
        // ACK deliberately has an opaque, idempotent response.
      }
    }
    return reply.code(204).send();
  });

  app.delete('/v1/handoffs/:id', async (request, reply) => {
    const id = pathId(request);
    const tokenHash = bearerTokenHash(request);
    if (id && tokenHash) {
      const key = opaqueKey('session', id);
      try {
        const session = await options.store.get(key);
        if (session && safeEqualHex(session.webTokenHash, tokenHash)) await options.store.cancel(key, tokenHash);
      } catch {
        // Cancel deliberately has an opaque, idempotent response.
      }
    }
    return reply.code(204).send();
  });

  return app;
};
