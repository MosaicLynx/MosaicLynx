import { NemChainAdapter } from "@mosaic-lynx/chain-nem";
import { SymbolChainAdapter } from "@mosaic-lynx/chain-symbol";
import { createStructuredMessage, structuredMessageDigest } from "@mosaic-lynx/core";
import { PublicKey, Signature } from "@nemnesia/symbol-sdk";
import { NemFacade } from "@nemnesia/symbol-sdk/nem";
import { SymbolFacade } from "@nemnesia/symbol-sdk/symbol";
import type {
  MosaicAccount,
  MosaicScope,
  RpcRequest,
  SignMessageParams,
  SignedMessage,
  SignedTransaction,
} from "@mosaic-lynx/provider-api";
import type { ApprovalRequest, ApprovalResolution, NewApprovalRequest } from "../approval/types.js";
import { MAINNET_SIGNING_ENABLED } from "../release-capabilities.js";
import {
  loadStore,
  saveStore,
  type ExtensionStore,
  type PermissionGrant,
  type PublicAccount,
  type PublicProfile,
} from "../vault.js";

interface BridgeRequest { readonly kind: "mosaic-lynx:request"; readonly request: RpcRequest; }
interface PendingApproval {
  readonly request: ApprovalRequest;
  readonly resolve: (resolution: ApprovalResolution) => void;
  windowId?: number;
  sidePanelTabId?: number;
  readonly timeoutId: number;
  resolved: boolean;
}

const adapters = { symbol: new SymbolChainAdapter(), nem: new NemChainAdapter() } as const;
const approvals = new Map<string, PendingApproval>();
const homePanelPath = "src/popup/index.html";
let nonceMutex: Promise<void> = Promise.resolve();

void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

const providerError = (code: string, message: string): never => { throw { code, message }; };
const scopeId = (scope: MosaicScope): string => `${scope.chain}-${scope.network}`;
const originAscii = (origin: string): string => new URL(origin).origin;

const requirePageOrigin = (sender: chrome.runtime.MessageSender): string => {
  if (sender.id !== chrome.runtime.id || sender.frameId !== 0 || !sender.tab?.id || !sender.url)
    return providerError("UNAUTHORIZED_ORIGIN", "Only a top-level web document can use MosaicLynx.");
  try {
    const parsed = new URL(sender.url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return providerError("UNAUTHORIZED_ORIGIN", "This page scheme is unsupported.");
    return parsed.origin;
  } catch {
    return providerError("UNAUTHORIZED_ORIGIN", "The sender origin is invalid.");
  }
};

const isTrustedExtensionPage = (sender: chrome.runtime.MessageSender): boolean => {
  if (sender.id !== chrome.runtime.id || !sender.url) return false;
  try { return new URL(sender.url).origin === new URL(chrome.runtime.getURL("/")).origin; }
  catch { return false; }
};

const isScope = (value: unknown): value is MosaicScope => {
  const scope = value as Partial<MosaicScope> | undefined;
  return (scope?.chain === "symbol" || scope?.chain === "nem")
    && (scope.network === "mainnet" || scope.network === "testnet");
};

const activeProfile = (store: ExtensionStore, network?: MosaicScope["network"]): PublicProfile => {
  const profile = store.profiles.find((item) => item.id === store.settings.activeProfileId);
  if (!profile) return providerError("VAULT_LOCKED", "Create and select a profile in MosaicLynx first.");
  if (network && profile.network !== network) return providerError("NETWORK_MISMATCH", "The active profile belongs to another network.");
  return profile;
};

const accountsForProfile = (store: ExtensionStore, profileId: string): readonly PublicAccount[] =>
  store.accounts.filter((account) => account.profileId === profileId);

const vaultRevisionFor = (store: ExtensionStore, profileId: string): number =>
  store.vaults.find((vault) => vault.profileId === profileId)?.revision
  ?? providerError("VAULT_LOCKED", "The active profile vault is unavailable.");

const accountById = (store: ExtensionStore, profile: PublicProfile, accountId: string): PublicAccount => {
  const account = store.accounts.find((item) => item.profileId === profile.id && item.id === accountId);
  if (!account) return providerError("ACCOUNT_NOT_FOUND", "The account is unavailable.");
  return account;
};

const projectAccount = (profile: PublicProfile, account: PublicAccount, scope: MosaicScope): MosaicAccount => ({
  id: account.id,
  profileId: profile.id,
  name: account.name,
  label: account.name,
  address: account.identities[scope.chain].address,
  publicKey: account.identities[scope.chain].publicKey,
  scope,
});

const permissionFor = (
  store: ExtensionStore,
  origin: string,
  profileId: string,
  scope: MosaicScope,
): PermissionGrant | undefined => store.permissions.find((grant) =>
  grant.origin === origin && grant.profileId === profileId
    && grant.chain === scope.chain && grant.network === scope.network);

const permittedAccounts = (
  store: ExtensionStore,
  profile: PublicProfile,
  permission: PermissionGrant,
): readonly PublicAccount[] => permission.accountIds
  .map((id) => store.accounts.find((account) => account.profileId === profile.id && account.id === id))
  .filter((account): account is PublicAccount => Boolean(account));

const requirePermission = (
  store: ExtensionStore,
  origin: string,
  profile: PublicProfile,
  scope: MosaicScope,
): PermissionGrant => permissionFor(store, origin, profile.id, scope)
  ?? providerError("UNAUTHORIZED_ORIGIN", "Connect this origin before requesting a signature.");

const emit = async (origin: string, event: "accountsChanged" | "disconnect", payload: unknown): Promise<void> => {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.flatMap((tab) => {
    if (!tab.id || !tab.url) return [];
    try {
      if (new URL(tab.url).origin !== origin) return [];
    } catch { return []; }
    return [chrome.tabs.sendMessage(tab.id, { kind: "mosaic-lynx:event", event, payload }).catch(() => undefined)];
  }));
};

