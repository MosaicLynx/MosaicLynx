import {
  type Account,
  type ConnectionScope,
  MosaicLynxError,
  type NetworkKind,
  type PermissionGrant,
  type Profile,
} from './domain.js';
import type {
  AccountRepository,
  Clock,
  CryptoPort,
  IdGenerator,
  PermissionRepository,
  ProfileRepository,
  ProfileVaultPort,
} from './ports.js';

export class ProfileService {
  public constructor(
    private readonly profiles: ProfileRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  public async create(
    network: NetworkKind,
    name: string,
    initialAccountId: string,
    vaultRef: string
  ): Promise<Profile> {
    const normalizedName = name.trim();
    if (!normalizedName || !initialAccountId || !vaultRef || (network !== 'mainnet' && network !== 'testnet'))
      throw new MosaicLynxError('INVALID_PARAMS', 'Profile fields are invalid.');
    const now = this.clock.now().toISOString();
    const profile: Profile = {
      id: this.ids.next(),
      network,
      name: normalizedName,
      accountIds: [initialAccountId],
      defaultAccountId: initialAccountId,
      nextAccountIndex: 1,
      vaultRef,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    await this.profiles.save(profile);
    return profile;
  }
}

export class AccountService {
  public constructor(
    private readonly profiles: ProfileRepository,
    private readonly accounts: AccountRepository,
    private readonly clock?: Clock
  ) {}

  public async add(account: Account): Promise<void> {
    const profile = await this.profiles.getById(account.profileId);
    if (!profile) throw new MosaicLynxError('PROFILE_NOT_FOUND', 'Profile was not found.');
    if (
      !account.name.trim() ||
      !account.identities.symbol.address ||
      !account.identities.nem.address ||
      !/^[0-9A-Fa-f]{64}$/.test(account.identities.symbol.publicKey) ||
      !/^[0-9A-Fa-f]{64}$/.test(account.identities.nem.publicKey)
    )
      throw new MosaicLynxError('INVALID_PARAMS', 'Account identity is invalid.');
    if (
      account.source.kind === 'mnemonicDerived' &&
      (account.source.accountIndex < 0 ||
        account.source.accountIndex >= 2 ** 31 ||
        account.source.accountIndex >= profile.nextAccountIndex)
    )
      throw new MosaicLynxError(
        'PROFILE_SCOPE_MISMATCH',
        'Account derivation index is outside the profile allocation.'
      );
    await this.accounts.save(account);
    if (!profile.accountIds.includes(account.id)) {
      const updated: Profile = {
        ...profile,
        accountIds: [...profile.accountIds, account.id],
        revision: profile.revision + 1,
        updatedAt: this.clock?.now().toISOString() ?? account.updatedAt,
      };
      await this.profiles.save(updated);
    }
  }

  public async getDefault(profileId: string): Promise<Account> {
    const profile = await this.profiles.getById(profileId);
    if (!profile) throw new MosaicLynxError('PROFILE_NOT_FOUND', 'Profile was not found.');
    const account = await this.accounts.getById(profile.defaultAccountId);
    if (!account || account.profileId !== profileId)
      throw new MosaicLynxError('ACCOUNT_NOT_FOUND', 'Default account was not found.');
    return account;
  }

  /** @deprecated Use getDefault. */
  public getActive(profileId: string): Promise<Account> {
    return this.getDefault(profileId);
  }

  public async remove(profileId: string, accountId: string): Promise<void> {
    const profile = await this.profiles.getById(profileId);
    if (!profile) throw new MosaicLynxError('PROFILE_NOT_FOUND', 'Profile was not found.');
    if (!profile.accountIds.includes(accountId))
      throw new MosaicLynxError('ACCOUNT_NOT_FOUND', 'Account was not found.');
    if (profile.accountIds.length === 1)
      throw new MosaicLynxError('LAST_ACCOUNT', 'The last account cannot be deleted.');
    const accountIds = profile.accountIds.filter((id) => id !== accountId);
    await this.profiles.save({
      ...profile,
      accountIds,
      defaultAccountId: profile.defaultAccountId === accountId ? accountIds[0]! : profile.defaultAccountId,
      revision: profile.revision + 1,
      updatedAt: this.clock?.now().toISOString() ?? profile.updatedAt,
    });
    await this.accounts.remove?.(accountId);
  }
}

export class PermissionService {
  public constructor(
    private readonly permissions: PermissionRepository,
    private readonly clock: Clock
  ) {}

  public async grant(
    origin: string,
    profileId: string,
    scope: ConnectionScope,
    accountIds: readonly string[]
  ): Promise<PermissionGrant> {
    let canonicalOrigin: string;
    try {
      canonicalOrigin = new URL(origin).origin;
    } catch {
      throw new MosaicLynxError('INVALID_PARAMS', 'Origin is invalid.');
    }
    if (!/^https?:\/\//.test(canonicalOrigin) || accountIds.length === 0)
      throw new MosaicLynxError('INVALID_PARAMS', 'Permission must include a web origin and account.');
    const now = this.clock.now().toISOString();
    const existing = await this.permissions.get(canonicalOrigin, profileId, scope);
    const grant: PermissionGrant = {
      origin: canonicalOrigin,
      profileId,
      scope,
      accountIds: [...new Set(accountIds)],
      revision: (existing?.revision ?? 0) + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.permissions.save(grant);
    return grant;
  }

  public async assertConnected(origin: string, profileId: string, scope: ConnectionScope): Promise<PermissionGrant> {
    const grant = await this.permissions.get(origin, profileId, scope);
    if (!grant)
      throw new MosaicLynxError('UNAUTHORIZED_ORIGIN', 'This origin is not connected for the requested scope.');
    return grant;
  }
}

export class VaultSessionService {
  public constructor(private readonly vault: ProfileVaultPort) {}

  public async unlock(profileId: string, password: string): Promise<void> {
    if (!profileId || !password) throw new MosaicLynxError('INVALID_PARAMS', 'Profile and password are required.');
    if (!(await this.vault.unlock(profileId, { kind: 'password', password })))
      throw new MosaicLynxError('VAULT_LOCKED', 'Unable to unlock the vault.');
  }

  public lock(profileId: string): Promise<void> {
    return this.vault.lock(profileId);
  }

  public async assertUnlocked(profileId: string): Promise<void> {
    if (await this.vault.isLocked(profileId))
      throw new MosaicLynxError('VAULT_LOCKED', 'Unlock MosaicLynx before signing.');
  }
}

export class SigningService {
  public constructor(
    private readonly vault: VaultSessionService,
    private readonly accounts: AccountRepository,
    private readonly crypto: CryptoPort
  ) {}

  public async signMessage(input: {
    profileId: string;
    accountId: string;
    signingBytes: Uint8Array;
    recipientPublicKey?: string;
  }): Promise<string> {
    await this.vault.assertUnlocked(input.profileId);
    if (!input.signingBytes.length) throw new MosaicLynxError('INVALID_PARAMS', 'Signing bytes are required.');
    const account = await this.account(input.profileId, input.accountId);
    return this.crypto.signMessage({
      account,
      profileId: input.profileId,
      signingBytes: input.signingBytes,
      ...(input.recipientPublicKey ? { recipientPublicKey: input.recipientPublicKey } : {}),
    });
  }

  public async signTransaction(input: {
    profileId: string;
    accountId: string;
    chain: ConnectionScope['chain'];
    payload: string;
  }): Promise<{ readonly payload: string; readonly hash: string; readonly signerPublicKey: string }> {
    await this.vault.assertUnlocked(input.profileId);
    if (!input.payload) throw new MosaicLynxError('INVALID_PARAMS', 'Transaction payload is required.');
    return this.crypto.signTransaction({
      account: await this.account(input.profileId, input.accountId),
      profileId: input.profileId,
      chain: input.chain,
      payload: input.payload,
    });
  }

  private async account(profileId: string, accountId: string): Promise<Account> {
    const account = await this.accounts.getById(accountId);
    if (!account || account.profileId !== profileId)
      throw new MosaicLynxError('ACCOUNT_NOT_FOUND', 'Account was not found.');
    return account;
  }
}
