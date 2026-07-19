import { type RedisClientType, createClient } from '@redis/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createHash, randomBytes } from 'node:crypto';

import { buildRelayApp } from '../src/app.js';
import { RedisRelayStore } from '../src/redis-store.js';

const redisUrl = process.env.RELAY_TEST_REDIS_URL;
const prefix = `mosaiclynx:relay:test:${randomBytes(8).toString('hex')}`;
const id = (byte: number): string => Buffer.alloc(16, byte).toString('base64url');
const token = (byte: number): string => Buffer.alloc(32, byte).toString('base64url');
const tokenHash = (value: string): string => createHash('sha256').update(Buffer.from(value, 'base64url')).digest('hex');
const envelope = (byte: number) => ({
  algorithm: 'A256GCM' as const,
  nonce: Buffer.alloc(12, byte).toString('base64url'),
  ciphertextAndTag: Buffer.alloc(32, byte).toString('base64url'),
});
const expiresIn = (milliseconds: number): string =>
  new Date(Math.floor((Date.now() + milliseconds) / 1000) * 1000).toISOString().replace('.000Z', 'Z');
const scanKeys = async (client: RedisClientType): Promise<string[]> => {
  const keys: string[] = [];
  for await (const batch of client.scanIterator({ MATCH: `${prefix}:*`, COUNT: 100 })) {
    if (Array.isArray(batch)) keys.push(...batch);
    else keys.push(batch);
  }
  return keys;
};

describe('Redis Relay integration', () => {
  const hmacKey = Buffer.alloc(32, 0x5a);
  let firstStore: RedisRelayStore;
  let secondStore: RedisRelayStore;
  let inspector: RedisClientType;
  let firstApp: ReturnType<typeof buildRelayApp>;
  let secondApp: ReturnType<typeof buildRelayApp>;

  beforeAll(async () => {
    if (!redisUrl) throw new Error('RELAY_TEST_REDIS_URL is required for Relay integration tests.');
    firstStore = new RedisRelayStore(redisUrl, prefix);
    secondStore = new RedisRelayStore(redisUrl, prefix);
    inspector = createClient({ url: redisUrl });
    inspector.on('error', () => undefined);
    await Promise.all([firstStore.connect(), secondStore.connect(), inspector.connect()]);
    firstApp = buildRelayApp({ store: firstStore, hmacKey, createCountLimit: 100 });
    secondApp = buildRelayApp({ store: secondStore, hmacKey, createCountLimit: 100 });
    await Promise.all([firstApp.ready(), secondApp.ready()]);
  });

  afterAll(async () => {
    if (!redisUrl) return;
    const keys = await scanKeys(inspector);
    if (keys.length > 0) await inspector.unlink(keys);
    await Promise.all([firstApp.close(), secondApp.close()]);
    await Promise.all([firstStore.close(), secondStore.close()]);
    await inspector.close();
  });

  it('coordinates long polling and first-write-wins across Relay instances', async () => {
    const sessionId = id(1);
    const requestId = id(2);
    const appToken = token(3);
    const webToken = token(4);
    const requestEnvelope = envelope(5);
    const created = await firstApp.inject({
      method: 'POST',
      url: '/v1/handoffs',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        protocol: 'mosaiclynx.relay.v1',
        sessionId,
        requestId,
        expiresAt: expiresIn(60_000),
        appTokenHash: tokenHash(appToken),
        webTokenHash: tokenHash(webToken),
        request: requestEnvelope,
      }),
    });
    expect(created.statusCode).toBe(201);

    const keysBefore = await scanKeys(inspector);
    const serializedKeys = keysBefore.join('\n');
    expect(serializedKeys).not.toContain(sessionId);
    expect(serializedKeys).not.toContain(requestId);
    expect(serializedKeys).not.toContain(appToken);
    expect(serializedKeys).not.toContain(webToken);

    const poll = firstApp.inject({
      method: 'GET',
      url: `/v1/handoffs/${sessionId}/response?wait=3`,
      headers: { authorization: `Bearer ${webToken}` },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const responseEnvelope = envelope(6);
    const attempts = await Promise.all(
      [responseEnvelope, envelope(7), envelope(8)].map((payload) =>
        secondApp.inject({
          method: 'PUT',
          url: `/v1/handoffs/${sessionId}/response`,
          headers: {
            authorization: `Bearer ${appToken}`,
            'content-type': 'application/json',
            'if-none-match': '*',
          },
          payload: JSON.stringify(payload),
        })
      )
    );
    expect(attempts.filter((result) => result.statusCode === 204)).toHaveLength(1);
    expect(attempts.filter((result) => result.statusCode === 409)).toHaveLength(2);
    const polled = await poll;
    expect(polled.statusCode).toBe(200);
    expect([responseEnvelope, envelope(7), envelope(8)]).toContainEqual(polled.json());

    expect(
      (
        await secondApp.inject({
          method: 'POST',
          url: `/v1/handoffs/${sessionId}/ack`,
          headers: { authorization: `Bearer ${webToken}` },
        })
      ).statusCode
    ).toBe(204);
    expect(
      (
        await firstApp.inject({
          method: 'GET',
          url: `/v1/handoffs/${sessionId}/response`,
          headers: { authorization: `Bearer ${webToken}` },
        })
      ).statusCode
    ).toBe(404);
  });

  it('lets Redis expiry purge ciphertext and token hashes', async () => {
    const sessionId = id(10);
    const created = await firstApp.inject({
      method: 'POST',
      url: '/v1/handoffs',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        protocol: 'mosaiclynx.relay.v1',
        sessionId,
        requestId: id(11),
        expiresAt: expiresIn(2_000),
        appTokenHash: tokenHash(token(12)),
        webTokenHash: tokenHash(token(13)),
        request: envelope(14),
      }),
    });
    expect(created.statusCode).toBe(201);
    await new Promise((resolve) => setTimeout(resolve, 2_100));
    const fetched = await firstApp.inject({
      method: 'GET',
      url: `/v1/handoffs/${sessionId}/request`,
      headers: { authorization: `Bearer ${token(12)}` },
    });
    expect(fetched.statusCode).toBe(404);
  });

  it('applies count and byte rate limits atomically in Redis', async () => {
    const rateKey = randomBytes(32).toString('hex');
    expect(await firstStore.consumeCreateRate(rateKey, Date.now(), 100, 2, 250)).toBe(true);
    expect(await firstStore.consumeCreateRate(rateKey, Date.now(), 100, 2, 250)).toBe(true);
    expect(await secondStore.consumeCreateRate(rateKey, Date.now(), 1, 2, 250)).toBe(false);

    const byteKey = randomBytes(32).toString('hex');
    expect(await firstStore.consumeCreateRate(byteKey, Date.now(), 200, 10, 250)).toBe(true);
    expect(await secondStore.consumeCreateRate(byteKey, Date.now(), 51, 10, 250)).toBe(false);
  });
});
