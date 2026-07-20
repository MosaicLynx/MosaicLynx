import type { RelaySigningRequest, SignedTransaction } from '@mosaiclynx/relay-protocol';

export interface MobileVaultPort {
  unlock(profileId: string, password: string): Promise<void>;
  lock(profileId: string): void;
  lockAll(): void;
  signRelayRequest(profileId: string, accountId: string, request: RelaySigningRequest): Promise<SignedTransaction>;
}

export interface RelayHandoffPort {
  open(rawUrl: string): Promise<{
    readonly handle: string;
    readonly request: RelaySigningRequest;
    readonly requestDigest: string;
  }>;
  complete(handle: string, signedTransaction: SignedTransaction): Promise<void>;
  fail(handle: string, errorCode: string, rejected?: boolean): Promise<void>;
  abandon(handle: string): void;
}

export interface OriginDisplayPort {
  format(origin: string): {
    readonly canonicalOrigin: string;
    readonly verified: false;
  };
}

export const unverifiedOriginDisplay: OriginDisplayPort = {
  format(origin) {
    return { canonicalOrigin: new URL(origin).origin, verified: false };
  },
};
