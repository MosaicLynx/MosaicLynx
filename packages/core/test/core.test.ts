import { describe, expect, it } from 'vitest';

import {
  type Account,
  type AccountRepository,
  AccountService,
  type PermissionGrant,
  type PermissionRepository,
  PermissionService,
  type Profile,
  type ProfileRepository,
  ProfileService,
  type ProfileVaultPort,
  VaultSessionService,
  createChainScope,
  createStructuredMessage,
} from '../src/index.js';

class MemoryProfiles implements ProfileRepository {
  public readonly records = new Map<string, Profile>();
  public async save(profile: Profile): Promise<void> {
    this.records.set(profile.id, profile);
  }
  public async getById(id: string): Promise<Profile | undefined> {
    return this.records.get(id);
  }
  public async listByNetwork(network: Profile['network']): Promise<readonly Profile[]> {
    return [...this.records.values()].filter((profile) => profile.network === network);
  }
}

class MemoryAccounts implements AccountRepository {
  public readonly records = new Map<string, Account>();
  public async save(account: Account): Promise<void> {
    this.records.set(account.id, account);
  }
  public async getById(id: string): Promise<Account | undefined> {
    return this.records.get(id);
  }
  public async listByProfile(profileId: string): Promise<readonly Account[]> {
    return [...this.records.values()].filter((account) => account.profileId === profileId);
  }
  public async remove(id: string): Promise<void> {
    this.records.delete(id);
  }
}

class MemoryPermissions implements PermissionRepository {
  private readonly records = new Map<string, PermissionGrant>();
  private key(origin: string, profileId: string, scope: PermissionGrant['scope']): string {
    return `${origin}:${profileId}:${scope.id}`;
  }
  public async get(
    origin: string,
    profileId: string,
    scope: PermissionGrant['scope']
  ): Promise<PermissionGrant | undefined> {
    return this.records.get(this.key(origin, profileId, scope));
  }
  public async save(grant: PermissionGrant): Promise<void> {
    this.records.set(this.key(grant.origin, grant.profileId, grant.scope), grant);
  }
  public async remove(origin: string, profileId: string, scope: PermissionGrant['scope']): Promise<void> {
    this.records.delete(this.key(origin, profileId, scope));
  }
}

const identity = (prefix: string) => ({ address: prefix, publicKey: 'A'.repeat(64) });

describe('Core profile, account, permission and message boundaries', () => {
  const clock = { now: () => new Date('2026-07-16T00:00:00.000Z') };
  let sequence = 0;
  const ids = { next: () => `profile-${++sequence}` };

  it('stores network at profile level and never reuses account indexes', async () => {
    const profiles = new MemoryProfiles();
    const profile = await new ProfileService(profiles, clock, ids).create(
      'mainnet',
      'Personal',
      'account-0',
      'vault-1'
    );
    expect(profile).toMatchObject({ network: 'mainnet', nextAccountIndex: 1, accountIds: ['account-0'] });

    const accounts = new AccountService(profiles, new MemoryAccounts(), clock);
    await expect(
      accounts.add({
        id: 'account-1',
        profileId: profile.id,
        name: 'Invalid reused index',
        identities: { symbol: identity('N'), nem: identity('NEM') },
        source: { kind: 'mnemonicDerived', secretRef: 'secret', accountIndex: 1, derivationPath: 'path' },
        revision: 1,
        createdAt: clock.now().toISOString(),
        updatedAt: clock.now().toISOString(),
      })
    ).rejects.toMatchObject({ code: 'PROFILE_SCOPE_MISMATCH' });
  });

  it('scopes permissions by origin, profile, chain, network and account set', async () => {
    const permissions = new PermissionService(new MemoryPermissions(), clock);
    const mainnet = createChainScope('nem', 'mainnet');
    await permissions.grant('https://example.com/path', 'profile-1', mainnet, ['account-1']);
    await expect(permissions.assertConnected('https://example.com', 'profile-1', mainnet)).resolves.toMatchObject({
      accountIds: ['account-1'],
      revision: 1,
    });
    await expect(
      permissions.assertConnected('https://example.com', 'profile-1', createChainScope('nem', 'testnet'))
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED_ORIGIN' });
  });

  it('locks vaults independently by profile', async () => {
    const locked = new Set(['profile-1']);
    const vault: ProfileVaultPort = {
      unlock: async (profileId) => {
        locked.delete(profileId);
        return true;
      },
      lock: async (profileId) => {
        locked.add(profileId);
      },
      isLocked: async (profileId) => locked.has(profileId),
    };
    await expect(new VaultSessionService(vault).assertUnlocked('profile-1')).rejects.toMatchObject({
      code: 'VAULT_LOCKED',
    });
    await expect(new VaultSessionService(vault).assertUnlocked('profile-2')).resolves.toBeUndefined();
  });

  it('domain-separates and validates structured messages', () => {
    const { message, signingBytes } = createStructuredMessage(
      'https://example.com/path',
      {
        chain: 'symbol',
        network: 'testnet',
        purpose: 'login:v1',
        nonce: 'AAAAAAAAAAAAAAAAAAAAAA',
        issuedAt: '2026-07-16T00:00:00Z',
        expiresAt: '2026-07-16T00:05:00Z',
        payload: { encoding: 'utf8', value: 'hello' },
      },
      clock.now()
    );
    expect(message.origin).toBe('https://example.com');
    expect(new TextDecoder().decode(signingBytes)).toContain('MOSAICLYNX\0MESSAGE\0V1\0');
  });
});
