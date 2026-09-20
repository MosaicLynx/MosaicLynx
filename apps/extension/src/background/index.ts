import { NemChainAdapter } from '@mosaiclynx/chain-nem';
import { SymbolChainAdapter } from '@mosaiclynx/chain-symbol';
import { createStructuredMessage, structuredMessageDigest } from '@mosaiclynx/core';
import type {
  CosignTransactionParams,
  MosaicAccount,
  MosaicLynxCosignature,
  MosaicScope,
  RpcRequest,
  SignMessageParams,
  SignedMessage,
  SignedTransaction,
} from '@mosaiclynx/provider-api';
import { PublicKey, Signature } from '@nemnesia/symbol-sdk';
import { NemFacade } from '@nemnesia/symbol-sdk/nem';
import { SymbolFacade } from '@nemnesia/symbol-sdk/symbol';

import type { ApprovalRequest, ApprovalResolution, NewApprovalRequest } from '../approval/types.js';
import { MAINNET_SIGNING_ENABLED } from '../release-capabilities.js';
import {
  type ExtensionStore,
  type PermissionGrant,
  type PublicAccount,
  type PublicProfile,
  STORAGE_KEYS,
  loadStore,
  saveStore,
} from '../vault.js';
import { AccountSelectionError, messageAccountCandidates, transactionAccount } from './account-selection.js';
import { pageOrigin } from './page-origin.js';
import { isActiveAccountForProfile, isEnabledProfileScope } from './profile-eligibility.js';

interface BridgeRequest {
  readonly kind: 'mosaiclynx:request';
  readonly request: RpcRequest;
}
interface PendingApproval {
  readonly request: ApprovalRequest;
  readonly resolve: (resolution: ApprovalResolution) => void;
  windowId?: number;
  readonly tabId?: number;
  readonly tabGeneration?: number;
  sidePanelTabId?: number;
  readonly timeoutId: number;
  resolved: boolean;
  messageAccountId?: string;
  messageNonceHash?: string;
  messagePreparation?: Promise<string>;
  transactionPreparation?: Promise<void>;
  transactionPrepared?: boolean;
}

const adapters = { symbol: new SymbolChainAdapter(), nem: new NemChainAdapter() } as const;
const approvals = new Map<string, PendingApproval>();
const sidePanelPorts = new Map<number, chrome.runtime.Port>();
const tabGenerations = new Map<number, number>();
const homePanelPath = 'src/popup/index.html';
let nonceMutex: Promise<void> = Promise.resolve();

void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

const providerError = (code: string, message: string): never => {
  throw { code, message };
};
const originAscii = (origin: string): string => new URL(origin).origin;

const requirePageOrigin = (sender: chrome.runtime.MessageSender): string => {
  if (sender.id !== chrome.runtime.id || sender.frameId !== 0 || !sender.tab?.id || !sender.url)
    return providerError('UNAUTHORIZED_ORIGIN', 'Only a top-level web document can use MosaicLynx.');
  const origin = pageOrigin(sender.url);
  if (!origin) return providerError('UNAUTHORIZED_ORIGIN', 'This page scheme is unsupported.');
  return origin;
};

const isTrustedExtensionPage = (sender: chrome.runtime.MessageSender): boolean => {
  if (sender.id !== chrome.runtime.id || !sender.url) return false;
  try {
    return new URL(sender.url).origin === new URL(chrome.runtime.getURL('/')).origin;
  } catch {
    return false;
  }
};

const isScope = (value: unknown): value is MosaicScope => {
  const scope = value as Partial<MosaicScope> | undefined;
  return (
    (scope?.chain === 'symbol' || scope?.chain === 'nem') &&
    (scope.network === 'mainnet' || scope.network === 'testnet')
  );
};

const activeProfile = (store: ExtensionStore, network?: MosaicScope['network']): PublicProfile => {
  const profile = store.profiles.find((item) => item.id === store.settings.activeProfileId);
  if (!profile) return providerError('VAULT_LOCKED', 'Create and select a profile in MosaicLynx first.');
  if (network && profile.network !== network)
    return providerError('NETWORK_MISMATCH', 'The active profile belongs to another network.');
  return profile;
};

const accountsForProfile = (store: ExtensionStore, profileId: string): readonly PublicAccount[] =>
  store.accounts.filter((account) => isActiveAccountForProfile(account, profileId));

const assertEnabledScope = (profile: PublicProfile, scope: MosaicScope): void => {
  if (!isEnabledProfileScope(profile, scope))
    providerError('UNSUPPORTED_CHAIN', 'This chain is disabled for the active profile.');
};

const vaultRevisionFor = (store: ExtensionStore, profileId: string): number =>
  store.vaults.find((vault) => vault.profileId === profileId)?.revision ??
  providerError('VAULT_LOCKED', 'The active profile vault is unavailable.');

const accountById = (store: ExtensionStore, profile: PublicProfile, accountId: string): PublicAccount => {
  const account = accountsForProfile(store, profile.id).find((item) => item.id === accountId);
  if (!account) return providerError('ACCOUNT_NOT_FOUND', 'The account is unavailable.');
  return account;
};

