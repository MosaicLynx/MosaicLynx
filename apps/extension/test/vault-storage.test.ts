import { deriveSharedAccount, generateMnemonic } from '@mosaiclynx/chain-symbol';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DuplicateMnemonicProfileError,
  type ExtensionStore,
  LEGACY_STORAGE_KEY,
  STORAGE_KEYS,
  assertUniqueMnemonicProfile,
  deleteProfileFromStore,
  findProfileByMnemonic,
  isProfileDeletionConfirmed,
  loadStore,
} from '../src/vault.js';

describe('extension store migration', () => {
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

  it('separates accounts from legacy profiles before removing the V1 key', async () => {
    const account = {
      id: 'account-1',
      profileId: 'profile-1',
      name: 'Account 1',
      identities: {},
      source: {},
      revision: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    values[LEGACY_STORAGE_KEY] = {
      schemaVersion: 1,
      profiles: [
        {
          id: 'profile-1',
          name: 'Test',
          network: 'testnet',
          accounts: [account],
          defaultAccountId: account.id,
          nextAccountIndex: 1,
          revision: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      vaults: [],
      permissions: [],
      usedMessageNonces: [],
      settings: {
        activeProfileId: 'profile-1',
        activeChain: 'symbol',
        language: 'ja',
        theme: 'light',
        autoLockMinutes: 15,
      },
    };

    const migrated = await loadStore();

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.accounts).toEqual([account]);
    expect(migrated.profiles[0]).not.toHaveProperty('accounts');
    expect(values[STORAGE_KEYS.profiles]).toEqual(migrated.profiles);
    expect(values[STORAGE_KEYS.accounts]).toEqual([account]);
    expect(values).not.toHaveProperty(LEGACY_STORAGE_KEY);
  });

  it('keeps the V1 key when the V2 commit fails', async () => {
    values[LEGACY_STORAGE_KEY] = {
      schemaVersion: 1,
      profiles: [],
      vaults: [],
      permissions: [],
      usedMessageNonces: [],
      settings: { activeChain: 'symbol', language: 'ja', theme: 'light', autoLockMinutes: 15 },
    };
    vi.mocked(chrome.storage.local.set).mockRejectedValueOnce(new Error('storage full'));

    await expect(loadStore()).rejects.toThrow('storage full');

    expect(values).toHaveProperty(LEGACY_STORAGE_KEY);
    expect(chrome.storage.local.remove).not.toHaveBeenCalled();
  });
});

describe('profile deletion', () => {
  const store: ExtensionStore = {
    schemaVersion: 2,
    profiles: [
      {
        id: 'profile-1',
        name: 'Delete me',
        network: 'testnet',
        defaultAccountId: 'account-1',
        nextAccountIndex: 1,
        revision: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'profile-2',
        name: 'Keep me',
        network: 'mainnet',
        defaultAccountId: 'account-2',
        nextAccountIndex: 1,
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
      activeChain: 'symbol',
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
  const identities = deriveSharedAccount('mainnet', mnemonic, 0).identities;
  const profile = {
    id: 'profile-root',
    name: 'Existing profile',
    network: 'mainnet' as const,
    enabledChains: ['symbol', 'nem'] as const,
    defaultAccountId: 'account-root',
    nextAccountIndex: 1,
    hdAccountIds: [] as readonly string[],
    revision: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const store = {
    schemaVersion: 2,
    profiles: [profile],
    accounts: [
      {
        id: 'account-root',
        profileId: profile.id,
        name: 'Excluded root',
        identities,
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
      activeChain: 'symbol' as const,
      language: 'ja' as const,
      theme: 'light' as const,
      autoLockMinutes: 15,
    },
  } satisfies ExtensionStore;

  it('detects the same root public keys across networks and excluded HD accounts', () => {
    expect(findProfileByMnemonic(store, mnemonic)).toBe(profile);
    expect(() => assertUniqueMnemonicProfile(store, mnemonic)).toThrow(DuplicateMnemonicProfileError);
    expect(() => assertUniqueMnemonicProfile(store, mnemonic)).toThrow('already exists');
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

    expect(findProfileByMnemonic(store, generateMnemonic())).toBeUndefined();
    expect(findProfileByMnemonic(importedStore, mnemonic)).toBeUndefined();
  });
});
