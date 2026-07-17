import { describe, expect, it } from 'vitest';

import { type RpcExecutor, RpcMosaicLynxProvider, isSupportedApiVersion } from '../src/index.js';

describe('Provider API v2', () => {
  it('exposes only dApp-safe Promise methods through request RPC', async () => {
    const requests: unknown[] = [];
    const executor: RpcExecutor = {
      request: async (request) => {
        requests.push(request);
        return [];
      },
    };
    const provider = new RpcMosaicLynxProvider(executor);
    await expect(provider.connect({ chain: 'symbol', network: 'testnet' })).resolves.toEqual([]);
    await expect(provider.getAccounts()).resolves.toEqual([]);
    expect('unlock' in provider).toBe(false);
    expect('switchProfile' in provider).toBe(false);
    expect(requests).toEqual([
      { method: 'permissions_connect', params: { chain: 'symbol', network: 'testnet' } },
      { method: 'account_list' },
    ]);
    expect(provider.apiVersion).toBe('2.0.0');
    expect(isSupportedApiVersion('2.9.0')).toBe(true);
    expect(isSupportedApiVersion('1.9.0')).toBe(false);
  });
});