const projectAccount = (profile: PublicProfile, account: PublicAccount, scope: MosaicScope): MosaicAccount => {
  if (account.chain !== scope.chain) throw new Error('Account chain does not match profile scope.');
  return {
    id: account.id,
    profileId: profile.id,
    name: account.name,
    label: account.name,
    address: account.identity.address,
    publicKey: account.identity.publicKey,
    scope,
  };
};

const permissionFor = (
  store: ExtensionStore,
  origin: string,
  profileId: string,
  scope: MosaicScope
): PermissionGrant | undefined =>
  store.permissions.find(
    (grant) =>
      grant.origin === origin &&
      grant.profileId === profileId &&
      grant.chain === scope.chain &&
      grant.network === scope.network
  );

const permittedAccounts = (
  store: ExtensionStore,
  profile: PublicProfile,
  permission: PermissionGrant
): readonly PublicAccount[] =>
  permission.accountIds
    .map((id) => accountsForProfile(store, profile.id).find((account) => account.id === id))
    .filter((account): account is PublicAccount => Boolean(account));

const publicAccountsForOrigin = (store: ExtensionStore, origin: string): readonly MosaicAccount[] => {
  try {
    const profile = activeProfile(store);
    return store.permissions
      .filter(
        (grant) =>
          grant.origin === origin &&
          grant.profileId === profile.id &&
          grant.network === profile.network &&
          profile.chain === grant.chain
      )
      .flatMap((grant) =>
        permittedAccounts(store, profile, grant).map((account) =>
          projectAccount(profile, account, { chain: grant.chain, network: grant.network })
        )
      );
  } catch {
    return [];
  }
};

const requirePermission = (
  store: ExtensionStore,
  origin: string,
  profile: PublicProfile,
  scope: MosaicScope
): PermissionGrant =>
  permissionFor(store, origin, profile.id, scope) ??
  providerError('UNAUTHORIZED_ORIGIN', 'Connect this origin before requesting a signature.');

const emit = async (origin: string, event: 'accountsChanged' | 'disconnect', payload: unknown): Promise<void> => {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.flatMap((tab) => {
      if (!tab.id || !tab.url) return [];
      try {
        if (new URL(tab.url).origin !== origin) return [];
      } catch {
        return [];
      }
      return [chrome.tabs.sendMessage(tab.id, { kind: 'mosaiclynx:event', event, payload }).catch(() => undefined)];
    })
  );
};

const permissionSnapshot = (value: unknown): readonly PermissionGrant[] =>
  Array.isArray(value) ? (value as readonly PermissionGrant[]) : [];

const activeProfileIdSnapshot = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const settings = (value as { readonly settings?: unknown }).settings;
  if (!settings || typeof settings !== 'object') return undefined;
  const activeProfileId = (settings as { readonly activeProfileId?: unknown }).activeProfileId;
  return typeof activeProfileId === 'string' ? activeProfileId : undefined;
};

const permissionBinding = (grant: PermissionGrant): string =>
  JSON.stringify({
    origin: grant.origin,
    profileId: grant.profileId,
    chain: grant.chain,
    network: grant.network,
    accountIds: [...grant.accountIds].sort(),
  });

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  const permissionChange = changes[STORAGE_KEYS.permissions];
  const metaChange = changes[STORAGE_KEYS.meta];
  if (!permissionChange && !metaChange) return;
  const before = permissionSnapshot(permissionChange?.oldValue);
  const after = permissionSnapshot(permissionChange?.newValue);
  const profileChanged =
    metaChange !== undefined &&
    activeProfileIdSnapshot(metaChange.oldValue) !== activeProfileIdSnapshot(metaChange.newValue);
  if (profileChanged && !permissionChange) {
    const previousProfileId = activeProfileIdSnapshot(metaChange?.oldValue);
    void loadStore().then((store) => {
      const origins = new Set(
        store.permissions
          .filter(
            (grant) => grant.profileId === previousProfileId || grant.profileId === store.settings.activeProfileId
          )
          .map((grant) => grant.origin)
      );
      for (const origin of origins) {
        const accounts = publicAccountsForOrigin(store, origin);
        void emit(origin, accounts.length ? 'accountsChanged' : 'disconnect', accounts.length ? accounts : undefined);
      }
    });
    return;
  }
  const origins = new Set([...before.map((grant) => grant.origin), ...after.map((grant) => grant.origin)]);
  for (const origin of origins) {
    const previous = before
      .filter((grant) => grant.origin === origin)
      .map(permissionBinding)
      .sort()
      .join('|');
    const current = after
      .filter((grant) => grant.origin === origin)
      .map(permissionBinding)
      .sort()
      .join('|');
    if (!profileChanged && (!previous || previous === current)) continue;
    void loadStore().then((store) => {
      const accounts = publicAccountsForOrigin(store, origin);
      return emit(origin, accounts.length ? 'accountsChanged' : 'disconnect', accounts.length ? accounts : undefined);
    });
  }
});

const sidePanelForTab = async (tabId: number): Promise<chrome.runtime.Port | undefined> => {
  try {
    const tab = await chrome.tabs.get(tabId);
    return sidePanelPorts.get(tab.windowId);
  } catch {
    return undefined;
  }
};

