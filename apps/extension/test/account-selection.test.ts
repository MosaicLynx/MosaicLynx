import { describe, expect, it } from 'vitest';

import {
  AccountSelectionError,
  messageAccountCandidates,
  transactionAccount,
} from '../src/background/account-selection.js';
import type { PublicAccount } from '../src/vault.js';

const account = (id: string, symbolPublicKey: string): PublicAccount => ({
  id,
  profileId: 'profile-1',
  name: id,
  revision: 1,
  identities: {
    symbol: { address: `T-${id}`, publicKey: symbolPublicKey },
    nem: { address: `N-${id}`, publicKey: `NEM-${symbolPublicKey}` },
  },
  source: {
    kind: 'mnemonicDerived',
    secretRef: `vault:profile-1:mnemonic:${id}`,
    accountIndex: 0,
    derivationPath: '44/1/0/0/0',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const scope = { chain: 'symbol', network: 'testnet' } as const;

describe('signing account selection', () => {
  const first = account('account-1', 'AAAA');
  const second = account('account-2', 'BBBB');

  it('keeps all permitted message candidates when accountId is omitted', () => {
    expect(messageAccountCandidates([first, second], undefined)).toEqual([first, second]);
  });

  it('restricts message candidates to an explicitly permitted account', () => {
    expect(messageAccountCandidates([first, second], second.id)).toEqual([second]);
    expect(() => messageAccountCandidates([first], 'outside')).toThrow(AccountSelectionError);
  });

  it('resolves an omitted transaction account from the payload signer instead of a default account', () => {
    expect(transactionAccount([first, second], scope, second.identities.symbol.publicKey, undefined)).toBe(second);
  });

  it('rejects explicit signer mismatch and ambiguous duplicate public keys', () => {
    expect(() => transactionAccount([first, second], scope, second.identities.symbol.publicKey, first.id)).toThrow(
      expect.objectContaining({ code: 'INVALID_TRANSACTION' })
    );
    expect(() => transactionAccount([first, account('duplicate', 'AAAA')], scope, 'AAAA', undefined)).toThrow(
      expect.objectContaining({ code: 'ACCOUNT_NOT_FOUND' })
    );
  });

  it('rejects a transaction signer outside the permission', () => {
    expect(() => transactionAccount([first, second], scope, 'CCCC', undefined)).toThrow(
      expect.objectContaining({ code: 'ACCOUNT_NOT_FOUND' })
    );
  });
});
