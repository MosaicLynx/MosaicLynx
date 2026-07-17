import type {
  MosaicAccount,
  MosaicScope,
  SignMessageParams,
  SignedMessage,
  SignedTransaction,
} from "@mosaiclynx/provider-api";
import type { PublicAccount, PublicProfile } from "../vault.js";

interface ApprovalBase {
  readonly id: string;
  readonly origin: string;
  readonly originAscii: string;
  readonly scope: MosaicScope;
  readonly profile: PublicProfile;
  /** Vault revision captured independently from mutable public profile metadata. */
  readonly vaultRevision: number;
  readonly account: PublicAccount;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface ConnectApproval extends ApprovalBase {
  readonly type: "connect";
  readonly availableAccounts: readonly MosaicAccount[];
}

export interface TransactionApproval extends ApprovalBase {
  readonly type: "transaction";
  readonly payload: string;
  readonly inspection: {
    readonly schema: string;
    readonly recipients: readonly string[];
    readonly warnings: readonly string[];
    readonly externalStateUnverified: readonly string[];
  };
}

export interface MessageApproval extends ApprovalBase {
  readonly type: "message";
  readonly messageParams: SignMessageParams;
}

export type ApprovalRequest =
  | ConnectApproval
  | TransactionApproval
  | MessageApproval;

export type NewApprovalRequest = ApprovalRequest extends infer Request
  ? Request extends ApprovalRequest
    ? Omit<Request, "id" | "createdAt" | "expiresAt">
    : never
  : never;

export type ApprovalResolution =
  | { readonly approved: false }
  | { readonly approved: true; readonly accountIds: readonly string[] }
  | { readonly approved: true; readonly signedTransaction: SignedTransaction }
  | { readonly approved: true; readonly signedMessage: SignedMessage };