const summaryFor = (scope: MosaicScope, account: PublicAccount): readonly { label: string; value: string }[] => [
  { label: "Chain / Network", value: `${scope.chain} ${scope.network}` },
  { label: "Account", value: `${account.name}\n${account.identities[scope.chain].address}` },
];

const requestApproval = async (
  request: NewApprovalRequest,
  tabId?: number,
): Promise<ApprovalResolution> => {
  if (approvals.size >= 50) return providerError("RESOURCE_LIMIT", "Too many approval requests are pending.");
  if (request.type === "connect") {
    if (tabId === undefined) return providerError("INTERNAL_ERROR", "The connection request has no browser tab.");
    if ([...approvals.values()].some((pending) => pending.sidePanelTabId === tabId))
      return providerError("RESOURCE_LIMIT", "Another connection approval is already open in this tab.");
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
    approvals.set(id, { request: approval, resolve, timeoutId, resolved: false });
  });
  try {
    if (request.type === "connect") {
      const sidePanelTabId = tabId!;
      const pending = approvals.get(id);
      if (pending) pending.sidePanelTabId = sidePanelTabId;
      await chrome.sidePanel.setOptions({
        tabId: sidePanelTabId,
        path: `src/approval/index.html?id=${encodeURIComponent(id)}`,
        enabled: true,
      });
      await chrome.sidePanel.open({ tabId: sidePanelTabId });
      return result;
    }
    const window = await chrome.windows.create({
      url: chrome.runtime.getURL(`src/approval/index.html?id=${encodeURIComponent(id)}`),
      type: "popup",
      width: 480,
      height: 720,
    });
    if (window.id === undefined) throw new Error("missing window id");
    const pending = approvals.get(id);
    if (pending) pending.windowId = window.id;
  } catch {
    finishApproval(id, { approved: false });
    return providerError("INTERNAL_ERROR", "Approval window could not be created.");
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
  for (const [id, pending] of approvals)
    if (pending.windowId === windowId) finishApproval(id, { approved: false });
});

const chooseAccount = (
  store: ExtensionStore,
  profile: PublicProfile,
  permission: PermissionGrant,
  accountId: unknown,
): PublicAccount => {
  const id = typeof accountId === "string" ? accountId : profile.defaultAccountId;
  if (!permission.accountIds.includes(id)) return providerError("ACCOUNT_NOT_FOUND", "The account is outside this origin permission.");
  return accountById(store, profile, id);
};

