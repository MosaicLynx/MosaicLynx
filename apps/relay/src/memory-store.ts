import type { CreateResult, PutResponseResult, RelayStore } from './store.js';
import type { StoredSession } from './types.js';

interface RateBucket {
  count: number;
  bytes: number;
}

export class MemoryRelayStore implements RelayStore {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly rates = new Map<string, RateBucket>();
  private readonly waiters = new Map<string, Set<() => void>>();
  private connected = false;

  public constructor(private readonly now: () => number = Date.now) {}

  public async connect(): Promise<void> {
    this.connected = true;
  }

  public async close(): Promise<void> {
    this.connected = false;
    for (const waiters of this.waiters.values()) for (const resolve of waiters) resolve();
    this.waiters.clear();
  }

  public async isReady(): Promise<boolean> {
    return this.connected;
  }

  public async create(key: string, session: StoredSession): Promise<CreateResult> {
    this.expire(key);
    if (session.expiresAtMs <= this.now()) return 'expired';
    if (this.sessions.has(key)) return 'exists';
    this.sessions.set(key, session);
    return 'created';
  }

  public async get(key: string): Promise<StoredSession | undefined> {
    this.expire(key);
    return this.sessions.get(key);
  }

  public async putResponse(
    key: string,
    expectedAppTokenHash: string,
    response: string,
    fingerprint: string
  ): Promise<PutResponseResult> {
    this.expire(key);
    const session = this.sessions.get(key);
    if (!session || session.appTokenHash !== expectedAppTokenHash) return 'missing';
    if (session.status === 'response_available')
      return session.responseFingerprint === fingerprint ? 'same' : 'different';
    this.sessions.set(key, { ...session, status: 'response_available', response, responseFingerprint: fingerprint });
    this.notify(key);
    return 'created';
  }

  public async acknowledge(key: string, expectedWebTokenHash: string): Promise<void> {
    this.expire(key);
    const session = this.sessions.get(key);
    if (session?.webTokenHash === expectedWebTokenHash && session.status === 'response_available')
      this.sessions.delete(key);
  }

  public async cancel(key: string, expectedWebTokenHash: string): Promise<void> {
    this.expire(key);
    const session = this.sessions.get(key);
    if (session?.webTokenHash === expectedWebTokenHash) {
      this.sessions.delete(key);
      this.notify(key);
    }
  }

  public async consumeCreateRate(
    ipKey: string,
    nowMs: number,
    requestBytes: number,
    countLimit: number,
    byteLimit: number
  ): Promise<boolean> {
    const bucketKey = `${ipKey}:${Math.floor(nowMs / 60_000)}`;
    const bucket = this.rates.get(bucketKey) ?? { count: 0, bytes: 0 };
    bucket.count += 1;
    bucket.bytes += requestBytes;
    this.rates.set(bucketKey, bucket);
    return bucket.count <= countLimit && bucket.bytes <= byteLimit;
  }

  public async waitForChange(key: string, timeoutMs: number): Promise<void> {
    await new Promise<void>((resolve) => {
      const waiters = this.waiters.get(key) ?? new Set<() => void>();
      const done = (): void => {
        clearTimeout(timer);
        waiters.delete(done);
        if (waiters.size === 0) this.waiters.delete(key);
        resolve();
      };
      const timer = setTimeout(done, timeoutMs);
      waiters.add(done);
      this.waiters.set(key, waiters);
    });
  }

  public inspect(key: string): StoredSession | undefined {
    this.expire(key);
    return this.sessions.get(key);
  }

  private expire(key: string): void {
    const session = this.sessions.get(key);
    if (session && session.expiresAtMs <= this.now()) {
      this.sessions.delete(key);
      this.notify(key);
    }
  }

  private notify(key: string): void {
    for (const resolve of this.waiters.get(key) ?? []) resolve();
  }
}
