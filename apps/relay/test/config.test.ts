import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';

describe('Relay configuration', () => {
  it('loads secure defaults and explicit required values', () => {
    const config = loadConfig({
      REDIS_URL: 'redis://redis:6379',
      RATE_LIMIT_HMAC_KEY: Buffer.alloc(32, 1).toString('base64url'),
    });
    expect(config).toMatchObject({
      host: '0.0.0.0',
      port: 8787,
      trustProxyHops: 1,
      createCountLimit: 10,
      createByteLimit: 4 * 1024 * 1024,
    });
  });

  it('fails closed for missing Redis or short HMAC keys', () => {
    expect(() => loadConfig({ RATE_LIMIT_HMAC_KEY: Buffer.alloc(32).toString('base64url') })).toThrow(
      'invalid_config:REDIS_URL'
    );
    expect(() => loadConfig({ REDIS_URL: 'redis://redis:6379', RATE_LIMIT_HMAC_KEY: 'c2hvcnQ' })).toThrow(
      'invalid_config:RATE_LIMIT_HMAC_KEY'
    );
  });
});
