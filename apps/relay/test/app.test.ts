import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHash } from 'node:crypto';

import { buildRelayApp } from '../src/app.js';
import { MemoryRelayStore } from '../src/memory-store.js';
import { MAX_BODY_BYTES } from '../src/types.js';

const id = (byte: number): string => Buffer.alloc(16, byte).toString('base64url');
const token = (byte: number): string => Buffer.alloc(32, byte).toString('base64url');
const tokenHash = (value: string): string => createHash('sha256').update(Buffer.from(value, 'base64url')).digest('hex');
const envelope = (byte: number) => ({
  algorithm: 'A256GCM' as const,
  nonce: Buffer.alloc(12, byte).toString('base64url'),
  ciphertextAndTag: Buffer.alloc(32, byte).toString('base64url'),
});

describe('Relay HTTP API', () => {
  const hmacKey = Buffer.alloc(32, 0xa5);
  let store: MemoryRelayStore;
  let app: ReturnType<typeof buildRelayApp>;

  const expiresIn = (milliseconds: number): string =>
    new Date(Math.floor((Date.now() + milliseconds) / 1000) * 1000).toISOString().replace('.000Z', 'Z');
  const createBody = (sessionId = id(1), expiresAt = expiresIn(290_000)) => ({
    protocol: 'mosaiclynx.relay.v1',
    sessionId,
    requestId: id(2),
    expiresAt,
    appTokenHash: tokenHash(token(3)),
    webTokenHash: tokenHash(token(4)),
    request: envelope(5),
  });

  const create = async (body = createBody()) =>
    app.inject({
      method: 'POST',
      url: '/v1/handoffs',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(body),
    });

  beforeEach(async () => {
    store = new MemoryRelayStore();
    await store.connect();
    app = buildRelayApp({ store, hmacKey });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    await store.close();
  });

  it('creates and retrieves a handoff with security and CORS headers', async () => {
    const body = createBody();
    const created = await create(body);
    expect(created.statusCode).toBe(201);
    expect(created.json()).toEqual({
      protocol: 'mosaiclynx.relay.v1',
      sessionId: body.sessionId,
      expiresAt: body.expiresAt,
    });
    expect(created.headers['cache-control']).toBe('no-store');
    expect(created.headers['referrer-policy']).toBe('no-referrer');
    expect(created.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(created.headers['access-control-allow-origin']).toBe('*');
    expect(created.headers['access-control-allow-credentials']).toBeUndefined();

    const fetched = await app.inject({
      method: 'GET',
      url: `/v1/handoffs/${body.sessionId}/request`,
      headers: { authorization: `Bearer ${token(3)}` },
    });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json()).toEqual({
      protocol: 'mosaiclynx.relay.v1',
      sessionId: body.sessionId,
      expiresAt: body.expiresAt,
      request: body.request,
    });

    const preflight = await app.inject({ method: 'OPTIONS', url: `/v1/handoffs/${body.sessionId}/response` });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-headers']).toBe('Authorization, Content-Type, If-None-Match');
  });

  it('strictly rejects malformed schemas, expiry, roles, and oversized bodies', async () => {
    const unknown = await create({ ...createBody(), extra: true } as ReturnType<typeof createBody>);
    expect(unknown.statusCode).toBe(400);
    expect(unknown.json()).toEqual({ error: 'RELAY_REQUEST_REJECTED' });

    const sameRole = createBody(id(6));
    const invalidRoles = await create({ ...sameRole, webTokenHash: sameRole.appTokenHash });
    expect(invalidRoles.statusCode).toBe(400);

    const fractional = await create(createBody(id(7), new Date(Date.now() + 60_000).toISOString()));
    expect(fractional.statusCode).toBe(400);

    const oversized = await app.inject({
      method: 'POST',
      url: '/v1/handoffs',
      headers: { 'content-type': 'application/json' },
      payload: 'x'.repeat(512 * 1024 + 1),
    });
    expect(oversized.statusCode).toBe(413);
    expect(oversized.json()).toEqual({ error: 'RELAY_REQUEST_REJECTED' });
  });

  it('accepts an exact 512 KiB body and never reflects forbidden input into errors or logs', async () => {
    const boundaryBody = createBody(id(15));
    boundaryBody.request.ciphertextAndTag = Buffer.alloc(390_000, 1).toString('base64url');
    const serialized = JSON.stringify(boundaryBody);
    expect(Buffer.byteLength(serialized)).toBeLessThan(MAX_BODY_BYTES);
    const exactBody = serialized.padEnd(MAX_BODY_BYTES, ' ');
    expect(Buffer.byteLength(exactBody)).toBe(MAX_BODY_BYTES);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/v1/handoffs',
          headers: { 'content-type': 'application/json' },
          payload: exactBody,
        })
      ).statusCode
    ).toBe(201);

    const forbidden = 'forbidden-token-session-ciphertext';
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalid = await app.inject({
      method: 'POST',
      url: '/v1/handoffs',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ forbidden }),
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.body).not.toContain(forbidden);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('wakes a long poll, enforces first-write-wins, and purges on ACK', async () => {
    const body = createBody();
    expect((await create(body)).statusCode).toBe(201);

    const poll = app.inject({
      method: 'GET',
      url: `/v1/handoffs/${body.sessionId}/response?wait=2`,
      headers: { authorization: `Bearer ${token(4)}` },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const responseEnvelope = envelope(9);
    const response = await app.inject({
      method: 'PUT',
      url: `/v1/handoffs/${body.sessionId}/response`,
      headers: {
        authorization: `Bearer ${token(3)}`,
        'content-type': 'application/json',
        'if-none-match': '*',
      },
      payload: JSON.stringify(responseEnvelope),
    });
    expect(response.statusCode).toBe(204);
    const polled = await poll;
    expect(polled.statusCode).toBe(200);
    expect(polled.json()).toEqual(responseEnvelope);

    const repeated = await app.inject({
      method: 'PUT',
      url: `/v1/handoffs/${body.sessionId}/response`,
      headers: {
        authorization: `Bearer ${token(3)}`,
        'content-type': 'application/json',
        'if-none-match': '*',
      },
      payload: JSON.stringify(responseEnvelope),
    });
    expect(repeated.statusCode).toBe(204);

    const replaced = await app.inject({
      method: 'PUT',
      url: `/v1/handoffs/${body.sessionId}/response`,
      headers: {
        authorization: `Bearer ${token(3)}`,
        'content-type': 'application/json',
        'if-none-match': '*',
      },
      payload: JSON.stringify(envelope(10)),
    });
    expect(replaced.statusCode).toBe(409);

    const ack = await app.inject({
      method: 'POST',
      url: `/v1/handoffs/${body.sessionId}/ack`,
      headers: { authorization: `Bearer ${token(4)}` },
    });
    expect(ack.statusCode).toBe(204);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/v1/handoffs/${body.sessionId}/request`,
          headers: { authorization: `Bearer ${token(3)}` },
        })
      ).statusCode
    ).toBe(404);
    expect((await app.inject({ method: 'POST', url: `/v1/handoffs/${body.sessionId}/ack` })).statusCode).toBe(204);
  });

  it('keeps token roles separate and makes cancel opaque and idempotent', async () => {
    const body = createBody();
    await create(body);
    const wrongRole = await app.inject({
      method: 'GET',
      url: `/v1/handoffs/${body.sessionId}/request`,
      headers: { authorization: `Bearer ${token(4)}` },
    });
    expect(wrongRole.statusCode).toBe(404);

    const fakeCancel = await app.inject({
      method: 'DELETE',
      url: `/v1/handoffs/${body.sessionId}`,
      headers: { authorization: `Bearer ${token(3)}` },
    });
    expect(fakeCancel.statusCode).toBe(204);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/v1/handoffs/${body.sessionId}/request`,
          headers: { authorization: `Bearer ${token(3)}` },
        })
      ).statusCode
    ).toBe(200);

    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: `/v1/handoffs/${body.sessionId}`,
          headers: { authorization: `Bearer ${token(4)}` },
        })
      ).statusCode
    ).toBe(204);
    expect((await app.inject({ method: 'DELETE', url: `/v1/handoffs/${body.sessionId}` })).statusCode).toBe(204);
  });

  it('rate limits creation without preventing an existing handoff from completing', async () => {
    await app.close();
    app = buildRelayApp({ store, hmacKey, createCountLimit: 2, createByteLimit: 4 * 1024 * 1024 });
    await app.ready();
    const first = createBody(id(11));
    expect((await create(first)).statusCode).toBe(201);
    expect((await create(createBody(id(12)))).statusCode).toBe(201);
    const limited = await create(createBody(id(13)));
    expect(limited.statusCode).toBe(429);
    expect(limited.headers['retry-after']).toBe('60');

    const completed = await app.inject({
      method: 'PUT',
      url: `/v1/handoffs/${first.sessionId}/response`,
      headers: {
        authorization: `Bearer ${token(3)}`,
        'content-type': 'application/json',
        'if-none-match': '*',
      },
      payload: JSON.stringify(envelope(14)),
    });
    expect(completed.statusCode).toBe(204);
  });

  it('reports liveness separately from Redis readiness', async () => {
    expect((await app.inject({ method: 'GET', url: '/healthz' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/readyz' })).statusCode).toBe(200);
    await store.close();
    expect((await app.inject({ method: 'GET', url: '/readyz' })).statusCode).toBe(503);
  });
});