const nonceDigest = async (
  origin: string,
  profileId: string,
  accountId: string,
  nonce: string,
): Promise<string> => {
  const bytes = new TextEncoder().encode(`${origin}\0${profileId}\0${accountId}\0${nonce}`);
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", copy.buffer));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const reserveMessageNonce = async (
  origin: string,
  profileId: string,
  accountId: string,
  nonce: string,
  expiresAt: string,
): Promise<string> => {
  let release!: () => void;
  const previous = nonceMutex;
  nonceMutex = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    const digest = await nonceDigest(origin, profileId, accountId, nonce);
    const store = await loadStore();
    const now = Date.now();
    const active = store.usedMessageNonces.filter((entry) => Date.parse(entry.expiresAt) > now);
    if (active.some((entry) => entry.nonceHash === digest && entry.origin === origin
      && entry.profileId === profileId && entry.accountId === accountId))
      return providerError("NONCE_REUSED", "This message nonce is already reserved or used.");
    await saveStore({
      ...store,
      usedMessageNonces: [...active, {
        nonceHash: digest,
        origin,
        profileId,
        accountId,
        state: "reserved",
        expiresAt,
      }],
    });
    return digest;
  } finally { release(); }
};

const markMessageNonceUsed = async (nonceHash: string): Promise<void> => {
  let release!: () => void;
  const previous = nonceMutex;
  nonceMutex = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    const store = await loadStore();
    await saveStore({
      ...store,
      usedMessageNonces: store.usedMessageNonces.map((entry) =>
        entry.nonceHash === nonceHash ? { ...entry, state: "used" as const } : entry),
    });
  } finally { release(); }
};

