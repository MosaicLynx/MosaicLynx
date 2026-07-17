import type { Account, ConnectionScope, PermissionGrant, Profile, UnlockMethod } from './domain.js';

export interface SharedAccountMaterial {
  readonly privateKey: string;
  readonly identities: Account['identities'];
}

/** Legacy single-chain material retained for adapter compatibility. */
export interface GeneratedAccountMaterial {
  readonly address: string;
  readonly publicKey: string;
  readonly privateKey: string;
}

export interface TransactionInspection {
  readonly fixtureContractVersion: '1';
  readonly chain: ConnectionScope['chain'];
  readonly network: ConnectionScope['network'];
  readonly schema: string;
  readonly numericType: number;
  readonly version: number;
  readonly signerPublicKey: string;
  readonly recipients: readonly string[];
  readonly warnings: readonly string[];
  readonly externalStateUnverified: readonly string[];
  readonly canonicalPayload: string;
}

export interface ChainAdapterPort {
  readonly chain: ConnectionScope['chain'];
  createAccount(network: ConnectionScope['network']): GeneratedAccountMaterial;
  importAccount(network: ConnectionScope['network'], privateKey: string): GeneratedAccountMaterial;
  inspectTransaction?(network: ConnectionScope['network'], payload: string): TransactionInspection;
  signTransaction?(
    network: ConnectionScope['network'],
    payload: string,
    privateKey: string
  ): { readonly payload: string; readonly hash: string; readonly signerPublicKey: string };
  verifySignedTransaction?(
    network: ConnectionScope['network'],
    unsignedPayload: string,
    result: { readonly payload: string; readonly hash: string; readonly signerPublicKey: string }
  ): boolean;
}

export interface ProfileRepository {
  save(profile: Profile): Promise<void>;
  getById(profileId: string): Promise<Profile | undefined>;
  listByNetwork(network: Profile['network']): Promise<readonly Profile[]>;
  remove?(profileId: string): Promise<void>;
}

export interface AccountRepository {
  save(account: Account): Promise<void>;
  getById(accountId: string): Promise<Account | undefined>;
  listByProfile(profileId: string): Promise<readonly Account[]>;
  remove?(accountId: string): Promise<void>;
}

export interface PermissionRepository {
  get(origin: string, profileId: string, scope: ConnectionScope): Promise<PermissionGrant | undefined>;
  save(grant: PermissionGrant): Promise<void>;
  remove(origin: string, profileId: string, scope: ConnectionScope): Promise<void>;
}

export interface ProfileVaultPort {
  unlock(profileId: string, method: UnlockMethod): Promise<boolean>;
  lock(profileId: string): Promise<void>;
  isLocked(profileId: string): Promise<boolean>;
}

/** @deprecated Use ProfileVaultPort. */
export type VaultPort = ProfileVaultPort;

export interface CryptoPort {
  signMessage(input: {
    readonly account: Account;
    readonly profileId: string;
    readonly signingBytes: Uint8Array;
    readonly recipientPublicKey?: string;
  }): Promise<string>;
  signTransaction(input: {
    readonly account: Account;
    readonly profileId: string;
    readonly chain: ConnectionScope['chain'];
    readonly payload: string;
  }): Promise<{ readonly payload: string; readonly hash: string; readonly signerPublicKey: string }>;
}

export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(): string;
}
