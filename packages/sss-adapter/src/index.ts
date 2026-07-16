import {
  ProviderRpcError,
  type MosaicAccount,
  type MosaicLynxProvider,
  type SignedTransaction,
} from "@mosaic-lynx/provider-api";

export interface SssWindow {
  SSS: SssApi;
  requestSSS(): boolean;
  isAllowedSSS(): boolean;
}

export interface SssApi {
  readonly activeName: string;
  readonly activeAddress: string;
  readonly activePublicKey: string;
  readonly activeNetworkType: number;
  setTransaction(transaction: unknown): void;
  setTransactionByPayload(serializedTx: string): void;
  setMessage(message: string, recipientPublicKey: string): void;
  requestSign(): Promise<SignedTransaction>;
  requestSignCosignatureTransaction(): Promise<SignedTransaction>;
  requestSignWithCosignatories(cosignatories: readonly unknown[]): Promise<never>;
  requestSignEncription(): Promise<string>;
  getActiveAccountToken(
    verifierPublicKey: string | { readonly publicKey: string },
    customPayload?: object,
    encryptedPayload?: string,
  ): Promise<never>;
}

interface StagedRequest {
  readonly kind: "transaction" | "message";
  readonly payload: string;
  readonly recipientPublicKey?: string;
  readonly accountId: string;
  readonly chain: MosaicAccount["scope"]["chain"];
  readonly network: MosaicAccount["scope"]["network"];
  readonly expiresAt: number;
}

interface SssPrivateProvider extends MosaicLynxProvider {
  isSssAllowed?(): Promise<boolean>;
  signLegacyMessage?(params: {
    message: string; recipientPublicKey: string; accountId: string;
    chain: MosaicAccount["scope"]["chain"]; network: MosaicAccount["scope"]["network"];
  }): Promise<string>;
}

const networkTypeFor = (account: MosaicAccount): number =>
  account.scope.network === "mainnet" ? 104 : 152;

const unsupported = (message: string): ProviderRpcError =>
  new ProviderRpcError("UNSUPPORTED_TRANSACTION", message);

class SssAdapter implements SssApi {
  private account: MosaicAccount | undefined;
  private staged: StagedRequest | undefined;
  private allowed = false;

  public constructor(private readonly provider: SssPrivateProvider) {
    void this.refreshAccount();
    provider.on("accountsChanged", (accounts) => {
      this.account = accounts[0];
      this.allowed = accounts.length > 0;
      this.staged = undefined;
    });
    provider.on("disconnect", () => {
      this.account = undefined;
      this.allowed = false;
      this.staged = undefined;
    });
  }

  public isAllowed(): boolean { return this.allowed; }

  public get activeName(): string { return this.requireAccount().name; }
  public get activeAddress(): string { return this.requireAccount().address; }
  public get activePublicKey(): string { return this.requireAccount().publicKey; }
  public get activeNetworkType(): number { return networkTypeFor(this.requireAccount()); }

  public setTransaction(transaction: unknown): void {
    const serializable = transaction as { serialize?: () => Uint8Array } | undefined;
    if (typeof serializable?.serialize !== "function")
      throw new ProviderRpcError("INVALID_PARAMS", "SSS transaction cannot be serialized.");
    let bytes: Uint8Array;
    try { bytes = serializable.serialize(); }
    catch { throw new ProviderRpcError("INVALID_PARAMS", "SSS transaction cannot be serialized."); }
    this.stage("transaction", Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase());
  }

  public setTransactionByPayload(serializedTx: string): void {
    if (!serializedTx || serializedTx.length % 2 || !/^[0-9a-fA-F]+$/.test(serializedTx))
      throw new ProviderRpcError("INVALID_PARAMS", "SSS payload must be even-length hexadecimal.");
    this.stage("transaction", serializedTx);
  }