const requestApproval = async (
  request: NewApprovalRequest,
  tabId?: number,
  preparedMessage?: { readonly accountId: string; readonly nonceHash: string }
): Promise<ApprovalResolution> => {
  if (approvals.size >= 50) return providerError('RESOURCE_LIMIT', 'Too many approval requests are pending.');
  if (request.type === 'connect' && tabId === undefined)
    return providerError('INTERNAL_ERROR', 'The connection request has no browser tab.');
  if (tabId !== undefined) {
    if ([...approvals.values()].some((pending) => pending.sidePanelTabId === tabId))
      return providerError('RESOURCE_LIMIT', 'Another approval is already open in this tab.');
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  const approval = {
    ...request,
    id,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 5 * 60_000).toISOString(),
  } as ApprovalRequest;
  const result = new Promise<ApprovalResolution>((resolve) => {
    const timeoutId = self.setTimeout(() => finishApproval(id, { approved: false }), 5 * 60_000);
    approvals.set(id, {
      request: approval,
      resolve,
      timeoutId,
      resolved: false,
      ...(tabId !== undefined ? { tabId, tabGeneration: tabGenerations.get(tabId) ?? 0 } : {}),
      ...(preparedMessage
        ? { messageAccountId: preparedMessage.accountId, messageNonceHash: preparedMessage.nonceHash }
        : {}),
    });
  });

  const openApprovalWindow = async (): Promise<void> => {
    const window = await chrome.windows.create({
      url: chrome.runtime.getURL(`src/approval/index.html?id=${encodeURIComponent(id)}`),
      type: 'popup',
      width: 480,
      height: 720,
    });
    if (window.id === undefined) throw new Error('missing window id');
    const pending = approvals.get(id);
    if (pending) pending.windowId = window.id;
  };

  let sidePanel = tabId === undefined ? undefined : await sidePanelForTab(tabId);
  if (sidePanel && tabId !== undefined) {
    const sidePanelTabId = tabId;
    // Tell the already-visible panel to navigate itself. A dedicated Port ties
    // the request to this browser window and avoids mistaking a closed panel
    // for an open one.
    try {
      sidePanel.postMessage({ kind: 'mosaiclynx:approval:present', id });
    } catch {
      sidePanel = undefined;
    }
    if (sidePanel) {
      const pending = approvals.get(id);
      if (pending) pending.sidePanelTabId = sidePanelTabId;
      try {
        await chrome.sidePanel.setOptions({
          tabId: sidePanelTabId,
          path: `src/approval/index.html?id=${encodeURIComponent(id)}`,
          enabled: true,
        });
      } catch {
        finishApproval(id, { approved: false });
        return providerError('INTERNAL_ERROR', 'Approval panel could not be created.');
      }
      return result;
    }
  }

  try {
    await openApprovalWindow();
  } catch {
    finishApproval(id, { approved: false });
    return providerError('INTERNAL_ERROR', 'Approval window could not be created.');
  }
  return result;
};

const finishApproval = (id: string, resolution: ApprovalResolution): void => {
  const pending = approvals.get(id);
  if (!pending || pending.resolved) return;
  pending.resolved = true;
  clearTimeout(pending.timeoutId);
  approvals.delete(id);
  if (pending.sidePanelTabId !== undefined)
    void chrome.sidePanel.setOptions({
      tabId: pending.sidePanelTabId,
      path: homePanelPath,
      enabled: true,
    });
  pending.resolve(resolution);
};

chrome.windows.onRemoved.addListener((windowId) => {
  for (const [id, pending] of approvals) if (pending.windowId === windowId) finishApproval(id, { approved: false });
});

const invalidateTabApprovals = (tabId: number): void => {
  tabGenerations.set(tabId, (tabGenerations.get(tabId) ?? 0) + 1);
  for (const [id, pending] of approvals) if (pending.tabId === tabId) finishApproval(id, { approved: false });
};

chrome.tabs.onRemoved.addListener((tabId) => {
  invalidateTabApprovals(tabId);
  tabGenerations.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' || changeInfo.url !== undefined) invalidateTabApprovals(tabId);
});

const approvalContextIsCurrent = async (pending: PendingApproval): Promise<boolean> => {
  if (pending.tabId === undefined || pending.tabGeneration === undefined) return true;
  if ((tabGenerations.get(pending.tabId) ?? 0) !== pending.tabGeneration) return false;
  try {
    const tab = await chrome.tabs.get(pending.tabId);
    return tab.id === pending.tabId && pageOrigin(tab.url ?? '') === pending.request.origin;
  } catch {
    return false;
  }
};

