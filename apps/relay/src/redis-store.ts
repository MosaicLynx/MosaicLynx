import { type RedisClientType, createClient } from '@redis/client';

import type { CreateResult, PutResponseResult, RelayStore } from './store.js';
import type { StoredSession } from './types.js';

const CREATE_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
local now = redis.call('TIME')
local now_ms = (tonumber(now[1]) * 1000) + math.floor(tonumber(now[2]) / 1000)
local expires_at = tonumber(ARGV[1])
if expires_at <= now_ms then return -1 end
redis.call('HSET', KEYS[1],
  'status', 'pending',
  'expiresAtMs', ARGV[1],
  'appTokenHash', ARGV[2],
  'webTokenHash', ARGV[3],
  'request', ARGV[4])
redis.call('PEXPIREAT', KEYS[1], expires_at)
return 1
`;

const PUT_RESPONSE_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
if redis.call('HGET', KEYS[1], 'appTokenHash') ~= ARGV[1] then return 0 end
local status = redis.call('HGET', KEYS[1], 'status')
if status == 'response_available' then
  if redis.call('HGET', KEYS[1], 'responseFingerprint') == ARGV[3] then return 2 end
  return 3
end
if status ~= 'pending' then return 0 end
redis.call('HSET', KEYS[1],
  'status', 'response_available',
  'response', ARGV[2],
  'responseFingerprint', ARGV[3])
redis.call('PUBLISH', KEYS[2], 'ready')
return 1
`;

const ACK_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
if redis.call('HGET', KEYS[1], 'webTokenHash') ~= ARGV[1] then return 0 end
if redis.call('HGET', KEYS[1], 'status') ~= 'response_available' then return 0 end
redis.call('DEL', KEYS[1])
redis.call('PUBLISH', KEYS[2], 'removed')
return 1
`;

const CANCEL_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
if redis.call('HGET', KEYS[1], 'webTokenHash') ~= ARGV[1] then return 0 end
redis.call('DEL', KEYS[1])
redis.call('PUBLISH', KEYS[2], 'removed')
return 1
`;

const RATE_SCRIPT = `
local count = redis.call('HINCRBY', KEYS[1], 'count', 1)
local bytes = redis.call('HINCRBY', KEYS[1], 'bytes', tonumber(ARGV[1]))
if count == 1 then redis.call('PEXPIRE', KEYS[1], 120000) end
if count > tonumber(ARGV[2]) or bytes > tonumber(ARGV[3]) then return 0 end
return 1
`;

export class RedisRelayStore implements RelayStore {
  private readonly client: RedisClientType;
  private readonly subscriber: RedisClientType;
  private readonly waiters = new Map<string, Set<() => void>>();

  public constructor(
    redisUrl: string,
    private readonly prefix = 'mosaiclynx:relay:v1'
  ) {
    this.client = createClient({ url: redisUrl });
    this.subscriber = this.client.duplicate();
    this.client.on('error', () => console.error('relay_redis_error'));
    this.subscriber.on('error', () => console.error('relay_redis_subscriber_error'));
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      await this.subscriber.connect();
      await this.subscriber.pSubscribe(`${this.prefix}:notify:*`, (_message, channel) => {
        for (const resolve of this.waiters.get(channel) ?? []) resolve();
      });
    } catch (error) {
      if (this.subscriber.isOpen) this.subscriber.destroy();
      if (this.client.isOpen) this.client.destroy();
      throw error;
    }
  }

  public async close(): Promise<void> {
    for (const waiters of this.waiters.values()) for (const resolve of waiters) resolve();
    this.waiters.clear();
    if (this.subscriber.isOpen) {
      await this.subscriber.pUnsubscribe(`${this.prefix}:notify:*`);
      await this.subscriber.close();
    }
    if (this.client.isOpen) await this.client.close();
  }

  public async isReady(): Promise<boolean> {
    return this.client.isReady && (await this.client.ping()) === 'PONG';
  }

  public async create(key: string, session: StoredSession): Promise<CreateResult> {
    const result = Number(
      await this.client.eval(CREATE_SCRIPT, {
        keys: [this.sessionKey(key)],
        arguments: [String(session.expiresAtMs), session.appTokenHash, session.webTokenHash, session.request],
      })
    );
    return result === 1 ? 'created' : result === 0 ? 'exists' : 'expired';
  }

  public async get(key: string): Promise<StoredSession | undefined> {
    const values = await this.client.hGetAll(this.sessionKey(key));
    if (
      (values.status !== 'pending' && values.status !== 'response_available') ||
      !values.expiresAtMs ||
      !values.appTokenHash ||
      !values.webTokenHash ||
      !values.request
    )
      return undefined;
    const expiresAtMs = Number(values.expiresAtMs);
    if (!Number.isSafeInteger(expiresAtMs)) return undefined;
    return {
      status: values.status,
      expiresAtMs,
      appTokenHash: values.appTokenHash,
      webTokenHash: values.webTokenHash,
      request: values.request,
      ...(values.response ? { response: values.response } : {}),
      ...(values.responseFingerprint ? { responseFingerprint: values.responseFingerprint } : {}),
    };
  }

  public async putResponse(
    key: string,
    expectedAppTokenHash: string,
    response: string,
    fingerprint: string
  ): Promise<PutResponseResult> {
    const result = Number(
      await this.client.eval(PUT_RESPONSE_SCRIPT, {
        keys: [this.sessionKey(key), this.notificationChannel(key)],
        arguments: [expectedAppTokenHash, response, fingerprint],
      })
    );
    return result === 1 ? 'created' : result === 2 ? 'same' : result === 3 ? 'different' : 'missing';
  }

  public async acknowledge(key: string, expectedWebTokenHash: string): Promise<void> {
    await this.client.eval(ACK_SCRIPT, {
      keys: [this.sessionKey(key), this.notificationChannel(key)],
      arguments: [expectedWebTokenHash],
    });
  }

  public async cancel(key: string, expectedWebTokenHash: string): Promise<void> {
    await this.client.eval(CANCEL_SCRIPT, {
      keys: [this.sessionKey(key), this.notificationChannel(key)],
      arguments: [expectedWebTokenHash],
    });
  }

  public async consumeCreateRate(
    ipKey: string,
    nowMs: number,
    requestBytes: number,
    countLimit: number,
    byteLimit: number
  ): Promise<boolean> {
    const bucket = Math.floor(nowMs / 60_000);
    const result = Number(
      await this.client.eval(RATE_SCRIPT, {
        keys: [`${this.prefix}:rate:${ipKey}:${bucket}`],
        arguments: [String(requestBytes), String(countLimit), String(byteLimit)],
      })
    );
    return result === 1;
  }

  public async waitForChange(key: string, timeoutMs: number): Promise<void> {
    const channel = this.notificationChannel(key);
    await new Promise<void>((resolve) => {
      const waiters = this.waiters.get(channel) ?? new Set<() => void>();
      const done = (): void => {
        clearTimeout(timer);
        waiters.delete(done);
        if (waiters.size === 0) this.waiters.delete(channel);
        resolve();
      };
      const timer = setTimeout(done, timeoutMs);
      waiters.add(done);
      this.waiters.set(channel, waiters);
    });
  }

  private sessionKey(key: string): string {
    return `${this.prefix}:session:${key}`;
  }

  private notificationChannel(key: string): string {
    return `${this.prefix}:notify:${key}`;
  }
}
