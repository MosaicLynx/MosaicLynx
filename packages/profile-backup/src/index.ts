import type { Account, PermissionGrant, Profile } from '@mosaiclynx/core';
import {
  type RelayCryptoDriver,
  base64UrlDecode,
  base64UrlEncode,
  canonicalize,
  utf8,
} from '@mosaiclynx/relay-protocol';
import { argon2idAsync } from '@noble/hashes/argon2.js';

export const PROFILE_BACKUP_FORMAT = 'mosaiclynx.profile-backup.v1' as const;

export interface ProfileBackupPlaintext {
  readonly profile: Profile;
  readonly accounts: readonly Account[];
  readonly permissions: readonly PermissionGrant[];
  readonly vault: {
    readonly mnemonic?: string;
    readonly importedPrivateKeys: Readonly<Record<string, string>>;
  };
}

export interface EncryptedProfileBackup {
  readonly format: typeof PROFILE_BACKUP_FORMAT;
  readonly createdAt: string;
  readonly sourceProfileId: string;
  readonly profileNetwork: 'testnet';
  readonly schemaVersion: 1;
  readonly kdf: {
    readonly name: 'argon2id';
    readonly salt: string;
    readonly memoryKiB: 65536;
    readonly iterations: 3;
    readonly parallelism: 1;
    readonly outputBytes: 32;
  };
  readonly cipher: {
    readonly name: 'AES-256-GCM';
    readonly nonce: string;
    readonly ciphertextAndTag: string;
  };
}

const aadFor = (value: Omit<EncryptedProfileBackup, 'cipher'>): Uint8Array =>
  utf8(
    canonicalize({
      format: value.format,
      createdAt: value.createdAt,
      sourceProfileId: value.sourceProfileId,
      profileNetwork: value.profileNetwork,
      schemaVersion: value.schemaVersion,
      kdf: value.kdf,
      cipher: { name: 'AES-256-GCM' },
    })
  );

const keyFor = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
  if (password.length < 12) throw new TypeError('Backup password must contain at least 12 characters.');
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

const validatePlaintext = (value: ProfileBackupPlaintext): void => {
  if (value.profile.network !== 'testnet') throw new TypeError('Only Testnet profiles can be backed up by this build.');
  if (!value.accounts.length || value.accounts.some((account) => account.profileId !== value.profile.id))
    throw new TypeError('Backup accounts do not belong to the profile.');
  if (
    value.profile.accountIds.length !== value.accounts.length ||
    value.profile.accountIds.some((id) => !value.accounts.some((account) => account.id === id))
  )
    throw new TypeError('Backup profile account index is inconsistent.');
  if (!value.accounts.some((account) => account.id === value.profile.defaultAccountId))
    throw new TypeError('Backup default account is missing.');
  if (!value.vault.importedPrivateKeys || typeof value.vault.importedPrivateKeys !== 'object')
    throw new TypeError('Backup Vault is invalid.');
};

export const exportProfileBackup = async (
  driver: RelayCryptoDriver,
  plaintext: ProfileBackupPlaintext,
  password: string,
  now = new Date()
): Promise<EncryptedProfileBackup> => {
  validatePlaintext(plaintext);
  const salt = driver.randomBytes(16);
  const nonce = driver.randomBytes(12);
  const header = {
    format: PROFILE_BACKUP_FORMAT,
    createdAt: new Date(Math.floor(now.getTime() / 1000) * 1000).toISOString().replace('.000Z', 'Z'),
    sourceProfileId: plaintext.profile.id,
    profileNetwork: 'testnet' as const,
    schemaVersion: 1 as const,
    kdf: {
      name: 'argon2id' as const,
      salt: base64UrlEncode(salt),
      memoryKiB: 65536 as const,
      iterations: 3 as const,
      parallelism: 1 as const,
      outputBytes: 32 as const,
    },
  };
  const key = await keyFor(password, salt);
  const plaintextBytes = utf8(canonicalize(plaintext));
  try {
    const ciphertextAndTag = await driver.encryptAesGcm(key, plaintextBytes, nonce, aadFor(header));
    return {
      ...header,
      cipher: {
        name: 'AES-256-GCM',
        nonce: base64UrlEncode(nonce),
        ciphertextAndTag: base64UrlEncode(ciphertextAndTag),
      },
    };
  } finally {
    plaintextBytes.fill(0);
    key.fill(0);
  }
};

const parseEnvelope = (value: unknown): EncryptedProfileBackup => {
  const backup = value as Partial<EncryptedProfileBackup> | undefined;
  if (
    backup?.format !== PROFILE_BACKUP_FORMAT ||
    backup.profileNetwork !== 'testnet' ||
    backup.schemaVersion !== 1 ||
    typeof backup.createdAt !== 'string' ||
    typeof backup.sourceProfileId !== 'string' ||
    backup.kdf?.name !== 'argon2id' ||
    backup.kdf.memoryKiB < 65536 ||
    backup.kdf.iterations < 3 ||
    backup.kdf.parallelism !== 1 ||
    backup.kdf.outputBytes !== 32 ||
    backup.cipher?.name !== 'AES-256-GCM'
  )
    throw new TypeError('Unsupported or non-Testnet profile backup.');
  base64UrlDecode(backup.kdf.salt, 16);
  base64UrlDecode(backup.cipher.nonce, 12);
  base64UrlDecode(backup.cipher.ciphertextAndTag);
  return backup as EncryptedProfileBackup;
};

export const importProfileBackup = async (
  driver: RelayCryptoDriver,
  input: string | unknown,
  password: string
): Promise<ProfileBackupPlaintext> => {
  const envelope = parseEnvelope(typeof input === 'string' ? (JSON.parse(input) as unknown) : input);
  const { cipher: _cipher, ...header } = envelope;
  const key = await keyFor(password, base64UrlDecode(envelope.kdf.salt, 16));
  let plaintext: Uint8Array | undefined;
  try {
    plaintext = await driver.decryptAesGcm(
      key,
      base64UrlDecode(envelope.cipher.ciphertextAndTag),
      base64UrlDecode(envelope.cipher.nonce, 12),
      aadFor(header)
    );
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext)) as ProfileBackupPlaintext;
    validatePlaintext(value);
    if (value.profile.id !== envelope.sourceProfileId)
      throw new TypeError('Backup Profile ID does not match its envelope.');
    return value;
  } catch {
    throw new Error('Unable to decrypt or validate this Testnet backup.');
  } finally {
    plaintext?.fill(0);
    key.fill(0);
  }
};

export const serializeProfileBackup = (backup: EncryptedProfileBackup): string => canonicalize(backup);