const nonceDigest = async (origin: string, profileId: string, accountId: string, nonce: string): Promise<string> => {
  const bytes = new TextEncoder().encode(`${origin}\0${profileId}\0${accountId}\0${nonce}`);
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', copy.buffer));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const reserveMessageNonce = async (
  origin: string,
  profileId: string,
  accountId: string,
  nonce: string,
  expiresAt: string
): Promise<string> => {
  let release!: () => void;
  const previous = nonceMutex;
  nonceMutex = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const digest = await nonceDigest(origin, profileId, accountId, nonce);
    const store = await loadStore();
    const now = Date.now();
    const active = store.usedMessageNonces.filter((entry) => Date.parse(entry.expiresAt) > now);
    if (
      active.some(
        (entry) =>
          entry.nonceHash === digest &&
          entry.origin === origin &&
          entry.profileId === profileId &&
          entry.accountId === accountId
      )
    )
      return providerError('NONCE_REUSED', 'This message nonce is already reserved or used.');
    await saveStore({
      ...store,
      usedMessageNonces: [
        ...active,
        {
          nonceHash: digest,
          origin,
          profileId,
          accountId,
          state: 'reserved',
          expiresAt,
        },
      ],
    });
    return digest;
  } finally {
    release();
  }
};

const markMessageNonceUsed = async (nonceHash: string): Promise<void> => {
  let release!: () => void;
  const previous = nonceMutex;
  nonceMutex = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const store = await loadStore();
    await saveStore({
      ...store,
      usedMessageNonces: store.usedMessageNonces.map((entry) =>
        entry.nonceHash === nonceHash ? { ...entry, state: 'used' as const } : entry
      ),
    });
  } finally {
    release();
  }
};

const prepareMessageApproval = (id: string, accountId: string): Promise<string> => {
  const pending = approvals.get(id);
  const request = pending?.request;
  if (!pending || pending.resolved || request?.type !== 'message')
    return Promise.reject({ code: 'CONTEXT_CHANGED', message: 'The message approval is no longer available.' });
  if (pending.messageAccountId && pending.messageAccountId !== accountId)
    return Promise.reject({ code: 'CONTEXT_CHANGED', message: 'The signing account selection is already fixed.' });
  if (pending.messagePreparation) return pending.messagePreparation;

  pending.messageAccountId = accountId;
  pending.messagePreparation = (async () => {
    if (!(await approvalContextIsCurrent(pending)))
      return providerError('CONTEXT_CHANGED', 'The requesting document changed during approval.');
    const selected = request.availableAccounts.find((account) => account.id === accountId);
    if (!selected) return providerError('ACCOUNT_NOT_FOUND', 'The selected account was not offered for this request.');

    const current = await loadStore();
    const currentProfile = current.profiles.find((profile) => profile.id === request.profile.id);
    const currentPermission = permissionFor(current, request.origin, request.profile.id, request.scope);
    const currentAccount = current.accounts.find(
      (account) => account.profileId === request.profile.id && account.id === accountId
    );
    if (
      current.settings.activeProfileId !== request.profile.id ||
      currentProfile?.revision !== request.profile.revision ||
      !currentPermission ||
      currentPermission.revision !== request.permissionRevision ||
      !currentPermission.accountIds.includes(accountId) ||
      currentAccount?.revision !== selected.revision ||
      vaultRevisionFor(current, request.profile.id) !== request.vaultRevision
    )
      return providerError('CONTEXT_CHANGED', 'Profile, account, permission, or vault changed during approval.');

    const nonceHash =
      pending.messageNonceHash ??
      (await reserveMessageNonce(
        request.origin,
        request.profile.id,
        accountId,
        request.messageParams.nonce,
        request.messageParams.expiresAt
      ));
    pending.messageNonceHash = nonceHash;
    return nonceHash;
  })();
  return pending.messagePreparation;
};

const prepareTransactionApproval = (id: string): Promise<void> => {
  const pending = approvals.get(id);
  const request = pending?.request;
  if (!pending || pending.resolved || (request?.type !== 'transaction' && request?.type !== 'cosignature'))
    return Promise.reject({ code: 'CONTEXT_CHANGED', message: 'The transaction approval is no longer available.' });
  if (pending.transactionPreparation) return pending.transactionPreparation;

  pending.transactionPreparation = (async () => {
    if (!(await approvalContextIsCurrent(pending)))
      return providerError('CONTEXT_CHANGED', 'The requesting document changed during approval.');
    const current = await loadStore();
    const currentProfile = current.profiles.find((profile) => profile.id === request.profile.id);
    const currentPermission = permissionFor(current, request.origin, request.profile.id, request.scope);
    const currentAccount = current.accounts.find(
      (account) => account.profileId === request.profile.id && account.id === request.account.id
    );
    if (
      current.settings.activeProfileId !== request.profile.id ||
      currentProfile?.revision !== request.profile.revision ||
      !currentPermission ||
      currentPermission.revision !== request.permissionRevision ||
      !currentPermission.accountIds.includes(request.account.id) ||
      currentAccount?.revision !== request.account.revision ||
      vaultRevisionFor(current, request.profile.id) !== request.vaultRevision
    )
      return providerError('CONTEXT_CHANGED', 'Profile, account, permission, or vault changed during approval.');
    pending.transactionPrepared = true;
  })();
  return pending.transactionPreparation;
};

