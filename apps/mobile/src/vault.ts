import { base64UrlDecode, base64UrlEncode, canonicalize, utf8 } from '@mosaiclynx/relay-protocol';
import { argon2idAsync } from '@noble/hashes/argon2.js';

import { mobileCryptoDriver } from './crypto';
import type { MobileVaultEnvelope, VaultContents } from './model';

const decoder = new TextDecoder('utf-8', { fatal: true });

const aad = (profileId: string, revision: number): Uint8Array =>
  utf8(
    canonicalize({
      format: 'mosaiclynx.profile-vault.v1',
      profileId,
      formatVersion: 1,
      schemaVersion: 1,
      revision,
      kdf: { name: 'argon2id', memoryKiB: 65536, iterations: 3, parallelism: 1, outputBytes: 32 },
      cipher: { name: 'AES-256-GCM' },
    })
  );

const deriveKey = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
  if (password.length < 12) throw new Error('PASSWORD_TOO_SHORT');
  const passwordBytes = utf8(password);
  try {
    return await argon2idAsync(passwordBytes, salt, {
      m: 65536,
      t: 3,
      p: 1,
      dkLen: 32,
      maxmem: 72 * 1024 * 1024,
      asyncTick: 16,
    });
  } finally {
    passwordBytes.fill(0);
  }
};

const encryptWithKey = async (
  profileId: string,
  key: Uint8Array,
  salt: Uint8Array,
  contents: VaultContents,
  revision: number
): Promise<MobileVaultEnvelope> => {
  const nonce = mobileCryptoDriver.randomBytes(12);
  const plaintext = utf8(canonicalize(contents));
  try {
    const encrypted = await mobileCryptoDriver.encryptAesGcm(key, plaintext, nonce, aad(profileId, revision));
    return {
      profileId,
      formatVersion: 1,
      schemaVersion: 1,
      revision,
      kdf: {
        name: 'argon2id',
        salt: base64UrlEncode(salt),
        memoryKiB: 65536,
        iterations: 3,
        parallelism: 1,
        outputBytes: 32,
      },
      cipher: { name: 'AES-256-GCM', nonce: base64UrlEncode(nonce), ciphertextAndTag: base64UrlEncode(encrypted) },
    };
  } finally {
    plaintext.fill(0);
  }
};

export const createVault = async (
  profileId: string,
  password: string,
  contents: VaultContents
): Promise<MobileVaultEnvelope> => {
  const salt = mobileCryptoDriver.randomBytes(16);
  const key = await deriveKey(password, salt);
  try {
    return await encryptWithKey(profileId, key, salt, contents, 1);
  } finally {
    key.fill(0);
  }
};

export interface UnlockedVault {
  readonly key: Uint8Array;
}

const assertEnvelope = (envelope: MobileVaultEnvelope): void => {
  if (
    envelope.formatVersion !== 1 ||
    envelope.schemaVersion !== 1 ||
    envelope.kdf.name !== 'argon2id' ||
    envelope.kdf.memoryKiB < 65536 ||
    envelope.kdf.iterations < 3 ||
    envelope.kdf.parallelism !== 1 ||
    envelope.kdf.outputBytes !== 32 ||
    envelope.cipher.name !== 'AES-256-GCM'
  )
    throw new Error('UNSUPPORTED_VAULT');
};

const decryptContents = async (envelope: MobileVaultEnvelope, key: Uint8Array): Promise<VaultContents> => {
  assertEnvelope(envelope);
  const decrypted = await mobileCryptoDriver.decryptAesGcm(
    key,
    base64UrlDecode(envelope.cipher.ciphertextAndTag),
    base64UrlDecode(envelope.cipher.nonce, 12),
    aad(envelope.profileId, envelope.revision)
  );
  try {
    const contents = JSON.parse(decoder.decode(decrypted)) as VaultContents;
    if (!contents.importedPrivateKeys || typeof contents.importedPrivateKeys !== 'object') throw new Error();
    return contents;
  } finally {
    decrypted.fill(0);
  }
};

export const destroyVaultContents = (contents: VaultContents): void => {
  delete contents.mnemonic;
  for (const accountId of Object.keys(contents.importedPrivateKeys)) delete contents.importedPrivateKeys[accountId];
};

export const unlockVault = async (envelope: MobileVaultEnvelope, password: string): Promise<UnlockedVault> => {
  assertEnvelope(envelope);
  const key = await deriveKey(password, base64UrlDecode(envelope.kdf.salt, 16));
  try {
    const contents = await decryptContents(envelope, key);
    destroyVaultContents(contents);
    return { key };
  } catch {
    key.fill(0);
    throw new Error('UNLOCK_FAILED');
  }
};

export const readUnlockedVault = async (
  envelope: MobileVaultEnvelope,
  session: UnlockedVault
): Promise<VaultContents> => {
  try {
    return await decryptContents(envelope, session.key);
  } catch {
    throw new Error('UNLOCK_FAILED');
  }
};

export const updateUnlockedVault = (
  envelope: MobileVaultEnvelope,
  session: UnlockedVault,
  contents: VaultContents
): Promise<MobileVaultEnvelope> =>
  encryptWithKey(
    envelope.profileId,
    session.key,
    base64UrlDecode(envelope.kdf.salt, 16),
    contents,
    envelope.revision + 1
  );

export const destroyUnlockedVault = (session: UnlockedVault): void => {
  session.key.fill(0);
};