const handleConnect = async (origin: string, params: unknown, tabId: number): Promise<readonly MosaicAccount[]> => {
  if (!isScope(params)) return providerError("INVALID_PARAMS", "connect() requires chain and network.");
  const store = await loadStore();
  const profile = activeProfile(store, params.network);
  const existing = permissionFor(store, origin, profile.id, params);
  if (existing) return permittedAccounts(store, profile, existing).map((account) => projectAccount(profile, account, params));
  const defaultAccount = accountById(store, profile, profile.defaultAccountId);
  const resolution = await requestApproval({
    type: "connect",
    origin,
    originAscii: originAscii(origin),
    scope: params,
    profile,
    vaultRevision: vaultRevisionFor(store, profile.id),
    account: defaultAccount,
    availableAccounts: accountsForProfile(store, profile.id).map((account) => projectAccount(profile, account, params)),
    summary: summaryFor(params, defaultAccount),
  }, tabId);
  if (!resolution.approved || !("accountIds" in resolution) || resolution.accountIds.length === 0)
    return providerError("USER_REJECTED", "The connection request was rejected.");
  const current = await loadStore();
  const currentProfile = activeProfile(current, params.network);
  if (currentProfile.id !== profile.id || currentProfile.revision !== profile.revision)
    return providerError("CONTEXT_CHANGED", "The profile changed during approval.");
  if (vaultRevisionFor(current, profile.id) !== vaultRevisionFor(store, profile.id))
    return providerError("CONTEXT_CHANGED", "The profile vault changed during approval.");
  const validIds = [...new Set(resolution.accountIds)].filter((id) =>
    current.accounts.some((account) => account.profileId === currentProfile.id && account.id === id));
  if (validIds.length !== resolution.accountIds.length) return providerError("CONTEXT_CHANGED", "The selected accounts changed.");
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

const handleTransaction = async (origin: string, params: unknown): Promise<SignedTransaction> => {
  const input = params as { chain?: unknown; network?: unknown; payload?: unknown; accountId?: unknown } | undefined;
  const scope = { chain: input?.chain, network: input?.network };
  if (!isScope(scope) || typeof input?.payload !== "string") return providerError("INVALID_PARAMS", "Transaction parameters are invalid.");
  if (scope.network === "mainnet" && !MAINNET_SIGNING_ENABLED)
    return providerError("UNSUPPORTED_CHAIN", "Mainnet signing is disabled because release evidence is not installed.");
  const store = await loadStore();
  const profile = activeProfile(store, scope.network);
  const permission = requirePermission(store, origin, profile, scope);
  const account = chooseAccount(store, profile, permission, input.accountId);
  let inspection;
  try { inspection = adapters[scope.chain].inspectTransaction(scope.network, input.payload, account.identities[scope.chain].publicKey); }
  catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_TRANSACTION";
    if (message.startsWith("UNSUPPORTED_TRANSACTION")) return providerError("UNSUPPORTED_TRANSACTION", "This transaction type or version is unsupported.");
    if (message.startsWith("NETWORK_MISMATCH")) return providerError("NETWORK_MISMATCH", "The transaction network does not match.");
    return providerError("INVALID_TRANSACTION", "The transaction failed strict local validation.");
  }
  const resolution = await requestApproval({
    type: "transaction",
    origin,
    originAscii: originAscii(origin),
    scope,
    profile,
    vaultRevision: vaultRevisionFor(store, profile.id),
    account,
    payload: input.payload,
    inspection,
    summary: [
      ...summaryFor(scope, account),
      { label: "Transaction", value: inspection.schema },
      { label: "Recipients", value: inspection.recipients.join("\n") || "None" },
      { label: "External state", value: "Not checked" },
    ],
  });
  if (!resolution.approved || !("signedTransaction" in resolution))
    return providerError("USER_REJECTED", "The signing request was rejected.");
  if (!adapters[scope.chain].verifySignedTransaction(scope.network, input.payload, resolution.signedTransaction))
    return providerError("INTERNAL_ERROR", "The signed transaction failed independent verification.");
  const current = await loadStore();
  const currentPermission = permissionFor(current, origin, profile.id, scope);
  const currentProfile = current.profiles.find((item) => item.id === profile.id);
  const currentVault = current.vaults.find((item) => item.profileId === profile.id);
  if (!currentPermission || currentPermission.revision !== permission.revision
    || currentProfile?.revision !== profile.revision
    || currentVault?.revision !== vaultRevisionFor(store, profile.id))
    return providerError("CONTEXT_CHANGED", "Profile or permission changed during approval.");
  return resolution.signedTransaction;
};

const handleMessage = async (origin: string, params: unknown): Promise<SignedMessage> => {
  const input = params as SignMessageParams | undefined;
  if (!input || !isScope(input)) return providerError("INVALID_PARAMS", "Structured message parameters are invalid.");
  if (input.network === "mainnet" && !MAINNET_SIGNING_ENABLED)
    return providerError("UNSUPPORTED_CHAIN", "Mainnet signing is disabled because release evidence is not installed.");
  const store = await loadStore();
  const profile = activeProfile(store, input.network);
  const permission = requirePermission(store, origin, profile, input);
  const account = chooseAccount(store, profile, permission, input.accountId);
  let structured;
  try { structured = createStructuredMessage(origin, input); }
  catch (error) {
    const code = (error as { code?: string }).code;
    return providerError(code === "REQUEST_EXPIRED" ? "REQUEST_EXPIRED" : "INVALID_MESSAGE", "The structured message is invalid.");
  }
  const expectedDigest = await structuredMessageDigest(structured.signingBytes);
  const reservedNonceHash = await reserveMessageNonce(
    origin, profile.id, account.id, input.nonce, input.expiresAt,
  );
  const resolution = await requestApproval({
    type: "message",
    origin,
    originAscii: originAscii(origin),
    scope: input,
    profile,
    vaultRevision: vaultRevisionFor(store, profile.id),
    account,
    messageParams: input,
    summary: [...summaryFor(input, account), { label: "Purpose", value: input.purpose }, { label: "Expires", value: input.expiresAt }],
  });
  if (!resolution.approved || !("signedMessage" in resolution))
    return providerError("USER_REJECTED", "The message signing request was rejected.");
  const current = await loadStore();
  const currentProfile = current.profiles.find((item) => item.id === profile.id);
  const currentPermission = permissionFor(current, origin, profile.id, input);
  const currentVault = current.vaults.find((item) => item.profileId === profile.id);
  if (currentProfile?.revision !== profile.revision || currentPermission?.revision !== permission.revision
    || currentVault?.revision !== vaultRevisionFor(store, profile.id))
    return providerError("CONTEXT_CHANGED", "Profile or permission changed during approval.");
  const signed = resolution.signedMessage;
  if (signed.signerPublicKey.toUpperCase() !== account.identities[input.chain].publicKey.toUpperCase()
    || signed.signingDigest.toLowerCase() !== expectedDigest
    || JSON.stringify(signed.message) !== JSON.stringify(structured.message))
    return providerError("INTERNAL_ERROR", "The signed message does not match the approved request.");
  let verified = false;
  try {
    const publicKey = new PublicKey(signed.signerPublicKey);
    const signature = new Signature(signed.signature);
    const Verifier = input.chain === "symbol"
      ? new SymbolFacade(input.network).static.Verifier
      : new NemFacade(input.network).static.Verifier;
    verified = new Verifier(publicKey).verify(structured.signingBytes, signature);
  } catch { verified = false; }
  if (!verified) return providerError("INTERNAL_ERROR", "The message signature failed independent verification.");
  await markMessageNonceUsed(reservedNonceHash);
  return resolution.signedMessage;
};