  public setMessage(message: string, recipientPublicKey: string): void {
    if (!message || !/^[0-9a-fA-F]{64}$/.test(recipientPublicKey))
      throw new ProviderRpcError("INVALID_PARAMS", "SSS legacy message parameters are invalid.");
    this.stage("message", message, recipientPublicKey);
  }

  public async requestSign(): Promise<SignedTransaction> {
    const staged = this.consume("transaction");
    return this.provider.signTransaction({
      chain: staged.chain,
      network: staged.network,
      payload: staged.payload,
      accountId: staged.accountId,
    });
  }

  public requestSignCosignatureTransaction(): Promise<SignedTransaction> {
    return this.requestSign();
  }

  public async requestSignWithCosignatories(_cosignatories: readonly unknown[]): Promise<never> {
    throw unsupported("SSS requestSignWithCosignatories is not supported.");
  }

  public async requestSignEncription(): Promise<string> {
    const staged = this.consume("message");
    if (!this.provider.signLegacyMessage || !staged.recipientPublicKey)
      throw unsupported("SSS legacy message signing is unavailable.");
    return this.provider.signLegacyMessage({
      message: staged.payload,
      recipientPublicKey: staged.recipientPublicKey,
      accountId: staged.accountId,
      chain: staged.chain,
      network: staged.network,
    });
  }

  public async getActiveAccountToken(
    _verifierPublicKey: string | { readonly publicKey: string },
    _customPayload?: object,
    _encryptedPayload?: string,
  ): Promise<never> {
    throw unsupported("SSS account tokens are intentionally unsupported.");
  }

  private async refreshAccount(): Promise<void> {
    try {
      const allowed = this.provider.isSssAllowed
        ? await this.provider.isSssAllowed()
        : (await this.provider.getAccounts()).length > 0;
      this.allowed = allowed;
      this.account = allowed ? await this.provider.getActiveAccount() : undefined;
    } catch {
      this.allowed = false;
      this.account = undefined;
    }
  }

  private stage(kind: StagedRequest["kind"], payload: string, recipientPublicKey?: string): void {
    const account = this.requireAccount();
    this.staged = {
      kind,
      payload,
      ...(recipientPublicKey ? { recipientPublicKey } : {}),
      accountId: account.id,
      chain: account.scope.chain,
      network: account.scope.network,
      expiresAt: Date.now() + 5 * 60_000,
    };
  }

  private consume(kind: StagedRequest["kind"]): StagedRequest {
    const staged = this.staged;
    this.staged = undefined;
    const account = this.requireAccount();
    if (!staged || staged.kind !== kind || staged.expiresAt <= Date.now()
      || staged.accountId !== account.id || staged.chain !== account.scope.chain
      || staged.network !== account.scope.network)
      throw new ProviderRpcError("CONTEXT_CHANGED", `SSS ${kind} is missing, expired, or belongs to another context.`);
    return staged;
  }

  private requireAccount(): MosaicAccount {
    if (!this.allowed || !this.account)
      throw new ProviderRpcError("UNAUTHORIZED_ORIGIN", "The origin is not connected to MosaicLynx.");
    return this.account;
  }
}

export const installSssAdapter = (target: SssWindow, provider: MosaicLynxProvider): void => {
  const adapter = new SssAdapter(provider);
  target.SSS = adapter;
  target.requestSSS = () => adapter.isAllowed();
  target.isAllowedSSS = () => adapter.isAllowed();
};

export const getActiveName = (target: SssWindow): string => target.SSS.activeName;
export const getActiveAddress = (target: SssWindow): string => target.SSS.activeAddress;
export const getActiveNetworkType = (target: SssWindow): number => target.SSS.activeNetworkType;
export const getActivePublicKey = (target: SssWindow): string => target.SSS.activePublicKey;
export const isAllowedSSS = (target: Partial<SssWindow>): boolean => target.isAllowedSSS?.() ?? false;
export const requestSSS = (target: SssWindow): boolean => target.requestSSS();
