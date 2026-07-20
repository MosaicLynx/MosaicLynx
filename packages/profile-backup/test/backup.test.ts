import type { RelayCryptoDriver } from '@mosaiclynx/relay-protocol';
import { describe, expect, it } from 'vitest';

import { webcrypto } from 'node:crypto';

import { exportProfileBackup, importProfileBackup, serializeProfileBackup } from '../src/index.js';

const buffer = (bytes: Uint8Array): ArrayBuffer => bytes.slice().buffer as ArrayBuffer;
const driver: RelayCryptoDriver = {
  randomBytes(length) {
    return webcrypto.getRandomValues(new Uint8Array(length));
  },
  async encryptAesGcm(key, plaintext, nonce, aad) {
    const imported = await webcrypto.subtle.importKey('raw', buffer(key), 'AES-GCM', false, ['encrypt']);
    return new Uint8Array(
      await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv: buffer(nonce), additionalData: buffer(aad) },
        imported,
        buffer(plaintext)
      )
    );
  },
  async decryptAesGcm(key, ciphertext, nonce, aad) {
    const imported = await webcrypto.subtle.importKey('raw', buffer(key), 'AES-GCM', false, ['decrypt']);
    return new Uint8Array(
      await webcrypto.subtle.decrypt(
        { name: 'AES-GCM', iv: buffer(nonce), additionalData: buffer(aad) },
        imported,
        buffer(ciphertext)
      )
    );
  },
};

const fixture = {
  profile: {
    id: 'profile-1',
    network: 'testnet' as const,
    name: 'Test',
    accountIds: ['account-1'],
    defaultAccountId: 'account-1',
    nextAccountIndex: 1,
    vaultRef: 'vault:profile-1',
    revision: 1,
    createdAt: '2026-07-20T00:00:00Z',
    updatedAt: '2026-07-20T00:00:00Z',
  },
  accounts: [
    {
      id: 'account-1',
      profileId: 'profile-1',
      name: 'Account 1',
      identities: {
        symbol: { address: 'T', publicKey: '1'.repeat(64) },
        nem: { address: 'T', publicKey: '2'.repeat(64) },
      },
      source: {
        kind: 'mnemonicDerived' as const,
        secretRef: 'vault:profile-1:mnemonic:0',
        accountIndex: 0,
        derivationPath: "44'/4343'/0'/0'/0'",
      },
      revision: 1,
      createdAt: '2026-07-20T00:00:00Z',
      updatedAt: '2026-07-20T00:00:00Z',
    },
  ],
  permissions: [],
  vault: { mnemonic: 'word '.repeat(23) + 'word', importedPrivateKeys: {} },
};

describe('profile backup', () => {
  it('round-trips a Testnet profile with a fresh encrypted envelope', async () => {
    const backup = await exportProfileBackup(driver, fixture, 'correct horse battery staple');
    const second = await exportProfileBackup(driver, fixture, 'correct horse battery staple');
    expect(second.kdf.salt).not.toBe(backup.kdf.salt);
    expect(second.cipher.nonce).not.toBe(backup.cipher.nonce);
    const restored = await importProfileBackup(driver, serializeProfileBackup(backup), 'correct horse battery staple');
    expect(restored.profile).toEqual(fixture.profile);
    expect(restored.vault.mnemonic).toBe(fixture.vault.mnemonic);
  }, 30_000);

  it('refuses Mainnet before encryption', async () => {
    await expect(
      exportProfileBackup(
        driver,
        { ...fixture, profile: { ...fixture.profile, network: 'mainnet' } },
        'correct horse battery staple'
      )
    ).rejects.toThrow('Only Testnet');
  });

  it('rejects a wrong password and AAD substitution', async () => {
    const backup = await exportProfileBackup(driver, fixture, 'correct horse battery staple');
    await expect(importProfileBackup(driver, backup, 'this password is incorrect')).rejects.toThrow(
      'Unable to decrypt'
    );
    await expect(
      importProfileBackup(driver, { ...backup, sourceProfileId: 'substituted-profile' }, 'correct horse battery staple')
    ).rejects.toThrow('Unable to decrypt');
  }, 30_000);
});
