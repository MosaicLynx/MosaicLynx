import { describe, expect, it } from 'vitest';

import type { MobilePersistedState } from '../src/model.js';
import { normalizeMobileState } from '../src/state.js';

describe('mobile state migration', () => {
  it('removes legacy imported-account chain selections in favor of profile chains', () => {
    const legacy = {
      schemaVersion: 1,
      profiles: [
        {
          id: 'profile-1',
          network: 'testnet',
          enabledChains: ['symbol'],
          name: 'Profile',
          accountIds: ['account-1'],
          defaultAccountId: 'account-1',
          nextAccountIndex: 1,
          vaultRef: 'vault:profile-1',
          revision: 1,
          createdAt: '2026-07-30T00:00:00Z',
          updatedAt: '2026-07-30T00:00:00Z',
        },
      ],
      accounts: [
        {
          id: 'account-1',
          profileId: 'profile-1',
          name: 'Imported',
          identities: {
            symbol: { address: 'S', publicKey: 'A'.repeat(64) },
            nem: { address: 'N', publicKey: 'B'.repeat(64) },
          },
          source: { kind: 'importedPrivateKey', secretRef: 'vault:profile-1:private:account-1', chains: ['symbol'] },
          revision: 1,
          createdAt: '2026-07-30T00:00:00Z',
          updatedAt: '2026-07-30T00:00:00Z',
        },
      ],
      vaults: [],
      permissions: [],
      settings: { activeChain: 'nem', language: 'en', theme: 'system', autoLockMinutes: 15 },
    } as unknown as MobilePersistedState;

    const normalized = normalizeMobileState(legacy);

    expect(normalized.profiles[0]?.enabledChains).toEqual(['symbol']);
    expect(normalized.profiles[0]?.hdAccountIds).toEqual([]);
    expect(normalized.settings.activeChain).toBe('symbol');
    expect(normalized.accounts[0]?.status).toBe('active');
    expect(normalized.accounts[0]?.source).toEqual({
      kind: 'importedPrivateKey',
      secretRef: 'vault:profile-1:private:account-1',
    });
  });
});
