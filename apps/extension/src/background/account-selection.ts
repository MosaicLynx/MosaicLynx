import type { MosaicScope } from '@mosaiclynx/provider-api';

import type { PublicAccount } from '../vault.js';

export class AccountSelectionError extends Error {
  public constructor(
    public readonly code: 'ACCOUNT_NOT_FOUND' | 'INVALID_TRANSACTION',
    message: string
  ) {
    super(message);
  }
}

const byId = (accounts: readonly PublicAccount[], accountId: string): PublicAccount => {
  const account = accounts.find((candidate) => candidate.id === accountId);
  if (!account) throw new AccountSelectionError('ACCOUNT_NOT_FOUND', 'The account is outside this origin permission.');
  return account;
};

export const messageAccountCandidates = (
  accounts: readonly PublicAccount[],
  accountId: unknown
): readonly PublicAccount[] => {
  if (typeof accountId === 'string') return [byId(accounts, accountId)];
  if (accounts.length === 0) throw new AccountSelectionError('ACCOUNT_NOT_FOUND', 'No permitted account is available.');
  return accounts;
};

export const transactionAccount = (
  accounts: readonly PublicAccount[],
  scope: MosaicScope,
  signerPublicKey: string,
  accountId: unknown
): PublicAccount => {
  const normalizedSigner = signerPublicKey.toUpperCase();
  if (typeof accountId === 'string') {
    const account = byId(accounts, accountId);
    if (account.identities[scope.chain].publicKey.toUpperCase() !== normalizedSigner)
      throw new AccountSelectionError('INVALID_TRANSACTION', 'The transaction signer does not match accountId.');
    return account;
  }

  const matches = accounts.filter(
    (account) => account.identities[scope.chain].publicKey.toUpperCase() === normalizedSigner
  );
  if (matches.length !== 1)
    throw new AccountSelectionError(
      'ACCOUNT_NOT_FOUND',
      matches.length === 0
        ? 'The transaction signer is outside this origin permission.'
        : 'The transaction signer does not identify one permitted account.'
    );
  return matches[0]!;
};
