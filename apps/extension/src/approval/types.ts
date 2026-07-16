import type {
  MosaicAccount,
  MosaicScope,
  SignMessageParams,
  SignedMessage,
  SignedTransaction,
} from "@mosaic-lynx/provider-api";
import type { PublicAccount, PublicProfile } from "../vault.js";

interface ApprovalBase {
  readonly id: string;
  readonly origin: string;
  readonly originAscii: string;
  readonly scope: MosaicScope;
  readonly profile: PublicProfile;
  readonly account: PublicAccount;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly summary: readonly { readonly label: string; readonly value: string }[];
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

export interface LegacyMessageApproval extends ApprovalBase {
  readonly type: "legacy-message";
  readonly legacyMessage: string;
  readonly recipientPublicKey: string;
}

export type ApprovalRequest =
  | ConnectApproval
  | TransactionApproval
  | MessageApproval
  | LegacyMessageApproval;

export type NewApprovalRequest = ApprovalRequest extends infer Request
  ? Request extends ApprovalRequest
    ? Omit<Request, "id" | "createdAt" | "expiresAt">
    : never
  : never;

export type ApprovalResolution =
  | { readonly approved: false }
  | { readonly approved: true; readonly accountIds: readonly string[] }
  | { readonly approved: true; readonly signedTransaction: SignedTransaction }
  | { readonly approved: true; readonly signedMessage: SignedMessage }
  | { readonly approved: true; readonly legacySignature: string };
