import { deriveSharedAccount, generateMnemonic } from '@mosaiclynx/chain-symbol';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DuplicateMnemonicProfileError,
  type ExtensionStore,
  STORAGE_KEYS,
  assertUniqueMnemonicProfile,
  deleteProfileFromStore,
  findProfileByMnemonic,
  isProfileDeletionConfirmed,
  loadStore,
} from '../src/vault.js';

describe('extension store schema', () => {
  let values: Record<string, unknown>;

  beforeEach(() => {
    values = {};
    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn(async () => ({ ...values })),
          set: vi.fn(async (next: Record<string, unknown>) => {
            Object.assign(values, next);
          }),
          remove: vi.fn(async (key: string) => {
            delete values[key];
          }),
        },
      },
    } as unknown as typeof chrome;
  });

  it('does not migrate an old store into the single-chain schema', async () => {
    values.mosaicLynxMetaV2 = { schemaVersion: 2 };

    const store = await loadStore();

    expect(store.schemaVersion).toBe(3);
    expect(store.profiles).toEqual([]);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('rejects a current-schema store that still contains mixed-chain data', async () => {
    values[STORAGE_KEYS.meta] = {
      schemaVersion: 3,
      settings: { language: 'ja', theme: 'light', autoLockMinutes: 15 },
    };
    values[STORAGE_KEYS.profiles] = [{ id: 'profile-1', enabledChains: ['symbol', 'nem'] }];

    await expect(loadStore()).rejects.toThrow('Unsupported mixed-chain profile store.');
  });

  it('rejects a current-schema permission whose chain or network differs from its profile', async () => {
    values[STORAGE_KEYS.meta] = {
      schemaVersion: 3,
      settings: { language: 'ja', theme: 'light', autoLockMinutes: 15 },
    };
    values[STORAGE_KEYS.profiles] = [
      {
        id: 'profile-1',
        network: 'testnet',
        chain: 'symbol',
        defaultAccountId: 'account-1',
        nextAccountIndex: 1,
        hdAccountIds: ['account-1'],
      },
    ];
    values[STORAGE_KEYS.permissions] = [
      { profileId: 'profile-1', origin: 'https://example.com', chain: 'nem', network: 'testnet' },
    ];

    await expect(loadStore()).rejects.toThrow('Unsupported mixed-chain profile store.');
  });
});

