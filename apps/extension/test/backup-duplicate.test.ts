import { deriveSharedAccount, generateMnemonic } from '@mosaiclynx/chain-symbol';
import type { ProfileBackupPlaintext } from '@mosaiclynx/profile-backup';
import { importProfileBackup } from '@mosaiclynx/profile-backup';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DuplicateMnemonicProfileError,
  type ExtensionStore,
  importExtensionProfileBackup,
} from '../src/vault.js';

vi.mock('@mosaiclynx/profile-backup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mosaiclynx/profile-backup')>();
  return { ...actual, importProfileBackup: vi.fn() };
});

afterEach(() => {
  vi.mocked(importProfileBackup).mockReset();
});

describe('extension backup mnemonic uniqueness', () => {
  it('rejects a backup whose mnemonic root already belongs to another profile', async () => {
    const mnemonic = generateMnemonic();
    const existingMaterial = deriveSharedAccount('mainnet', mnemonic, 0);
    const restoredMaterial = deriveSharedAccount('testnet', mnemonic, 0);
    const now = '2026-07-30T00:00:00.000Z';
    const restored: ProfileBackupPlaintext = {
      profile: {
        id: 'backup-profile',
        network: 'testnet',
        enabledChains: ['symbol', 'nem'],
        name: 'Backup profile',
        accountIds: ['backup-account'],
        hdAccountIds: ['backup-account'],
        defaultAccountId: 'backup-account',
        nextAccountIndex: 1,
        vaultRef: 'vault:backup-profile',
        revision: 1,
        createdAt: now,
        updatedAt: now,
      },
      accounts: [
        {
          id: 'backup-account',
          profileId: 'backup-profile',
          name: 'Account 1',
          identities: restoredMaterial.identities,
          source: {
            kind: 'mnemonicDerived',
            secretRef: 'vault:backup-profile:mnemonic:0',
            accountIndex: 0,
            derivationPath: restoredMaterial.derivationPath,
          },
          status: 'active',
          revision: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      permissions: [],
      vault: {
        mnemonic,
        hdPrivateKeys: { 'backup-account': restoredMaterial.privateKey },
        importedPrivateKeys: {},
      },
    };
    const store: ExtensionStore = {
      schemaVersion: 2,
      profiles: [
        {
          id: 'existing-profile',
          name: 'Existing profile',
          network: 'mainnet',
          enabledChains: ['symbol', 'nem'],
          defaultAccountId: 'existing-account',
          nextAccountIndex: 1,
          hdAccountIds: ['existing-account'],
          revision: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      accounts: [
        {
          id: 'existing-account',
          profileId: 'existing-profile',
          name: 'Account 1',
          identities: existingMaterial.identities,
          source: {
            kind: 'mnemonicDerived',
            secretRef: 'vault:existing-profile:mnemonic:0',
            accountIndex: 0,
            derivationPath: existingMaterial.derivationPath,
          },
          status: 'active',
          revision: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      vaults: [],
      permissions: [],
      usedMessageNonces: [],
      settings: {
        activeProfileId: 'existing-profile',
        activeChain: 'symbol',
        language: 'ja',
        theme: 'light',
        autoLockMinutes: 15,
      },
    };
    vi.mocked(importProfileBackup).mockResolvedValue(restored);

    await expect(importExtensionProfileBackup(store, '{}', 'correct horse battery staple')).rejects.toMatchObject({
      name: DuplicateMnemonicProfileError.name,
      profileName: 'Existing profile',
    });
  });
});
