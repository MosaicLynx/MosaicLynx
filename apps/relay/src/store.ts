import type { StoredSession } from './types.js';

export type CreateResult = 'created' | 'exists' | 'expired';
export type PutResponseResult = 'created' | 'same' | 'different' | 'missing';

export interface RelayStore {
  connect(): Promise<void>;
  close(): Promise<void>;
  isReady(): Promise<boolean>;
  create(key: string, session: StoredSession): Promise<CreateResult>;
  get(key: string): Promise<StoredSession | undefined>;
  putResponse(
    key: string,
    expectedAppTokenHash: string,
    response: string,
    fingerprint: string
  ): Promise<PutResponseResult>;
  acknowledge(key: string, expectedWebTokenHash: string): Promise<void>;
  cancel(key: string, expectedWebTokenHash: string): Promise<void>;
  consumeCreateRate(
    ipKey: string,
    nowMs: number,
    requestBytes: number,
    countLimit: number,
    byteLimit: number
  ): Promise<boolean>;
  waitForChange(key: string, timeoutMs: number): Promise<void>;
}