const handleRequest = async (origin: string, request: RpcRequest, tabId: number): Promise<unknown> => {
  switch (request.method) {
    case "permissions_connect": return handleConnect(origin, request.params, tabId);
    case "permissions_disconnect": {
      const store = await loadStore();
      const remaining = store.permissions.filter((grant) => grant.origin !== origin);
      await saveStore({ ...store, permissions: remaining });
      await emit(origin, "disconnect", undefined);
      return undefined;
    }
    case "account_list": {
      const store = await loadStore();
      const profile = activeProfile(store);
      return store.permissions.filter((grant) => grant.origin === origin && grant.profileId === profile.id)
        .flatMap((grant) => permittedAccounts(store, profile, grant).map((account) => projectAccount(profile, account, { chain: grant.chain, network: grant.network })));
    }
    case "account_getActive": {
      const accounts = await handleRequest(origin, { method: "account_list" }, tabId) as readonly MosaicAccount[];
      const store = await loadStore();
      const profile = activeProfile(store);
      return accounts.find((account) => account.id === profile.defaultAccountId) ?? accounts[0];
    }
    case "sign_transaction": return handleTransaction(origin, request.params);
    case "sign_message": return handleMessage(origin, request.params);
  }
};

void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  const envelope = message as BridgeRequest | { kind?: string; id?: string; resolution?: ApprovalResolution };
  if (envelope.kind === "mosaic-lynx:approval:get") {
    if (!isTrustedExtensionPage(sender) || !envelope.id) { sendResponse(undefined); return; }
    sendResponse(approvals.get(envelope.id)?.request);
    return;
  }
  if (envelope.kind === "mosaic-lynx:approval:resolve") {
    if (!isTrustedExtensionPage(sender) || !envelope.id || !envelope.resolution) { sendResponse({ ok: false }); return; }
    finishApproval(envelope.id, envelope.resolution);
    sendResponse({ ok: true });
    return;
  }
  if (envelope.kind !== "mosaic-lynx:request") return;
  const bridge = envelope as BridgeRequest;
  let origin: string;
  try { origin = requirePageOrigin(sender); }
  catch (error) {
    const detail = error as { code?: string; message?: string };
    sendResponse({ error: { code: detail.code ?? "UNAUTHORIZED_ORIGIN", message: detail.message ?? "Request rejected." } });
    return;
  }
  void handleRequest(origin, bridge.request, sender.tab!.id!)
    .then((result) => sendResponse({ result }))
    .catch((error: unknown) => {
      const detail = error as { code?: string; message?: string };
      sendResponse({ error: { code: detail.code ?? "INTERNAL_ERROR", message: detail.message ?? "Unexpected error." } });
    });
  return true;
});
