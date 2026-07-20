import type { Account, PermissionGrant, Profile } from '@mosaiclynx/core';

export interface MobileProfile extends Profile {
  readonly passwordHint?: string;
}

export interface VaultContents {
  mnemonic?: string;
  importedPrivateKeys: Record<string, string>;
}

export interface MobileVaultEnvelope {
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

export interface MobilePersistedState {
  readonly schemaVersion: 1;
  readonly profiles: readonly MobileProfile[];
  readonly accounts: readonly Account[];
  readonly vaults: readonly MobileVaultEnvelope[];
  readonly permissions: readonly PermissionGrant[];
  readonly settings: {
    readonly activeProfileId?: string;
    readonly activeChain: 'symbol' | 'nem';
    readonly language: 'ja' | 'en';
    readonly theme: 'system' | 'light' | 'dark';
    readonly autoLockMinutes: 15;
  };
}

export const emptyMobileState = (language: 'ja' | 'en' = 'en'): MobilePersistedState => ({
  schemaVersion: 1,
  profiles: [],
  accounts: [],
  vaults: [],
  permissions: [],
  settings: { activeChain: 'symbol', language, theme: 'system', autoLockMinutes: 15 },
});
