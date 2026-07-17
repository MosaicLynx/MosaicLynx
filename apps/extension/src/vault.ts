import type { AccountSource, ChainIdentity, NetworkKind } from '@mosaiclynx/core';
import { argon2idAsync } from '@noble/hashes/argon2.js';

export const LEGACY_STORAGE_KEY = 'mosaicLynxStoreV1';
export const STORE_SCHEMA_VERSION = 2;
export const VAULT_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  meta: 'mosaicLynxMetaV2',
  profiles: 'mosaicLynxProfilesV2',
  accounts: 'mosaicLynxAccountsV2',
  vaults: 'mosaicLynxVaultsV2',
  permissions: 'mosaicLynxPermissionsV2',
  usedMessageNonces: 'mosaicLynxUsedMessageNoncesV2',
} as const;

export interface PublicAccount {
  readonly id: string;
  readonly profileId: string;
  readonly name: string;
  readonly identities: Readonly<Record<'symbol' | 'nem', ChainIdentity>>;
  readonly source: AccountSource;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PublicProfile {
  readonly id: string;
  readonly name: string;
  readonly network: NetworkKind;
  readonly defaultAccountId: string;
  readonly nextAccountIndex: number;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly passwordHint?: string;
}

export interface PermissionGrant {
  readonly origin: string;
  readonly profileId: string;
  readonly chain: 'symbol' | 'nem';
  readonly network: NetworkKind;
  readonly accountIds: readonly string[];
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface VaultContents {
  readonly mnemonic?: string;
  readonly importedPrivateKeys: Readonly<Record<string, string>>;
}

export interface VaultEnvelope {
  readonly profileId: string;
  readonly formatVersion: 1;
  readonly schemaVersion: 1;
  readonly revision: number;
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

export interface ExtensionStore {
  readonly schemaVersion: 2;
  readonly profiles: readonly PublicProfile[];
  readonly accounts: readonly PublicAccount[];
  readonly vaults: readonly VaultEnvelope[];
  readonly permissions: readonly PermissionGrant[];
  readonly usedMessageNonces: readonly {
    readonly nonceHash: string;
    readonly origin: string;
    readonly profileId: string;
    readonly accountId: string;
    readonly state: 'reserved' | 'used';
    readonly expiresAt: string;
  }[];
  readonly settings: {
    readonly activeProfileId?: string;
    readonly activeChain: 'symbol' | 'nem';
    readonly language: 'ja' | 'en';
    readonly theme: 'light' | 'dark';
    readonly autoLockMinutes: number;
  };
}

export const emptyStore = (): ExtensionStore => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  profiles: [],
  accounts: [],
  vaults: [],
  permissions: [],
  usedMessageNonces: [],
  settings: {
    activeChain: 'symbol',
    language: navigator.language.startsWith('ja') ? 'ja' : 'en',
    theme: 'light',
    autoLockMinutes: 15,
  },
});

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

const base64UrlToBytes = (value: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid vault encoding.');
  const raw = atob(
    value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=')
  );
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
};

const buffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
};

const aadFor = (profileId: string, revision: number): Uint8Array =>
  encoder.encode(
    JSON.stringify({
      format: 'mosaiclynx.profile-vault.v1',
      profileId,
      formatVersion: 1,
      schemaVersion: VAULT_SCHEMA_VERSION,
      revision,
      kdf: { name: 'argon2id', memoryKiB: 65536, iterations: 3, parallelism: 1, outputBytes: 32 },
      cipher: { name: 'AES-256-GCM' },
    })
  );

const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const passwordBytes = encoder.encode(password);
  try {
    const derived = await argon2idAsync(passwordBytes, salt, {
      m: 65536,
      t: 3,
      p: 1,
      dkLen: 32,
      maxmem: 72 * 1024 * 1024,
      asyncTick: 16,
    });
    return await crypto.subtle.importKey('raw', buffer(derived), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  } finally {
    passwordBytes.fill(0);
  }
};

export const encryptVault = async (
  profileId: string,
  password: string,
  contents: VaultContents,
  revision = 1
): Promise<VaultEnvelope> => {
  if (password.length < 12) throw new Error('Password must contain at least 12 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: buffer(nonce), additionalData: buffer(aadFor(profileId, revision)), tagLength: 128 },
    key,
    buffer(encoder.encode(JSON.stringify(contents)))
  );
  return {
    profileId,
    formatVersion: 1,
    schemaVersion: 1,
    revision,
    kdf: {
      name: 'argon2id',
      salt: bytesToBase64Url(salt),
      memoryKiB: 65536,
      iterations: 3,
      parallelism: 1,
      outputBytes: 32,
    },
    cipher: {
      name: 'AES-256-GCM',
      nonce: bytesToBase64Url(nonce),
      ciphertextAndTag: bytesToBase64Url(new Uint8Array(encrypted)),
    },
  };
};