const cosignatureAccount = (
  accounts: readonly PublicAccount[],
  profile: PublicProfile,
  accountId: unknown
): PublicAccount => {
  if (typeof accountId === 'string') {
    const account = accounts.find((candidate) => candidate.id === accountId);
    if (!account) return providerError('ACCOUNT_NOT_FOUND', 'The account is outside this origin permission.');
    return account;
  }
  return (
    accounts.find((account) => account.id === profile.defaultAccountId) ??
    (accounts.length === 1
      ? accounts[0]!
      : providerError('ACCOUNT_NOT_FOUND', 'Select an account before requesting a cosignature.'))
  );
};

const handleConnect = async (origin: string, params: unknown, tabId: number): Promise<readonly MosaicAccount[]> => {
  if (!isScope(params)) return providerError('INVALID_PARAMS', 'connect() requires chain and network.');
  const store = await loadStore();
  const profile = activeProfile(store, params.network);
  assertEnabledScope(profile, params);
  const existing = permissionFor(store, origin, profile.id, params);
  if (existing)
    return permittedAccounts(store, profile, existing).map((account) => projectAccount(profile, account, params));
  const defaultAccount = accountById(store, profile, profile.defaultAccountId);
  const resolution = await requestApproval(
    {
      type: 'connect',
      origin,
      originAscii: originAscii(origin),
      scope: params,
      profile,
      vaultRevision: vaultRevisionFor(store, profile.id),
      account: defaultAccount,
      availableAccounts: accountsForProfile(store, profile.id).map((account) =>
        projectAccount(profile, account, params)
      ),
    },
    tabId
  );
  if (!resolution.approved || !('accountIds' in resolution) || resolution.accountIds.length === 0)
    return providerError('USER_REJECTED', 'The connection request was rejected.');
  const current = await loadStore();
  const currentProfile = activeProfile(current, params.network);
  if (currentProfile.id !== profile.id || currentProfile.revision !== profile.revision)
    return providerError('CONTEXT_CHANGED', 'The profile changed during approval.');
  if (vaultRevisionFor(current, profile.id) !== vaultRevisionFor(store, profile.id))
    return providerError('CONTEXT_CHANGED', 'The profile vault changed during approval.');
  const validIds = [...new Set(resolution.accountIds)].filter((id) =>
    current.accounts.some((account) => account.profileId === currentProfile.id && account.id === id)
  );
  if (validIds.length !== resolution.accountIds.length)
    return providerError('CONTEXT_CHANGED', 'The selected accounts changed.');
  const now = new Date().toISOString();
  const grant: PermissionGrant = {
    origin,
    profileId: profile.id,
    chain: params.chain,
    network: params.network,
    accountIds: validIds,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
  await saveStore({ ...current, permissions: [...current.permissions, grant] });
  return validIds.map((id) => projectAccount(currentProfile, accountById(current, currentProfile, id), params));
};

const handleTransaction = async (origin: string, params: unknown, tabId: number): Promise<SignedTransaction> => {
  const input = params as { chain?: unknown; network?: unknown; payload?: unknown; accountId?: unknown } | undefined;
  const scope = { chain: input?.chain, network: input?.network };
  if (!isScope(scope) || typeof input?.payload !== 'string')
    return providerError('INVALID_PARAMS', 'Transaction parameters are invalid.');
  if (input.accountId !== undefined && typeof input.accountId !== 'string')
    return providerError('INVALID_PARAMS', 'accountId must be a string when provided.');
  if (scope.network === 'mainnet' && !MAINNET_SIGNING_ENABLED)
    return providerError('UNSUPPORTED_CHAIN', 'Mainnet signing is disabled because release evidence is not installed.');
  const store = await loadStore();
  const profile = activeProfile(store, scope.network);
  assertEnabledScope(profile, scope);
  const permission = requirePermission(store, origin, profile, scope);
  let inspection;
  try {
    inspection = adapters[scope.chain].inspectTransaction(scope.network, input.payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'INVALID_TRANSACTION';
    if (message.startsWith('UNSUPPORTED_TRANSACTION'))
      return providerError('UNSUPPORTED_TRANSACTION', 'This transaction type or version is unsupported.');
    if (message.startsWith('NETWORK_MISMATCH'))
      return providerError('NETWORK_MISMATCH', 'The transaction network does not match.');
    return providerError('INVALID_TRANSACTION', 'The transaction failed strict local validation.');
  }
  let account: PublicAccount;
  try {
    account = transactionAccount(
      permittedAccounts(store, profile, permission),
      scope,
      inspection.signerPublicKey,
      input.accountId
    );
  } catch (error) {
    if (error instanceof AccountSelectionError) return providerError(error.code, error.message);
    throw error;
  }
  const resolution = await requestApproval(
    {
      type: 'transaction',
      origin,
      originAscii: originAscii(origin),
      scope,
      profile,
      vaultRevision: vaultRevisionFor(store, profile.id),
      permissionRevision: permission.revision,
      account,
      payload: input.payload,
      inspection,
    },
    tabId
  );
  if (!resolution.approved) {
    if (resolution.error) return providerError(resolution.error.code, resolution.error.message);
    return providerError('USER_REJECTED', 'The signing request was rejected.');
  }
  if (!('signedTransaction' in resolution))
    return providerError('INTERNAL_ERROR', 'The transaction approval result is invalid.');
  if (
    resolution.signedTransaction.signerPublicKey.toUpperCase() !== account.identity.publicKey.toUpperCase() ||
    !adapters[scope.chain].verifySignedTransaction(scope.network, input.payload, resolution.signedTransaction)
  )
    return providerError('INTERNAL_ERROR', 'The signed transaction failed independent verification.');
  const current = await loadStore();
  const currentPermission = permissionFor(current, origin, profile.id, scope);
  const currentProfile = current.profiles.find((item) => item.id === profile.id);
  const currentVault = current.vaults.find((item) => item.profileId === profile.id);
  const currentAccount = current.accounts.find((item) => item.profileId === profile.id && item.id === account.id);
  if (
    !currentPermission ||
    currentPermission.revision !== permission.revision ||
    currentProfile?.revision !== profile.revision ||
    currentAccount?.revision !== account.revision ||
    currentVault?.revision !== vaultRevisionFor(store, profile.id)
  )
    return providerError('CONTEXT_CHANGED', 'Profile or permission changed during approval.');
  return resolution.signedTransaction;
};

const handleMessage = async (origin: string, params: unknown, tabId: number): Promise<SignedMessage> => {
  const input = params as SignMessageParams | undefined;
  if (!input || !isScope(input)) return providerError('INVALID_PARAMS', 'Structured message parameters are invalid.');
  if (input.accountId !== undefined && typeof input.accountId !== 'string')
    return providerError('INVALID_PARAMS', 'accountId must be a string when provided.');
  if (input.network === 'mainnet' && !MAINNET_SIGNING_ENABLED)
    return providerError('UNSUPPORTED_CHAIN', 'Mainnet signing is disabled because release evidence is not installed.');
  const store = await loadStore();
  const profile = activeProfile(store, input.network);
  assertEnabledScope(profile, input);
  const permission = requirePermission(store, origin, profile, input);
  let availableAccounts: readonly PublicAccount[];
  try {
    availableAccounts = messageAccountCandidates(permittedAccounts(store, profile, permission), input.accountId);
  } catch (error) {
    if (error instanceof AccountSelectionError) return providerError(error.code, error.message);
    throw error;
  }
  let structured;
  try {
    structured = createStructuredMessage(origin, input);
  } catch (error) {
    const code = (error as { code?: string }).code;
    return providerError(
      code === 'REQUEST_EXPIRED' ? 'REQUEST_EXPIRED' : 'INVALID_MESSAGE',
      'The structured message is invalid.'
    );
  }
  const expectedDigest = await structuredMessageDigest(structured.signingBytes);
  const preparedMessage =
    availableAccounts.length === 1
      ? {
          accountId: availableAccounts[0]!.id,
          nonceHash: await reserveMessageNonce(
            origin,
            profile.id,
            availableAccounts[0]!.id,
            input.nonce,
            input.expiresAt
          ),
        }
      : undefined;
  const resolution = await requestApproval(
    {
      type: 'message',
      origin,
      originAscii: originAscii(origin),
      scope: input,
      profile,
      vaultRevision: vaultRevisionFor(store, profile.id),
      permissionRevision: permission.revision,
      availableAccounts,
      messageParams: input,
    },
    tabId,
    preparedMessage
  );
  if (!resolution.approved) {
    if (resolution.error) return providerError(resolution.error.code, resolution.error.message);
    return providerError('USER_REJECTED', 'The message signing request was rejected.');
  }
  if (!('signedMessage' in resolution) || !resolution.nonceHash)
    return providerError('INTERNAL_ERROR', 'The message approval was not prepared.');
  const account = availableAccounts.find((candidate) => candidate.id === resolution.accountId);
  if (!account) return providerError('INTERNAL_ERROR', 'The approved signing account was not offered.');
  const current = await loadStore();
  const currentProfile = current.profiles.find((item) => item.id === profile.id);
  const currentPermission = permissionFor(current, origin, profile.id, input);
  const currentVault = current.vaults.find((item) => item.profileId === profile.id);
  const currentAccount = current.accounts.find((item) => item.profileId === profile.id && item.id === account.id);
  if (
    currentProfile?.revision !== profile.revision ||
    currentPermission?.revision !== permission.revision ||
    currentAccount?.revision !== account.revision ||
    currentVault?.revision !== vaultRevisionFor(store, profile.id)
  )
    return providerError('CONTEXT_CHANGED', 'Profile or permission changed during approval.');
  const signed = resolution.signedMessage;
  if (
    signed.signerPublicKey.toUpperCase() !== account.identity.publicKey.toUpperCase() ||
    signed.signingDigest.toLowerCase() !== expectedDigest ||
    JSON.stringify(signed.message) !== JSON.stringify(structured.message)
  )
    return providerError('INTERNAL_ERROR', 'The signed message does not match the approved request.');
  let verified: boolean;
  try {
    const publicKey = new PublicKey(signed.signerPublicKey);
    const signature = new Signature(signed.signature);
    const Verifier =
      input.chain === 'symbol'
        ? new SymbolFacade(input.network).static.Verifier
        : new NemFacade(input.network).static.Verifier;
    verified = new Verifier(publicKey).verify(structured.signingBytes, signature);
  } catch {
    return providerError('INTERNAL_ERROR', 'The message signature failed independent verification.');
  }
  if (!verified) return providerError('INTERNAL_ERROR', 'The message signature failed independent verification.');
  await markMessageNonceUsed(resolution.nonceHash);
  return resolution.signedMessage;
};

const handleCosignature = async (origin: string, params: unknown, tabId: number): Promise<MosaicLynxCosignature> => {
  const input = params as CosignTransactionParams | undefined;
  if (!input || !isScope(input) || typeof input.parentPayload !== 'string')
    return providerError('INVALID_PARAMS', 'Cosignature parameters are invalid.');
  if (input.chain === 'nem' && typeof input.payload !== 'string')
    return providerError('INVALID_PARAMS', 'NEM cosignature payload is required.');
  if (input.accountId !== undefined && typeof input.accountId !== 'string')
    return providerError('INVALID_PARAMS', 'accountId must be a string when provided.');
  if (input.network === 'mainnet' && !MAINNET_SIGNING_ENABLED)
    return providerError('UNSUPPORTED_CHAIN', 'Mainnet signing is disabled because release evidence is not installed.');
  const store = await loadStore();
  const profile = activeProfile(store, input.network);
  assertEnabledScope(profile, input);
  const permission = requirePermission(store, origin, profile, input);
  const account = cosignatureAccount(permittedAccounts(store, profile, permission), profile, input.accountId);
  let inspection;
  try {
    inspection = adapters[input.chain].inspectTransaction(input.network, input.parentPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('NETWORK_MISMATCH')) return providerError('NETWORK_MISMATCH', 'Network mismatch.');
    if (message.startsWith('UNSUPPORTED_TRANSACTION'))
      return providerError('UNSUPPORTED_TRANSACTION', 'The parent transaction is unsupported.');
    return providerError('INVALID_TRANSACTION', 'The parent transaction failed strict validation.');
  }
  const resolution = await requestApproval(
    {
      type: 'cosignature',
      origin,
      originAscii: originAscii(origin),
      scope: input,
      profile,
      vaultRevision: vaultRevisionFor(store, profile.id),
      permissionRevision: permission.revision,
      account,
      parentPayload: input.parentPayload,
      ...(input.chain === 'nem' ? { payload: input.payload } : { detached: input.detached }),
      inspection,
    },
    tabId
  );
  if (!resolution.approved) return providerError('USER_REJECTED', 'The cosignature request was rejected.');
  if (!('cosignature' in resolution) || resolution.cosignature.chain !== input.chain)
    return providerError('INTERNAL_ERROR', 'The cosignature approval result is invalid.');
  if (resolution.cosignature.signerPublicKey.toUpperCase() !== account.identity.publicKey.toUpperCase())
    return providerError('INTERNAL_ERROR', 'The cosignature signer does not match the approved account.');
  const current = await loadStore();
  const currentPermission = permissionFor(current, origin, profile.id, input);
  const currentProfile = current.profiles.find((item) => item.id === profile.id);
  const currentAccount = current.accounts.find((item) => item.id === account.id && item.profileId === profile.id);
  if (
    currentPermission?.revision !== permission.revision ||
    currentProfile?.revision !== profile.revision ||
    currentAccount?.revision !== account.revision ||
    vaultRevisionFor(current, profile.id) !== vaultRevisionFor(store, profile.id)
  )
    return providerError('CONTEXT_CHANGED', 'Profile or permission changed during approval.');
  return resolution.cosignature;
};

const handleRequest = async (origin: string, request: RpcRequest, tabId: number): Promise<unknown> => {
  switch (request.method) {
    case 'permissions_connect':
      return handleConnect(origin, request.params, tabId);
    case 'permissions_disconnect': {
      const store = await loadStore();
      const remaining = store.permissions.filter((grant) => grant.origin !== origin);
      await saveStore({ ...store, permissions: remaining });
      return undefined;
    }
    case 'account_list': {
      const store = await loadStore();
      const profile = activeProfile(store);
      return store.permissions
        .filter(
          (grant) =>
            grant.origin === origin &&
            grant.profileId === profile.id &&
            grant.network === profile.network &&
            profile.chain === grant.chain
        )
        .flatMap((grant) =>
          permittedAccounts(store, profile, grant).map((account) =>
            projectAccount(profile, account, { chain: grant.chain, network: grant.network })
          )
        );
    }
    case 'account_getActive': {
      if (!isScope(request.params)) return providerError('INVALID_PARAMS', 'Active account scope is invalid.');
      const scope = request.params;
      const accounts = (
        (await handleRequest(origin, { method: 'account_list' }, tabId)) as readonly MosaicAccount[]
      ).filter((account) => account.scope.chain === scope.chain && account.scope.network === scope.network);
      const store = await loadStore();
      const profile = activeProfile(store);
      return accounts.find((account) => account.id === profile.defaultAccountId) ?? accounts[0];
    }
    case 'sign_transaction':
      return handleTransaction(origin, request.params, tabId);
    case 'sign_message':
      return handleMessage(origin, request.params, tabId);
    case 'cosign_transaction':
      return handleCosignature(origin, request.params, tabId);
  }
};

void chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
void chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'mosaiclynx:side-panel' || !port.sender || !isTrustedExtensionPage(port.sender)) return;
  let windowId: number | undefined;
  port.onMessage.addListener((message: unknown) => {
    const registration = message as { readonly kind?: unknown; readonly windowId?: unknown };
    if (registration.kind !== 'mosaiclynx:side-panel:ready' || typeof registration.windowId !== 'number') return;
    windowId = registration.windowId;
    sidePanelPorts.set(windowId, port);
  });
  port.onDisconnect.addListener(() => {
    if (windowId !== undefined && sidePanelPorts.get(windowId) === port) sidePanelPorts.delete(windowId);
  });
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  const envelope = message as
    BridgeRequest | { kind?: string; id?: string; accountId?: string; resolution?: ApprovalResolution };
  if (envelope.kind === 'mosaiclynx:approval:get') {
    if (!isTrustedExtensionPage(sender) || !envelope.id) {
      sendResponse(undefined);
      return;
    }
    sendResponse(approvals.get(envelope.id)?.request);
    return;
  }
  if (envelope.kind === 'mosaiclynx:approval:resolve') {
    if (!isTrustedExtensionPage(sender) || !envelope.id || !envelope.resolution) {
      sendResponse({ ok: false });
      return;
    }
    const approvalId = envelope.id;
    const resolution = envelope.resolution;
    void (async () => {
      const pending = approvals.get(approvalId);
      if (pending && !(await approvalContextIsCurrent(pending))) {
        finishApproval(approvalId, {
          approved: false,
          error: { code: 'CONTEXT_CHANGED', message: 'The requesting document changed during approval.' },
        });
        sendResponse({ ok: false });
        return;
      }
      if ('signedTransaction' in resolution || 'cosignature' in resolution) {
        const expectedType = 'signedTransaction' in resolution ? 'transaction' : 'cosignature';
        if (pending?.request.type !== expectedType || !pending.transactionPrepared) {
          finishApproval(approvalId, {
            approved: false,
            error: { code: 'CONTEXT_CHANGED', message: 'The transaction approval was not prepared.' },
          });
          sendResponse({ ok: false });
          return;
        }
        finishApproval(approvalId, resolution);
        sendResponse({ ok: true });
        return;
      }
      if ('signedMessage' in resolution) {
        if (
          pending?.request.type !== 'message' ||
          pending.messageAccountId !== resolution.accountId ||
          !pending.messageNonceHash
        ) {
          finishApproval(approvalId, {
            approved: false,
            error: { code: 'CONTEXT_CHANGED', message: 'The message approval was not prepared for this account.' },
          });
          sendResponse({ ok: false });
          return;
        }
        finishApproval(approvalId, { ...resolution, nonceHash: pending.messageNonceHash });
        sendResponse({ ok: true });
        return;
      }
      finishApproval(approvalId, resolution);
      sendResponse({ ok: true });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (envelope.kind === 'mosaiclynx:approval:prepare-message') {
    if (!isTrustedExtensionPage(sender) || !envelope.id || !envelope.accountId) {
      sendResponse({ ok: false, error: { code: 'CONTEXT_CHANGED', message: 'Invalid approval request.' } });
      return;
    }
    void prepareMessageApproval(envelope.id, envelope.accountId)
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => {
        const detail = error as { code?: string; message?: string };
        const failure = {
          code: detail.code ?? 'INTERNAL_ERROR',
          message: detail.message ?? 'The signing account could not be prepared.',
        };
        finishApproval(envelope.id!, { approved: false, error: failure });
        sendResponse({ ok: false, error: failure });
      });
    return true;
  }
  if (envelope.kind === 'mosaiclynx:approval:prepare-transaction') {
    if (!isTrustedExtensionPage(sender) || !envelope.id) {
      sendResponse({ ok: false, error: { code: 'CONTEXT_CHANGED', message: 'Invalid approval request.' } });
      return;
    }
    void prepareTransactionApproval(envelope.id)
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => {
        const detail = error as { code?: string; message?: string };
        const failure = {
          code: detail.code ?? 'INTERNAL_ERROR',
          message: detail.message ?? 'The transaction could not be prepared.',
        };
        finishApproval(envelope.id!, { approved: false, error: failure });
        sendResponse({ ok: false, error: failure });
      });
    return true;
  }
  if (envelope.kind !== 'mosaiclynx:request') return;
  const bridge = envelope as BridgeRequest;
  let origin: string;
  try {
    origin = requirePageOrigin(sender);
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    sendResponse({
      error: { code: detail.code ?? 'UNAUTHORIZED_ORIGIN', message: detail.message ?? 'Request rejected.' },
    });
    return;
  }
  void handleRequest(origin, bridge.request, sender.tab!.id!)
    .then((result) => sendResponse({ result }))
    .catch((error: unknown) => {
      const detail = error as { code?: string; message?: string };
      sendResponse({
        error: { code: detail.code ?? 'INTERNAL_ERROR', message: detail.message ?? 'Unexpected error.' },
      });
    });
  return true;
});
