import { describe, expect, it } from 'vitest';

import { readFile } from 'node:fs/promises';

import { MAINNET_SIGNING_ENABLED } from '../src/release-capabilities.js';

describe('Testnet mobile release', () => {
  it('cannot enable Mainnet through runtime configuration', async () => {
    expect(MAINNET_SIGNING_ENABLED).toBe(false);
    const config = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8')) as {
      expo: { extra: { mainnetEnabled: boolean }; updates: { enabled: boolean } };
    };
    expect(config.expo.extra.mainnetEnabled).toBe(false);
    expect(config.expo.updates.enabled).toBe(false);
  });
});
