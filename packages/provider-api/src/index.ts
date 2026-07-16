export type MosaicChain = "symbol" | "nem";
export type MosaicNetwork = "mainnet" | "testnet";

export interface MosaicScope {
  readonly chain: MosaicChain;
  readonly network: MosaicNetwork;
}

/** A chain-specific projection of an account explicitly shared with a dApp. */
export interface MosaicAccount {
  readonly id: string;
  readonly profileId: string;
  readonly name: string;
  /** @deprecated Use name. Kept as a read-only compatibility alias. */
  readonly label?: string;
  readonly address: string;
  readonly publicKey: string;
  readonly scope: MosaicScope;
}

export interface ConnectParams extends MosaicScope {}

export interface StructuredMessage {
  readonly domain: "mosaiclynx.message.v1";
  readonly origin: string;
  readonly chain: MosaicChain;
  readonly network: MosaicNetwork;
  readonly purpose: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payload: {
    readonly encoding: "utf8" | "hex";
    readonly value: string;
  };
}

export interface SignMessageParams extends MosaicScope {
  readonly purpose: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payload: StructuredMessage["payload"];
  readonly recipientPublicKey?: string;
  readonly accountId?: string;
}

export interface SignedMessage {
  readonly signature: string;
  readonly signerPublicKey: string;
  readonly signingDigest: string;
  readonly message: StructuredMessage;
}

export interface SignTransactionParams extends MosaicScope {
  readonly payload: string;
  readonly accountId?: string;
}

export interface SignedTransaction {
  readonly payload: string;
  readonly hash: string;
  readonly signerPublicKey: string;
}

export interface ProviderEventMap {
  accountsChanged: readonly MosaicAccount[];
  disconnect: undefined;
}

export type ProviderEventName = keyof ProviderEventMap;
export type ProviderEventListener<T extends ProviderEventName> = (
  event: ProviderEventMap[T],
) => void;

/** Public API exposed to untrusted web pages. Profile and vault controls stay in extension UI. */
export interface MosaicLynxProvider {
  readonly version: string;
  readonly apiVersion: string;
  connect(params: ConnectParams): Promise<readonly MosaicAccount[]>;
  disconnect(): Promise<void>;
  getAccounts(): Promise<readonly MosaicAccount[]>;
  getActiveAccount(): Promise<MosaicAccount | undefined>;
  signMessage(params: SignMessageParams): Promise<SignedMessage>;
  signTransaction(params: SignTransactionParams): Promise<SignedTransaction>;
  on<T extends ProviderEventName>(
    event: T,
    listener: ProviderEventListener<T>,
  ): void;
  removeListener<T extends ProviderEventName>(
    event: T,
    listener: ProviderEventListener<T>,
  ): void;
}

export const PROVIDER_API_VERSION = "2.0.0";

export const isSupportedApiVersion = (version: string): boolean => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return Boolean(match && Number(match[1]) === 2);
};

export type RpcMethod =
  | "permissions_connect"
  | "permissions_disconnect"
  | "account_list"
  | "account_getActive"
  | "sign_message"
  | "sign_transaction"
  | "sss_isAllowed"
  | "sss_signLegacyMessage";

export interface RpcRequest {
  readonly method: RpcMethod;
  readonly params?: unknown;
}

export interface RpcExecutor {
  request<TResult>(request: RpcRequest): Promise<TResult>;
}

export type ProviderErrorCode =
  | "USER_REJECTED"
  | "UNAUTHORIZED_ORIGIN"
  | "VAULT_LOCKED"
  | "INVALID_PARAMS"
  | "INVALID_MESSAGE"
  | "NONCE_REUSED"
  | "UNSUPPORTED_CHAIN"
  | "ACCOUNT_NOT_FOUND"
  | "UNSUPPORTED_TRANSACTION"
  | "INVALID_TRANSACTION"
  | "CHAIN_MISMATCH"
  | "NETWORK_MISMATCH"
  | "REQUEST_EXPIRED"
  | "CONTEXT_CHANGED"
  | "RESOURCE_LIMIT"
  | "INTERNAL_ERROR";

export class ProviderRpcError extends Error {
  public constructor(
    public readonly code: ProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProviderRpcError";
  }
}

export class RpcMosaicLynxProvider implements MosaicLynxProvider {
  public readonly version = "0.1.0";
  public readonly apiVersion = PROVIDER_API_VERSION;
  private readonly listeners = new Map<
    ProviderEventName,
    Set<(event: never) => void>
  >();

  public constructor(private readonly executor: RpcExecutor) {}

  public connect(params: ConnectParams): Promise<readonly MosaicAccount[]> {
    return this.executor.request({ method: "permissions_connect", params });
  }

  public disconnect(): Promise<void> {
    return this.executor.request({ method: "permissions_disconnect" });
  }

  public getAccounts(): Promise<readonly MosaicAccount[]> {
    return this.executor.request({ method: "account_list" });
  }

  public getActiveAccount(): Promise<MosaicAccount | undefined> {
    return this.executor.request({ method: "account_getActive" });
  }

  public signMessage(params: SignMessageParams): Promise<SignedMessage> {
    return this.executor.request({ method: "sign_message", params });
  }

  public signTransaction(
    params: SignTransactionParams,
  ): Promise<SignedTransaction> {
    return this.executor.request({ method: "sign_transaction", params });
  }

  /** SSS Adapter-only RPC. It is intentionally absent from MosaicLynxProvider. */
  public isSssAllowed(): Promise<boolean> {
    return this.executor.request({ method: "sss_isAllowed" });
  }

  /** SSS Adapter-only legacy signing RPC. */
  public signLegacyMessage(params: {
    readonly message: string;
    readonly recipientPublicKey: string;
    readonly accountId: string;
    readonly chain: MosaicChain;
    readonly network: MosaicNetwork;
  }): Promise<string> {
    return this.executor.request({ method: "sss_signLegacyMessage", params });
  }

  public on<T extends ProviderEventName>(
    event: T,
    listener: ProviderEventListener<T>,
  ): void {
    const eventListeners =
      this.listeners.get(event) ?? new Set<(event: never) => void>();
    eventListeners.add(listener as (event: never) => void);
    this.listeners.set(event, eventListeners);
  }

  public removeListener<T extends ProviderEventName>(
    event: T,
    listener: ProviderEventListener<T>,
  ): void {
    this.listeners.get(event)?.delete(listener as (event: never) => void);
  }

  public emit<T extends ProviderEventName>(
    event: T,
    payload: ProviderEventMap[T],
  ): void {
    for (const listener of this.listeners.get(event) ?? [])
      listener(payload as never);
  }
}