describe('profile deletion', () => {
  const store: ExtensionStore = {
    schemaVersion: 3,
    profiles: [
      {
        id: 'profile-1',
        name: 'Delete me',
        network: 'testnet',
        chain: 'symbol',
        defaultAccountId: 'account-1',
        nextAccountIndex: 1,
        hdAccountIds: ['account-1'],
        revision: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'profile-2',
        name: 'Keep me',
        network: 'mainnet',
        chain: 'nem',
        defaultAccountId: 'account-2',
        nextAccountIndex: 1,
        hdAccountIds: ['account-2'],
        revision: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    accounts: [
      { id: 'account-1', profileId: 'profile-1' },
      { id: 'account-2', profileId: 'profile-2' },
    ] as ExtensionStore['accounts'],
    vaults: [{ profileId: 'profile-1' }, { profileId: 'profile-2' }] as ExtensionStore['vaults'],
    permissions: [
      { profileId: 'profile-1', origin: 'https://delete.example' },
      { profileId: 'profile-2', origin: 'https://keep.example' },
    ] as ExtensionStore['permissions'],
    usedMessageNonces: [
      { profileId: 'profile-1', accountId: 'account-1' },
      { profileId: 'profile-2', accountId: 'account-2' },
    ] as ExtensionStore['usedMessageNonces'],
    settings: {
      activeProfileId: 'profile-1',
      language: 'ja',
      theme: 'light',
      autoLockMinutes: 15,
    },
  };

  it('requires an exact profile name and at least one remaining profile', () => {
    expect(isProfileDeletionConfirmed(store, 'profile-1', '')).toBe(false);
    expect(isProfileDeletionConfirmed(store, 'profile-1', 'delete me')).toBe(false);
    expect(isProfileDeletionConfirmed(store, 'profile-1', 'Delete me')).toBe(true);
    expect(isProfileDeletionConfirmed({ ...store, profiles: [store.profiles[0]!] }, 'profile-1', 'Delete me')).toBe(
      false
    );
  });

  it('removes only records scoped to the deleted profile and selects a remaining profile', () => {
    const next = deleteProfileFromStore(store, 'profile-1');

    expect(next.profiles.map((profile) => profile.id)).toEqual(['profile-2']);
    expect(next.accounts.map((account) => account.id)).toEqual(['account-2']);
    expect(next.vaults.map((vault) => vault.profileId)).toEqual(['profile-2']);
    expect(next.permissions.map((grant) => grant.profileId)).toEqual(['profile-2']);
    expect(next.usedMessageNonces.map((entry) => entry.profileId)).toEqual(['profile-2']);
    expect(next.settings.activeProfileId).toBe('profile-2');
  });

  it('does not allow the last profile to be deleted', () => {
    const singleProfileStore = { ...store, profiles: [store.profiles[0]!] };

    expect(() => deleteProfileFromStore(singleProfileStore, 'profile-1')).toThrow('last profile');
  });
});

describe('mnemonic profile uniqueness', () => {
  const mnemonic = generateMnemonic();
  const identity = deriveSharedAccount('mainnet', mnemonic, 0).identities.symbol;
  const profile = {
    id: 'profile-root',
    name: 'Existing profile',
    network: 'mainnet' as const,
    chain: 'symbol' as const,
    defaultAccountId: 'account-root',
    nextAccountIndex: 1,
    hdAccountIds: [] as readonly string[],
    revision: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const store = {
    schemaVersion: 3,
    profiles: [profile],
    accounts: [
      {
        id: 'account-root',
        profileId: profile.id,
        chain: 'symbol' as const,
        name: 'Excluded root',
        identity,
        source: {
          kind: 'mnemonicDerived' as const,
          secretRef: 'vault:profile-root:mnemonic:0',
          accountIndex: 0,
          derivationPath: "44'/4343'/0'/0'/0'",
        },
        status: 'excluded' as const,
        excludedAt: '2026-01-02T00:00:00.000Z',
        revision: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ],
    vaults: [],
    permissions: [],
    usedMessageNonces: [],
    settings: {
      activeProfileId: profile.id,
      language: 'ja' as const,
      theme: 'light' as const,
      autoLockMinutes: 15,
    },
  } satisfies ExtensionStore;

  it('detects the same root public keys for the same network, including excluded HD accounts', () => {
    expect(findProfileByMnemonic(store, mnemonic, 'mainnet', 'symbol')).toBe(profile);
    expect(() => assertUniqueMnemonicProfile(store, mnemonic, 'mainnet', 'symbol')).toThrow(
      DuplicateMnemonicProfileError
    );
    expect(() => assertUniqueMnemonicProfile(store, mnemonic, 'mainnet', 'symbol')).toThrow('already exists');
  });

  it('allows the same mnemonic in a profile for another network', () => {
    expect(findProfileByMnemonic(store, mnemonic, 'testnet', 'symbol')).toBeUndefined();
    expect(() => assertUniqueMnemonicProfile(store, mnemonic, 'testnet', 'symbol')).not.toThrow();
  });

  it('allows the same mnemonic in a separate profile for the other chain', () => {
    expect(findProfileByMnemonic(store, mnemonic, 'mainnet', 'nem')).toBeUndefined();
    expect(() => assertUniqueMnemonicProfile(store, mnemonic, 'mainnet', 'nem')).not.toThrow();
  });

  it('does not treat a different root or an imported private key as a duplicate mnemonic', () => {
    const importedStore: ExtensionStore = {
      ...store,
      accounts: [
        {
          ...store.accounts[0]!,
          source: {
            kind: 'importedPrivateKey',
            secretRef: 'vault:profile-root:private:account-root',
          },
        },
      ],
    };

    expect(findProfileByMnemonic(store, generateMnemonic(), 'mainnet', 'symbol')).toBeUndefined();
    expect(findProfileByMnemonic(importedStore, mnemonic, 'mainnet', 'symbol')).toBeUndefined();
  });
});
