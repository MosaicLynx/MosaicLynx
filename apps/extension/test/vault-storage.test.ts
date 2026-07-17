import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type ExtensionStore,
  LEGACY_STORAGE_KEY,
  STORAGE_KEYS,
  deleteProfileFromStore,
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
