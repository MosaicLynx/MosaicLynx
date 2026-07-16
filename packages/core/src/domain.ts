export type ChainKind = "symbol" | "nem";
export type NetworkKind = "mainnet" | "testnet";

export interface ConnectionScope {
  readonly chain: ChainKind;
  readonly network: NetworkKind;
  readonly id: `${ChainKind}-${NetworkKind}`;
}

/** @deprecated ConnectionScope is the canonical name. */
export type ChainScope = ConnectionScope;

export const createChainScope = (
  chain: ChainKind,
  network: NetworkKind,
): ConnectionScope => ({ chain, network, id: `${chain}-${network}` });

export interface Profile {
  readonly id: string;
  readonly network: NetworkKind;
  readonly name: string;
  readonly accountIds: readonly string[];
  readonly defaultAccountId: string;
  readonly nextAccountIndex: number;
  readonly vaultRef: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AccountSource =
  | {
      readonly kind: "mnemonicDerived";
      readonly secretRef: string;
      readonly accountIndex: number;
      readonly derivationPath: string;
    }
  | { readonly kind: "importedPrivateKey"; readonly secretRef: string };

export interface ChainIdentity {
  readonly address: string;
  readonly publicKey: string;
}

export interface Account {
  readonly id: string;
  readonly profileId: string;
  readonly name: string;
  readonly identities: Readonly<Record<ChainKind, ChainIdentity>>;
  readonly source: AccountSource;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PermissionGrant {
  readonly origin: string;
  readonly profileId: string;
  readonly scope: ConnectionScope;
  readonly accountIds: readonly string[];
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SessionState {
  readonly activeProfileId: string | undefined;
  readonly activeAccountId: string | undefined;
  readonly activeChain: ChainKind;
  readonly lockedProfileIds: readonly string[];
}

export type UnlockMethod =
  | { readonly kind: "password"; readonly password: string }
  | { readonly kind: "passkey"; readonly credentialId: string }
  | { readonly kind: "biometric"; readonly assertion: string };

export type MosaicLynxErrorCode =
  | "INVALID_PARAMS"
  | "UNAUTHORIZED_ORIGIN"
  | "VAULT_LOCKED"
  | "PROFILE_SCOPE_MISMATCH"
  | "ACCOUNT_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "LAST_ACCOUNT"
  | "INVALID_MESSAGE"
  | "NONCE_REUSED"
  | "REQUEST_EXPIRED"
  | "CONTEXT_CHANGED";

export class MosaicLynxError extends Error {
  public constructor(
    public readonly code: MosaicLynxErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MosaicLynxError";
  }
}