interface AttemptState {
  failures: number;
  nextAttemptAt: number;
}

const attemptKey = (profileId: string): string => `unlockAttempts:${profileId}`;

export const decryptVault = async (envelope: VaultEnvelope, password: string): Promise<VaultContents> => {
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
    throw new Error('Vault format or KDF parameters are unsupported.');
  const keyName = attemptKey(envelope.profileId);
  const stored = await chrome.storage.session.get(keyName);
  const attempts = (stored[keyName] as AttemptState | undefined) ?? { failures: 0, nextAttemptAt: 0 };
  const remaining = attempts.nextAttemptAt - Date.now();
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  try {
    const key = await deriveKey(password, base64UrlToBytes(envelope.kdf.salt));
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: buffer(base64UrlToBytes(envelope.cipher.nonce)),
        additionalData: buffer(aadFor(envelope.profileId, envelope.revision)),
        tagLength: 128,
      },
      key,
      buffer(base64UrlToBytes(envelope.cipher.ciphertextAndTag))
    );
    const contents = JSON.parse(decoder.decode(decrypted)) as VaultContents;
    if (typeof contents !== 'object' || !contents.importedPrivateKeys) throw new Error('Invalid vault contents.');
    await chrome.storage.session.remove(keyName);
    return contents;
  } catch {
    const failures = attempts.failures + 1;
    const delaySeconds = failures >= 5 ? Math.min(60, 2 ** (failures - 5)) : 0;
    await chrome.storage.session.set({ [keyName]: { failures, nextAttemptAt: Date.now() + delaySeconds * 1000 } });
    throw new Error('Unable to unlock this profile.');
  }
};

interface StoreMeta {
  readonly schemaVersion: 2;
  readonly settings: ExtensionStore['settings'];
}

interface LegacyPublicProfile extends PublicProfile {
  readonly accounts: readonly PublicAccount[];
}

interface LegacyExtensionStore extends Omit<ExtensionStore, 'schemaVersion' | 'profiles' | 'accounts'> {
  readonly schemaVersion: 1;
  readonly profiles: readonly LegacyPublicProfile[];
}

const migrateLegacyStore = (legacy: LegacyExtensionStore): ExtensionStore => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  profiles: legacy.profiles.map(({ accounts: _accounts, ...profile }) => profile),
  accounts: legacy.profiles.flatMap((profile) => profile.accounts),
  vaults: legacy.vaults ?? [],
  permissions: legacy.permissions ?? [],
  usedMessageNonces: legacy.usedMessageNonces ?? [],
  settings: legacy.settings,
});

export const loadStore = async (): Promise<ExtensionStore> => {
  const keys = [...Object.values(STORAGE_KEYS), LEGACY_STORAGE_KEY];
  const stored = await chrome.storage.local.get(keys);
  const meta = stored[STORAGE_KEYS.meta] as StoreMeta | undefined;
  if (meta?.schemaVersion === STORE_SCHEMA_VERSION) {
    return {
      schemaVersion: STORE_SCHEMA_VERSION,
      profiles: (stored[STORAGE_KEYS.profiles] as readonly PublicProfile[] | undefined) ?? [],
      accounts: (stored[STORAGE_KEYS.accounts] as readonly PublicAccount[] | undefined) ?? [],
      vaults: (stored[STORAGE_KEYS.vaults] as readonly VaultEnvelope[] | undefined) ?? [],
      permissions: (stored[STORAGE_KEYS.permissions] as readonly PermissionGrant[] | undefined) ?? [],
      usedMessageNonces:
        (stored[STORAGE_KEYS.usedMessageNonces] as ExtensionStore['usedMessageNonces'] | undefined) ?? [],
      settings: meta.settings,
    };
  }
  const legacy = stored[LEGACY_STORAGE_KEY] as LegacyExtensionStore | undefined;
  if (!legacy) return emptyStore();
  const migrated = migrateLegacyStore(legacy);
  await saveStore(migrated);
  return migrated;
};

export const saveStore = async (store: ExtensionStore): Promise<void> => {
  await chrome.storage.local.set({
    [STORAGE_KEYS.meta]: { schemaVersion: STORE_SCHEMA_VERSION, settings: store.settings } satisfies StoreMeta,
    [STORAGE_KEYS.profiles]: store.profiles,
    [STORAGE_KEYS.accounts]: store.accounts,
    [STORAGE_KEYS.vaults]: store.vaults,
    [STORAGE_KEYS.permissions]: store.permissions,
    [STORAGE_KEYS.usedMessageNonces]: store.usedMessageNonces,
  });
  await chrome.storage.local.remove(LEGACY_STORAGE_KEY);
};
